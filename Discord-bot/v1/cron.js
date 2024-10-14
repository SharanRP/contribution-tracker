import cron from 'node-cron';
import { updateCache } from './cache.js';
import { notifyInactiveUsers } from './notifications.js'; 

function isWeekday() {
    const day = new Date().getDay();
    return day >= 1 && day <= 5;
}

function isPeakHours() {
    const hour = new Date().getHours();
    return hour >= 16 || hour < 1;
}

export function setupCronJob(client, cache, repos) {
    cron.schedule('*/15 * * * *', async () => {
        try {
            const now = new Date();
            if (isWeekday()) {
                if (isPeakHours()) {
                    console.log('Peak hours on weekday, updating cache');
                    await updateCache(repos, cache);
                } else {
                    console.log('Non-peak hours on weekday, skipping cache update');
                }
            } else {
                console.log('Weekend, updating cache');
                await updateCache(repos, cache);
            }
        } catch (error) {
            console.error('Error in cache update cron job:', error);
        }
    }, {
        timezone: "Asia/Kolkata"
    });

    // Schedule a job to notify inactive users at 11:59 PM every day
    cron.schedule('59 23 * * *', async () => {
        try {
            console.log('Running end-of-day check for inactive users');
            await notifyInactiveUsers(client, repos, cache);
        } catch (error) {
            console.error('Error in inactive users notification cron job:', error);
        }
    }, {
        timezone: "Asia/Kolkata"
    });
}
