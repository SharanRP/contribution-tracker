import { getUserWeeklyCommits } from './github.js';

export async function notifyInactiveUsers(client, repos, cache) {
    try {
        const channelId = process.env.NOTIFICATION_CHANNEL_ID;
        if (!channelId) {
            console.error('Notification channel ID not found');
            return;
        }

        let channel;
        try {
            channel = await client.channels.fetch(channelId);
        } catch (error) {
            console.error('Error fetching notification channel:', error);
            return;
        }

        if (!channel) {
            console.error('Notification channel not found');
            return;
        }

        if (!channel.permissionsFor(client.user).has('SendMessages')) {
            console.error('Bot does not have permission to send messages in the notification channel');
            return;
        }

        let inactiveUsers = [];
        await Promise.all(repos.map(async ({ owner, repo }) => {
            try {
                const usersWithoutCommits = await getUserWeeklyCommits(owner, repo, cache);
                inactiveUsers = [...inactiveUsers, ...usersWithoutCommits];
            } catch (error) {
                console.error(`Error getting weekly commits for ${owner}/${repo}:`, error);
            }
        }));

        const uniqueInactiveUsers = [...new Set(inactiveUsers)];
        if (uniqueInactiveUsers.length > 0) {
            const response = `**Inactive members today:**\n` +
                uniqueInactiveUsers.map(user => `• ${user}`).join("\n");
            try {
                await channel.send(response);
            } catch (error) {
                console.error('Error sending message to notification channel:', error);
            }
        } else {
            try {
                await channel.send(`**All members have been active today.**`);
            } catch (error) {
                console.error('Error sending message to notification channel:', error);
            }
        }
    } catch (error) {
        console.error('Error in notifyInactiveUsers:', error);
    }
}
