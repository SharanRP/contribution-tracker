import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validation functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return email && emailRegex.test(email.trim());
}

function cleanGitHubUrl(url) {
    if (!url) return null;

    // Clean the URL
    url = url.trim()
        .replace(/[\r\n"]/g, '')
        .replace(/\.git$/, '')
        .replace(/\/$/, '');

    // Try to extract owner and repo name using various patterns
    let owner, repo;

    // Pattern 1: Full GitHub URL
    if (url.includes('github.com')) {
        const match = url.match(/github\.com\/([^\/]+)\/([^\/\s]+)/i);
        if (match) {
            owner = match[1];
            repo = match[2];
        }
    } 
    // Pattern 2: Just owner/repo format
    else {
        const parts = url.split('/').filter(p => p.trim());
        if (parts.length >= 2) {
            owner = parts[parts.length - 2];
            repo = parts[parts.length - 1];
        } else if (parts.length === 1) {
            // If only one part, treat it as the repo name
            owner = parts[0];
            repo = parts[0];
        }
    }

    // Clean owner and repo names while preserving original casing
    if (owner) {
        owner = owner.replace(/[^\w-]/g, '');
    }

    if (repo) {
        repo = repo.replace(/[^\w.-]/g, '');
    }

    if (!owner || !repo) {
        console.warn(`Could not parse GitHub URL: ${url}`);
        return null;
    }

    return `https://github.com/${owner}/${repo}`;
}

function isValidGitHubUsername(username) {
    const usernameRegex = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
    return username && usernameRegex.test(username.trim());
}

function cleanGitHubUsername(username) {
    if (!username) return null;
    
    // Clean the username
    username = username.trim()
        .replace(/[^\w-]/g, '')  // Remove invalid chars
        .replace(/-+/g, '-')     // Replace multiple hyphens with single
        .replace(/^-|-$/g, '');  // Remove leading/trailing hyphens

    // Truncate if too long
    if (username.length > 39) {
        username = username.slice(0, 39);
    }

    return username || null;
}

function cleanString(str) {
    return str ? str.trim().replace(/[\r\n"]/g, '') : '';
}

function parseGitHubUrl(url) {
    if (!url) {
        console.warn('Missing GitHub URL');
        return null;
    }

    // Clean and format the URL
    const cleanedUrl = cleanGitHubUrl(url);
    if (!cleanedUrl) {
        console.warn(`Could not clean GitHub URL: ${url}`);
        return null;
    }

    try {
        const parts = cleanedUrl.split('/');
        const owner = parts[parts.length - 2];
        const name = parts[parts.length - 1];

        return {
            url: cleanedUrl,
            owner: owner,
            name: name
        };
    } catch (error) {
        console.error('Error parsing URL:', url);
        return null;
    }
}

function validateMember(role, name, githubUsername, email = null) {
    // Skip if name is empty or N/A
    if (!name || name.trim() === '' || name.trim().toLowerCase() === 'n/a') {
        return null;
    }

    // Clean the data
    name = cleanString(name);
    githubUsername = cleanGitHubUsername(githubUsername) || name.replace(/\s+/g, '');

    const member = {
        role,
        name,
        githubUsername
    };

    // Add email only for team leader and if valid
    if (email && role === 'Team Leader') {
        if (isValidEmail(email)) {
            member.email = email.trim();
        } else {
            console.warn(`Invalid email for team leader ${name}: ${email}`);
        }
    }

    return member;
}

// Read and parse CSV
try {
    const csvContent = fs.readFileSync(path.join(__dirname, '../../repos.csv'), 'utf-8');
    const lines = csvContent.split('\n');

    // Remove header and empty lines
    const header = lines.shift();
    const validLines = lines.filter(line => line.trim());

    // Parse CSV to structured data
    const teams = validLines
        .map(line => {
            const fields = line.split(',').map(field => cleanString(field));
            const [, email, teamName, leader, member1, member2, member3, repoUrl, leaderGithub, member1Github, member2Github, member3Github] = fields;

            // Clean team name
            const cleanedTeamName = teamName ? teamName.trim() : '';

            // Parse and clean repository URL
            const repoInfo = parseGitHubUrl(repoUrl);

            // Create and validate members array
            const members = [
                validateMember('Team Leader', leader, leaderGithub, email),
                validateMember('Member 1', member1, member1Github),
                validateMember('Member 2', member2, member2Github),
                validateMember('Member 3', member3, member3Github)
            ].filter(member => member !== null);

            return {
                teamName: cleanedTeamName,
                repoUrl: repoInfo ? repoInfo.url : repoUrl,
                members,
                repository: repoInfo || {
                    url: repoUrl,
                    owner: 'unknown',
                    name: 'unknown'
                }
            };
        })
        .filter(team => team.members.length > 0); // Keep teams that have at least one member

    // Write to teams.json
    const teamsJson = {
        teams: teams
    };

    fs.writeFileSync(
        path.join(__dirname, '../../teams.json'), 
        JSON.stringify(teamsJson, null, 2)
    );
    
    console.log('teams.json has been generated successfully!');
    console.log(`Total teams processed: ${teams.length}`);
} catch (error) {
    console.error('Error processing CSV file:', error);
    process.exit(1);
} 
console.log('teams.json has been generated successfully!'); 