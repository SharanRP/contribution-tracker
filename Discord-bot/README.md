# GitHub Analytics Discord Bot

This Discord bot provides GitHub analytics for specified repositories. It offers various commands to retrieve information about repository activity, user contributions, and more.

## Table of Contents
1. [Features](#features)
2. [Commands](#commands)
3. [Setup](#setup)
4. [Implementation Details](#implementation-details)
5. [Docker Configuration](#docker-configuration)

## Features
- Monitor multiple GitHub repositories
- Retrieve information about inactive users and repositories
- Display top contributors and most active repositories
- Provide detailed statistics for specific repositories
- Automatic cache updates to improve performance
- Express server for health checks

## Commands
The bot responds to the following commands in Discord channels:

1. `!github inactive-users`: Lists users who haven't made commits in the last week across all monitored repositories.
2. `!github inactive-repos`: Shows repositories with no commits in the last week.
3. `!github top-repos`: Displays the top 5 most active repositories based on commit count in the last week.
4. `!github top-contributor`: Identifies the most active contributor across all repositories in the last week.
5. `!github repo-stats <owner> <repo>`: Provides detailed statistics for a specific repository.

## Setup
1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   - `DISCORD_TOKEN`: Your Discord bot token
   - `GITHUB_TOKEN`: Your GitHub personal access token
   - `PORT`: (Optional) Port for the Express server (default: 10000)

4. Create a `repoUrls.json` file with the list of GitHub repository URLs to monitor.
5. Run the bot:
   ```bash
   node v1.js
   ```

## Implementation Details

### Main Components
- **Discord.js**: Client for bot functionality.
- **Octokit**: Used for GitHub API interactions.
- **Express**: For a simple web server.
- **Node-cache**: For caching API responses.
- **Node-cron**: For scheduling cache updates.

### Key Functions

#### `getWeeklyCommits(owner, repo)`
Retrieves commits for a repository in the last week. Uses caching to improve performance.

#### `updateCache()`
Updates the cache for all repositories. Called by a cron job.

#### `getUserWeeklyCommits(owner, repo)`
Identifies users who haven't made commits in the last week for a specific repository.

#### `getInactiveRepos()`
Finds repositories with no commits in the last week.

#### `getTeamContributions()`
Calculates the number of commits for each repository in the last week.

#### `getMostActiveMember()`
Identifies the user with the most commits across all repositories in the last week.

#### `getRepoStats(owner, repo)`
Retrieves detailed statistics for a specific repository, including commit count, contributor count, and total lines changed.

### Cron Job
A cron job runs every 15 minutes to update the cache. It follows these rules:
- On weekdays during peak hours (4 PM to 1 AM IST), it updates the cache.
- On weekdays during non-peak hours, it skips the update.
- On weekends, it always updates the cache.

### Express Server
A simple Express server runs on the specified port (default: 10000) and provides a health check endpoint at the root URL (`/`).

## Docker Configuration

This project includes a Dockerfile for development with hot reloading. Below are the key commands and explanations for building and running the Docker image.

### Building the Docker Image

To build the Docker image for development, use the following command:
```bash
# Build the Docker image for development
docker build --target dev -t discord-bot-dev .
```

### Running the Docker Container

To run the Docker container with hot reloading, use the command below:

```bash
# Run the Docker container with hot reloading
docker run -it \
  -p 3000:3000 \
  -p 10000:10000 \
  --env-file .env \
  --name discord-bot-dev \
  --mount type=bind,source=$(pwd),target=/usr/src/app \
  discord-bot-dev
```

This command mounts the current directory inside the container and utilizes `nodemon`. Any changes made to the code will automatically trigger a restart of the application.

### `.dockerignore` Example

To optimize your Docker build, you can use a `.dockerignore` file. Below is an example of what to include:

```
# .dockerignore
node_modules
npm-debug.log
Dockerfile*
.dockerignore
```

This will prevent unnecessary files from being included in your Docker image.
```
