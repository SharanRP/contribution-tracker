const express = require("express");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs");
const Redis = require("ioredis");
const cron = require("node-cron");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL);
console.log("Redis client initialized");

// Read repo URLs from JSON file
let repoUrls;
try {
  repoUrls = JSON.parse(fs.readFileSync("repourlorig.json", "utf8")).urls;
  // Remove duplicate URLs
  repoUrls = [...new Set(repoUrls)];
  console.log(`Loaded ${repoUrls.length} unique repository URLs`);
} catch (error) {
  console.error("Error reading repoUrls.json:", error);
  process.exit(1);
}

// Function to get or set cache
async function getOrSetCache(key, callback, ttl = 3600) {
  try {
    const cachedData = await redis.get(key);
    if (cachedData) {
      console.log(`Cache hit for key: ${key}`);
      return JSON.parse(cachedData);
    }

    console.log(`Cache miss for key: ${key}, fetching fresh data`);
    const freshData = await callback();
    await redis.set(key, JSON.stringify(freshData), 'EX', ttl);
    console.log(`Data cached for key: ${key}`);
    return freshData;
  } catch (error) {
    console.error("Cache error:", error);
    return null;
  }
}

// Function to fetch repository data
async function fetchRepoData(startDate, endDate) {
  console.log(`Fetching repo data from ${startDate} to ${endDate}`);
  const token = process.env.REACT_APP_GITHUB_TOKEN;
  const headers = { Authorization: `token ${token}` };
  let totalRequests = 0;

  const progressData = await Promise.all(
    repoUrls.map(async (repoUrl) => {
      const ownerRepo = repoUrl.replace("https://github.com/", "").split("/");
      const owner = ownerRepo[0];
      const repo = ownerRepo[1];

      console.log(`Processing repository: ${owner}/${repo}`);
      try {
        totalRequests++; // Increment for repo info request
        const repoResponse = await axios.get(
          `https://api.github.com/repos/${owner}/${repo}`,
          { headers }
        );
        console.log(`Fetched repo info for ${owner}/${repo}`);

        totalRequests++; // Increment for branches request
        const branchesResponse = await axios.get(
          `https://api.github.com/repos/${owner}/${repo}/branches`,
          { headers }
        );
        console.log(`Fetched branches for ${owner}/${repo}`);

        const branches = branchesResponse.data.map((branch) => branch.name);
        console.log(`Found ${branches.length} branches for ${owner}/${repo}`);

        const fetchCommits = async (branch, page = 1, commits = []) => {
          try {
            totalRequests++; // Increment for each commit request
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
            console.log(`Fetched ${newCommits.length} commits for ${owner}/${repo} on branch ${branch}, page ${page}`);
            if (newCommits.length === 100) {
              return fetchCommits(branch, page + 1, [
                ...commits,
                ...newCommits,
              ]);
            } else {
              return [...commits, ...newCommits];
            }
          } catch (error) {
            console.error(`Error fetching commits for ${repo} on branch ${branch}:`, error);
            return commits;
          }
        };

        const branchContributions = await Promise.all(
          branches.map(async (branch) => {
            console.log(`Processing branch: ${branch} for ${owner}/${repo}`);
            const commitsData = await fetchCommits(branch);

            const contributionsByAuthor = commitsData.reduce(
              (acc, commit) => {
                const author = commit.author?.login || "Unknown";
                acc[author] = (acc[author] || 0) + 1;
                return acc;
              },
              {}
            );

            console.log(`Processed ${commitsData.length} commits for ${owner}/${repo} on branch ${branch}`);
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

        console.log(`Completed processing for ${owner}/${repo}. Total commits: ${totalCommitsAcrossBranches}`);
        return {
          name: repo,
          stars: repoResponse.data.stargazers_count,
          forks: repoResponse.data.forks_count,
          branches: branchContributions,
          commits: totalCommitsAcrossBranches,
          url: repoResponse.data.html_url,
        };
      } catch (error) {
        console.error(`Error fetching data for ${repo}:`, error);
        return null;
      }
    })
  );

  console.log(`Total API requests made: ${totalRequests}`);
  return progressData.filter((repo) => repo !== null);
}

// Function to update cache
async function updateCache() {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30).toISOString();
  const endDate = now.toISOString();
  const cacheKey = `repo-progress:${startDate}:${endDate}`;

  console.log(`Updating cache for period: ${startDate} to ${endDate}`);
  const startTime = Date.now();

  try {
    const repositories = await fetchRepoData(startDate, endDate);
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000; // Convert to seconds

    const cacheData = {
      metadata: {
        totalTime: totalTime,
        lastUpdated: new Date().toISOString()
      },
      repositories: repositories,
    };

    await redis.set(cacheKey, JSON.stringify(cacheData), 'EX', 3600);
    console.log(`Cache updated successfully. Total time: ${totalTime} seconds`);
  } catch (error) {
    console.error("Error updating cache:", error);
  }
}

// Schedule cache update every hour
cron.schedule('0 * * * *', () => {
  console.log("Running scheduled cache update");
  updateCache();
});

app.post("/api/repo-progress", async (req, res) => {
  console.log("API called with body:", req.body);
  const { startDate, endDate } = req.body;

  // Generate a unique cache key based on the request parameters
  const cacheKey = `repo-progress:${startDate}:${endDate}`;

  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log(`Returning cached data for ${cacheKey}`);
      return res.json(JSON.parse(cachedData));
    }

    console.log(`Cache miss for ${cacheKey}, fetching fresh data`);
    const repositories = await fetchRepoData(startDate, endDate);

    if (repositories.length === 0) {
      console.log("No repository data found");
      return res.status(404).json({ error: "No repository data found" });
    }

    const responseData = {
      metadata: {
        totalTime: 0, // This will be calculated on the first fetch
        lastUpdated: new Date().toISOString()
      },
      repositories: repositories,
    };

    await redis.set(cacheKey, JSON.stringify(responseData), 'EX', 3600);
    console.log(`Data cached for ${cacheKey}`);
    res.json(responseData);
  } catch (error) {
    console.error("Error fetching repository data:", error);
    res.status(500).json({ error: "Failed to fetch repository data" });
  }
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log("Initiating initial cache update");
  updateCache(); // Initial cache update when server starts
});

// Export the function
module.exports = {
  getOrSetCache
};

// Or use ES6 export syntax
// export { getOrSetCache };