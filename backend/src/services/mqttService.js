const mqtt = require('mqtt');
const Trap = require('../models/Trap');
const Reading = require('../models/Reading');

const setupMQTT = (io) => {
    // Config for local Mosquitto and TTN
    const brokers = [
        { url: 'mqtt://localhost', name: 'Mosquitto' },
        // Add TTN config here when credentials are provided
    ];

    brokers.forEach(broker => {
        const client = mqtt.connect(broker.url);
        let lastErrorLog = 0;
        const LOG_THROTTLE = 30000; // 30 seconds

        client.on('connect', () => {
            console.log(`MQTT: ✅ Successfully connected to broker: ${broker.name} (${broker.url})`);
            client.subscribe('traps/+/data', (err) => {
                if (err) console.error(`MQTT: ❌ Failed to subscribe to NB-IoT: ${err}`);
                else console.log('MQTT: Subscribed to traps/+/data (NB-IoT)');
            });
            client.subscribe('v3/+/devices/+/up', (err) => {
                if (err) console.error(`MQTT: ❌ Failed to subscribe to TTN: ${err}`);
                else console.log('MQTT: Subscribed to v3/+/devices/+/up (LoRaWAN)');
            });
        });

        client.on('error', (err) => {
            const now = Date.now();
            if (now - lastErrorLog > LOG_THROTTLE) {
                console.error(`MQTT: ❌ Error on broker ${broker.name}:`, err.message);
                lastErrorLog = now;
            }
        });

        client.on('offline', () => {
            const now = Date.now();
            if (now - lastErrorLog > LOG_THROTTLE) {
                console.warn(`MQTT: ⚠️ Broker ${broker.name} went offline.`);
                lastErrorLog = now;
            }
        });

        client.on('message', async (topic, message) => {
            try {
                let deviceId;

                // Simple Binary Parser (4-byte packet)
                if (message.length === 4) {
                    const status = message[0] === 0x00 ? 'triggered' : 'active';
                    const voltage = message.readUInt16BE(1);
                    const rssi = message[3]; // Raw absolute value
                    // Battery Calibration: 4.2V = 100%, 3.2V = 0%
                    const batteryPercent = Math.min(100, Math.max(0, ((voltage - 3200) / (4200 - 3200)) * 100));

                    deviceId = topic.split('/')[1];

                    console.log(`MQTT: Received data for Device [${deviceId}] -> Status: ${status}, V: ${voltage}mV, Signal: ${rssi}`);

                    await updateTrapData(deviceId, {
                        status,
                        batteryVoltage: voltage,
                        batteryPercent: Math.round(batteryPercent),
                        signalStrength: normalizeRSSI(rssi),
                        rssi: Math.abs(rssi),
                        value: voltage,
                        type: 'vibration'
                    }, io);
                } else {
                    console.log(`MQTT: Ignoring unknown packet format on topic [${topic}]. Length: ${message.length}`);
                }
            } catch (err) {
                console.error(`MQTT: ❌ Processing Error on topic [${topic}]:`, err);
            }
        });
    });
};

const normalizeRSSI = (rssi) => {
    // 0-4 bars normalization based on user defined thresholds
    const absRSSI = Math.abs(rssi);
    if (absRSSI <= 75) return 4;    // -50 bis -75 (Exzellent/Gut)
    if (absRSSI <= 90) return 3;    // -76 bis -90 (Mittelmäßig)
    if (absRSSI <= 100) return 2;   // -91 bis -100 (Genügend/Schwach)
    if (absRSSI <= 110) return 1;   // -101 bis -110 (Schlecht)
    return 0;                       // Ab -110 (Sehr schlecht)
};

const updateTrapData = async (deviceId, data, io) => {
    const trap = await Trap.findOne({ where: { imei: deviceId } });
    if (!trap) return;

    await trap.update({
        status: data.status,
        batteryVoltage: data.batteryVoltage,
        batteryPercent: data.batteryPercent,
        signalStrength: data.signalStrength,
        rssi: data.rssi, // Store raw absolute value
        lastReading: new Date()
    });

    await Reading.create({
        trapId: trap.id,
        value: data.value,
        type: data.type,
        status: data.status,
        batteryPercent: data.batteryPercent,
        rssi: data.rssi
    });

    // Real-time broadcast
    io.emit('trap_update', trap);
};

module.exports = { setupMQTT };
