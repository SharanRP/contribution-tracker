import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load teams data
const teamsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../../teams.json'), 'utf-8'));

export function findTeamByRepo(owner, repo) {
    return teamsData.teams.find(team => 
        team.repository.owner.toLowerCase() === owner.toLowerCase() && 
        team.repository.name.toLowerCase() === repo.toLowerCase()
    );
}

export function findTeamByName(teamName) {
    return teamsData.teams.find(t => 
        t.teamName.toLowerCase() === teamName.toLowerCase()
    );
}

export function findMemberInTeams(username) {
    const team = teamsData.teams.find(team => 
        team.members.some(m => m.githubUsername.toLowerCase() === username.toLowerCase())
    );
    if (!team) return null;
    
    return {
        team,
        member: team.members.find(m => m.githubUsername.toLowerCase() === username.toLowerCase())
    };
}

export function calculateMemberStats(commits, member) {
    const memberCommits = commits.filter(commit => 
        commit.author?.login.toLowerCase() === member.githubUsername.toLowerCase()
    );
    
    const linesChanged = memberCommits.reduce((acc, commit) => {
        const additions = commit.stats?.additions || 0;
        const deletions = commit.stats?.deletions || 0;
        return acc + additions + deletions;
    }, 0);

    return {
        name: member.name,
        role: member.role,
        commitCount: memberCommits.length,
        linesChanged
    };
}

export function calculateTotalLines(commits) {
    return commits.reduce((acc, commit) => {
        const additions = commit.stats?.additions || 0;
        const deletions = commit.stats?.deletions || 0;
        return acc + additions + deletions;
    }, 0);
}

export { teamsData }; 