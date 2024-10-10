import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import { Octokit } from '@octokit/rest';
import fs from 'fs';
import express from 'express';

dotenv.config();

console.log('Environment variables loaded');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

console.log('Discord client initialized');

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});

console.log('Octokit initialized');

// Read repo URLs from repoUrls.json
const repoUrls = JSON.parse(fs.readFileSync('repoUrls.json', 'utf8')).urls;
console.log('Repository URLs loaded:', repoUrls);

// Convert URLs to owner/repo format
const repos = repoUrls.map(url => {
    const [, owner, repo] = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    return { owner, repo };
});
console.log('Repositories parsed:', repos);

async function getWeeklyCommits(owner, repo) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    try {
        console.log(`Fetching weekly commits for ${owner}/${repo}`);
        const commits = await octokit.rest.repos.listCommits({
            owner,
            repo,
            since: oneWeekAgo.toISOString(),
        });
        console.log(`Retrieved ${commits.data.length} commits for ${owner}/${repo}`);
        return commits.data;
    } catch (error) {
        console.error(`Error fetching weekly commits for ${owner}/${repo}:`, error);
        return [];
    }
}

async function getUserWeeklyCommits(owner, repo) {
    console.log(`Getting user weekly commits for ${owner}/${repo}`);
    const commits = await getWeeklyCommits(owner, repo);
    const usersWithoutCommits = [];

    console.log(`Fetching contributors for ${owner}/${repo}`);
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
    console.log(`Users without commits in ${owner}/${repo}:`, usersWithoutCommits);
    return usersWithoutCommits;
}

async function getInactiveRepos() {
    console.log('Checking for inactive repositories');
    const inactiveRepos = [];
    for (const { owner, repo } of repos) {
        const commits = await getWeeklyCommits(owner, repo);
        if (commits.length === 0) {
            inactiveRepos.push(`${owner}/${repo}`);
        }
    }
    console.log('Inactive repositories:', inactiveRepos);
    return inactiveRepos;
}

async function getTeamContributions() {
    console.log('Fetching team contributions');
    const teamContributions = [];
    for (const { owner, repo } of repos) {
        const commits = await getWeeklyCommits(owner, repo);
        teamContributions.push({
            repo: `${owner}/${repo}`,
            commitCount: commits.length
        });
    }
    return teamContributions.sort((a, b) => b.commitCount - a.commitCount);
}

client.on("messageCreate", async (message) => {
    console.log(`Received message: ${message.content}`);
    if (message.content === "!inactive") {
        console.log('Received !inactive command');
        let inactiveUsers = [];
        for (const { owner, repo } of repos) {
            console.log(`Processing ${owner}/${repo}`);
            const usersWithoutCommits = await getUserWeeklyCommits(owner, repo);
            inactiveUsers = [...inactiveUsers, ...usersWithoutCommits];
        }
        const uniqueInactiveUsers = [...new Set(inactiveUsers)];
        console.log('Unique inactive users:', uniqueInactiveUsers);
        if (uniqueInactiveUsers.length > 0) {
            const response = `Inactive members in the last week: ${uniqueInactiveUsers.join(", ")}`;
            console.log(`Sending response: ${response}`);
            message.channel.send(response);
        } else {
            const response = "All members have been active in the last week.";
            console.log(`Sending response: ${response}`);
            message.channel.send(response);
        }
        console.log('Response sent to Discord channel');
    } else if (message.content === "!inactive-teams") {
        console.log('Received !inactive-teams command');
        const inactiveRepos = await getInactiveRepos();
        if (inactiveRepos.length > 0) {
            const response = `Repositories with no commits in the last week: ${inactiveRepos.join(", ")}`;
            console.log(`Sending response: ${response}`);
            message.channel.send(response);
        } else {
            const response = "All repositories have had activity in the last week.";
            console.log(`Sending response: ${response}`);
            message.channel.send(response);
        }
        console.log('Response sent to Discord channel');
    } else if (message.content === "!leaderteams") {
        console.log('Received !leaderteams command');
        const teamContributions = await getTeamContributions();
        const topTeams = teamContributions.slice(0, 5);
        const response = "Top 5 most active teams in the last week:\n" +
            topTeams.map((team, index) => `${index + 1}. ${team.repo}: ${team.commitCount} commits`).join("\n");
        console.log(`Sending response: ${response}`);
        message.channel.send(response);
        console.log('Response sent to Discord channel');
    }
});

client.login(process.env.DISCORD_TOKEN);
console.log('Discord bot logged in');

// Create a simple Express server to show that the bot is running
const app = express();
const PORT = process.env.PORT || 10000;  // Use the PORT environment variable

app.get('/', (req, res) => {
    console.log('Received request to root endpoint');
    res.send('Service is active');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
