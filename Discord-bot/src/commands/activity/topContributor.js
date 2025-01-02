import { getWeeklyCommits } from '../../services/github.js';
import { findTeamByRepo } from '../utils.js';

export async function handleTopContributor(repos, cache) {
    try {
        console.log('Fetching most active member');
        const memberContributions = {};
        await Promise.all(repos.map(async ({ owner, repo }) => {
            try {
                console.log(`Getting commits for ${owner}/${repo}`);
                const commits = await getWeeklyCommits(owner, repo, cache);
                const team = findTeamByRepo(owner, repo);
                
                commits.forEach(commit => {
                    const author = commit.author?.login;
                    if (author) {
                        const member = team?.members.find(m => m.githubUsername.toLowerCase() === author.toLowerCase());
                        const key = author;
                        if (!memberContributions[key]) {
                            memberContributions[key] = {
                                githubUsername: author,
                                name: member?.name || 'Unknown',
                                role: member?.role || 'Unknown',
                                teamName: team?.teamName || 'Unknown Team',
                                commitCount: 0
                            };
                        }
                        memberContributions[key].commitCount++;
                    }
                });
            } catch (error) {
                console.error(`Error getting commits for ${owner}/${repo}:`, error);
            }
        }));
        
        console.log('Member contributions:', memberContributions);
        const entries = Object.values(memberContributions);
        if (entries.length === 0) {
            console.log('No contributions found');
            return { name: 'No one', commitCount: 0, teamName: 'N/A', role: 'N/A' };
        }
        const mostActiveMember = entries.reduce((a, b) => a.commitCount > b.commitCount ? a : b);
        console.log('Most active member:', mostActiveMember);

        return `**Most active member in the last week:**\n\n` +
            `• **${mostActiveMember.name}** (${mostActiveMember.githubUsername})\n` +
            `  Team: ${mostActiveMember.teamName}\n` +
            `  Role: ${mostActiveMember.role}\n` +
            `  Total Commits: ${mostActiveMember.commitCount}`;
    } catch (error) {
        console.error('Error in handleTopContributor:', error);
        throw error;
    }
} 