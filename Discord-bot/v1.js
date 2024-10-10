import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import { Octokit } from '@octokit/rest';
import fs from 'fs';
import express from 'express';
import NodeCache from 'node-cache';

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

const cache = new NodeCache({ stdTTL: 900 });

const repoUrls = JSON.parse(fs.readFileSync('repoUrls.json', 'utf8')).urls;
console.log('Repository URLs loaded:', repoUrls);

const repos = repoUrls.map(url => {
    const [, owner, repo] = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    return { owner, repo, url };
});
console.log('Repositories parsed:', repos);

async function getWeeklyCommits(owner, repo, useCachedData = false) {
    const cacheKey = `commits:${owner}:${repo}`;
    
    if (useCachedData) {
        const cachedCommits = cache.get(cacheKey);
        if (cachedCommits) {
            console.log(`Retrieved cached commits for ${owner}/${repo}`);
            return cachedCommits;
        }
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

async function getUserWeeklyCommits(owner, repo, useCachedData = false) {
    console.log(`Getting user weekly commits for ${owner}/${repo}`);
    const commits = await getWeeklyCommits(owner, repo, useCachedData);
    const usersWithoutCommits = [];

    const cacheKey = `contributors:${owner}:${repo}`;
    let contributors;
    
    if (useCachedData) {
        contributors = cache.get(cacheKey);
    }
    
    if (!contributors) {
        console.log(`Fetching contributors for ${owner}/${repo}`);
        const response = await octokit.rest.repos.listContributors({ owner, repo });
        contributors = response.data;
        cache.set(cacheKey, contributors);
    }

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

async function getInactiveRepos(useCachedData = false) {
    console.log('Checking for inactive repositories');
    const inactiveRepos = [];
    await Promise.all(repos.map(async ({ owner, repo, url }) => {
        const commits = await getWeeklyCommits(owner, repo, useCachedData);
        if (commits.length === 0) {
            inactiveRepos.push({ owner, repo, url });
        }
    }));
    console.log('Inactive repositories:', inactiveRepos);
    return inactiveRepos;
}

async function getTeamContributions(useCachedData = false) {
    console.log('Fetching team contributions');
    const teamContributions = await Promise.all(repos.map(async ({ owner, repo, url }) => {
        const commits = await getWeeklyCommits(owner, repo, useCachedData);
        return {
            repo: `${owner}/${repo}`,
            commitCount: commits.length,
            url
        };
    }));
    return teamContributions.sort((a, b) => b.commitCount - a.commitCount);
}

async function getMostActiveMember(useCachedData = false) {
    console.log('Fetching most active member');
    const memberContributions = {};
    await Promise.all(repos.map(async ({ owner, repo }) => {
        const commits = await getWeeklyCommits(owner, repo, useCachedData);
        commits.forEach(commit => {
            const author = commit.author?.login;
            if (author) {
                memberContributions[author] = (memberContributions[author] || 0) + 1;
            }
        });
    }));
    const mostActiveMember = Object.entries(memberContributions).reduce((a, b) => a[1] > b[1] ? a : b);
    return { name: mostActiveMember[0], commitCount: mostActiveMember[1] };
}

client.on("messageCreate", async (message) => {
    console.log(`Received message: ${message.content}`);
    if (message.content.startsWith("!inactive")) {
        console.log('Received !inactive command');
        const useCachedData = message.content.includes("cached");
        let inactiveUsers = [];
        await Promise.all(repos.map(async ({ owner, repo }) => {
            console.log(`Processing ${owner}/${repo}`);
            const usersWithoutCommits = await getUserWeeklyCommits(owner, repo, useCachedData);
            inactiveUsers = [...inactiveUsers, ...usersWithoutCommits];
        }));
        const uniqueInactiveUsers = [...new Set(inactiveUsers)];
        console.log('Unique inactive users:', uniqueInactiveUsers);
        if (uniqueInactiveUsers.length > 0) {
            const response = `**Inactive members in the last week (${useCachedData ? 'cached' : 'live'} data):**\n` + 
                uniqueInactiveUsers.map(user => `• ${user}`).join("\n");
            console.log(`Sending response: ${response}`);
            message.channel.send(response);
        } else {
            const response = `**All members have been active in the last week. (${useCachedData ? 'cached' : 'live'} data)**`;
            console.log(`Sending response: ${response}`);
            message.channel.send(response);
        }
        console.log('Response sent to Discord channel');
    } else if (message.content.startsWith("!inactive-teams")) {
        console.log('Received !inactive-teams command');
        const useCachedData = message.content.includes("cached");
        const inactiveRepos = await getInactiveRepos(useCachedData);
        if (inactiveRepos.length > 0) {
            const response = `**Repositories with no commits in the last week (${useCachedData ? 'cached' : 'live'} data):**\n` + 
                inactiveRepos.map(repo => `• [${repo.owner}/${repo.repo}](${repo.url})`).join("\n");
            console.log(`Sending response: ${response}`);
            message.channel.send(response);
        } else {
            const response = `**All repositories have had activity in the last week. (${useCachedData ? 'cached' : 'live'} data)**`;
            console.log(`Sending response: ${response}`);
            message.channel.send(response);
        }
        console.log('Response sent to Discord channel');
    } else if (message.content.startsWith("!leaderteams")) {
        console.log('Received !leaderteams command');
        const useCachedData = message.content.includes("cached");
        const teamContributions = await getTeamContributions(useCachedData);
        const topTeams = teamContributions.slice(0, 5);
        const response = `**Top 5 most active teams in the last week (${useCachedData ? 'cached' : 'live'} data):**\n` +
            topTeams.map((team, index) => `${index + 1}. [${team.repo}](${team.url}): ${team.commitCount} commits`).join("\n");
        console.log(`Sending response: ${response}`);
        message.channel.send(response);
        console.log('Response sent to Discord channel');
    } else if (message.content.startsWith("!most-active-member")) {
        console.log('Received !most-active-member command');
        const useCachedData = message.content.includes("cached");
        const mostActiveMember = await getMostActiveMember(useCachedData);
        const response = `**Most active member in the last week (${useCachedData ? 'cached' : 'live'} data):**\n${mostActiveMember.name} with ${mostActiveMember.commitCount} commits`;
        console.log(`Sending response: ${response}`);
        message.channel.send(response);
        console.log('Response sent to Discord channel');
    }
});

client.login(process.env.DISCORD_TOKEN);
console.log('Discord bot logged in');

const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
    console.log('Received request to root endpoint');
    res.send('Service is active');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
