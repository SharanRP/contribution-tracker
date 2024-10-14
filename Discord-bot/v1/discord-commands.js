import { getWeeklyCommits, getContributors, getOpenIssues, getOpenPullRequests } from './github.js';

async function getUserWeeklyCommits(owner, repo, cache) {
    try {
        console.log(`Getting user weekly commits for ${owner}/${repo}`);
        const commits = await getWeeklyCommits(owner, repo, cache);
        const contributors = await getContributors(owner, repo, cache);

        console.log(`Checking for users without commits in ${owner}/${repo}`);
        const usersWithoutCommits = contributors.filter(contributor =>
            !commits.some(commit => commit.author?.login === contributor.login)
        ).map(contributor => contributor.login);

        console.log(`Users without commits in ${owner}/${repo}:`, usersWithoutCommits);
        return usersWithoutCommits;
    } catch (error) {
        console.error(`Error in getUserWeeklyCommits for ${owner}/${repo}:`, error);
        throw error;
    }
}

async function getInactiveRepos(repos, cache) {
    try {
        console.log('Checking for inactive repositories');
        const inactiveRepos = [];
        await Promise.all(repos.map(async ({ owner, repo, url }) => {
            try {
                console.log(`Checking activity for ${owner}/${repo}`);
                const commits = await getWeeklyCommits(owner, repo, cache);
                if (commits.length === 0) {
                    console.log(`${owner}/${repo} is inactive`);
                    inactiveRepos.push({ owner, repo, url });
                }
            } catch (error) {
                console.error(`Error checking activity for ${owner}/${repo}:`, error);
                // Continue with other repos
            }
        }));
        console.log('Inactive repositories:', inactiveRepos);
        return inactiveRepos;
    } catch (error) {
        console.error('Error in getInactiveRepos:', error);
        throw error;
    }
}

async function getTeamContributions(repos, cache) {
    try {
        console.log('Fetching team contributions');
        const teamContributions = await Promise.all(repos.map(async ({ owner, repo, url }) => {
            try {
                console.log(`Getting contributions for ${owner}/${repo}`);
                const commits = await getWeeklyCommits(owner, repo, cache);
                return {
                    repo: `${owner}/${repo}`,
                    commitCount: commits.length,
                    url
                };
            } catch (error) {
                console.error(`Error getting contributions for ${owner}/${repo}:`, error);
                return { repo: `${owner}/${repo}`, commitCount: 0, url };
            }
        }));
        console.log('Team contributions fetched, sorting...');
        return teamContributions.sort((a, b) => b.commitCount - a.commitCount);
    } catch (error) {
        console.error('Error in getTeamContributions:', error);
        throw error;
    }
}

async function getMostActiveMember(repos, cache) {
    try {
        console.log('Fetching most active member');
        const memberContributions = {};
        await Promise.all(repos.map(async ({ owner, repo }) => {
            try {
                console.log(`Getting commits for ${owner}/${repo}`);
                const commits = await getWeeklyCommits(owner, repo, cache);
                commits.forEach(commit => {
                    const author = commit.author?.login;
                    if (author) {
                        memberContributions[author] = (memberContributions[author] || 0) + 1;
                    }
                });
            } catch (error) {
                console.error(`Error getting commits for ${owner}/${repo}:`, error);
                // Continue with other repos
            }
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
    } catch (error) {
        console.error('Error in getMostActiveMember:', error);
        throw error;
    }
}

async function getRepoStats(owner, repo, cache) {
    try {
        console.log(`Fetching repo stats for ${owner}/${repo}`);
        const commits = await getWeeklyCommits(owner, repo, cache);
        const contributors = new Set(commits.map(commit => commit.author?.login).filter(Boolean));
        const totalLines = commits.reduce((acc, commit) => acc + (commit.stats?.total || 0), 0);
        const openIssues = await getOpenIssues(owner, repo, cache);
        const openPullRequests = await getOpenPullRequests(owner, repo, cache);

        console.log(`Stats for ${owner}/${repo}:`, {
            commitCount: commits.length,
            contributorCount: contributors.size,
            totalLines,
            openIssuesCount: openIssues.length,
            openPullRequestCount: openPullRequests.length,
        });

        return {
            commitCount: commits.length,
            contributorCount: contributors.size,
            totalLines,
            openIssuesCount: openIssues.length,
            openPullRequestCount: openPullRequests.length,
        };
    } catch (error) {
        console.error(`Error in getRepoStats for ${owner}/${repo}:`, error);
        throw error;
    }
}

export async function handleMessage(message, repos, cache) {
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
                        try {
                            console.log(`Processing ${owner}/${repo}`);
                            const usersWithoutCommits = await getUserWeeklyCommits(owner, repo, cache);
                            inactiveUsers = [...inactiveUsers, ...usersWithoutCommits];
                        } catch (error) {
                            console.error(`Error processing ${owner}/${repo} for inactive users:`, error);
                            // Continue with other repos
                        }
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
                    const inactiveRepos = await getInactiveRepos(repos, cache);
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
                    const teamContributions = await getTeamContributions(repos, cache);
                    const topTeams = teamContributions.slice(0, 5);
                    const response = `**Top 5 most active repos in the last week:**\n` +
                        topTeams.map((team, index) => `${index + 1}. [${team.repo}](${team.url}): ${team.commitCount} commits`).join("\n");
                    console.log(`Sending response: ${response}`);
                    await message.channel.send(response);
                    break;

                case "top-contributor":
                    console.log('Received !github top-contributor command');
                    const mostActiveMember = await getMostActiveMember(repos, cache);
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
                            const stats = await getRepoStats(owner, repo, cache);
                            const statsResponse = `**Stats for ${owner}/${repo}:**\n` +
                                `Commits: ${stats.commitCount}\n` +
                                `Contributors: ${stats.contributorCount}\n` +
                                `Total lines changed: ${stats.totalLines}\n` +
                                `Open issues: ${stats.openIssuesCount}\n` +
                                `Pull requests: ${stats.openPullRequestCount}\n`;
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
}
