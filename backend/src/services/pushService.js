const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin SDK
// Looks for serviceAccountKey.json in the backend root
const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');
let firebaseInitialized = false;

try {
    // Check if the file exists AND is actually a file (Docker can create empty dirs for missing volumes)
    if (fs.existsSync(serviceAccountPath) && fs.lstatSync(serviceAccountPath).isFile()) {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Push Service: Firebase Admin SDK initialized successfully. ✅');
        firebaseInitialized = true;
    } else {
        console.warn('Push Service: ⚠️ serviceAccountKey.json not found in backend root. Native Push (FCM) will not work.');
    }
} catch (error) {
    console.error('Push Service: ❌ Error initializing Firebase Admin SDK:', error.message);
}

const webpush = require('web-push');

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

const sendNativeNotification = async (token, title, body, data = {}) => {
    if (!firebaseInitialized) {
        console.warn('Push Service: Skipping Native Push - Firebase not initialized.');
        return;
    }

    const message = {
        token: token,
        notification: {
            title: title,
            body: body
        },
        data: {
            // Capacitor Push plugin puts data in 'data' field
            ...data,
            landing_page: data.url || '/', // Custom data
            click_action: 'FCM_PLUGIN_ACTIVITY' // Required for some plugins
        },
        android: {
            priority: 'high',
            notification: {
                sound: 'default',
                channelId: 'catch-channel', // Must match channel created in App
                priority: 'max',
                defaultSound: true
            }
        }
    };

    try {
        console.log(`Push Service: Sending Native FCM to token: ${token.substring(0, 20)}...`);
        const response = await admin.messaging().send(message);
        console.log('Push Service: Native FCM sent successfully:', response);
        return response;
    } catch (error) {
        console.error('Push Service: Error sending Native FCM:', error);
        if (error.code === 'messaging/registration-token-not-registered') {
            console.warn('Push Service: Token invalid/expired. Caller should cleanup database.');
            throw error; // Let caller handle cleanup if needed
        }
    }
};

const sendPushNotification = async (catchSensor, subscription, title, body) => {
    // Throttling and message generation is now handled centrally 
    // in notificationService.js to ensure consistency across all channels.

    const payload = JSON.stringify({
        title,
        body,
        data: {
            url: `/catch/${catchSensor.id}`,
            t: Date.now()
        }
    });

    try {
        console.log(`Push Service: Sending to endpoint: ${subscription.endpoint.substring(0, 40)}...`);
        console.log(`Push Service: Payload: ${payload}`);

        const result = await webpush.sendNotification(subscription, payload, {
            TTL: 60 * 60 * 24, // 24 hours
            urgency: 'high'    // Critical for Android to wake up from Doze mode
        });
        console.log(`Push Service: Success! Status Code: ${result.statusCode}`);

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

module.exports = { sendPushNotification, sendNativeNotification };

