const PushSubscription = require('../models/PushSubscription');
const { sendNativeNotification } = require('../services/pushService');

const sequelize = require('../config/database');

exports.subscribe = async (req, res) => {
    try {
        const subscription = req.body;
        const userId = req.user.id;

        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({ error: 'Invalid subscription object' });
        }

        let sub = await PushSubscription.findOne({ where: { endpoint: subscription.endpoint } });

        if (sub) {
            sub.userId = userId;
            sub.keys = null; // Ensure keys are always null for pure native tokens
            await sub.save();
        } else {
            await PushSubscription.create({
                endpoint: subscription.endpoint,
                keys: null,
                userId: userId
            });
        }

        res.status(201).json({ message: 'Subscription saved (Native).' });
    } catch (error) {
        console.error('Subscribe Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.unsubscribe = async (req, res) => {
    try {
        const { endpoint } = req.body;
        if (!endpoint) {
            // If no endpoint provided, we might want to clear all for this user?
            // But let's be safe and only delete the current one.
            return res.status(400).json({ error: 'Endpoint required' });
        }

        await PushSubscription.destroy({ where: { endpoint } });
        res.json({ message: 'Unsubscribed successfully' });
    } catch (error) {
        console.error('Unsubscribe Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.clearAllSubscriptions = async (req, res) => {
    try {
        const userId = req.user.id;
        await PushSubscription.destroy({ where: { userId } });
        res.json({ message: 'Alle Benachrichtigungs-Abos gelöscht.' });
    } catch (error) {
        console.error('Clear Subscriptions Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.testNotification = async (req, res) => {
    try {
        const userId = req.user.id;
        const subscriptions = await PushSubscription.findAll({ where: { userId } });

        if (subscriptions.length === 0) {
            return res.status(200).json({
                message: 'Keine aktiven Push-Abos gefunden. Bitte Push-Benachrichtigungen erst aktivieren.',
                count: 0
            });
        }

        let sentCount = 0;
        for (const sub of subscriptions) {
            try {
                console.log(`Test Notification: Sending Native FCM to ${sub.endpoint.substring(0, 15)}...`);
                await sendNativeNotification(
                    sub.endpoint,
                    '🧪 Test-Push (Native)',
                    'Diese Nachricht bestätigt, dass Native Push-Benachrichtigungen funktionieren. 🦊',
                    { type: 'TEST', url: '/setup' }
                );
                sentCount++;
            } catch (err) {
                console.error('Test Notification: Native Push failed:', err.message);
            }
        }

        res.json({ message: `Test-Push an ${sentCount} Gerät(e) gesendet.`, count: sentCount });

    } catch (error) {
        console.error('Test notification error:', error);
        res.status(500).json({ error: 'Failed to send test notification.' });
    }
};
