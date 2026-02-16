const webpush = require('web-push');
const Trap = require('../models/Trap');

// Normally generated and stored in .env
// const vapidKeys = webpush.generateVAPIDKeys(); 
const PUBLIC_VAPID_KEY = process.env.VAPID_PUBLIC_KEY;
const PRIVATE_VAPID_KEY = process.env.VAPID_PRIVATE_KEY;

if (PUBLIC_VAPID_KEY && PRIVATE_VAPID_KEY) {
    webpush.setVapidDetails(
        'mailto:admin@trapsensor.de',
        PUBLIC_VAPID_KEY,
        PRIVATE_VAPID_KEY
    );
}

const sendPushNotification = async (trap, type, subscription) => {
    // 24h Throttling Logic for Battery Warnings
    if (type === 'LOW_BATTERY') {
        const lastAlert = trap.lastBatteryAlert;
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        if (lastAlert && lastAlert > oneDayAgo) {
            console.log(`Push: Throttling battery alert for ${trap.name}`);
            return;
        }
    }

    const payload = JSON.stringify({
        title: type === 'ALARM' ? '🚨 FANG-ALARM!' : '⚠️ System-Info',
        body: type === 'ALARM'
            ? `Falle "${trap.name}" hat ausgelöst! Standort: ${trap.location}`
            : `Falle "${trap.name}" meldet niedrigen Batteriestand (${trap.batteryPercent}%)`,
        icon: '/vite.svg',
        data: {
            url: `/trap/${trap.id}`
        }
    });

    try {
        await webpush.sendNotification(subscription, payload);

        if (type === 'LOW_BATTERY') {
            await trap.update({ lastBatteryAlert: new Date() });
        }
    } catch (err) {
        console.error('Push Error:', err);
    }
};

module.exports = { sendPushNotification };
