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
            console.error(`MQTT: ❌ Error on broker ${broker.name}:`, err.message);
        });

        client.on('offline', () => {
            console.warn(`MQTT: ⚠️ Broker ${broker.name} went offline.`);
        });

        client.on('message', async (topic, message) => {
            try {
                let deviceId;

                // Simple Binary Parser (4-byte packet)
                if (message.length === 4) {
                    const status = message[0] === 0x00 ? 'triggered' : 'active';
                    const voltage = message.readUInt16BE(1);
                    const rssi = message[3]; // Raw absolute value
                    const batteryPercent = Math.min(100, Math.max(0, ((voltage - 3400) / (4200 - 3400)) * 100));

                    deviceId = topic.split('/')[1];

                    console.log(`MQTT: Received data for Device [${deviceId}] -> Status: ${status}, V: ${voltage}mV, Signal: ${rssi}`);

                    await updateTrapData(deviceId, {
                        status,
                        batteryVoltage: voltage,
                        batteryPercent: Math.round(batteryPercent),
                        signalStrength: normalizeRSSI(rssi),
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
    // 0-4 bars normalization (RSSI ist jetzt negativ, z.B. -40 bis -120)
    const absRSSI = Math.abs(rssi);
    if (absRSSI < 60) return 4;
    if (absRSSI < 80) return 3;
    if (absRSSI < 100) return 2;
    if (absRSSI < 115) return 1;
    return 0;
};

const updateTrapData = async (deviceId, data, io) => {
    const trap = await Trap.findOne({ where: { imei: deviceId } });
    if (!trap) return;

    await trap.update({
        status: data.status,
        batteryVoltage: data.batteryVoltage,
        batteryPercent: data.batteryPercent,
        signalStrength: data.signalStrength,
        lastReading: new Date()
    });

    await Reading.create({
        trapId: trap.id,
        value: data.value,
        type: data.type
    });

    // Real-time broadcast
    io.emit('trap_update', trap);
};

module.exports = { setupMQTT };
