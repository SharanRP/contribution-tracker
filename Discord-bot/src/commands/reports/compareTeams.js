import { getWeeklyCommits, getOpenIssues, getOpenPullRequests } from '../../services/github.js';
import { teamsData } from '../utils.js';

export async function handleCompareTeams(team1Name, team2Name, cache) {
    try {
        const team1 = teamsData.teams.find(t => t.teamName.toLowerCase() === team1Name.toLowerCase());
        const team2 = teamsData.teams.find(t => t.teamName.toLowerCase() === team2Name.toLowerCase());

        if (!team1 || !team2) {
            return "One or both teams not found.";
        }

        async function getTeamStats(team) {
            const commits = await getWeeklyCommits(team.repository.owner, team.repository.name, cache);
            const issues = await getOpenIssues(team.repository.owner, team.repository.name, cache);
            const prs = await getOpenPullRequests(team.repository.owner, team.repository.name, cache);

            const memberStats = team.members.map(member => {
                const memberCommits = commits.filter(commit => 
                    commit.author?.login.toLowerCase() === member.githubUsername.toLowerCase()
                );
                const linesChanged = memberCommits.reduce((acc, commit) => {
                    const additions = commit.stats?.additions || 0;
                    const deletions = commit.stats?.deletions || 0;
                    return acc + additions + deletions;
                }, 0);
                return {
                    name: member.name,
                    role: member.role,
                    commitCount: memberCommits.length,
                    linesChanged
                };
            });

            const totalLines = commits.reduce((acc, commit) => {
                const additions = commit.stats?.additions || 0;
                const deletions = commit.stats?.deletions || 0;
                return acc + additions + deletions;
            }, 0);

            return {
                commitCount: commits.length,
                totalLines,
                contributorCount: new Set(commits.map(c => c.author?.login).filter(Boolean)).size,
                openIssuesCount: issues.length,
                openPullRequestCount: prs.length,
                memberStats
            };
        }

        const team1Stats = await getTeamStats(team1);
        const team2Stats = await getTeamStats(team2);

        return `**Team Comparison**\n\n` +
            `**${team1.teamName}** vs **${team2.teamName}**\n\n` +
            `Total Commits:\n` +
            `• ${team1.teamName}: ${team1Stats.commitCount}\n` +
            `• ${team2.teamName}: ${team2Stats.commitCount}\n\n` +
            `Lines Changed:\n` +
            `• ${team1.teamName}: ${team1Stats.totalLines}\n` +
            `• ${team2.teamName}: ${team2Stats.totalLines}\n\n` +
            `Active Contributors:\n` +
            `• ${team1.teamName}: ${team1Stats.contributorCount}\n` +
            `• ${team2.teamName}: ${team2Stats.contributorCount}\n\n` +
            `Open Issues:\n` +
            `• ${team1.teamName}: ${team1Stats.openIssuesCount}\n` +
            `• ${team2.teamName}: ${team2Stats.openIssuesCount}\n\n` +
            `Pull Requests:\n` +
            `• ${team1.teamName}: ${team1Stats.openPullRequestCount}\n` +
            `• ${team2.teamName}: ${team2Stats.openPullRequestCount}\n\n` +
            `**Member Comparison:**\n\n` +
            `${team1.teamName} Members:\n` +
            team1Stats.memberStats.map(member =>
                `• ${member.name} (${member.role}):\n` +
                `  - Commits: ${member.commitCount}\n` +
                `  - Lines: ${member.linesChanged}`
            ).join('\n\n') +
            `\n\n${team2.teamName} Members:\n` +
            team2Stats.memberStats.map(member =>
                `• ${member.name} (${member.role}):\n` +
                `  - Commits: ${member.commitCount}\n` +
                `  - Lines: ${member.linesChanged}`
            ).join('\n\n');
    } catch (error) {
        console.error(`Error in handleCompareTeams:`, error);
        throw error;
    }
} 