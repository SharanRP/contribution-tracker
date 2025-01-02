import { octokit } from './client.js';

export async function getPullRequests(owner, repo, cache) {
    const cacheKey = `pullRequests:${owner}:${repo}`;
    let pullRequests;

    try {
        if (cache && typeof cache.get === 'function') {
            pullRequests = cache.get(cacheKey);
        }

        if (!pullRequests) {
            console.log(`Fetching pull requests for ${owner}/${repo}`);
            const response = await octokit.rest.pulls.list({
                owner,
                repo,
                state: 'all',
            });
            pullRequests = response.data;
            if (cache && typeof cache.set === 'function') {
                cache.set(cacheKey, pullRequests);
            }
        }

        return pullRequests;
    } catch (error) {
        console.error(`Error fetching or caching pull requests for ${owner}/${repo}:`, error);
        return [];
    }
}

export async function calculateAverageResolutionTime(owner, repo, cache) {
    try {
        const pullRequests = await getPullRequests(owner, repo, cache);
        const closedPRs = pullRequests.filter(pr => pr.state === 'closed');

        if (closedPRs.length === 0) {
            return 0;
        }

        const totalResolutionTime = closedPRs.reduce((acc, pr) => {
            const createdAt = new Date(pr.created_at);
            const closedAt = new Date(pr.closed_at);
            return acc + (closedAt - createdAt);
        }, 0);

        return totalResolutionTime / closedPRs.length;
    } catch (error) {
        console.error(`Error calculating average resolution time for ${owner}/${repo}:`, error);
        return 0;
    }
}

export async function getOpenPullRequests(owner, repo, cache) {
    const cacheKey = `openPullRequests:${owner}:${repo}`;
    let openPullRequests;

    try {
        if (cache && typeof cache.get === 'function') {
            openPullRequests = cache.get(cacheKey);
        }

        if (!openPullRequests) {
            console.log(`Fetching open pull requests for ${owner}/${repo}`);
            const response = await octokit.rest.pulls.list({
                owner,
                repo,
                state: 'open',
            });
            openPullRequests = response.data;
            if (cache && typeof cache.set === 'function') {
                cache.set(cacheKey, openPullRequests);
            }
        }

        return openPullRequests;
    } catch (error) {
        console.error(`Error fetching or caching open pull requests for ${owner}/${repo}:`, error);
        return [];
    }
} 