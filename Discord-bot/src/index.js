import { Client, GatewayIntentBits } from 'discord.js';
import { handleMessage } from './commands/index.js';
import { initializeOctokit } from './services/github.js';
import { updateCache } from './utils/cache.js';
import { startServer } from './services/server.js';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.DISCORD_TOKEN) {
    console.error('DISCORD_TOKEN is required but was not found in environment variables');
    process.exit(1);
}

if (!process.env.GITHUB_TOKEN) {
    console.error('GITHUB_TOKEN is required but was not found in environment variables');
    process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load teams data
const teamsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../teams.json'), 'utf-8'));

// Extract repository information from teams data
const repos = teamsData.teams.map(team => ({
    owner: team.repository.owner,
    repo: team.repository.name,
    url: team.repoUrl
}));

const cache = new Map();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.once('ready', () => {
    console.log('Discord bot logged in');
    initializeOctokit();
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    await handleMessage(message, repos, cache);
});

// Schedule cache update every hour
cron.schedule('0 * * * *', () => {
    console.log('Updating cache...');
    updateCache(repos, cache);
});

// Handle errors
client.on('error', error => {
    console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

// Login with error handling
try {
    await client.login(process.env.DISCORD_TOKEN);
    startServer();
} catch (error) {
    console.error('Failed to start the bot:', error);
    process.exit(1);
}
