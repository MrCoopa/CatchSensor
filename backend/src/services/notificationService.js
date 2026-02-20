const Pushover = require('pushover-notifications');
const { sendNativeNotification } = require('./pushService');
const User = require('../models/User');
const PushSubscription = require('../models/PushSubscription');

/**
 * Returns true if an alert should be suppressed based on the last alert time and interval.
 * @param {Date|null} lastAlert
 * @param {number} intervalHours
 */
const isThrottled = (lastAlert, intervalHours) => {
    if (!lastAlert) return false;
    return new Date(lastAlert).getTime() > Date.now() - intervalHours * 3600000;
};

/**
 * Unified Notification Engine
 * Handles Native Push (FCM) and Pushover (optional secondary channel).
 * Throttling is based on per-sensor lastAlert timestamps; "confirmation" is
 * the natural state change (e.g. user resets triggered sensor, sensor comes back online).
 */
const sendUnifiedNotification = async (user, catchSensor, type, customMessage = null) => {
    try {
        const catchInterval = user.catchAlertInterval || 3;   // hours (triggered re-alerts)
        const batteryInterval = user.batteryAlertInterval || 8;   // hours (low battery re-alerts)
        const offlineInterval = user.offlineAlertInterval || 8;   // hours (offline re-alerts)

        // ── Throttle checks ──────────────────────────────────────────────────────
        if (type === 'LOW_BATTERY' && isThrottled(catchSensor.lastBatteryAlert, batteryInterval)) {
            console.log(`NotificationEngine: Throttling battery alert for "${catchSensor.alias || catchSensor.imei}" (${batteryInterval}h interval)`);
            return;
        }
        if (type === 'CONNECTION_LOST' && isThrottled(catchSensor.lastOfflineAlert, offlineInterval)) {
            console.log(`NotificationEngine: Throttling offline alert for "${catchSensor.alias || catchSensor.imei}" (${offlineInterval}h interval)`);
            return;
        }
        if (type === 'ALARM' && isThrottled(catchSensor.lastCatchAlert, catchInterval)) {
            console.log(`NotificationEngine: Throttling alarm for "${catchSensor.alias || catchSensor.imei}" (${catchInterval}h interval)`);
            return;
        }

        const sensorName = catchSensor.alias || catchSensor.name || catchSensor.deviceId || catchSensor.imei || 'Unbekannt';
        console.log(`NotificationEngine: Sending ${type} for "${sensorName}" → User [${user.id}]`);

        // ── Build message ────────────────────────────────────────────────────────
        let notificationTitle;
        let messageText = customMessage;

        if (type === 'ALARM') {
            notificationTitle = `🚨 FANG-GEMELDET: ${sensorName}!`;
            if (!messageText) messageText = `${sensorName} hat ausgelöst!`;
        } else if (type === 'LOW_BATTERY') {
            const voltStr = catchSensor.batteryVoltage ? ` (${(catchSensor.batteryVoltage / 1000).toFixed(2)}V)` : '';
            notificationTitle = `⚠️ Batterie von ${sensorName} niedrig (${catchSensor.batteryPercent || 0}%)`;
            if (!messageText) messageText = `Batterie bei "${sensorName}" niedrig.${voltStr} (${catchSensor.batteryPercent || 0}%)`;
        } else if (type === 'CONNECTION_LOST') {
            const diffHours = Math.round((Date.now() - new Date(catchSensor.lastSeen).getTime()) / 3600000);
            notificationTitle = `📡 ${sensorName} ist offline seit ${diffHours}h`;
            if (!messageText) messageText = `${sensorName} hat seit ${diffHours} Stunden keinen Status gesendet.`;
        } else if (type === 'TEST') {
            notificationTitle = '🧪 Test-Modus';
            if (!messageText) messageText = 'Test-Benachrichtigung erfolgreich empfangen.';
        } else {
            notificationTitle = '⚠️ System-Info';
            if (!messageText) messageText = `Status-Update für "${sensorName}".`;
        }

        // ── 1. Native Push (FCM via Capacitor) ──────────────────────────────────
        if (user.pushEnabled !== false) {
            const subscriptions = await PushSubscription.findAll({ where: { userId: user.id } });
            for (const sub of subscriptions) {
                try {
                    console.log(`NotificationEngine: Sending FCM to ${sub.endpoint.substring(0, 15)}...`);
                    await sendNativeNotification(sub.endpoint, notificationTitle, messageText, {
                        url: `/catch/${catchSensor.id}`,
                        catchId: catchSensor.id ? catchSensor.id.toString() : '',
                        type
                    });
                } catch (err) {
                    console.error('NotificationEngine: FCM send failed for sub:', sub.id, err.message);
                }
            }
        }

        // ── 2. Pushover (optional secondary channel) ─────────────────────────────
        if (user.pushoverAppKey && user.pushoverUserKey) {
            const push = new Pushover({ user: user.pushoverUserKey, token: user.pushoverAppKey });
            push.send({
                title: notificationTitle,
                message: messageText,
                sound: type === 'ALARM' ? 'siren' : 'none',
                priority: type === 'ALARM' ? 1 : 0,
            }, (err, result) => {
                if (err) console.error('NotificationEngine: Pushover failed:', err);
                else console.log('NotificationEngine: Pushover sent:', result);
            });
        }

        // ── Update alert timestamps ───────────────────────────────────────────────
        if (type === 'LOW_BATTERY') await catchSensor.update({ lastBatteryAlert: new Date() });
        else if (type === 'CONNECTION_LOST') await catchSensor.update({ lastOfflineAlert: new Date() });
        else if (type === 'ALARM') await catchSensor.update({ lastCatchAlert: new Date() });

    } catch (err) {
        console.error('NotificationEngine: Error in sendUnifiedNotification:', err);
    }
};

module.exports = { sendUnifiedNotification };
