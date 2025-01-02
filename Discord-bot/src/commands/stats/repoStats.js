import { getWeeklyCommits, getOpenIssues, getOpenPullRequests } from '../../services/github.js';
import { findTeamByRepo } from '../utils.js';

export async function handleRepoStats(owner, repo, cache) {
    try {
        console.log(`Fetching repo stats for ${owner}/${repo}`);
        const commits = await getWeeklyCommits(owner, repo, cache);
        const team = findTeamByRepo(owner, repo);
        
        const memberStats = team?.members.map(member => {
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
        }) || [];

        const contributors = new Set(commits.map(commit => commit.author?.login).filter(Boolean));
        const totalLines = commits.reduce((acc, commit) => {
            const additions = commit.stats?.additions || 0;
            const deletions = commit.stats?.deletions || 0;
            return acc + additions + deletions;
        }, 0);
        const openIssues = await getOpenIssues(owner, repo, cache);
        const openPullRequests = await getOpenPullRequests(owner, repo, cache);

        const stats = {
            teamName: team?.teamName || 'Unknown Team',
            commitCount: commits.length,
            contributorCount: contributors.size,
            totalLines,
            openIssuesCount: openIssues.length,
            openPullRequestCount: openPullRequests.length,
            memberStats
        };

        const memberStatsText = stats.memberStats
            .map(member => 
                `    ${member.name} (${member.role}):\n` +
                `      Commits: ${member.commitCount}\n` +
                `      Lines Changed: ${member.linesChanged}`
            ).join('\n');

        return `**Stats for ${owner}/${repo}:**\n\n` +
            `Team: ${stats.teamName}\n` +
            `Total Commits: ${stats.commitCount}\n` +
            `Total Contributors: ${stats.contributorCount}\n` +
            `Total Lines Changed: ${stats.totalLines}\n` +
            `Open Issues: ${stats.openIssuesCount}\n` +
            `Open Pull Requests: ${stats.openPullRequestCount}\n\n` +
            `**Member Statistics:**\n${memberStatsText}`;
    } catch (error) {
        console.error(`Error in handleRepoStats for ${owner}/${repo}:`, error);
        throw error;
    }
} 