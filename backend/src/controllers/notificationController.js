const PushSubscription = require('../models/PushSubscription');
const { sendPushNotification } = require('../services/pushService');
const sequelize = require('../config/database');

exports.subscribe = async (req, res) => {
    try {
        const subscription = req.body;
        const userId = req.user.id;

        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({ error: 'Invalid subscription object' });
        }

        // Helper to ensure we store keys as an object
        // (Though Sequelize JSON type should handle it, we want to be safe)
        let subKeys = subscription.keys;
        if (typeof subKeys === 'string') {
            try { subKeys = JSON.parse(subKeys); } catch (e) { }
        }

        let sub = await PushSubscription.findOne({ where: { endpoint: subscription.endpoint } });

        if (sub) {
            sub.userId = userId;
            sub.keys = subKeys;
            await sub.save();
        } else {
            await PushSubscription.create({
                endpoint: subscription.endpoint,
                keys: subKeys,
                userId: userId
            });
        }

        res.status(201).json({ message: 'Subscription saved.' });
    } catch (error) {
        console.error('Subscribe Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.testNotification = async (req, res) => {
    try {
        const userId = req.user.id;
        const subscriptions = await PushSubscription.findAll({ where: { userId } });

        if (subscriptions.length === 0) {
            return res.status(200).json({
                message: 'Keine aktiven Browser-Abos gefunden. Bitte Push-Benachrichtigungen erst aktivieren.',
                count: 0
            });
        }

        let sentCount = 0;
        for (const sub of subscriptions) {
            // Robust parsing for keys that might be double-stringified in DB
            let currentKeys = sub.keys;
            let parseAttempts = 0;
            while (typeof currentKeys === 'string' && parseAttempts < 3) {
                try {
                    currentKeys = JSON.parse(currentKeys);
                } catch (e) {
                    console.error(`Keys parse error for sub ${sub.id}:`, e.message);
                    break;
                }
                parseAttempts++;
            }

            // Validate keys
            if (!currentKeys || typeof currentKeys !== 'object' || !currentKeys.p256dh || !currentKeys.auth) {
                console.warn(`Test Notification: ⚠️ Invalid keys for sub ${sub.id}. Cleaning up.`);
                await sub.destroy();
                continue;
            }

            try {
                await sendPushNotification(
                    { name: 'Test-Device', location: 'System', id: 'test' },
                    'TEST',
                    { endpoint: sub.endpoint, keys: currentKeys }
                );
                sentCount++;
            } catch (err) {
                console.error(`Test Notification Failed for ${sub.endpoint.substring(0, 20)}...`, err.message);
            }
        }

        res.json({ message: `Test-Push an ${sentCount} Gerät(e) gesendet.`, count: sentCount });

    } catch (error) {
        console.error('Test notification error:', error);
        res.status(500).json({ error: 'Failed to send test notification.' });
    }
};
