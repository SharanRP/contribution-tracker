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
import chalk from 'chalk';

// Load environment variables
dotenv.config();

// Configure logging
const log = {
    info: (...args) => console.log(chalk.blue('[INFO]'), ...args),
    error: (...args) => console.error(chalk.red('[ERROR]'), ...args),
    warn: (...args) => console.warn(chalk.yellow('[WARN]'), ...args),
    success: (...args) => console.log(chalk.green('[SUCCESS]'), ...args)
};

// Validate required environment variables
const requiredEnvVars = ['DISCORD_TOKEN', 'GITHUB_TOKEN'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    log.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load teams data with validation
let teamsData;
try {
    const teamsFilePath = path.join(__dirname, '../teams.json');
    if (!fs.existsSync(teamsFilePath)) {
        log.error('teams.json file not found');
        process.exit(1);
    }
    
    const teamsContent = fs.readFileSync(teamsFilePath, 'utf-8');
    teamsData = JSON.parse(teamsContent);
    
    if (!teamsData.teams || !Array.isArray(teamsData.teams)) {
        log.error('Invalid teams.json structure: missing or invalid teams array');
        process.exit(1);
    }
    
    // Validate each team's structure
    teamsData.teams.forEach((team, index) => {
        if (!team.repository?.owner || !team.repository?.name || !team.repoUrl) {
            log.error(`Invalid repository data in team at index ${index}`);
            process.exit(1);
        }
    });
} catch (error) {
    log.error('Failed to load teams data:', error);
    process.exit(1);
}

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

// Set up graceful shutdown
function gracefulShutdown(signal) {
    log.warn(`Received ${signal}. Starting graceful shutdown...`);
    
    // Destroy Discord client connection
    client.destroy();
    log.info('Discord client connection closed');
    
    // Clear cache
    cache.clear();
    log.info('Cache cleared');
    
    log.success('Graceful shutdown completed');
    process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

client.once('ready', () => {
    log.success('Discord bot logged in');
    try {
        initializeOctokit();
        log.success('GitHub client initialized');
    } catch (error) {
        log.error('Failed to initialize GitHub client:', error);
        process.exit(1);
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    try {
        await handleMessage(message, repos, cache);
    } catch (error) {
        log.error('Error handling message:', error);
        try {
            await message.channel.send('An error occurred while processing your command. Please try again later.');
        } catch (sendError) {
            log.error('Failed to send error message to channel:', sendError);
        }
    }
});

// Schedule cache update with error handling
cron.schedule('0 * * * *', async () => {
    log.info('Starting scheduled cache update...');
    try {
        await updateCache(repos, cache);
        log.success('Cache update completed');
    } catch (error) {
        log.error('Failed to update cache:', error);
    }
});

// Enhanced error handling
client.on('error', error => {
    log.error('Discord client error:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    log.error('Unhandled promise rejection:', reason);
    log.error('Promise:', promise);
});

process.on('uncaughtException', (error) => {
    log.error('Uncaught exception:', error);
    // Attempt graceful shutdown on uncaught exceptions
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Start the bot with enhanced error handling
try {
    await client.login(process.env.DISCORD_TOKEN);
    log.success('Bot successfully logged in');
    
    try {
        startServer();
        log.success('Server started successfully');
    } catch (error) {
        log.error('Failed to start server:', error);
        // Continue running the bot even if server fails to start
    }
} catch (error) {
    log.error('Failed to start the bot:', error);
    process.exit(1);
}
