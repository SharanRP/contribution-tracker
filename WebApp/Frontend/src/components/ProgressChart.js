import React, { useState, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { AlertCircle, GitBranch, GitPullRequest, Star } from 'lucide-react';
import { motion } from 'framer-motion';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ProgressChart = ({ repositories }) => {
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState('main');

  const chartData = useMemo(() => ({
    labels: repositories.map(repo => repo.name),
    datasets: [
      {
        type: 'bar',
        label: 'Commits',
        data: repositories.map(repo => 
          repo.branches?.find(b => b.branch === selectedBranch)?.totalCommits || 0
        ),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        type: 'line',
        label: 'Pull Requests',
        data: repositories.map(repo => repo.pullRequests || 0),
        borderColor: 'rgb(236, 72, 153)',
        backgroundColor: 'rgba(236, 72, 153, 0.5)',
        borderWidth: 2,
        pointRadius: 4,
        yAxisID: 'y1',
      },
      {
        type: 'line',
        label: 'Stars',
        data: repositories.map(repo => repo.stars || 0),
        borderColor: 'rgb(250, 204, 21)',
        backgroundColor: 'rgba(250, 204, 21, 0.5)',
        borderWidth: 2,
        pointRadius: 4,
        yAxisID: 'y1',
      },
    ],
  }), [repositories, selectedBranch]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    stacked: false,
    plugins: {
      title: {
        display: true,
        text: 'Repository Progress Overview',
        color: '#fff',
        font: { size: 24, weight: 'bold' },
        padding: { top: 20, bottom: 20 },
      },
      legend: {
        position: 'top',
        labels: { color: '#fff', usePointStyle: true, font: { size: 14 } },
      },
      tooltip: {
        callbacks: {
          afterBody: (tooltipItems) => {
            const repo = repositories[tooltipItems[0].dataIndex];
            return [
              `Latest commit: ${repo.latestCommit || 'N/A'}`,
              `Open issues: ${repo.openIssues || 0}`,
            ];
          },
        },
      },
    },
    scales: {
      x: { 
        ticks: { color: '#fff', font: { size: 12 } },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        ticks: { color: '#fff', font: { size: 12 } },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        title: { display: true, text: 'Commits', color: '#fff', font: { size: 14 } },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        ticks: { color: '#fff', font: { size: 12 } },
        grid: { 
          drawOnChartArea: false,
          color: 'rgba(255, 255, 255, 0.1)',
        },
        title: { display: true, text: 'Pull Requests / Stars', color: '#fff', font: { size: 14 } },
      },
    },
    onClick: (_, elements) => {
      if (elements.length > 0) {
        const repoIndex = elements[0].index;
        setSelectedRepo(repositories[repoIndex]);
      }
    },
  };

  const renderRepoDetails = () => {
    if (!selectedRepo) return null;

    const selectedBranchData = selectedRepo.branches.find(b => b.branch === selectedBranch);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-8 p-6 bg-gray-800 rounded-lg shadow-xl"
      >
        <h3 className="text-2xl font-bold text-white mb-4">{selectedRepo.name} Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <GitBranch className="mr-2 text-blue-400" />
              <span className="text-white font-semibold">Branches</span>
            </div>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full bg-gray-600 text-white p-2 rounded"
            >
              {selectedRepo.branches.map(({ branch }) => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <GitPullRequest className="mr-2 text-pink-400" />
              <span className="text-white font-semibold">Pull Requests</span>
            </div>
            <p className="text-2xl font-bold text-white">{selectedRepo.pullRequests}</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Star className="mr-2 text-yellow-400" />
              <span className="text-white font-semibold">Stars</span>
            </div>
            <p className="text-2xl font-bold text-white">{selectedRepo.stars}</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <AlertCircle className="mr-2 text-red-400" />
              <span className="text-white font-semibold">Open Issues</span>
            </div>
            <p className="text-2xl font-bold text-white">{selectedRepo.openIssues}</p>
          </div>
        </div>
        {selectedBranchData && (
          <div className="mt-6">
            <h4 className="text-xl font-semibold text-white mb-3">Top Contributors</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(selectedBranchData.contributionsByAuthor || {})
                .sort(([, a], [, b]) => b - a)
                .slice(0, 6)
                .map(([author, commits]) => (
                  <div key={author} className="bg-gray-700 p-4 rounded-lg">
                    <p className="text-white font-semibold">{author}</p>
                    <p className="text-lg text-blue-400">{commits} commits</p>
                  </div>
                ))
              }
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="flex min-w-full justify-center items-center min-h-screen bg-gray-900 p-4">
      <div className="w-full">
        <div className="min-w-full p-6 bg-gray-800 rounded-xl shadow-2xl">
          <h2 className="text-4xl font-bold text-white mb-8 text-center">Repository Analytics Dashboard</h2>
          <div className=" min-w-[80vh] h-[60vh] mb-8">
            <Bar data={chartData} options={chartOptions} />
          </div>
          {renderRepoDetails()}
        </div>
      </div>
    </div>
  );
};

export default ProgressChart;