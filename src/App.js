import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { Box, VStack, Spinner, Text, Container, useColorMode, Button, Grid, GridItem } from "@chakra-ui/react";
import axios from "axios";
import { motion } from "framer-motion";
import Navbar from "./components/Navbar";
import ProgressChart from "./components/ProgressChart";
import Leaderboard from "./components/LeaderBoard";
import TimelineFilter from "./components/TimelineFilter";
import Announcements from "./components/announcements";
import Login from "./components/Login";

// Motion variants for animations
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

const App = () => {
  const [repositories, setRepositories] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const repoUrls = [
    "https://github.com/TanayGada/BlocTick",
    "https://github.com/NiranjanMore10/EventMint",
    "https://github.com/adiawaskar/FreelanceHub",
    "https://github.com/SharanRP/contribution-tracker",
    // Add more repo URLs here
  ];

  useEffect(() => {
    const fetchAllRepoProgress = async () => {
      setLoading(true);
      setError(null);
      const token = process.env.REACT_APP_GITHUB_TOKEN;
      const headers = { Authorization: `token ${token}` };

      const progressData = await Promise.all(
        repoUrls.map(async (repoUrl) => {
          const ownerRepo = repoUrl.replace("https://github.com/", "").split("/");
          const owner = ownerRepo[0];
          const repo = ownerRepo[1];

          try {
            const repoResponse = await axios.get(
              `https://api.github.com/repos/${owner}/${repo}`,
              { headers }
            );

            const branchesResponse = await axios.get(
              `https://api.github.com/repos/${owner}/${repo}/branches`,
              { headers }
            );

            const branches = branchesResponse.data.map(branch => branch.name);

            const fetchCommits = async (branch, page = 1, commits = []) => {
              const commitsResponse = await axios.get(
                `https://api.github.com/repos/${owner}/${repo}/commits`,
                {
                  headers,
                  params: {
                    sha: branch,
                    since: startDate,
                    until: endDate,
                    per_page: 100, 
                    page,
                  },
                }
              );

              const newCommits = commitsResponse.data;
              if (newCommits.length === 100) {
                return fetchCommits(branch, page + 1, [...commits, ...newCommits]);
              } else {
                return [...commits, ...newCommits];
              }
            };

            const branchContributions = await Promise.all(
              branches.map(async (branch) => {
                const commitsData = await fetchCommits(branch);

                const contributionsByAuthor = commitsData.reduce((acc, commit) => {
                  const author = commit.author?.login || "Unknown";
                  acc[author] = (acc[author] || 0) + 1;
                  return acc;
                }, {});

                return {
                  branch,
                  totalCommits: commitsData.length,
                  contributionsByAuthor,
                };
              })
            );

            const totalCommitsAcrossBranches = branchContributions.reduce(
              (acc, branch) => acc + branch.totalCommits,
              0
            );

            return {
              name: repo,
              stars: repoResponse.data.stargazers_count,
              forks: repoResponse.data.forks_count,
              branches: branchContributions,
              commits: totalCommitsAcrossBranches,
              url: repoResponse.data.html_url
            };
          } catch (error) {
            console.error(`Error fetching data for ${repo}:`, error);
            setError("Failed to fetch some repositories.");
            return null;
          }
        })
      );

      setRepositories(progressData.filter((repo) => repo !== null));
      setLoading(false);
    };

    if (startDate && endDate) {
      fetchAllRepoProgress();
    }
  }, [startDate, endDate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    delete axios.defaults.headers.common['Authorization'];
    setIsAdmin(false);
  };

  // <div class="absolute top-0 z-[-2] h-screen w-screen bg-[#000000] bg-[radial-gradient(#ffffff33_1px,#00091d_1px)] bg-[size:20px_20px]"></div>

  return (
    <Router>
      {/* <div className=""></div> */}
      <Box
        // bg="black"
        minH="100vh"
        p={6}
        // backgroundImage="linear-gradient(to bottom, rgba(0,0,0,0.9), rgba(30,30,30,0.8)), url('/path-to-tech-grid-background.png')"
        backgroundSize="cover"
        backgroundAttachment="fixed"
        // color="white"
        className=" min-h-[100vh] absolute top-0 z-[-2] w-full bg-[#000] bg-[radial-gradient(#808080,#00091d_1px)] bg-[size:20px_20px]"
      >
        <Navbar isAdmin={isAdmin} onLogout={handleLogout} />
        <Container maxW="container.4xl" py={8}>
          <VStack spacing={6} align="stretch">
            <Routes>
              <Route path="/login" element={<Login setIsAdmin={setIsAdmin} />} />
              <Route
                path="/admin"
                element={
                  isAdmin ? (
                    <Announcements isAdmin={isAdmin} />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/"
                element={
                  <>
                    <motion.div initial="hidden" animate="visible" variants={fadeIn}>
                      <TimelineFilter
                        startDate={startDate}
                        endDate={endDate}
                        setStartDate={setStartDate}
                        setEndDate={setEndDate}
                      />
                    </motion.div>
                    {loading ? (
                      <motion.div initial="hidden" animate="visible" variants={fadeIn}>
                        <Box display="flex" justifyContent="center" alignItems="center" mt={8}>
                          <Spinner size="xl" speed="0.65s" color="teal.300" />
                          <Text ml={4}>Fetching repository data...</Text>
                        </Box>
                      </motion.div>
                    ) : (
                      <motion.div initial="hidden" animate="visible" variants={fadeIn}>
                        <VStack spacing={6} width="100%">
                          {error && (
                            <Text color="red.500" mt={4}>
                              {error}
                            </Text>
                          )}
                          {repositories.length > 0 ? (
                            <>
                              <ProgressChart repositories={repositories} startDate={startDate} endDate={endDate} />
                              <Leaderboard repositories={repositories} />
                            </>
                          ) : (
                            <Text mt={6} textAlign="center">
                              No data available for the selected timeline.
                            </Text>
                          )}
                        </VStack>
                      </motion.div>
                    )}
                  </>
                }
              />
              <Route path = "/posts" element={<Announcements isAdmin={false}/>} />
            </Routes>
          </VStack>
        </Container>
      </Box>
      
    </Router>
  );
};

export default App;
