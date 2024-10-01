import React, { useEffect, useState } from "react";
import { Box, Heading, Spinner, Text, VStack } from "@chakra-ui/react";
import axios from "axios";
import ProgressChart from "./ProgressChart";
import Leaderboard from "./LeaderBoard";
import TimelineFilter from "./TimelineFilter";

const App = () => {
  const [repositories, setRepositories] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // To handle errors

  const repoUrls = [
    "https://github.com/TanayGada/BlocTick",
    "https://github.com/NiranjanMore10/EventMint",
    // Add more repo URLs here
  ];

  const [isAdmin, setIsAdmin] = useState(false);

  const handleLogin = () => {
    // In a real app, you'd check credentials here.
    setIsAdmin(true);
  };

  const handleLogout = () => {
    setIsAdmin(false);
  };


  useEffect(() => {
    const fetchAllRepoProgress = async () => {
      setLoading(true);
      setError(null); // Reset any previous errors
      const token = process.env.REACT_APP_GITHUB_TOKEN;
      const headers = { Authorization: `token ${token}` };

      const progressData = await Promise.all(
        repoUrls.map(async (repoUrl) => {
          const ownerRepo = repoUrl.replace("https://github.com/", "").split("/");
          const owner = ownerRepo[0];
          const repo = ownerRepo[1];

          try {
            // Fetch repository details (stars, forks, branches)
            const repoResponse = await axios.get(
              `https://api.github.com/repos/${owner}/${repo}`,
              { headers }
            );

            // Fetch commits by branch
            const branchesResponse = await axios.get(
              `https://api.github.com/repos/${owner}/${repo}/branches`,
              { headers }
            );

            const branches = branchesResponse.data.map(branch => branch.name);

            // Fetch commit and contribution details for each branch
            const branchContributions = await Promise.all(
              branches.map(async (branch) => {
                const commitsResponse = await axios.get(
                  `https://api.github.com/repos/${owner}/${repo}/commits`,
                  {
                    headers,
                    params: {
                      sha: branch, // Fetch commits for the specific branch
                      since: startDate,
                      until: endDate,
                    },
                  }
                );
                const commitsData = commitsResponse.data;

                // Calculate weekly contributions by author
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

            // Return consolidated data for each repository
            return {
              name: repo,
              stars: repoResponse.data.stargazers_count,
              forks: repoResponse.data.forks_count,
              branches: branchContributions, // Array of branch data
            };
          } catch (error) {
            console.error(`Error fetching data for ${repo}:`, error);
            setError("Failed to fetch some repositories.");
            return null;
          }
        })
      );

      // Filter out any null values from failed fetches
      setRepositories(progressData.filter((repo) => repo !== null));
      setLoading(false);
    };

    if (startDate && endDate) {
      fetchAllRepoProgress();
    }
  }, [startDate, endDate]);

  return (
    <Box  p={4} bg="gray.800" color="white" minH="100vh">
      <VStack spacing={6}>
        <Heading as="h1" mb={4} textAlign="center">
          Repository Progress Tracker
        </Heading>

        {/* Timeline Filter */}
        <TimelineFilter
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
        />

        {/* Display loading spinner */}
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" mt={8}>
            <Spinner size="xl" />
            <Text ml={4}>Fetching repository data...</Text>
          </Box>
        ) : (
          <div minW="100vh">
            {/* Error Handling */}
            {error && (
              <Text color="red.500" mt={4}>
                {error}
              </Text>
            )}

            {/* Display chart and leaderboard if data is available */}
            {repositories.length > 0 ? (
              <>
                <ProgressChart
                  repositories={repositories}
                  startDate={startDate}
                  endDate={endDate}
                />
                <Leaderboard repositories={repositories} />
              </>
            ) : (
              <Text mt={6} textAlign="center">
                No data available for the selected timeline.
              </Text>
            )}
          </div>
        )}
      </VStack>
    </Box>
  );
};

export default App;
