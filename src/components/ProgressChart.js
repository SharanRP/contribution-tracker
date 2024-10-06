import React, { useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { Box, Heading, Text, Button, VStack, Select, HStack, Badge, Stat, StatLabel, StatNumber, StatHelpText, StatArrow, Flex } from "@chakra-ui/react";
import { motion } from "framer-motion";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const ProgressChart = ({ repositories }) => {
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [branch, setBranch] = useState("main");
  const [showDetails, setShowDetails] = useState(false);

  if (!repositories || repositories.length === 0) {
    return <Box>No repository data available</Box>;
  }

  const data = {
    labels: repositories.map((repo) => repo.name || 'Unnamed Repo'),
    datasets: [
      {
        type: "bar",
        label: "Commits",
        data: repositories.map((repo) => 
          repo.branches?.find(b => b.branch === branch)?.totalCommits || 0
        ),
        backgroundColor: "rgba(99, 179, 237, 0.6)",
        borderColor: "#63b3ed",
        borderWidth: 1,
      },
      {
        type: "line",
        label: "Pull Requests",
        data: repositories.map((repo) => repo.pullRequests || 0),
        borderColor: "#9f7aea",
        backgroundColor: "rgba(159, 122, 234, 0.2)",
        borderWidth: 2,
        pointBackgroundColor: "#9f7aea",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (e, elements) => {
      if (elements.length > 0) {
        const repoIndex = elements[0].index;
        setSelectedRepo(repositories[repoIndex]);
        setShowDetails(true);
      }
    },
    plugins: {
      legend: {
        position: "top",
        labels: { color: "#fff" },
      },
      title: {
        display: true,
        text: "Repository Progress Overview",
        color: "#fff",
        font: { size: 20 },
        padding: { top: 20, bottom: 20 },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value}`;
          },
          afterBody: (tooltipItems) => {
            const repoIndex = tooltipItems[0].dataIndex;
            const repo = repositories[repoIndex];
            return [
              `Latest commit: ${repo.latestCommit || 'N/A'}`,
              `Open issues: ${repo.openIssues || 0}`,
              `Stars: ${repo.stars || 0}`,
            ];
          },
        },
      },
    },
    scales: {
      x: { ticks: { color: "#fff" }, grid: { display: false } },
      y: { ticks: { color: "#fff" }, grid: { color: "rgba(255, 255, 255, 0.1)" } },
    },
  };

  const renderContributions = () => {
    const selectedBranch = selectedRepo.branches.find(b => b.branch === branch);
    const contributions = selectedBranch?.contributionsByAuthor || {};

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-700 p-6 rounded-lg shadow-xl mt-6"
      >
        <Box bg="gray.700" p={6} borderRadius="lg" boxShadow="xl" mt={6} maxHeight="400px" overflowY="auto" >
          <Heading as="h3" size="lg" color="white" mb={4}>
            Contributions for {selectedRepo.name} ({branch} branch)
          </Heading>

          <Select
            bg="gray.800"
            color="white"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            mb={4}
          >
            {selectedRepo.branches.map(({ branch }) => (
              <option key={branch} value={branch}>{branch}</option>
            ))}
          </Select>

          <VStack spacing={4} align="stretch">
            {Object.entries(contributions).map(([member, commitCount]) => (
              <Flex key={member} justify="space-between" align="center" bg="gray.600" p={3} borderRadius="md">
                <Text color="white" fontWeight="bold">{member}</Text>
                <HStack>
                  <Badge colorScheme="blue">{commitCount} commits</Badge>
                  <Stat>
                    <StatNumber color="white">{((commitCount / selectedBranch.totalCommits) * 100).toFixed(1)}%</StatNumber>
                    <StatHelpText color="gray.300">
                      <StatArrow type="increase" />
                      of total commits
                    </StatHelpText>
                  </Stat>
                </HStack>
              </Flex>
            ))}
          </VStack>
          <Button mt={6} colorScheme="blue" onClick={() => setShowDetails(false)}>
            Back to Chart
          </Button>
        </Box>
      </motion.div>
    );
  };

  return (
    <Box
      width="100%"
      height="600px"
      p={6}
      borderRadius="xl"
      boxShadow="0 0 20px rgba(0, 0, 0, 0.1), 0 0 40px rgba(255, 255, 255, 0.1)"
      position="relative"
      overflow="hidden"
      _before={{
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(26, 32, 44, 0.7)",
        backdropFilter: "blur(70px)",
        zIndex: -1,
      }}
      className="border-2 border-gray-600 shadow-[75_20px_30px_rgba(75,_112,_184,_0.7)] "
     >
      <Heading as="h2" size="xl" color="white" mb={6} textAlign="center">
        Team Progress: Commits & Contributions
      </Heading>
      {showDetails ? (
        renderContributions()
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Bar data={data} options={options} />
        </motion.div>
      )}
    </Box>
  );
};

export default ProgressChart;