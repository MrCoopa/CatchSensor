const mqtt = require('mqtt');
const Trap = require('./src/models/Trap');
const sequelize = require('./src/config/database');
require('dotenv').config();

async function runVerify() {
    try {
        await sequelize.authenticate();
        const trap = await Trap.findOne();
        if (!trap) {
            console.error('No trap found');
            process.exit(1);
        }

        console.log(`Using Trap: ${trap.name} (${trap.imei})`);

        const client = mqtt.connect('mqtt://127.0.0.1:1883', {
            connectTimeout: 5000
        });

        client.on('connect', () => {
            console.log('Connected to MQTT Broker');

            // 1. First Publish (Should be Cache Miss)
            console.log('Sending first packet...');
            sendData(client, trap.imei, 4100);

            setTimeout(() => {
                // 2. Second Publish (Should be Cache Hit)
                console.log('Sending second packet...');
                sendData(client, trap.imei, 4090);

                setTimeout(() => {
                    console.log('Closing client...');
                    client.end();
                    process.exit(0);
                }, 1000);
            }, 2000);
        });

        client.on('error', (err) => {
            console.error('MQTT Client Error:', err);
        });

        client.on('offline', () => {
            console.log('MQTT Client Offline');
        });

        client.on('close', () => {
            console.log('MQTT Client Closed');
        });

    } catch (err) {
        console.error('Setup Error:', err);
        process.exit(1);
    }
}

function sendData(client, imei, voltage) {
    const topic = `traps/${imei}/data`;
    // Packet: Status(1), Voltage(2), RSSI(1)
    const buf = Buffer.alloc(4);
    buf.writeUInt8(0x01, 0); // Active
    buf.writeUInt16BE(voltage, 1);
    buf.writeUInt8(60, 3); // RSSI

    client.publish(topic, buf);
    console.log(`Published to ${topic}`);
}

runVerify();
