import { octokit } from './client.js';

export async function getContributors(owner, repo, cache) {
    const cacheKey = `contributors:${owner}:${repo}`;
    let contributors;

    try {
        if (cache && typeof cache.get === 'function') {
            contributors = cache.get(cacheKey);
        }

        if (!contributors) {
            console.log(`Fetching contributors for ${owner}/${repo}`);
            const response = await octokit.rest.repos.listContributors({ owner, repo });
            contributors = response.data;
            if (cache && typeof cache.set === 'function') {
                cache.set(cacheKey, contributors);
            }
        }

        return contributors;
    } catch (error) {
        console.error(`Error fetching or caching contributors for ${owner}/${repo}:`, error);
        return [];
    }
} 