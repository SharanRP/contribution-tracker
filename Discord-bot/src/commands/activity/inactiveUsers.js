import { getWeeklyCommits, getContributors } from '../../services/github.js';
import { findTeamByRepo } from '../utils.js';

export async function handleInactiveUsers(repos, cache) {
    console.log('Received !github inactive-users command');
    const inactiveUsersMap = new Map();
    
    await Promise.all(repos.map(async ({ owner, repo }) => {
        try {
            console.log(`Processing ${owner}/${repo}`);
            const commits = await getWeeklyCommits(owner, repo, cache);
            const contributors = await getContributors(owner, repo, cache);
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
        }
    }));

    const uniqueInactiveUsers = Array.from(inactiveUsersMap.values());
    console.log('Unique inactive users:', uniqueInactiveUsers);
    
    if (uniqueInactiveUsers.length > 0) {
        return `**Inactive members in the last week:**\n` +
            uniqueInactiveUsers.map(user => 
                `• **${user.name}** (${user.username})\n` +
                `  Team: ${user.teamName}\n` +
                `  Role: ${user.role}`
            ).join("\n\n");
    } else {
        return `**All members have been active in the last week.**`;
    }
} 