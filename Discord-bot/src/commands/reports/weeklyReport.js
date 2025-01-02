import { getWeeklyCommits, getOpenIssues, getOpenPullRequests } from '../../services/github.js';
import { teamsData, calculateMemberStats, calculateTotalLines } from '../utils.js';

export async function handleWeeklyReport(cache) {
    try {
        console.log('Generating weekly report...');
        if (!teamsData || !teamsData.teams || !Array.isArray(teamsData.teams)) {
            console.error('Invalid teams data structure:', teamsData);
            throw new Error('Invalid teams data structure');
        }

        const allTeamStats = await Promise.all(teamsData.teams.map(async team => {
            try {
                console.log(`Processing team: ${team.teamName}`);
                if (!team.repository || !team.repository.owner || !team.repository.name) {
                    console.error('Invalid repository data for team:', team);
                    return null;
                }

                const repoInfo = team.repository;
                const commits = await getWeeklyCommits(repoInfo.owner, repoInfo.name, cache);
                const issues = await getOpenIssues(repoInfo.owner, repoInfo.name, cache);
                const prs = await getOpenPullRequests(repoInfo.owner, repoInfo.name, cache);

                const memberActivity = team.members.map(member => {
                    const stats = calculateMemberStats(commits, member);
                    return {
                        name: member.name,
                        role: member.role,
                        commits: stats.commitCount,
                        lines: stats.linesChanged
                    };
                });

                return {
                    teamName: team.teamName,
                    repoUrl: team.repoUrl,
                    totalCommits: commits.length,
                    totalLines: calculateTotalLines(commits),
                    openIssues: issues.length,
                    openPRs: prs.length,
                    memberActivity
                };
            } catch (error) {
                console.error(`Error processing team ${team.teamName}:`, error);
                return null;
            }
        }));

        // Filter out failed teams and sort by activity
        const validTeamStats = allTeamStats.filter(Boolean);
        if (validTeamStats.length === 0) {
            return "No team data available for the weekly report.";
        }

        validTeamStats.sort((a, b) => b.totalCommits - a.totalCommits);

        return `**Weekly Activity Report**\n\n` +
            validTeamStats.map(team => 
                `**${team.teamName}**\n` +
                `Repository: [Link](${team.repoUrl})\n` +
                `• Total Commits: ${team.totalCommits}\n` +
                `• Total Lines Changed: ${team.totalLines}\n` +
                `• Open Issues: ${team.openIssues}\n` +
                `• Open PRs: ${team.openPRs}\n\n` +
                `Member Activity:\n` +
                team.memberActivity
                    .filter(member => member.commits > 0 || member.lines > 0)
                    .map(member =>
                        `• ${member.name} (${member.role}):\n` +
                        `  - Commits: ${member.commits}\n` +
                        `  - Lines Changed: ${member.lines}`
                    ).join('\n\n')
            ).join('\n\n---\n\n');
    } catch (error) {
        console.error('Error generating weekly report:', error);
        throw new Error('Failed to generate weekly report: ' + error.message);
    }
} 