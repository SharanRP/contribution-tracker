import { getWeeklyCommits, getOpenIssues, getOpenPullRequests } from '../../services/github.js';
import { findTeamByRepo } from '../utils.js';

export async function handleRepoInsights(owner, repo, cache) {
    try {
        console.log(`Fetching insights for ${owner}/${repo}`);
        const commits = await getWeeklyCommits(owner, repo, cache);
        const team = findTeamByRepo(owner, repo);
        const issues = await getOpenIssues(owner, repo, cache);
        const prs = await getOpenPullRequests(owner, repo, cache);

        // Calculate commit patterns
        const commitsByHour = Array(24).fill(0);
        const commitsByDay = Array(7).fill(0);
        const fileChanges = new Map();
        let totalAdditions = 0;
        let totalDeletions = 0;

        commits.forEach(commit => {
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

        const insights = {
            team,
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
            workflow: {
                commits: commits.length,
                openIssues: issues.length,
                openPRs: prs.length,
                issueToCommitRatio: issues.length / (commits.length || 1),
                prToCommitRatio: prs.length / (commits.length || 1)
            }
        };

        return `**Repository Insights for ${owner}/${repo}**\n` +
            `Team: ${insights.team?.teamName || 'Unknown Team'}\n\n` +
            `**Commit Patterns**\n` +
            `Most Active Hours: ${insights.commitPatterns.byHour.indexOf(Math.max(...insights.commitPatterns.byHour))}:00\n` +
            `Most Active Day: ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][insights.commitPatterns.byDay.indexOf(Math.max(...insights.commitPatterns.byDay))]}\n\n` +
            `**Codebase Stats**\n` +
            `• Total Additions: ${insights.codebase.totalAdditions}\n` +
            `• Total Deletions: ${insights.codebase.totalDeletions}\n` +
            `• File Types:\n` +
            insights.codebase.fileTypes.map(type =>
                `  - ${type.extension}: ${type.fileCount} files, ${type.changes} changes`
            ).join('\n') + '\n\n' +
            `**Workflow Metrics**\n` +
            `• Total Commits: ${insights.workflow.commits}\n` +
            `• Open Issues: ${insights.workflow.openIssues}\n` +
            `• Open PRs: ${insights.workflow.openPRs}\n` +
            `• Issue to Commit Ratio: ${insights.workflow.issueToCommitRatio.toFixed(2)}\n` +
            `• PR to Commit Ratio: ${insights.workflow.prToCommitRatio.toFixed(2)}`;
    } catch (error) {
        console.error(`Error in handleRepoInsights for ${owner}/${repo}:`, error);
        throw error;
    }
} 