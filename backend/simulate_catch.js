const mqtt = require('mqtt');
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('./src/config/database');
const CatchSensor = require('./src/models/CatchSensor');
require('dotenv').config();

async function simulate() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');

        // 1. Find a catch sensor
        const catchSensor = await CatchSensor.findOne();
        if (!catchSensor) {
            console.error('❌ No CatchSensors found in DB! Run seed.js first.');
            process.exit(1);
        }

        console.log(`🎯 Targeting CatchSensor: ${catchSensor.name} (IMEI: ${catchSensor.imei})`);

        // 2. Connect to MQTT
        const client = mqtt.connect('mqtt://127.0.0.1');

        client.on('connect', () => {
            console.log('✅ MQTT Connected.');

            const topic = `catches/${catchSensor.imei}/data`;

            // A) First set to Active (to ensure state change)
            const payloadActive = Buffer.from([0x01, 0x10, 0x68, 0x50]); // Active
            console.log(`🔄 Resetting status to ACTIVE...`);
            client.publish(topic, payloadActive);

            // B) Then Trigger Alarm after delay
            setTimeout(() => {
                const payloadTrigger = Buffer.from([0x00, 0x10, 0x68, 0x50]); // Triggered
                console.log(`🚀 Sending ALARM (Triggered) to topic: ${topic}`);
                client.publish(topic, payloadTrigger, {}, (err) => {
                    if (err) console.error('❌ Publish Error:', err);
                    else console.log('✅ Alarm Sent!');
                    setTimeout(() => {
                        client.end();
                        process.exit(0);
                    }, 500);
                });
            }, 2000);
        });

    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

simulate();

