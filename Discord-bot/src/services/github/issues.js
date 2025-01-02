import { octokit } from './client.js';

export async function getOpenIssues(owner, repo, cache) {
    const cacheKey = `openIssues:${owner}:${repo}`;
    let openIssues;

    try {
        if (cache && typeof cache.get === 'function') {
            openIssues = cache.get(cacheKey);
        }

        if (!openIssues) {
            console.log(`Fetching open issues for ${owner}/${repo}`);
            const response = await octokit.rest.issues.listForRepo({
                owner,
                repo,
                state: 'open',
            });
            openIssues = response.data;
            if (cache && typeof cache.set === 'function') {
                cache.set(cacheKey, openIssues);
            }
        }

        return openIssues;
    } catch (error) {
        console.error(`Error fetching or caching open issues for ${owner}/${repo}:`, error);
        return [];
    }
} 