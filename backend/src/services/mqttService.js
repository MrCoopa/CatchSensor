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
            console.log(`MQTT: Connected to ${broker.name}`);
            client.subscribe('traps/+/data'); // NB-IoT
            client.subscribe('v3/+/devices/+/up'); // TTN
        });

        client.on('message', async (topic, message) => {
            try {
                let payload;
                let deviceId;

                // Simple Binary Parser (4-byte packet)
                // Byte 0: Status (0x00 = Triggered, 0x01 = OK)
                // Byte 1-2: Voltage (Hex to mV)
                // Byte 3: Signal (RSSI)

                if (message.length === 4) {
                    const status = message[0] === 0x00 ? 'triggered' : 'active';
                    const voltage = message.readUInt16BE(1);
                    const rssi = message[3]; // Raw absolute value
                    const batteryPercent = Math.min(100, Math.max(0, ((voltage - 3400) / (4200 - 3400)) * 100));

                    // Identify device from topic or payload (simulation)
                    // In real TTN, deviceId comes from the JSON wrapper, here we assume binary-only for NB-IoT
                    deviceId = topic.split('/')[1];

                    await updateTrapData(deviceId, {
                        status,
                        batteryVoltage: voltage,
                        batteryPercent: Math.round(batteryPercent),
                        signalStrength: normalizeRSSI(rssi),
                        value: voltage,
                        type: 'vibration'
                    }, io);
                }
            } catch (err) {
                console.error('MQTT Parsing Error:', err);
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
