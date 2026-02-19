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

module.exports = { sendNativeNotification };

