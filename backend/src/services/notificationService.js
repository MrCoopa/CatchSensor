const Pushover = require('pushover-notifications');
const { sendPushNotification } = require('./pushService');
const User = require('../models/User');
const PushSubscription = require('../models/PushSubscription');

/**
 * Unified Notification Engine
 * Handles Web-Push (PWA) and Pushover (Additional)
 */
const sendUnifiedNotification = async (user, catchSensor, type, customMessage = null) => {
    try {
        // Throttling logic based on user settings (Identical for LoraWAN & NB-IoT)
        const batteryInterval = user.batteryAlertInterval || 24;
        const offlineInterval = user.offlineAlertInterval || 24;
        const catchInterval = user.catchAlertInterval || 1;

        if (type === 'LOW_BATTERY') {
            const lastAlert = catchSensor.lastBatteryAlert;
            const thresholdTime = new Date(Date.now() - batteryInterval * 60 * 60 * 1000);
            if (lastAlert && lastAlert > thresholdTime) {
                console.log(`NotificationEngine: Throttling battery alert for ${catchSensor.alias || catchSensor.imei} (Interval: ${batteryInterval}h)`);
                return;
            }
        }

        if (type === 'CONNECTION_LOST') {
            const lastAlert = catchSensor.lastOfflineAlert;
            const thresholdTime = new Date(Date.now() - offlineInterval * 60 * 60 * 1000);
            if (lastAlert && lastAlert > thresholdTime) {
                console.log(`NotificationEngine: Throttling offline alert for ${catchSensor.alias || catchSensor.imei} (Interval: ${offlineInterval}h)`);
                return;
            }
        }

        if (type === 'ALARM') {
            const lastAlert = catchSensor.lastCatchAlert;
            const thresholdTime = new Date(Date.now() - catchInterval * 60 * 60 * 1000);
            // Only throttle if the sensor is ALREADY triggered (repeat alert logic)
            if (catchSensor.status === 'triggered' && lastAlert && lastAlert > thresholdTime) {
                console.log(`NotificationEngine: Throttling repetitive alarm for ${catchSensor.alias || catchSensor.imei} (Interval: ${catchInterval}h)`);
                return;
            }
        }

        console.log(`NotificationEngine: Sending ${type} for CatchSensor [${catchSensor.alias || catchSensor.deviceId || catchSensor.imei}] to User [${user.id}]`);

        // Centralized ID Fallback for consistency between LoraWAN and NB-IoT
        const sensorName = catchSensor.alias || catchSensor.name || catchSensor.deviceId || catchSensor.imei || 'Unbekannt';

        let messageText = customMessage;

        if (!messageText) {
            if (type === 'ALARM') {
                messageText = `${sensorName} hat ausgelöst!`;
            } else if (type === 'LOW_BATTERY') {
                const voltStr = catchSensor.batteryVoltage ? ` (${(catchSensor.batteryVoltage / 1000).toFixed(2)}V)` : '';
                messageText = `Batterie bei "${sensorName}" niedrig.${voltStr} (${catchSensor.batteryPercent || '0'}%)`;
            } else if (type === 'CONNECTION_LOST') {
                const diffMs = Date.now() - new Date(catchSensor.lastSeen).getTime();
                const diffHours = Math.round(diffMs / (1000 * 60 * 60));
                messageText = `${sensorName} hat seit ${diffHours} Stunden keinen Status gesendet.`;
            } else {
                messageText = `Status-Update für "${sensorName}".`;
            }
        }

        let notificationTitle = '⚠️ System-Info';
        if (type === 'ALARM') {
            notificationTitle = `🚨 FANG-GEMELDET: ${sensorName} !`;
        } else if (type === 'LOW_BATTERY') {
            notificationTitle = `⚠️ System-Info: Batterie von ${sensorName} niedrig (${catchSensor.batteryPercent || '0'}%)`;
        } else if (type === 'CONNECTION_LOST') {
            const diffMs = Date.now() - new Date(catchSensor.lastSeen).getTime();
            const diffHours = Math.round(diffMs / (1000 * 60 * 60));
            notificationTitle = `WARNUNG: ${sensorName} ist Offline seit ${diffHours} Stunden`;
        } else if (type === 'TEST') {
            notificationTitle = '🧪 Test-Modus';
            messageText = 'Testnachricht für PWA SW Push';
        }

        // 1. Web-Push (PWA)
        if (user.pushEnabled !== false) {
            const subscriptions = await PushSubscription.findAll({ where: { userId: user.id } });
            if (subscriptions.length > 0) {
                for (const sub of subscriptions) {
                    try {
                        await sendPushNotification(catchSensor, { endpoint: sub.endpoint, keys: sub.keys }, notificationTitle, messageText);
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
                title: notificationTitle,
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
            await catchSensor.update({ lastBatteryAlert: new Date() });
        } else if (type === 'CONNECTION_LOST') {
            await catchSensor.update({ lastOfflineAlert: new Date() });
        } else if (type === 'ALARM') {
            await catchSensor.update({ lastCatchAlert: new Date() });
        }
    } catch (err) {
        console.error('NotificationEngine: Error in sendUnifiedNotification:', err);
    }
};

module.exports = { sendUnifiedNotification };

