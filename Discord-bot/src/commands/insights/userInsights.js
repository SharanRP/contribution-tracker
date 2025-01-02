import { getWeeklyCommits } from '../../services/github.js';
import { teamsData } from '../utils.js';

export async function handleUserInsights(username, repos, cache) {
    try {
        console.log(`Fetching insights for user ${username}`);
        const memberTeam = teamsData.teams.find(team => 
            team.members.some(m => m.githubUsername.toLowerCase() === username.toLowerCase())
        );

        if (!memberTeam) {
            return `User "${username}" not found in any team.`;
        }

        const memberInfo = memberTeam.members.find(m => 
            m.githubUsername.toLowerCase() === username.toLowerCase()
        );

        const commitsByHour = Array(24).fill(0);
        const commitsByDay = Array(7).fill(0);
        const fileChanges = new Map();
        let totalAdditions = 0;
        let totalDeletions = 0;
        const repoStats = new Map();

        for (const { owner, repo } of repos) {
            const commits = await getWeeklyCommits(owner, repo, cache);
            const userCommits = commits.filter(commit => 
                commit.author?.login.toLowerCase() === username.toLowerCase()
            );

            if (userCommits.length > 0) {
                repoStats.set(`${owner}/${repo}`, {
                    commits: userCommits.length,
                    additions: userCommits.reduce((acc, commit) => acc + (commit.stats?.additions || 0), 0),
                    deletions: userCommits.reduce((acc, commit) => acc + (commit.stats?.deletions || 0), 0)
                });

                userCommits.forEach(commit => {
                    const date = new Date(commit.commit.author.date);
                    commitsByHour[date.getHours()]++;
                    commitsByDay[date.getDay()]++;

                    totalAdditions += commit.stats?.additions || 0;
                    totalDeletions += commit.stats?.deletions || 0;

                    commit.files?.forEach(file => {
                        const ext = file.filename.split('.').pop();
                        if (!fileChanges.has(ext)) {
                            fileChanges.set(ext, {
                                files: new Set(),
                                changes: 0
                            });
                        }
                        fileChanges.get(ext).files.add(file.filename);
                        fileChanges.get(ext).changes += (file.additions || 0) + (file.deletions || 0);
                    });
                });
            }
        }

        const insights = {
            memberInfo,
            teamName: memberTeam.teamName,
            commitPatterns: {
                byHour: commitsByHour,
                byDay: commitsByDay
            },
            codebase: {
                totalAdditions,
                totalDeletions,
                fileTypes: Array.from(fileChanges.entries()).map(([ext, data]) => ({
                    extension: ext,
                    fileCount: data.files.size,
                    changes: data.changes
                }))
            },
            repositories: Array.from(repoStats.entries()).map(([repo, stats]) => ({
                repo,
                ...stats
            }))
        };

        return `**User Insights for ${insights.memberInfo.name}**\n` +
            `Team: ${insights.teamName}\n` +
            `Role: ${insights.memberInfo.role}\n\n` +
            `**Work Patterns**\n` +
            `Most Active Hours: ${insights.commitPatterns.byHour.indexOf(Math.max(...insights.commitPatterns.byHour))}:00\n` +
            `Most Active Day: ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][insights.commitPatterns.byDay.indexOf(Math.max(...insights.commitPatterns.byDay))]}\n\n` +
            `**Code Contributions**\n` +
            `• Total Additions: ${insights.codebase.totalAdditions}\n` +
            `• Total Deletions: ${insights.codebase.totalDeletions}\n` +
            `• File Types:\n` +
            insights.codebase.fileTypes.map(type =>
                `  - ${type.extension}: ${type.fileCount} files, ${type.changes} changes`
            ).join('\n') + '\n\n' +
            `**Repository Activity**\n` +
            insights.repositories.map(repo =>
                `• ${repo.repo}:\n` +
                `  - Commits: ${repo.commits}\n` +
                `  - Additions: ${repo.additions}\n` +
                `  - Deletions: ${repo.deletions}`
            ).join('\n\n');
    } catch (error) {
        console.error(`Error in handleUserInsights for ${username}:`, error);
        throw error;
    }
} 