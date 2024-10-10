import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import { Octokit } from '@octokit/rest';
import fs from 'fs';

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

// To host this bot for free and enable continuous deployment without using Heroku:
// 1. Push your code to a GitHub repository
// 2. Sign up for a free account on Replit (https://replit.com/)
// 3. Create a new Repl and import your GitHub repository
// 4. Set up environment variables in Replit (Secrets tab):
//    - DISCORD_TOKEN
//    - GITHUB_TOKEN
// 5. Install the required packages using the Replit package manager
// 6. Set up a free UptimeRobot account (https://uptimerobot.com/) to ping your Replit URL and keep it running
// 7. In your Replit, create a new file called `keep_alive.js` with the following content:

/*
const express = require('express');
const server = express();

server.all('/', (req, res) => {
    res.send('Bot is running!');
});

function keepAlive() {
    server.listen(3000, () => {
        console.log('Server is ready.');
    });
}

module.exports = keepAlive;
*/

// 8. Import and use the `keepAlive` function in your main bot file:

/*
const keepAlive = require('./keep_alive');
keepAlive();
*/

// 9. Set up a GitHub Actions workflow for continuous deployment:
// Create a file `.github/workflows/deploy.yml` with the following content:

/*
name: Deploy to Replit
on:
  push:
    branches:
      - main
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '14'
      - name: Update Replit
        env:
          REPLIT_USERNAME: ${{ secrets.REPLIT_USERNAME }}
          REPLIT_APP_NAME: ${{ secrets.REPLIT_APP_NAME }}
          REPLIT_TOKEN: ${{ secrets.REPLIT_TOKEN }}
        run: |
          npm install -g @replit/replit-cli
          replit login --token $REPLIT_TOKEN
          replit deploy $REPLIT_USERNAME/$REPLIT_APP_NAME
*/

// 10. Set up the necessary secrets in your GitHub repository settings

// Now, whenever you push changes to your GitHub repository,
// the GitHub Actions workflow will automatically deploy the updated code to Replit.