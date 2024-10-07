import dotenv from 'dotenv';
import { Client, GatewayIntentBits } from 'discord.js';
import { Octokit } from '@octokit/rest';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Repositories list (Array of owner/repo objects)
const repos = [
  { owner: "owner1", repo: "repo1" },
  { owner: "owner2", repo: "repo2" },
  // Add more repositories here
];

// Function to get commits for a specific repo
async function getRepoContributions(owner, repo) {
  try {
    const commits = await octokit.rest.repos.listCommits({
      owner,
      repo,
    });
    return commits.data;
  } catch (error) {
    console.error(`Error fetching commits for ${owner}/${repo}:`, error);
    return [];
  }
}

// Function to calculate leaderboard based on commits and lines of code
async function calculateLeaderboard(repos) {
  const leaderboard = [];

  for (const { owner, repo } of repos) {
    const commits = await getRepoContributions(owner, repo);

    let totalCommits = 0;
    let totalLinesChanged = 0;

    commits.forEach((commit) => {
      totalCommits += 1;
      totalLinesChanged += commit.stats?.additions ?? 0;
      totalLinesChanged += commit.stats?.deletions ?? 0;
    });

    leaderboard.push({ repo, totalCommits, totalLinesChanged });
  }

  // Sort by commits, then lines changed
  leaderboard.sort(
    (a, b) =>
      b.totalCommits - a.totalCommits ||
      b.totalLinesChanged - a.totalLinesChanged
  );
  return leaderboard;
}

// Function to get weekly commits for a repo
async function getWeeklyCommits(owner, repo) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  try {
    const commits = await octokit.rest.repos.listCommits({
      owner,
      repo,
      since: oneWeekAgo.toISOString(),
    });
    return commits.data;
  } catch (error) {
    console.error(`Error fetching weekly commits for ${owner}/${repo}:`, error);
    return [];
  }
}

// Function to check if a repo has no commits in the last week
async function repoHasNoCommits(owner, repo) {
  const commits = await getWeeklyCommits(owner, repo);
  return commits.length === 0; // True if no commits
}

// Function to identify users without weekly commits
async function getUserWeeklyCommits(owner, repo) {
  const commits = await getWeeklyCommits(owner, repo);
  const usersWithoutCommits = [];

  const contributors = await octokit.rest.repos.listContributors({
    owner,
    repo,
  });

  contributors.data.forEach((contributor) => {
    const hasCommits = commits.some(
      (commit) => commit.author?.login === contributor.login
    );
    if (!hasCommits) {
      usersWithoutCommits.push(contributor.login);
    }
  });
  return usersWithoutCommits;
}

// Bot event for when the bot is ready
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// Command to display the leaderboard
client.on("messageCreate", async (message) => {
  if (message.content === "!leaderboard") {
    const leaderboard = await calculateLeaderboard(repos);
    const response = leaderboard
      .map(
        (repo, index) =>
          `${index + 1}. ${repo.repo} - ${repo.totalCommits} commits, ${
            repo.totalLinesChanged
          } lines of code`
      )
      .join("\n");
    message.channel.send(response);
  }
});

// Command to list repositories with no commits this week
client.on("messageCreate", async (message) => {
  if (message.content === "!nocommits") {
    for (const { owner, repo } of repos) {
      const noCommits = await repoHasNoCommits(owner, repo);
      if (noCommits) {
        message.channel.send(`${repo} has no commits this week.`);
      }
    }
  }
});

// Command to list users with no commits this week
client.on("messageCreate", async (message) => {
  if (message.content.startsWith("!inactiveusers")) {
    const [_, owner, repo] = message.content.split(" ");
    if (!owner || !repo) {
      message.channel.send("Usage: !inactiveusers <owner> <repo>");
      return;
    }

    const usersWithoutCommits = await getUserWeeklyCommits(owner, repo);
    if (usersWithoutCommits.length > 0) {
      message.channel.send(
        `Users with no commits in ${repo}: ${usersWithoutCommits.join(", ")}`
      );
    } else {
      message.channel.send(`All users have committed in ${repo}.`);
    }
  }
});

// Log the bot in using the token from the .env file
client.login(process.env.DISCORD_TOKEN);
