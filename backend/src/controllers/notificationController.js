const PushSubscription = require('../models/PushSubscription');
const { sendPushNotification } = require('../services/pushService');

exports.subscribe = async (req, res) => {
    try {
        const subscription = req.body;
        const userId = req.user.id; // From authMiddleware

        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({ error: 'Invalid subscription object' });
        }

        // Check if exists
        const [sub, created] = await PushSubscription.findOrCreate({
            where: { endpoint: subscription.endpoint },
            defaults: {
                keys: subscription.keys,
                userId: userId
            }
        });

        if (!created && sub.userId !== userId) {
            // Update user if changed (multi-user device scenario)
            sub.userId = userId;
            sub.keys = subscription.keys; // Update keys just in case
            await sub.save();
        }

        res.status(201).json({ message: 'Subscription saved.' });
    } catch (error) {
        console.error('Subscribe error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.testNotification = async (req, res) => {
    try {
        const userId = req.user.id;
        const subscriptions = await PushSubscription.findAll({ where: { userId } });

        if (subscriptions.length === 0) {
            return res.status(404).json({ message: 'No subscriptions found for user.' });
        }

        let sentCount = 0;
        for (const sub of subscriptions) {
            // Construct subscription object for web-push
            const pushSub = {
                endpoint: sub.endpoint,
                keys: sub.keys
            };

            // Send test Notif
            await sendPushNotification(
                { name: 'Test-Device', location: 'System', id: 'test' },
                'TEST',
                pushSub
            );
            sentCount++;
        }

        res.json({ message: `Sent test notification to ${sentCount} devices.` });

    } catch (error) {
        console.error('Test notification error:', error);
        res.status(500).json({ error: 'Failed to send test notification.' });
    }
};
