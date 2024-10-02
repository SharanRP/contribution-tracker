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
import { Box, Heading, Text, Button, VStack, Select } from "@chakra-ui/react";

// Register Chart.js components
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
  const [selectedRepo, setSelectedRepo] = useState(null); // Store selected repository
  const [branch, setBranch] = useState("main"); // Default branch
  const [showDetails, setShowDetails] = useState(false); // Toggle contribution details

  const data = {
    labels: repositories.map((repo) => repo.name),
    datasets: [
      {
        type: "bar", // Bar chart for commits
        label: "Commits",
        data: repositories.map((repo) => repo.branches.find(b => b.branch === branch)?.totalCommits || 0),
        backgroundColor: "rgba(99, 179, 237, 0.6)",
        borderColor: "#63b3ed",
        borderWidth: 1,
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
        labels: {
          color: "#fff",
        },
      },
      title: {
        display: true,
        text: "Repository Progress with Commits Comparison",
        color: "#fff",
        font: {
          size: 20,
        },
        padding: {
          top: 20,
          bottom: 20,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#fff",
        },
        grid: {
          display: false,
        },
      },
      y: {
        ticks: {
          color: "#fff",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
      },
    },
  };

  const renderContributions = () => {
    const selectedBranch = selectedRepo.branches.find(b => b.branch === branch);
    const contributions = selectedBranch?.contributionsByAuthor || {};

    return (
      <Box bg="gray.700" p={4} borderRadius="md" mt={6}>
        <Heading as="h3" size="md" color="white" mb={4}>
          Contributions for {selectedRepo.name} ({branch} branch)
        </Heading>

        {/* Branch Selector */}
        <Select
          bg="gray.800"
          color="white"
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          mb={4}
        >
          {selectedRepo.branches.map(({ branch }) => (
            <option key={branch} value={branch}>
              {branch}
            </option>
          ))}
        </Select>

        {/* Display contribution data */}
        <VStack spacing={4} alignItems="flex-start">
          {Object.entries(contributions).map(([member, commitCount]) => (
            <Text key={member} color="white">
              {member}: {commitCount} commits
            </Text>
          ))}
        </VStack>
        <Button mt={4} onClick={() => setShowDetails(false)}>
          Back to Chart
        </Button>
      </Box>
    );
  };

  return (
    <Box
      width="100%"
      height="600px"
      p={4}
      bg="gray.800"
      borderRadius="md"
      boxShadow="lg"
    >
      <Heading as="h2" size="lg" color="white" mb={4} textAlign="center">
        Team Progress: Commits & Contributions
      </Heading>
      {showDetails ? (
        renderContributions()
      ) : (
        <Bar data={data} options={options} />
      )}
    </Box>
  );
};

export default ProgressChart;
