import { getWeeklyCommits, getOpenIssues, getOpenPullRequests } from '../../services/github.js';
import { teamsData } from '../utils.js';

export async function handleTeamProgress(teamName, cache) {
    try {
        const team = teamsData.teams.find(t => 
            t.teamName.toLowerCase() === teamName.toLowerCase()
        );

        if (!team) {
            return `Team "${teamName}" not found.`;
        }

        const repoInfo = team.repository;
        const commits = await getWeeklyCommits(repoInfo.owner, repoInfo.name, cache);
        const issues = await getOpenIssues(repoInfo.owner, repoInfo.name, cache);
        const prs = await getOpenPullRequests(repoInfo.owner, repoInfo.name, cache);

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

        return `**Team Progress Report for ${team.teamName}**\n\n` +
            `Repository: [${repoInfo.owner}/${repoInfo.name}](${team.repoUrl})\n\n` +
            `**Weekly Activity:**\n` +
            `• Total Commits: ${commits.length}\n` +
            `• Lines Changed: ${totalLines}\n` +
            `• Active Contributors: ${new Set(commits.map(c => c.author?.login).filter(Boolean)).size}\n\n` +
            `**Current Status:**\n` +
            `• Open Issues: ${issues.length}\n` +
            `• Open PRs: ${prs.length}\n\n` +
            `**Member Activity:**\n` +
            memberStats.map(member => 
                `• ${member.name} (${member.role}):\n` +
                `  - Commits: ${member.commitCount}\n` +
                `  - Lines Changed: ${member.linesChanged}`
            ).join('\n\n');
    } catch (error) {
        console.error(`Error in handleTeamProgress for ${teamName}:`, error);
        throw error;
    }
} 