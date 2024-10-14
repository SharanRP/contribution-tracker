import NodeCache from 'node-cache';

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
    console.log('Updating cache...');
    try {
        for (const { owner, repo } of repos) {
            try {
                await getWeeklyCommits(owner, repo, cache);
            } catch (error) {
                console.error(`Error updating cache for ${owner}/${repo}:`, error);
                // Continue with the next repo
            }
        }
        console.log('Cache update complete');
    } catch (error) {
        console.error('Error updating cache:', error);
        throw error;
    }
}