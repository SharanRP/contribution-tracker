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

client.on("messageCreate", async (message) => {
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
            message.channel.send(`Inactive members in the last week: ${uniqueInactiveUsers.join(", ")}`);
        } else {
            message.channel.send("All members have been active in the last week.");
        }
        console.log('Response sent to Discord channel');
    } else if (message.content === "!inactive-teams") {
        console.log('Received !inactive-teams command');
        const inactiveRepos = await getInactiveRepos();
        if (inactiveRepos.length > 0) {
            message.channel.send(`Repositories with no commits in the last week: ${inactiveRepos.join(", ")}`);
        } else {
            message.channel.send("All repositories have had activity in the last week.");
        }
        console.log('Response sent to Discord channel');
    }
});

client.login(process.env.DISCORD_TOKEN);
console.log('Discord bot logged in');

// Create a simple Express server to show that the bot is running
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Discord bot is running!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
