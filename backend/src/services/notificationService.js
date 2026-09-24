const Pushover = require('pushover-notifications');
const { sendNativeNotification } = require('./pushService');
const User = require('../models/User');
const PushSubscription = require('../models/PushSubscription');
const https = require('https');

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
 * Helper to dispatch Revierwelt Webhook (once per event)
 */
const sendRevierweltWebhook = (catchSensor, sensorName) => {
    if (!catchSensor.revierweltWebhookUrl) return;

    try {
        const data = JSON.stringify({
            imei: catchSensor.imei || catchSensor.deviceId,
            sensorName: sensorName,
            status: 'triggered',
            timestamp: new Date().toISOString()
        });

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = https.request(catchSensor.revierweltWebhookUrl, options, (res) => {
            console.log(`NotificationEngine: Revierwelt Webhook status: ${res.statusCode}`);
        });

        req.on('error', (err) => {
            console.error('NotificationEngine: Revierwelt Webhook failed:', err);
        });

        req.write(data);
        req.end();
    } catch (err) {
        console.error('NotificationEngine: Revierwelt Webhook error:', err);
    }
};

/**
 * Unified Notification Engine
 * Handles Native Push (FCM) and Pushover (optional secondary channel).
 * Throttling is based on per-sensor lastAlert timestamps; "confirmation" is
 * the natural state change (e.g. user resets triggered sensor, sensor comes back online).
 *
 * @param {Object} user
 * @param {Object} catchSensor
 * @param {string} type - 'ALARM', 'LOW_BATTERY', 'CONNECTION_LOST', 'RESYNC_REQUIRED', 'TEST'
 * @param {string|null} customMessage
 * @param {boolean} updateTimestamp - Whether to update the sensor timestamp in DB immediately
 */
const sendUnifiedNotification = async (user, catchSensor, type, customMessage = null, updateTimestamp = true) => {
    try {
        const catchInterval = user.catchAlertInterval || 3;   // hours (triggered re-alerts)
        const batteryInterval = user.batteryAlertInterval || 8;   // hours (low battery re-alerts)
        const offlineInterval = user.offlineAlertInterval || 8;   // hours (offline re-alerts)

        // ── Throttle checks (only if standalone call, otherwise notifySensorUsers handles it) ─────
        if (updateTimestamp) {
            if (type === 'LOW_BATTERY' && isThrottled(catchSensor.lastBatteryAlert, batteryInterval)) {
                console.log(`NotificationEngine: Throttling battery alert for "${catchSensor.alias || catchSensor.imei}" (${batteryInterval}h interval)`);
                return;
            }
            if (type === 'CONNECTION_LOST' && isThrottled(catchSensor.lastOfflineAlert, offlineInterval)) {
                console.log(`NotificationEngine: Throttling offline alert for "${catchSensor.alias || catchSensor.imei}" (${offlineInterval}h interval)`);
                return;
            }
            if (type === 'RESYNC_REQUIRED' && isThrottled(catchSensor.lastResyncAlert, 1)) { // 1 hour throttle for resync
                console.log(`NotificationEngine: Throttling resync alert for "${catchSensor.alias || catchSensor.imei}" (1h interval)`);
                return;
            }
            if (type === 'ALARM') {
                const isAcknowledged = catchSensor.alarmAcknowledgedAt &&
                    catchSensor.lastCatchAlert &&
                    new Date(catchSensor.alarmAcknowledgedAt) >= new Date(catchSensor.lastCatchAlert);

                if (isAcknowledged) {
                    console.log(`NotificationEngine: Suppressing alarm for "${catchSensor.alias || catchSensor.imei}" — already acknowledged.`);
                    return;
                }

                if (isThrottled(catchSensor.lastCatchAlert, catchInterval)) {
                    console.log(`NotificationEngine: Throttling alarm for "${catchSensor.alias || catchSensor.imei}" (${catchInterval}h interval)`);
                    return;
                }
            }
        }

        const sensorName = catchSensor.alias || catchSensor.name || catchSensor.deviceId || catchSensor.imei || 'Unbekannt';
        console.log(`NotificationEngine: Sending ${type} for "${sensorName}" → User [${user.id}]`);

        // ── Build message ────────────────────────────────────────────────────────
        let notificationTitle;
        let messageText = customMessage;

        if (type === 'ALARM') {
            notificationTitle = `❌ Fang! - Melder "${sensorName}"`;
            if (!messageText) messageText = `Melder "${sensorName}" hat ausgelöst. Bitte die Falle kontrollieren.`;
        } else if (type === 'LOW_BATTERY') {
            const voltStr = catchSensor.batteryVoltage ? `${(catchSensor.batteryVoltage / 1000).toFixed(2).replace('.', ',')}V` : '---V';
            notificationTitle = `Warnung - Batterie bei Melder "${sensorName}" auf ${catchSensor.batteryPercent || 0}%`;
            if (!messageText) messageText = `Batterie bei Melder "${sensorName}" niedrig. (${voltStr}) (${catchSensor.batteryPercent || 0}%)`;
        } else if (type === 'CONNECTION_LOST') {
            const diffHours = Math.round((Date.now() - new Date(catchSensor.lastSeen).getTime()) / 3600000);
            
            let timeStr;
            if (diffHours >= 24) {
                const days = Math.floor(diffHours / 24);
                const remainingHours = diffHours % 24;
                timeStr = `${days} Tag${days > 1 ? 'e' : ''}${remainingHours > 0 ? ` und ${remainingHours} Std.` : ''}`;
            } else {
                timeStr = `${diffHours} Std.`;
            }

            notificationTitle = `Warnung - Melder "${sensorName}" seit ${timeStr} offline.`;
            if (!messageText) messageText = `Seit ${timeStr} keine Statusmeldung von Melder "${sensorName}" empfangen.`;
        } else if (type === 'RESYNC_REQUIRED') {
            notificationTitle = `Batteriewechsel? - Melder "${sensorName}"`;
            if (!messageText) messageText = `Melder "${sensorName}" wurde neu gestartet. Bitte Batteriewechsel in der App bestätigen.`;
        } else if (type === 'TEST') {
            notificationTitle = 'Test-Push';
            if (!messageText) messageText = 'Test-Benachrichtigung erfolgreich empfangen.';
        } else {
            notificationTitle = 'Info';
            if (!messageText) messageText = `Status-Update für "${sensorName}".`;
        }

        // ── 1. Native Push (FCM via Capacitor) ──────────────────────────────────
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

        // ── 2. Pushover (optional secondary channel) ─────────────────────────────
        if (user.pushoverEnabled && user.pushoverAppKey && user.pushoverUserKey) {
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

        // ── 3. Revierwelt Webhook (Optional, only for standalone single-user call)
        if (updateTimestamp && type === 'ALARM') {
            sendRevierweltWebhook(catchSensor, sensorName);
        }

        // ── 4. Update alert timestamps ───────────────────────────────────────────
        if (updateTimestamp) {
            if (type === 'LOW_BATTERY') await catchSensor.update({ lastBatteryAlert: new Date() });
            else if (type === 'CONNECTION_LOST') await catchSensor.update({ lastOfflineAlert: new Date() });
            else if (type === 'ALARM') await catchSensor.update({ lastCatchAlert: new Date() });
            else if (type === 'RESYNC_REQUIRED') await catchSensor.update({ lastResyncAlert: new Date() });
        }

    } catch (err) {
        console.error('NotificationEngine: Error in sendUnifiedNotification:', err);
    }
};

/**
 * Notifies multiple authorized users (owner + co-hunters) without premature throttling.
 * Timestamps are updated ONCE after all recipients have received the alert.
 */
const notifySensorUsers = async (users, catchSensor, type, customMessage = null) => {
    if (!users || users.length === 0) return;

    // Check alarm acknowledgment before proceeding
    if (type === 'ALARM') {
        const isAcknowledged = catchSensor.alarmAcknowledgedAt &&
            catchSensor.lastCatchAlert &&
            new Date(catchSensor.alarmAcknowledgedAt) >= new Date(catchSensor.lastCatchAlert);

        if (isAcknowledged) {
            console.log(`NotificationEngine: Suppressing alarm for "${catchSensor.alias || catchSensor.imei}" — already acknowledged.`);
            return;
        }
    }

    // Capture initial timestamps so that every user in this batch is checked against the same state
    const initialLastCatchAlert = catchSensor.lastCatchAlert;
    const initialLastBatteryAlert = catchSensor.lastBatteryAlert;
    const initialLastOfflineAlert = catchSensor.lastOfflineAlert;
    const initialLastResyncAlert = catchSensor.lastResyncAlert;

    let anySent = false;

    for (const user of users) {
        if (!user) continue;

        const catchInterval = user.catchAlertInterval || 3;
        const batteryInterval = user.batteryAlertInterval || 8;
        const offlineInterval = user.offlineAlertInterval || 8;

        if (type === 'LOW_BATTERY' && isThrottled(initialLastBatteryAlert, batteryInterval)) {
            console.log(`NotificationEngine: Throttling battery alert for User ${user.id} (${batteryInterval}h interval)`);
            continue;
        }
        if (type === 'CONNECTION_LOST' && isThrottled(initialLastOfflineAlert, offlineInterval)) {
            console.log(`NotificationEngine: Throttling offline alert for User ${user.id} (${offlineInterval}h interval)`);
            continue;
        }
        if (type === 'RESYNC_REQUIRED' && isThrottled(initialLastResyncAlert, 1)) {
            console.log(`NotificationEngine: Throttling resync alert for User ${user.id} (1h interval)`);
            continue;
        }
        if (type === 'ALARM' && isThrottled(initialLastCatchAlert, catchInterval)) {
            console.log(`NotificationEngine: Throttling alarm for User ${user.id} (${catchInterval}h interval)`);
            continue;
        }

        // Send notification without mutating timestamps yet
        await sendUnifiedNotification(user, catchSensor, type, customMessage, false);
        anySent = true;
    }

    // Dispatch Revierwelt Webhook exactly once per event
    if (anySent && type === 'ALARM') {
        const sensorName = catchSensor.alias || catchSensor.name || catchSensor.deviceId || catchSensor.imei || 'Unbekannt';
        sendRevierweltWebhook(catchSensor, sensorName);
    }

    // Persist updated timestamp once for the sensor
    if (anySent) {
        if (type === 'LOW_BATTERY') await catchSensor.update({ lastBatteryAlert: new Date() });
        else if (type === 'CONNECTION_LOST') await catchSensor.update({ lastOfflineAlert: new Date() });
        else if (type === 'ALARM') await catchSensor.update({ lastCatchAlert: new Date() });
        else if (type === 'RESYNC_REQUIRED') await catchSensor.update({ lastResyncAlert: new Date() });
    }
};

module.exports = { sendUnifiedNotification, notifySensorUsers };
