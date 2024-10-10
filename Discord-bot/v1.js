import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import { Octokit } from '@octokit/rest';
import fs from 'fs';
import express from 'express';
import NodeCache from 'node-cache';
import cron from 'node-cron';

console.log('Starting application...');

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
console.log('manas is pro');

const cache = new NodeCache({ stdTTL: 900 });
console.log('NodeCache initialized');

console.log('Loading repository URLs...');
const repoUrls = JSON.parse(fs.readFileSync('repoUrls.json', 'utf8')).urls;
console.log('Repository URLs loaded:', repoUrls);

console.log('Parsing repository information...');
const repos = repoUrls.map(url => {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
        console.error(`Invalid repository URL: ${url}`);
        return null;
    }
    const [, owner, repo] = match;
    return { owner, repo, url };
}).filter(Boolean);
console.log('Repositories parsed:', repos);

async function getWeeklyCommits(owner, repo) {
    console.log(`Getting weekly commits for ${owner}/${repo}`);
    const cacheKey = `commits:${owner}:${repo}`;

    const cachedCommits = cache.get(cacheKey);
    if (cachedCommits) {
        console.log(`Retrieved cached commits for ${owner}/${repo}`);
        return cachedCommits;
    }

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
        cache.set(cacheKey, commits.data);
        return commits.data;
    } catch (error) {
        console.error(`Error fetching weekly commits for ${owner}/${repo}:`, error);
        return [];
    }
}

async function updateCache() {
    console.log('Updating cache...');
    for (const { owner, repo } of repos) {
        await getWeeklyCommits(owner, repo);
    }
    console.log('Cache update complete');
}

// Function to check if it's a weekday
function isWeekday() {
    const day = new Date().getDay();
    return day >= 1 && day <= 5;
}

// Function to check if it's peak hours (4 PM to 1 AM IST)
function isPeakHours() {
    const hour = new Date().getHours();
    return hour >= 16 || hour < 1;
}

// Cron job to update cache
cron.schedule('*/15 * * * *', async () => {
    const now = new Date();
    if (isWeekday()) {
        if (isPeakHours()) {
            console.log('Peak hours on weekday, updating cache');
            await updateCache();
        } else {
            console.log('Non-peak hours on weekday, skipping cache update');
        }
    } else {
        console.log('Weekend, updating cache');
        await updateCache();
    }
}, {
    timezone: "Asia/Kolkata"
});

async function getUserWeeklyCommits(owner, repo) {
    console.log(`Getting user weekly commits for ${owner}/${repo}`);
    const commits = await getWeeklyCommits(owner, repo);
    const usersWithoutCommits = [];

    const cacheKey = `contributors:${owner}:${repo}`;
    let contributors = cache.get(cacheKey);

    if (!contributors) {
        console.log(`Fetching contributors for ${owner}/${repo}`);
        try {
            const response = await octokit.rest.repos.listContributors({ owner, repo });
            contributors = response.data;
            cache.set(cacheKey, contributors);
        } catch (error) {
            console.error(`Error fetching contributors for ${owner}/${repo}:`, error);
            return [];
        }
    }

    console.log(`Checking for users without commits in ${owner}/${repo}`);
    contributors.forEach((contributor) => {
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
    await Promise.all(repos.map(async ({ owner, repo, url }) => {
        console.log(`Checking activity for ${owner}/${repo}`);
        const commits = await getWeeklyCommits(owner, repo);
        if (commits.length === 0) {
            console.log(`${owner}/${repo} is inactive`);
            inactiveRepos.push({ owner, repo, url });
        }
    }));
    console.log('Inactive repositories:', inactiveRepos);
    return inactiveRepos;
}

async function getTeamContributions() {
    console.log('Fetching team contributions');
    const teamContributions = await Promise.all(repos.map(async ({ owner, repo, url }) => {
        console.log(`Getting contributions for ${owner}/${repo}`);
        const commits = await getWeeklyCommits(owner, repo);
        return {
            repo: `${owner}/${repo}`,
            commitCount: commits.length,
            url
        };
    }));
    console.log('Team contributions fetched, sorting...');
    return teamContributions.sort((a, b) => b.commitCount - a.commitCount);
}

async function getMostActiveMember() {
    console.log('Fetching most active member');
    const memberContributions = {};
    await Promise.all(repos.map(async ({ owner, repo }) => {
        console.log(`Getting commits for ${owner}/${repo}`);
        const commits = await getWeeklyCommits(owner, repo);
        commits.forEach(commit => {
            const author = commit.author?.login;
            if (author) {
                memberContributions[author] = (memberContributions[author] || 0) + 1;
            }
        });
    }));
    console.log('Member contributions:', memberContributions);
    const entries = Object.entries(memberContributions);
    if (entries.length === 0) {
        console.log('No contributions found');
        return { name: 'No one', commitCount: 0 };
    }
    const mostActiveMember = entries.reduce((a, b) => a[1] > b[1] ? a : b);
    console.log('Most active member:', mostActiveMember);
    return { name: mostActiveMember[0], commitCount: mostActiveMember[1] };
}

async function getRepoStats(owner, repo) {
    console.log(`Fetching repo stats for ${owner}/${repo}`);
    const commits = await getWeeklyCommits(owner, repo);
    const contributors = new Set(commits.map(commit => commit.author?.login).filter(Boolean));
    const totalLines = commits.reduce((acc, commit) => acc + (commit.stats?.total || 0), 0);
    console.log(`Stats for ${owner}/${repo}:`, { commitCount: commits.length, contributorCount: contributors.size, totalLines });
    return {
        commitCount: commits.length,
        contributorCount: contributors.size,
        totalLines
    };
}

client.on("messageCreate", async (message) => {
    console.log(`Received message: ${message.content}`);

    if (message.content.startsWith("!github")) {
        const [, command, ...args] = message.content.split(" ");
        console.log(`Processing command: ${command}`);

        try {
            switch (command) {
                case "inactive-users":
                    console.log('Received !github inactive-users command');
                    let inactiveUsers = [];
                    await Promise.all(repos.map(async ({ owner, repo }) => {
                        console.log(`Processing ${owner}/${repo}`);
                        const usersWithoutCommits = await getUserWeeklyCommits(owner, repo);
                        inactiveUsers = [...inactiveUsers, ...usersWithoutCommits];
                    }));
                    const uniqueInactiveUsers = [...new Set(inactiveUsers)];
                    console.log('Unique inactive users:', uniqueInactiveUsers);
                    if (uniqueInactiveUsers.length > 0) {
                        const response = `**Inactive members in the last week:**\n` +
                            uniqueInactiveUsers.map(user => `• ${user}`).join("\n");
                        console.log(`Sending response: ${response}`);
                        await message.channel.send(response);
                    } else {
                        const response = `**All members have been active in the last week.**`;
                        console.log(`Sending response: ${response}`);
                        await message.channel.send(response);
                    }
                    break;

                case "inactive-repos":
                    console.log('Received !github inactive-repos command');
                    const inactiveRepos = await getInactiveRepos();
                    if (inactiveRepos.length > 0) {
                        const response = `**Repositories with no commits in the last week:**\n` +
                            inactiveRepos.map(repo => `• [${repo.owner}/${repo.repo}](${repo.url})`).join("\n");
                        console.log(`Sending response: ${response}`);
                        await message.channel.send(response);
                    } else {
                        const response = `**All repositories have had activity in the last week.**`;
                        console.log(`Sending response: ${response}`);
                        await message.channel.send(response);
                    }
                    break;

                case "top-repos":
                    console.log('Received !github top-repos command');
                    const teamContributions = await getTeamContributions();
                    const topTeams = teamContributions.slice(0, 5);
                    const response = `**Top 5 most active repos in the last week:**\n` +
                        topTeams.map((team, index) => `${index + 1}. [${team.repo}](${team.url}): ${team.commitCount} commits`).join("\n");
                    console.log(`Sending response: ${response}`);
                    await message.channel.send(response);
                    break;

                case "top-contributor":
                    console.log('Received !github top-contributor command');
                    const mostActiveMember = await getMostActiveMember();
                    const topContributorResponse = `**Most active member in the last week:**\n${mostActiveMember.name} with ${mostActiveMember.commitCount} commits`;
                    console.log(`Sending response: ${topContributorResponse}`);
                    await message.channel.send(topContributorResponse);
                    break;

                case "repo-stats":
                    console.log('Received !github repo-stats command');
                    const [owner, repo] = args;
                    if (owner && repo) {
                        console.log(`Checking if repo exists: ${owner}/${repo}`);
                        const repoExists = repos.some(r => r.owner.toLowerCase() === owner.toLowerCase() && r.repo.toLowerCase() === repo.toLowerCase());
                        console.log(`Repo exists: ${repoExists}`);
                        if (repoExists) {
                            console.log(`Fetching stats for ${owner}/${repo}`);
                            const stats = await getRepoStats(owner, repo);
                            const statsResponse = `**Stats for ${owner}/${repo}:**\n` +
                                `Commits: ${stats.commitCount}\n` +
                                `Contributors: ${stats.contributorCount}\n` +
                                `Total lines changed: ${stats.totalLines}`;
                            console.log(`Sending response: ${statsResponse}`);
                            await message.channel.send(statsResponse);
                        } else {
                            console.log(`Repository not found: ${owner}/${repo}`);
                            await message.channel.send("This repository is not in the list of monitored repositories.");
                        }
                    } else {
                        console.log('Invalid repo-stats command format');
                        await message.channel.send("Please provide owner and repo names. Usage: !github repo-stats <owner> <repo>");
                    }
                    break;

                default:
                    console.log(`Unknown command: ${command}`);
                    await message.channel.send("Unknown command. Available commands: inactive-users, inactive-repos, top-repos, top-contributor, repo-stats");
            }
        } catch (error) {
            console.error('Error processing command:', error);
            await message.channel.send("An error occurred while processing your command. Please try again later.");
        }
        console.log('Response sent to Discord channel');
    }
});

client.login(process.env.DISCORD_TOKEN);
console.log('Discord bot logged in');

const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
    console.log('Received request to root endpoint');
    res.status(200).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>GitHub Analytics Discord Bot</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    margin: 0;
                    padding: 20px;
                    background-color: #f4f4f4;
                }
                .container {
                    background-color: #fff;
                    border-radius: 5px;
                    padding: 20px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    max-width: 800px;
                    margin: 0 auto;
                }
                h1 {
                    color: #2c3e50;
                    border-bottom: 2px solid #3498db;
                    padding-bottom: 10px;
                    font-size: 24px;
                }
                .status {
                    display: inline-block;
                    background-color: #2ecc71;
                    color: white;
                    padding: 5px 10px;
                    border-radius: 3px;
                    font-weight: bold;
                }
                .timestamp {
                    color: #7f8c8d;
                    font-style: italic;
                }
                @media (max-width: 600px) {
                    body {
                        padding: 10px;
                    }
                    .container {
                        padding: 15px;
                    }
                    h1 {
                        font-size: 20px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>GitHub Analytics Discord Bot</h1>
                <p><strong>Status:</strong> <span class="status">Active</span></p>
                <p><strong>Message:</strong> GitHub Analytics Discord Bot is up and running</p>
                <p class="timestamp"><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            </div>
        </body>
        </html>
    `);
    console.log('Response sent for root endpoint');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});

// How to use the bot:
// 1. Invite the bot to your Discord server
// 2. Use the following commands in any text channel:
//    - !github inactive-users: List inactive users in the last week
//    - !github inactive-repos: List repositories with no commits in the last week
//    - !github top-repos: Show top 5 most active repositories in the last week
//    - !github top-contributor: Show the most active contributor in the last week
//    - !github repo-stats <owner> <repo>: Show stats for a specific repository
//
// Available commands:
// !github inactive-users
// !github inactive-repos
// !github top-repos
// !github top-contributor
// !github repo-stats <owner> <repo>