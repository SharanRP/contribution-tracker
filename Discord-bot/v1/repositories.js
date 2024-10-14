import fs from 'fs';

export function loadRepositories() {
    try {
        console.log('Loading repository URLs...');
        let repoUrls;
        try {
            const fileContent = fs.readFileSync('repoUrls.json', 'utf8');
            repoUrls = JSON.parse(fileContent).urls;
            console.log('Repository URLs loaded:', repoUrls);
        } catch (error) {
            console.error('Error reading or parsing repoUrls.json:', error);
            throw new Error('Failed to load repository URLs');
        }

        console.log('Parsing repository information...');
        const repos = repoUrls.map(url => {
            try {
                const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
                if (!match) {
                    console.error(`Invalid repository URL: ${url}`);
                    return null;
                }
                const [, owner, repo] = match;
                return { owner, repo, url };
            } catch (error) {
                console.error(`Error parsing repository URL: ${url}`, error);
                return null;
            }
        }).filter(Boolean);

        if (repos.length === 0) {
            throw new Error('No valid repositories found');
        }

        console.log('Repositories parsed:', repos);
        return repos;
    } catch (error) {
        console.error('Error in loadRepositories:', error);
        throw error;
    }
}