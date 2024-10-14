import { Octokit } from '@octokit/rest';

let octokit;

export function initializeOctokit() {
    try {
        octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN,
        });
        console.log('Octokit initialized');
    } catch (error) {
        console.error('Error initializing Octokit:', error);
    }
}

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
    console.log(`Getting weekly commits for ${owner}/${repo}`);
    const cacheKey = `commits:${owner}:${repo}`;

    if (cache && typeof cache.get === 'function') {
        try {
            const cachedCommits = cache.get(cacheKey);
            if (cachedCommits) {
                console.log(`Retrieved cached commits for ${owner}/${repo}`);
                return cachedCommits;
            }
        } catch (error) {
            console.error(`Error retrieving cached commits for ${owner}/${repo}:`, error);
        }
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    try {
        console.log(`Fetching weekly commits for ${owner}/${repo}`);
        const commits = await octokit.rest.repos.listCommits({
            owner,
            repo,
            since: oneWeekAgo.toISOString(),
        });
        console.log(`Retrieved ${commits.data.length} commits for ${owner}/${repo}`);
        if (cache && typeof cache.set === 'function') {
            try {
                cache.set(cacheKey, commits.data);
            } catch (error) {
                console.error(`Error caching commits for ${owner}/${repo}:`, error);
            }
        }
        return commits.data;
    } catch (error) {
        console.error(`Error fetching weekly commits for ${owner}/${repo}:`, error);
        return [];
    }
}

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
