const webpush = require('web-push');
const CatchSensor = require('../models/CatchSensor');

// Normally generated and stored in .env
// const vapidKeys = webpush.generateVAPIDKeys(); 
const PUBLIC_VAPID_KEY = process.env.VAPID_PUBLIC_KEY;
const PRIVATE_VAPID_KEY = process.env.VAPID_PRIVATE_KEY;

if (PUBLIC_VAPID_KEY && PRIVATE_VAPID_KEY) {
    webpush.setVapidDetails(
        'mailto:admin@CatchSensor.de',
        PUBLIC_VAPID_KEY,
        PRIVATE_VAPID_KEY
    );
}

const sendPushNotification = async (catchSensor, type, subscription) => {
    // 24h Throttling Logic for Battery Warnings
    if (type === 'LOW_BATTERY') {
        const lastAlert = catchSensor.lastBatteryAlert;
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        if (lastAlert && lastAlert > oneDayAgo) {
            console.log(`Push: Throttling battery alert for ${catchSensor.name}`);
            return;
        }
    }

    const payload = JSON.stringify({
        title: type === 'ALARM' ? '🚨 FANG-ALARM!' : '⚠️ System-Info',
        body: type === 'ALARM'
            ? `Fallenmelder "${catchSensor.name}" hat ausgelöst!`
            : `Batterie bei "${catchSensor.name}" niedrig.`,
        data: {
            url: `/catch/${catchSensor.id}`,
            t: Date.now()
        }
    });

    try {
        console.log(`Push Service: Sending to endpoint: ${subscription.endpoint.substring(0, 40)}...`);
        console.log(`Push Service: Payload: ${payload}`);

        const result = await webpush.sendNotification(subscription, payload);
        console.log(`Push Service: Success! Status Code: ${result.statusCode}`);

        if (type === 'LOW_BATTERY') {
            await catchSensor.update({ lastBatteryAlert: new Date() });
        }
    } catch (err) {
        console.error('Push Service: ❌ Error during webpush.sendNotification:', err);
        if (err.statusCode === 410 || err.statusCode === 404) {
            console.warn('Push Service: ⚠️ Subscription expired or no longer valid. Cleaning up...');
            const PushSubscription = require('../models/PushSubscription');
            await PushSubscription.destroy({ where: { endpoint: subscription.endpoint } });
            console.log(`Push Service: ✅ Subscription deleted for endpoint: ${subscription.endpoint.substring(0, 30)}...`);
        }
    }
};

module.exports = { sendPushNotification };

