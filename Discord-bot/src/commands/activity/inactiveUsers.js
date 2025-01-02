import { getWeeklyCommits, getContributors } from '../../services/github.js';
import { findTeamByRepo } from '../utils.js';

export async function handleInactiveUsers(repos, cache) {
    console.log('Received !github inactive-users command');
    const inactiveUsersMap = new Map();
    const skippedRepos = [];
    
    await Promise.all(repos.map(async ({ owner, repo }) => {
        try {
            console.log(`Processing ${owner}/${repo}`);
            const commits = await getWeeklyCommits(owner, repo, cache);
            const contributors = await getContributors(owner, repo, cache);
            
            // Skip if we couldn't get data for this repo
            if (commits.length === 0 && contributors.length === 0) {
                skippedRepos.push(`${owner}/${repo}`);
                return;
            }

            const team = findTeamByRepo(owner, repo);

            const usersWithoutCommits = contributors.filter(contributor =>
                !commits.some(commit => commit.author?.login === contributor.login)
            ).map(contributor => {
                const member = team?.members.find(m => m.githubUsername === contributor.login);
                return {
                    username: contributor.login,
                    role: member?.role || 'Unknown',
                    name: member?.name || 'Unknown'
                };
            });

            usersWithoutCommits.forEach(user => {
                if (!inactiveUsersMap.has(user.username)) {
                    inactiveUsersMap.set(user.username, {
                        ...user,
                        teamName: team?.teamName || 'Unknown Team'
                    });
                }
            });
        } catch (error) {
            console.error(`Error processing ${owner}/${repo} for inactive users:`, error);
            skippedRepos.push(`${owner}/${repo}`);
        }
    }));

    const uniqueInactiveUsers = Array.from(inactiveUsersMap.values());
    console.log('Unique inactive users:', uniqueInactiveUsers);
    
    let response = '';
    
    if (skippedRepos.length > 0) {
        response += `**Note:** The following repositories were skipped (private or inaccessible):\n`;
        response += skippedRepos.map(repo => `• ${repo}`).join('\n');
        response += '\n\n';
    }
    
    if (uniqueInactiveUsers.length > 0) {
        response += `**Inactive members in the last week:**\n` +
            uniqueInactiveUsers.map(user => 
                `• **${user.name}** (${user.username})\n` +
                `  Team: ${user.teamName}\n` +
                `  Role: ${user.role}`
            ).join("\n\n");
    } else {
        response += `**All members have been active in the last week.**`;
    }
    
    return response;
} 