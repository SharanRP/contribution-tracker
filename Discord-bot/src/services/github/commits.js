import { octokit } from './client.js';
import { getContributors } from './contributors.js';

export async function getUserWeeklyCommits(owner, repo, cache) {
    try {
        console.log(`Getting user weekly commits for ${owner}/${repo}`);
        const commits = await getWeeklyCommits(owner, repo, cache);
        const contributors = await getContributors(owner, repo, cache);

        console.log(`Checking for users without commits in ${owner}/${repo}`);
        const usersWithoutCommits = contributors.filter(contributor =>
            !commits.some(commit => commit.author?.login === contributor.login)
        ).map(contributor => contributor.login);

        console.log(`Users without commits in ${owner}/${repo}:`, usersWithoutCommits);
        return usersWithoutCommits;
    } catch (error) {
        console.error(`Error in getUserWeeklyCommits for ${owner}/${repo}:`, error);
        throw error;
    }
}

export async function getWeeklyCommits(owner, repo, cache) {
    const cacheKey = `commits:${owner}/${repo}`;
    const cachedCommits = cache.get(cacheKey);
    if (cachedCommits) {
        return cachedCommits;
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    try {
        const commits = await octokit.paginate('GET /repos/{owner}/{repo}/commits', {
            owner,
            repo,
            since: oneWeekAgo.toISOString(),
            per_page: 100
        });

        // Fetch detailed commit data for each commit to get stats
        const detailedCommits = await Promise.all(commits.map(async commit => {
            try {
                const { data } = await octokit.request('GET /repos/{owner}/{repo}/commits/{ref}', {
                    owner,
                    repo,
                    ref: commit.sha
                });
                return data;
            } catch (error) {
                console.error(`Error fetching detailed commit data for ${commit.sha}:`, error);
                return commit;
            }
        }));

        cache.set(cacheKey, detailedCommits);
        return detailedCommits;
    } catch (error) {
        console.error(`Error fetching commits for ${owner}/${repo}:`, error);
        throw error;
    }
} 