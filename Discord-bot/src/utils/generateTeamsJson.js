import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseGitHubUrl(url) {
    try {
        // Remove .git extension and trailing slashes
        url = url.trim().replace(/\.git$/, '').replace(/\/$/, '');
        const parts = url.split('/');
        return {
            url: url,
            owner: parts[parts.length - 2],
            name: parts[parts.length - 1]
        };
    } catch (error) {
        console.error('Error parsing URL:', url);
        return {
            url: url,
            owner: 'unknown',
            name: 'unknown'
        };
    }
}

// Read the CSV file
const csvContent = fs.readFileSync(path.join(__dirname, '../../repos.csv'), 'utf-8');
const lines = csvContent.split('\n');

// Remove header
const header = lines.shift();

// Parse CSV to structured data
const teams = lines
    .filter(line => line.trim()) // Remove empty lines
    .map(line => {
        const fields = line.split(',');
        const repoInfo = parseGitHubUrl(fields[7]);
        
        return {
            teamName: fields[2],
            repoUrl: fields[7],
            members: [
                {
                    role: 'Team Leader',
                    name: fields[3],
                    githubUsername: fields[8],
                    email: fields[1]
                },
                {
                    role: 'Member 1',
                    name: fields[4],
                    githubUsername: fields[9]
                },
                {
                    role: 'Member 2',
                    name: fields[5],
                    githubUsername: fields[10]
                },
                {
                    role: 'Member 3',
                    name: fields[6],
                    githubUsername: fields[11]
                }
            ].filter(member => member.name && member.name.trim() !== 'N/A'), // Remove empty or N/A members
            repository: repoInfo
        };
    });

// Write to teams.json
const teamsJson = {
    teams: teams
};

fs.writeFileSync(path.join(__dirname, '../../teams.json'), JSON.stringify(teamsJson, null, 2));
console.log('teams.json has been generated successfully!'); 