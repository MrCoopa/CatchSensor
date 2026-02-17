const mqtt = require('mqtt');
const Trap = require('../models/Trap');
const Reading = require('../models/Reading');
const User = require('../models/User');
const TrapShare = require('../models/TrapShare');
const PushSubscription = require('../models/PushSubscription');
const { sendPushNotification } = require('./pushService');

const setupMQTT = (io, aedes) => {
    // 1. Direct Ingestion (Bypasses network, highly reliable)
    if (aedes) {
        console.log('MQTT: ✅ Direct Ingestion active (Aedes Internal)');
        aedes.on('publish', async (packet, client) => {
            // Only process topics starting with 'traps/' and ending with '/data'
            if (packet.topic && packet.topic.startsWith('traps/') && packet.topic.endsWith('/data')) {
                // Internal aedes.publish packets have topic and payload
                handleMQTTMessage(packet.topic, packet.payload, io);
            }
        });
    }

    // 2. External Brokers (Optional)
    const brokers = [];

    brokers.forEach(broker => {
        const client = mqtt.connect(broker.url, {
            protocolVersion: 4,
            connectTimeout: 5000,
            family: 4
        });

        client.on('connect', () => {
            console.log(`MQTT: ✅ Successfully connected to EXTERNAL broker: ${broker.name}`);
            client.subscribe('traps/+/data');
        });

        client.on('message', (topic, message) => {
            handleMQTTMessage(topic, message, io);
        });
    });
};

const handleMQTTMessage = async (topic, message, io) => {
    try {
        if (message.length === 4) {
            const status = message[0] === 0x00 ? 'triggered' : 'active';
            const voltage = message.readUInt16BE(1);
            const rssi = message[3];
            const batteryPercent = Math.min(100, Math.max(0, ((voltage - 3200) / (4200 - 3200)) * 100));

            const deviceId = topic.split('/')[1];
            console.log(`MQTT INGEST: Device [${deviceId}] -> Status: ${status}, V: ${voltage}mV, RSSI: ${rssi}`);

            await updateTrapData(deviceId, {
                status,
                batteryVoltage: voltage,
                batteryPercent: Math.round(batteryPercent),
                signalStrength: normalizeRSSI(rssi),
                rssi: Math.abs(rssi),
                value: voltage,
                type: 'vibration'
            }, io);
        }
    } catch (err) {
        console.error('MQTT Handle Error:', err);
    }
};

const normalizeRSSI = (rssi) => {
    const absRSSI = Math.abs(rssi);
    if (absRSSI <= 75) return 4;
    if (absRSSI <= 90) return 3;
    if (absRSSI <= 100) return 2;
    if (absRSSI <= 110) return 1;
    return 0;
};

const trapCache = new Map(); // Cache for Trap Lookups (IMEI -> {trap, userId, timestamp})
const CACHE_TTL = 5 * 60 * 1000; // 5 Minutes

const updateTrapData = async (deviceId, data, io) => {
    let trap;
    const now = Date.now();

    // 1. Check Cache
    if (trapCache.has(deviceId)) {
        const cached = trapCache.get(deviceId);
        if (now - cached.timestamp < CACHE_TTL) {
            trap = cached.trap;
            // console.log(`MQTT Cache: Hit for [${deviceId}]`);
        } else {
            trapCache.delete(deviceId); // Expired
        }
    }

    // 2. Fetch from DB if not in cache
    if (!trap) {
        trap = await Trap.findOne({ where: { imei: deviceId } });
        if (trap) {
            trapCache.set(deviceId, { trap, timestamp: now });
            // console.log(`MQTT Cache: Miss & Set for [${deviceId}]`);
        }
    }

    if (!trap) {
        console.log(`MQTT Logic: Trap with IMEI [${deviceId}] not found in database.`);
        return;
    }

    const oldStatus = trap.status;
    // console.log(`MQTT Logic: Updating Trap [${trap.name}] (${deviceId}). Old Status: ${oldStatus}, New Status: ${data.status}`);

    // Update instance (this updates the object in memory/cache too if sequelize managed it well, but we reload effectively)
    await trap.update({
        status: data.status,
        batteryVoltage: data.batteryVoltage,
        batteryPercent: data.batteryPercent,
        signalStrength: data.signalStrength,
        rssi: data.rssi,
        lastReading: new Date()
    });

    // Update cache timestamp on write to keep it fresh
    trapCache.set(deviceId, { trap, timestamp: Date.now() });

    if (trap.userId) {
        // console.log(`MQTT Logic: Trap owned by User [${trap.userId}]. Checking push criteria...`);
        if (data.status === 'triggered' && oldStatus !== 'triggered') {
            console.log(`MQTT Logic: 🚨 TRIGGERED state detected for Trap [${trap.name}]! Calling triggerPush...`);
            triggerPush(trap.userId, trap, 'ALARM');
        } else if (data.batteryPercent < 20 && oldStatus >= 20) { // Simple debounce
            console.log(`MQTT Logic: 🔋 LOW_BATTERY for Trap [${trap.name}]! Calling triggerPush...`);
            triggerPush(trap.userId, trap, 'LOW_BATTERY');
        }
    } else {
        // console.log(`MQTT Logic: Trap [${trap.name}] has no owner (userId is null). No push notification sent.`);
    }

    await Reading.create({
        trapId: trap.id,
        value: data.value,
        type: data.type,
        status: data.status,
        batteryPercent: data.batteryPercent,
        rssi: data.rssi
    });

    // Emit only to the specific user's room
    // Emit to the owner's room
    if (trap.userId) {
        io.to(`user_${trap.userId}`).emit('trap_update', trap);
    }

    // Emit to shared users' rooms
    try {
        const shares = await TrapShare.findAll({ where: { trapId: trap.id } });
        shares.forEach(share => {
            io.to(`user_${share.userId}`).emit('trap_update', trap);
            // console.log(`MQTT Logic: Emitted update to SHARED user room [user_${share.userId}]`);
        });
    } catch (err) {
        console.error('MQTT Logic: Error fetching shares for emission:', err);
    }
};

async function triggerPush(userId, trap, type) {
    try {
        console.log(`Push Service: Looking for subscriptions for user [${userId}]...`);
        const subscriptions = await PushSubscription.findAll({ where: { userId } });
        console.log(`Push Service: Found ${subscriptions.length} subscriptions.`);

        if (subscriptions.length > 0) {
            console.log(`Push Service: Sending ${type} notification to ${subscriptions.length} devices...`);
            for (const sub of subscriptions) {
                const pushSubscription = {
                    endpoint: sub.endpoint,
                    keys: sub.keys
                };
                await sendPushNotification(trap, type, pushSubscription);
            }
            console.log(`Push Service: ✅ All notifications sent.`);
        } else {
            console.warn(`Push Service: ⚠️ No subscriptions found for user [${userId}]. User might need to enable push in their browser.`);
        }
    } catch (err) {
        console.error('Push Service: ❌ Error during push trigger:', err);
    }
}

module.exports = { setupMQTT };
