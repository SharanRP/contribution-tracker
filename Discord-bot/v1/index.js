import dotenv from 'dotenv';
import { Client, GatewayIntentBits } from 'discord.js';
import { initializeOctokit } from './github.js';
import { setupCache } from './cache.js';
import { loadRepositories } from './repositories.js';
import { setupCronJob } from './cron.js';
import { handleMessage } from './discord-commands.js';
import { startServer } from './server.js';

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

initializeOctokit();
const cache = setupCache();
const repos = loadRepositories();

client.on("messageCreate", (message) => handleMessage(message, repos, cache));

client.login(process.env.DISCORD_TOKEN);
console.log('Discord bot logged in');

setupCronJob(client, cache, repos);

startServer();
