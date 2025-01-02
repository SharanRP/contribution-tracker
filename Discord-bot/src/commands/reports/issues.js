import { getOpenIssues } from '../../services/github.js';
import { teamsData } from '../utils.js';

export async function handleIssues(teamName, cache) {
    try {
        let targetTeams = teamName 
            ? teamsData.teams.filter(t => t.teamName.toLowerCase() === teamName.toLowerCase())
            : teamsData.teams;

        if (teamName && targetTeams.length === 0) {
            return `Team "${teamName}" not found.`;
        }

        const teamIssues = await Promise.all(targetTeams.map(async team => {
            const repoInfo = team.repository;
            const issues = await getOpenIssues(repoInfo.owner, repoInfo.name, cache);
            return {
                teamName: team.teamName,
                repoUrl: team.repoUrl,
                issues: issues.map(issue => ({
                    title: issue.title,
                    url: issue.html_url,
                    assignee: issue.assignee?.login || 'Unassigned',
                    createdAt: new Date(issue.created_at).toLocaleDateString()
                }))
            };
        }));

        return `**Open Issues Report**\n\n` +
            teamIssues.map(team => 
                `**${team.teamName}**\n` +
                `Repository: [Link](${team.repoUrl})\n\n` +
                (team.issues.length > 0 
                    ? team.issues.map(issue =>
                        `• [${issue.title}](${issue.url})\n` +
                        `  - Assignee: ${issue.assignee}\n` +
                        `  - Created: ${issue.createdAt}`
                    ).join('\n\n')
                    : '• No open issues')
            ).join('\n\n---\n\n');
    } catch (error) {
        console.error(`Error in handleIssues:`, error);
        throw error;
    }
} 