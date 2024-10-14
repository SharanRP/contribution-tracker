import express from 'express';

export function startServer() {
    const app = express();
    const PORT = process.env.PORT || 10000;

    app.get('/', (req, res) => {
        try {
            console.log('Received request to root endpoint');
            res.status(200).send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>GitHub Analytics Discord Bot</title>
                    <style>
                        /* CSS styles here */
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>GitHub Analytics Discord Bot</h1>
                        <p><strong>Status:</strong> <span class="status">Active</span></p>
                        <p><strong>Message:</strong> GitHub Analytics Discord Bot is up and running</p>
                        <p class="timestamp"><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
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