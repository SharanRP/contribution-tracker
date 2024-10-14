import express from 'express';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export function startServer() {
    const app = express();
    const PORT = process.env.PORT || 10000;

    // Get the directory name of the current module
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // Function to get the last deployed commit and its timestamp
    function getLastDeployedCommit() {
        try {
            // Try to read the last commit from a file
            const commitFilePath = path.join(__dirname, 'last_commit.txt');
            if (fs.existsSync(commitFilePath)) {
                return fs.readFileSync(commitFilePath, 'utf8').trim();
            }

            // If file doesn't exist, try git log command
            const gitLog = execSync('git log -1 --format="%h - %s (%cd)"').toString().trim();
            
            // Save the result to the file for future use
            fs.writeFileSync(commitFilePath, gitLog);

            return gitLog;
        } catch (error) {
            console.error('Error getting last commit:', error);
            return 'Unable to retrieve last commit';
        }
    }

    app.get('/', (req, res) => {
        try {
            console.log('Received request to root endpoint');
            const lastCommit = getLastDeployedCommit();
            res.status(200).send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>GitHub Analytics Discord Bot</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            margin: 0;
                            padding: 20px;
                            background-color: #f4f4f4;
                        }
                        .container {
                            background-color: #fff;
                            border-radius: 5px;
                            padding: 20px;
                            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                            max-width: 800px;
                            margin: 0 auto;
                            width: 90%;
                        }
                        h1 {
                            color: #2c3e50;
                            border-bottom: 2px solid #3498db;
                            padding-bottom: 10px;
                            font-size: 24px;
                            word-wrap: break-word;
                        }
                        .status {
                            display: inline-block;
                            background-color: #2ecc71;
                            color: white;
                            padding: 5px 10px;
                            border-radius: 3px;
                            font-weight: bold;
                        }
                        .timestamp {
                            color: #7f8c8d;
                            font-style: italic;
                        }
                        p {
                            word-wrap: break-word;
                        }
                        @media (max-width: 600px) {
                            body {
                                padding: 10px;
                            }
                            .container {
                                padding: 15px;
                                width: 95%;
                            }
                            h1 {
                                font-size: 20px;
                            }
                            .status {
                                display: block;
                                margin-top: 10px;
                                text-align: center;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>GitHub Analytics Discord Bot</h1>
                        <p><strong>Status:</strong> <span class="status">Active</span></p>
                        <p><strong>Message:</strong> GitHub Analytics Discord Bot is up and running</p>
                        <p class="timestamp"><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
                        <p><strong>Last Deployed Commit:</strong> ${lastCommit}</p>
                    </div>
                </body>
                </html>
            `);
            console.log('Response sent for root endpoint');
        } catch (error) {
            console.error('Error handling root endpoint request:', error);
            res.status(500).send('Internal Server Error');
        }
    });

    app.use((err, req, res, next) => {
        console.error('Unhandled error:', err);
        res.status(500).send('Internal Server Error');
    });

    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server is running on port ${PORT}`);
    });

    server.on('error', (error) => {
        console.error('Server error:', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
        process.exit(1);
    });
}