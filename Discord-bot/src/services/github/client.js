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

export { octokit }; 