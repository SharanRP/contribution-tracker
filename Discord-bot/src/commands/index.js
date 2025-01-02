import { handleInactiveUsers, handleInactiveRepos, handleTopContributor } from './activity/index.js';
import { handleRepoStats, handleTeamProgress, handleMemberProgress } from './stats/index.js';
import { handleWeeklyReport, handleCompareTeams, handleIssues } from './reports/index.js';
import { handleRepoInsights, handleUserInsights } from './insights/index.js';

export async function handleMessage(message, repos, cache) {
    console.log(`Received message: ${message.content}`);

    if (message.content.startsWith("!github")) {
        const [, command, ...args] = message.content.split(" ");
        console.log(`Processing command: ${command}`);

        try {
            let response;
            switch (command) {
                case "inactive-users":
                    response = await handleInactiveUsers(repos, cache);
                    break;

                case "inactive-repos":
                    response = await handleInactiveRepos(repos, cache);
                    break;

                case "top-contributor":
                    response = await handleTopContributor(repos, cache);
                    break;

                case "repo-stats":
                    const [owner, repo] = args;
                    if (owner && repo) {
                        console.log(`Checking if repo exists: ${owner}/${repo}`);
                        const repoExists = repos.some(r => 
                            r.owner.toLowerCase() === owner.toLowerCase() && 
                            r.repo.toLowerCase() === repo.toLowerCase()
                        );
                        if (repoExists) {
                            response = await handleRepoStats(owner, repo, cache);
                        } else {
                            response = "This repository is not in the list of monitored repositories.";
                        }
                    } else {
                        response = "Please provide owner and repo names. Usage: !github repo-stats <owner> <repo>";
                    }
                    break;

                case "team-progress":
                    const [teamName] = args;
                    if (teamName) {
                        response = await handleTeamProgress(teamName, cache);
                    } else {
                        response = "Please provide a team name. Usage: !github team-progress <team-name>";
                    }
                    break;

                case "member-progress":
                    const [memberUsername] = args;
                    if (memberUsername) {
                        response = await handleMemberProgress(memberUsername, repos, cache);
                    } else {
                        response = "Please provide a GitHub username. Usage: !github member-progress <github-username>";
                    }
                    break;

                case "weekly-report":
                    response = await handleWeeklyReport(cache);
                    break;

                case "compare-teams":
                    const [team1Name, team2Name] = args;
                    if (team1Name && team2Name) {
                        response = await handleCompareTeams(team1Name, team2Name, cache);
                    } else {
                        response = "Please provide two team names. Usage: !github compare-teams <team1-name> <team2-name>";
                    }
                    break;

                case "issues":
                    const [issueTeamName] = args;
                    response = await handleIssues(issueTeamName, cache);
                    break;

                case "repo-insights":
                    const [insightOwner, insightRepo] = args;
                    if (insightOwner && insightRepo) {
                        response = await handleRepoInsights(insightOwner, insightRepo, cache);
                    } else {
                        response = "Please provide owner and repo names. Usage: !github repo-insights <owner> <repo>";
                    }
                    break;

                case "user-insights":
                    const [insightUsername] = args;
                    if (insightUsername) {
                        response = await handleUserInsights(insightUsername, repos, cache);
                    } else {
                        response = "Please provide a GitHub username. Usage: !github user-insights <github-username>";
                    }
                    break;

                default:
                    response = "**Available Commands:**\n\n" +
                        "**Repository Activity:**\n" +
                        "• `!github inactive-users` - Show inactive team members\n" +
                        "• `!github inactive-repos` - Show inactive repositories\n" +
                        "• `!github top-repos` - Show top 5 active repositories\n" +
                        "• `!github top-contributor` - Show most active contributor\n" +
                        "• `!github repo-stats <owner> <repo>` - Show detailed repository statistics\n\n" +
                        "**Team Management:**\n" +
                        "• `!github team-progress <team-name>` - Show detailed team progress\n" +
                        "• `!github member-progress <github-username>` - Show individual member progress\n" +
                        "• `!github weekly-report` - Show weekly activity report for all teams\n" +
                        "• `!github issues [team-name]` - Show open issues (optionally filter by team)\n" +
                        "• `!github compare-teams <team1> <team2>` - Compare two teams' progress\n\n" +
                        "**Detailed Progress Tracking:**\n" +
                        "• `!github repo-insights <owner> <repo>` - Show detailed repository analytics\n" +
                        "• `!github user-insights <github-username>` - Show detailed user contribution patterns";
            }

            if (response) {
                await message.channel.send(response);
            }
        } catch (error) {
            console.error('Error processing command:', error);
            await message.channel.send("An error occurred while processing your command. Please try again later.");
        }
        console.log('Response sent to Discord channel');
    }
}
