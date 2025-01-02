import { getWeeklyCommits } from '../../services/github.js';
import { teamsData } from '../utils.js';

export async function handleMemberProgress(memberUsername, repos, cache) {
    try {
        let memberStats = {
            totalCommits: 0,
            totalLines: 0,
            activeRepos: 0,
            teamName: '',
            role: '',
            name: '',
            repoStats: []
        };

        // Find member's team and details
        const memberTeam = teamsData.teams.find(team => 
            team.members.some(m => m.githubUsername.toLowerCase() === memberUsername.toLowerCase())
        );

        if (!memberTeam) {
            return `Member "${memberUsername}" not found in any team.`;
        }

        const memberInfo = memberTeam.members.find(m => 
            m.githubUsername.toLowerCase() === memberUsername.toLowerCase()
        );

        memberStats.teamName = memberTeam.teamName;
        memberStats.role = memberInfo.role;
        memberStats.name = memberInfo.name;

        // Gather stats from all repositories
        for (const { owner, repo } of repos) {
            const commits = await getWeeklyCommits(owner, repo, cache);
            const memberCommits = commits.filter(commit => 
                commit.author?.login.toLowerCase() === memberUsername.toLowerCase()
            );

            if (memberCommits.length > 0) {
                memberStats.activeRepos++;
                memberStats.totalCommits += memberCommits.length;
                const repoLines = memberCommits.reduce((acc, commit) => 
                    acc + (commit.stats?.total || 0), 0
                );
                memberStats.totalLines += repoLines;

                memberStats.repoStats.push({
                    repo: `${owner}/${repo}`,
                    commits: memberCommits.length,
                    lines: repoLines
                });
            }
        }

        return `**Progress Report for ${memberStats.name}**\n\n` +
            `Team: ${memberStats.teamName}\n` +
            `Role: ${memberStats.role}\n` +
            `GitHub: ${memberUsername}\n\n` +
            `**Overall Activity:**\n` +
            `• Total Commits: ${memberStats.totalCommits}\n` +
            `• Total Lines Changed: ${memberStats.totalLines}\n` +
            `• Active in Repositories: ${memberStats.activeRepos}\n\n` +
            `**Repository Breakdown:**\n` +
            memberStats.repoStats.map(stat => 
                `• ${stat.repo}:\n` +
                `  - Commits: ${stat.commits}\n` +
                `  - Lines Changed: ${stat.lines}`
            ).join('\n\n');
    } catch (error) {
        console.error(`Error in handleMemberProgress for ${memberUsername}:`, error);
        throw error;
    }
} 