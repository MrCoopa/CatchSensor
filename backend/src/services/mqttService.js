const mqtt = require('mqtt');
const Trap = require('../models/Trap');
const Reading = require('../models/Reading');
const User = require('../models/User');
const TrapShare = require('../models/TrapShare');
const PushSubscription = require('../models/PushSubscription');
const LoraMetadata = require('../models/LoraMetadata');
const { sendPushNotification } = require('./pushService');
const { sendUnifiedNotification } = require('./notificationService');

const setupMQTT = (io, aedes) => {
    // 1. Path A: Internal NB-IoT Broker (Aedes)
    if (aedes) {
        console.log('MQTT: ✅ Internal NB-IoT Broker active (Aedes)');
        aedes.on('publish', async (packet, client) => {
            if (packet.topic.startsWith('$SYS')) return; // Ignore system topics
            console.log(`MQTT: 📥 Internal Broker received publish on: ${packet.topic}`);
            if (packet.topic && packet.topic.startsWith('traps/') && packet.topic.endsWith('/data')) {
                handleMQTTMessage(packet.topic, packet.payload, io, 'NB-IOT');
            }
        });
    }

    // 2. Path B: External NB-IoT Broker (Optional)
    if (process.env.NBIOT_MQTT_BROKER) {
        connectToBroker({
            name: 'External NB-IoT',
            url: `mqtt://${process.env.NBIOT_MQTT_BROKER}`,
            port: process.env.NBIOT_MQTT_PORT || 1883,
            username: process.env.NBIOT_MQTT_USER,
            password: process.env.NBIOT_MQTT_PASS,
            topic: process.env.NBIOT_MQTT_TOPIC || 'traps/+/data'
        }, (topic, payload) => handleMQTTMessage(topic, payload, io, 'NB-IOT'));
    }

    // 3. Path C: LoRaWAN via TTN (External MQTT Broker)
    if (process.env.TTN_MQTT_USER) {
        const ttnPort = process.env.TTN_MQTT_PORT || 1883;
        const protocol = ttnPort == 8883 ? 'mqtts' : 'mqtt';

        connectToBroker({
            name: 'LoRaWAN (TTN)',
            url: `${protocol}://${process.env.TTN_MQTT_BROKER || 'eu1.cloud.thethings.network'}`,
            port: ttnPort,
            username: process.env.TTN_MQTT_USER,
            password: process.env.TTN_MQTT_PASS,
            topic: '#' // Use wildcard as specific topics are being rejected
        }, (topic, payload) => {
            console.log(`MQTT: TTN Raw Topic: ${topic}`);
            if (topic.endsWith('/up')) {
                handleMQTTMessage(topic, payload, io, 'LORAWAN');
            } else {
                console.log(`MQTT: Ignored TTN Topic: ${topic}`);
            }
        });
    }
};

const connectToBroker = (config, onMessage) => {
    console.log(`MQTT: Connecting to ${config.name} Broker: ${config.url}`);
    const client = mqtt.connect(config.url, {
        port: config.port,
        username: config.username,
        password: config.password,
    });

    client.on('connect', () => {
        console.log(`MQTT: ✅ Connected to ${config.name} Broker`);
        client.subscribe(config.topic, (err) => {
            if (err) console.error(`MQTT: Failed to subscribe to ${config.topic}`, err);
            else console.log(`MQTT: Subscribed to ${config.topic}`);
        });
    });

    client.on('packetreceive', (packet) => {
        if (packet.cmd === 'publish') {
            console.log(`MQTT: DEBUG - Packet received on topic: ${packet.topic}`);
        }
    });

    client.on('message', (topic, payload) => {
        console.log(`MQTT: Received message on ${config.name} topic: ${topic}`);
        onMessage(topic, payload);
    });

    client.on('error', (err) => {
        console.error(`MQTT ${config.name} Error:`, err);
    });

    return client;
};


const handleMQTTMessage = async (topic, payload, io, pathType) => {
    try {
        let normalizedData = null;
        let deviceId = null;

        if (pathType === 'NB-IOT') {
            // Path A: NB-IoT Binary (4 Bytes)
            // Payload format: [Status (1), Voltage (2), RSSI (1)]
            if (payload.length < 4) return;

            deviceId = topic.split('/')[1];
            const statusByte = payload.readUInt8(0);
            const voltage = payload.readUInt16BE(1);
            const rssi = payload.readUInt8(3);

            normalizedData = {
                type: 'NB-IOT',
                status: statusByte === 0x01 ? 'active' : 'triggered',
                batteryVoltage: voltage,
                batteryPercent: Math.min(100, Math.max(0, Math.floor((voltage - 3300) / 9))), // Approx mapping
                rssi: -rssi,
                lastReading: new Date()
            };
        } else if (pathType === 'LORAWAN') {
            // Path B: LoRaWAN JSON (TTN Format)
            const json = JSON.parse(payload.toString());
            // console.log('MQTT: Raw LoRaWAN JSON:', JSON.stringify(json).substring(0, 1000));


            // Handle both array-wrapped (simulate) and single-object (real) JSON
            const data = Array.isArray(json) ? json[0] : (json.data || json);
            if (!data.end_device_ids) return;

            deviceId = data.end_device_ids.device_id;
            const uplink = data.uplink_message;
            if (!uplink) return;

            console.log(`MQTT: Processing LoRaWAN Message for ${deviceId}`);

            // Priority 1: Use Decoded Payload if available
            let status = 'active';
            let voltage = 0;
            let batteryPercent = 0;

            if (uplink.decoded_payload) {
                const dp = uplink.decoded_payload;
                const statusStr = (dp.status || '').toLowerCase();
                status = (statusStr === 'triggered' || statusStr === 'closed') ? 'triggered' : 'active';

                // Voltage can be in mV or V
                voltage = dp.batteryVoltage > 100 ? dp.batteryVoltage : Math.round(dp.batteryVoltage * 1000);
                batteryPercent = dp.batteryPercent || 0;
            }
            // Priority 2: Fallback to binary parsing of frm_payload if decoded_payload is missing or 0
            else if (uplink.frm_payload) {
                const buffer = Buffer.from(uplink.frm_payload, 'base64');
                if (buffer.length >= 3) {
                    const statusByte = buffer.readUInt8(0);
                    // Use the 3-byte format seen in the dump: AQ39 -> 01 0d fd -> 3581mV
                    // Or the 4-byte format seen in the other dump: AQzkUA== -> 01 0c e4 50 -> 3300mV 80%
                    status = statusByte === 0x01 ? 'active' : 'triggered';
                    voltage = buffer.readUInt16BE(1);
                    if (buffer.length >= 4) {
                        batteryPercent = buffer.readUInt8(3);
                    } else {
                        batteryPercent = Math.min(100, Math.max(0, Math.floor((voltage - 3300) / 9)));
                    }
                }
            }

            // Extract Metadata
            const rssi = uplink.rx_metadata?.[0]?.rssi || 0;
            const snr = uplink.rx_metadata?.[0]?.snr || 0;
            const gatewayId = uplink.rx_metadata?.[0]?.gateway_ids?.gateway_id || 'unknown';
            const gatewayCount = uplink.rx_metadata?.length || 1;
            const fCnt = uplink.f_cnt || 0;
            const sf = uplink.settings?.data_rate?.lora?.spreading_factor || 0;

            normalizedData = {
                deviceId,
                type: 'LORAWAN',
                status: status, // Standardized key
                batteryPercent,
                rssi,
                snr,
                gatewayId,
                gatewayCount,
                fCnt,
                spreadingFactor: sf,
                batteryVoltage: voltage, // Ensure consistent property name (mV)
                lastVoltage: voltage / 1000, // Keep for backward compatibility if needed
                lastSeen: new Date()
            };

            // console.log(`MQTT: Normalized LoRaWAN Data for ${deviceId}:`, JSON.stringify(normalizedData, null, 2));
        }



        if (normalizedData && deviceId) {
            await updateTrapData(deviceId, normalizedData, io);
        }
    } catch (err) {
        console.error('MQTT Handler Error:', err);
    }
};

const updateTrapData = async (deviceId, data, io) => {
    try {
        let trap = await Trap.findOne({
            where: data.type === 'NB-IOT' ? { imei: deviceId } : { deviceId: deviceId },
            include: data.type === 'LORAWAN' ? [{ model: LoraMetadata, as: 'lorawanTrapSensor' }] : []
        });

        console.log(`MQTT: Search result for ${deviceId}: ${trap ? 'Found' : 'NOT FOUND'}`);

        if (!trap) {
            console.log(`MQTT: 🆕 Auto-provisioning new device: ${deviceId}`);
            try {
                trap = await Trap.create({
                    name: `New Device ${deviceId}`,
                    alias: deviceId,
                    type: data.type,
                    deviceId: data.type === 'LORAWAN' ? deviceId : null,
                    imei: data.type === 'NB-IOT' ? deviceId : null,
                    status: data.status,
                    userId: null // Unbound
                });
                console.log(`MQTT: ✅ Created new trap: ${trap.id}`);
            } catch (createErr) {
                console.error('MQTT: Failed to auto-provision trap:', createErr);
                return;
            }
        }

        // 1. Update Core Fields
        trap.type = data.type;

        if (data.type === 'NB-IOT') {
            trap.imei = deviceId;
            trap.status = data.status || 'active';
            trap.batteryVoltage = data.batteryVoltage;
            trap.batteryPercent = data.batteryPercent;
            trap.rssi = data.rssi;
            trap.lastSeen = new Date();
            await trap.save();
        } else {
            // LoRaWAN Unified
            trap.deviceId = deviceId;
            trap.status = data.status || 'active';
            trap.batteryVoltage = data.batteryVoltage; // Already in mV from normalizedData
            trap.batteryPercent = data.batteryPercent;
            trap.lastSeen = data.lastSeen || new Date();

            await trap.save();

            // 2. Update Lora Metadata (lorawwanTrapSensor)
            await LoraMetadata.upsert({
                trapId: trap.id,
                loraRssi: data.rssi,
                snr: data.snr,
                spreadingFactor: data.spreadingFactor,
                gatewayId: data.gatewayId,
                gatewayCount: data.gatewayCount || 1,
                fCnt: data.fCnt || 0
            });

            // 3. Refetch to get the updated metadata object
            trap = await Trap.findByPk(trap.id, {
                include: [{ model: LoraMetadata, as: 'lorawanTrapSensor' }]
            });
        }


        // Create Reading
        await Reading.create({
            trapId: trap.id,
            value: data.batteryVoltage, // Store voltage in 'value'
            type: data.status === 'triggered' ? 'alarm' : 'status',
            status: data.status,
            batteryPercent: data.batteryPercent,
            rssi: data.rssi,
            // Capture LoRaWAN metadata for this specific reading
            snr: data.snr,
            gatewayId: data.gatewayId,
            gatewayCount: data.gatewayCount,
            fCnt: data.fCnt,
            spreadingFactor: data.spreadingFactor
        });

        // 3. Emit Socket Update
        const roomName = `user_${trap.userId}`;
        io.to(roomName).emit('trapUpdate', trap);
        console.log(`MQTT: 📢 Emitted update for ${trap.name} (${deviceId}). Status: ${trap.status}, Batt: ${trap.batteryPercent}%`);


        // 4. Send Notifications
        if (trap.userId) {
            const user = await User.findByPk(trap.userId);
            if (user) {
                const threshold = user.batteryThreshold || 20;

                if (trap.status === 'triggered') {
                    await sendUnifiedNotification(user, trap, 'ALARM');
                } else if (trap.batteryPercent !== null && trap.batteryPercent < threshold) {
                    await sendUnifiedNotification(user, trap, 'LOW_BATTERY');
                }
            }
        }

    } catch (err) {
        console.error('UpdateTrapData Error:', err);
    }
};


module.exports = { setupMQTT };
