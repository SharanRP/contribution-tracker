import { getWeeklyCommits } from '../../services/github.js';
import { findTeamByRepo } from '../utils.js';

export async function handleInactiveRepos(repos, cache) {
    try {
        console.log('Checking for inactive repositories');
        const inactiveRepos = [];
        await Promise.all(repos.map(async ({ owner, repo, url }) => {
            try {
                console.log(`Checking activity for ${owner}/${repo}`);
                const commits = await getWeeklyCommits(owner, repo, cache);
                if (commits.length === 0) {
                    console.log(`${owner}/${repo} is inactive`);
                    const team = findTeamByRepo(owner, repo);
                    inactiveRepos.push({ 
                        owner, 
                        repo, 
                        url,
                        teamName: team?.teamName,
                        teamLeader: team?.members.find(m => m.role === 'Team Leader')?.name
                    });
                }
            } catch (error) {
                console.error(`Error checking activity for ${owner}/${repo}:`, error);
            }
        }));
        console.log('Inactive repositories:', inactiveRepos);

        if (inactiveRepos.length > 0) {
            return `**Repositories with no commits in the last week:**\n\n` +
                inactiveRepos.map(repo => 
                    `• **${repo.teamName}**\n` +
                    `  Repository: [${repo.owner}/${repo.repo}](${repo.url})\n` +
                    `  Team Leader: ${repo.teamLeader}`
                ).join("\n\n");
        } else {
            return `**All repositories have had activity in the last week.**`;
        }
    } catch (error) {
        console.error('Error in handleInactiveRepos:', error);
        throw error;
    }
} 