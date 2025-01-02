import { Octokit } from "@octokit/rest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { teamsData } from "../commands/utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getRepoDetails() {
    const octokit = new Octokit({
        auth: process.env.GITHUB_TOKEN,
    });

    const repoDetails = [];
    console.log("Fetching repository details...");

    for (const team of teamsData.teams) {
        try {
            const { owner, name } = team.repository;
            console.log(`Checking repository: ${owner}/${name}`);

            // Basic repo info
            const { data: repo } = await octokit.repos.get({
                owner,
                repo: name,
            });

            // Languages
            const { data: languages } = await octokit.repos.listLanguages({
                owner,
                repo: name,
            });

            // Contributors
            const { data: contributors } = await octokit.repos.listContributors({
                owner,
                repo: name,
            }).catch(() => ({ data: [] }));

            // Weekly commit activity
            const { data: weeklyCommits } = await octokit.repos.getCommitActivityStats({
                owner,
                repo: name,
            }).catch(() => ({ data: null }));

            const details = {
                // Team Information
                team_name: team.teamName,
                team_size: team.members.length,
                team_leader: team.members.find(m => m.role === "Team Leader")?.name,

                // Repository Information
                repo_name: `${owner}/${name}`,
                repo_url: repo.html_url,
                description: repo.description,
                homepage: repo.homepage,
                created_at: repo.created_at,
                updated_at: repo.updated_at,
                pushed_at: repo.pushed_at,

                // Stats
                size: repo.size,
                stargazers_count: repo.stargazers_count,
                watchers_count: repo.watchers_count,
                forks_count: repo.forks_count,
                open_issues_count: repo.open_issues_count,
                network_count: repo.network_count,
                subscribers_count: repo.subscribers_count,

                // Features
                has_wiki: repo.has_wiki,
                has_issues: repo.has_issues,
                archived: repo.archived,
                allow_forking: repo.allow_forking,

                // Languages and Contributors
                languages: languages,
                contributors_count: contributors.length,
                weekly_commits: weeklyCommits,

                // License
                license: repo.license?.name,
                license_url: repo.license?.url
            };

            repoDetails.push(details);
            console.log(`Successfully fetched details for ${owner}/${name}`);
        } catch (error) {
            console.error(
                `Error fetching details for ${team.repository.owner}/${team.repository.name}:`,
                error.message
            );
            repoDetails.push({
                team_name: team.teamName,
                repo_name: `${team.repository.owner}/${team.repository.name}`,
                repo_url: team.repoUrl,
                error: error.message
            });
        }
    }

    return repoDetails;
}

function saveToCSV(details) {
    try {
        const csvPath = path.join(__dirname, "../../repo_details.csv");
        const jsonPath = path.join(__dirname, "../../repo_details.json");
        console.log("Saving details to CSV and JSON...");

        // Define headers
        const headers = [
            'team_name',
            'team_size',
            'team_leader',
            'repo_name',
            'repo_url',
            'description',
            'homepage',
            'created_at',
            'updated_at',
            'pushed_at',
            'size',
            'stargazers_count',
            'watchers_count',
            'forks_count',
            'open_issues_count',
            'network_count',
            'subscribers_count',
            'has_wiki',
            'has_issues',
            'archived',
            'allow_forking',
            'contributors_count',
            'license',
            'license_url',
            'error'
        ];

        // Create CSV content
        const csvContent = [
            headers.join(","),
            ...details.map(obj =>
                headers
                    .map(header => {
                        const value = obj[header];
                        if (value === undefined || value === null) return '""';
                        return `"${String(value).replace(/"/g, '""')}"`;
                    })
                    .join(",")
            ),
        ].join("\n");

        // Save files
        fs.writeFileSync(csvPath, csvContent, "utf-8");
        fs.writeFileSync(jsonPath, JSON.stringify(details, null, 2), "utf-8");

        console.log(`Files saved: ${csvPath} and ${jsonPath}`);
    } catch (error) {
        console.error("Error saving files:", error.message);
        throw error;
    }
}

async function main() {
    try {
        const details = await getRepoDetails();
        saveToCSV(details);
        console.log("Script completed successfully");
    } catch (error) {
        console.error("Script failed:", error.message);
        process.exit(1);
    }
}

// Run the script if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main();
}
