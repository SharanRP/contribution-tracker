import NodeCache from 'node-cache';
import { getWeeklyCommits, getContributors, getOpenIssues, getOpenPullRequests } from '../services/github.js';

export function setupCache() {
    try {
        const cache = new NodeCache({ stdTTL: 900 });
        console.log('NodeCache initialized');
        return cache;
    } catch (error) {
        console.error('Error initializing NodeCache:', error);
        throw error;
    }
}

export async function updateCache(repos, cache) {
    try {
        console.log('Updating cache...');
        await Promise.all(repos.map(async ({ owner, repo }) => {
            try {
                // Update commits cache
                const commits = await getWeeklyCommits(owner, repo, cache);
                cache.set(`commits:${owner}/${repo}`, commits);

                // Update contributors cache
                const contributors = await getContributors(owner, repo, cache);
                cache.set(`contributors:${owner}/${repo}`, contributors);

                // Update issues cache
                const issues = await getOpenIssues(owner, repo, cache);
                cache.set(`openIssues:${owner}/${repo}`, issues);

                // Update pull requests cache
                const prs = await getOpenPullRequests(owner, repo, cache);
                cache.set(`openPullRequests:${owner}/${repo}`, prs);

                console.log(`Cache updated for ${owner}/${repo}`);
            } catch (error) {
                console.error(`Error updating cache for ${owner}/${repo}:`, error);
            }
        }));
        console.log('Cache update completed');
    } catch (error) {
        console.error('Error in updateCache:', error);
    }
}