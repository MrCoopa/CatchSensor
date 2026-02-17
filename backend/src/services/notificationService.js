const Pushover = require('pushover-notifications');
const { sendPushNotification } = require('./pushService');
const User = require('../models/User');
const PushSubscription = require('../models/PushSubscription');

/**
 * Unified Notification Engine
 * Handles Web-Push (PWA) and Pushover (Additional)
 */
const sendUnifiedNotification = async (user, trap, type, customMessage = null) => {
    try {
        // ... Throttling logic remains ...
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        if (type === 'LOW_BATTERY') {
            if (trap.lastBatteryAlert && trap.lastBatteryAlert > oneDayAgo) {
                console.log(`NotificationEngine: Throttling battery alert for ${trap.alias || trap.imei}`);
                return;
            }
        }
        if (type === 'CONNECTION_LOST') {
            if (trap.lastOfflineAlert && trap.lastOfflineAlert > oneDayAgo) {
                console.log(`NotificationEngine: Throttling offline alert for ${trap.alias || trap.imei}`);
                return;
            }
        }

        console.log(`NotificationEngine: Sending ${type} for Trap [${trap.alias || trap.deviceId || trap.imei}] to User [${user.id}]`);

        const messageText = customMessage || (
            type === 'ALARM'
                ? `Falle "${trap.alias || trap.name || trap.imei}" hat ausgelöst!`
                : type === 'LOW_BATTERY'
                    ? `Batterie schwach bei "${trap.alias || trap.name || trap.imei}": ${trap.batteryPercent}%`
                    : `Status-Update für "${trap.alias || trap.name || trap.imei}".`
        );

        // 1. Web-Push (PWA)
        if (user.pushEnabled !== false) {
            const subscriptions = await PushSubscription.findAll({ where: { userId: user.id } });
            if (subscriptions.length > 0) {
                for (const sub of subscriptions) {
                    try {
                        await sendPushNotification(trap, type, { endpoint: sub.endpoint, keys: sub.keys });
                    } catch (err) {
                        console.error('NotificationEngine: Web-Push failed for sub:', sub.id, err.message);
                    }
                }
            }
        }

        // 2. Pushover (Optional)
        if (user.pushoverAppKey && user.pushoverUserKey) {
            const push = new Pushover({
                user: user.pushoverUserKey,
                token: user.pushoverAppKey,
            });

            const msg = {
                title: type === 'ALARM' ? '🚨 FANG-ALARM!' : '⚠️ System-Info',
                message: messageText,
                sound: type === 'ALARM' ? 'siren' : 'none',
                priority: type === 'ALARM' ? 1 : 0,
            };

            push.send(msg, (err, result) => {
                if (err) {
                    console.error('NotificationEngine: Pushover failed:', err);
                } else {
                    console.log('NotificationEngine: Pushover success:', result);
                }
            });
        }

        // Update Alert Timestamps
        if (type === 'LOW_BATTERY') {
            await trap.update({ lastBatteryAlert: new Date() });
        } else if (type === 'CONNECTION_LOST') {
            await trap.update({ lastOfflineAlert: new Date() });
        }
    } catch (err) {
        console.error('NotificationEngine: Error in sendUnifiedNotification:', err);
    }
};

module.exports = { sendUnifiedNotification };
