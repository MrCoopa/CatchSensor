const mqtt = require('mqtt');
require('dotenv').config();

const client = mqtt.connect(`mqtts://${process.env.TTN_MQTT_BROKER}`, {
    port: 8883,
    username: process.env.TTN_MQTT_USER,
    password: process.env.TTN_MQTT_PASS,
});

client.on('connect', () => {
    console.log('✅ Connected to TTN (MQTTS)');



    client.on('message', (topic, msg) => {
        console.log(`📩 RECEIVED MESSAGE on ${topic}`);
        // console.log(msg.toString());
    });

    const testPayload = {
        end_device_ids: {
            device_id: 'melder-2-esp32-lora-v2-abp'
        },
        uplink_message: {
            decoded_payload: {
                status: 'OPEN',
                batteryVoltage: 3600,
                batteryPercent: 85
            },
            rx_metadata: [{
                rssi: -75,
                snr: 8.5,
                gateway_ids: {
                    gateway_id: 'test-gateway-001'
                }
            }],
            settings: {
                data_rate: {
                    lora: {
                        spreading_factor: 7
                    }
                }
            },
            f_cnt: 42
        }
    };

    const topic = 'v3/melder@ttn/devices/melder-2-esp32-lora-v2-abp/up';
    const topicPattern = '#';

    client.subscribe(topicPattern, (err, granted) => {
        if (err) console.error('Subscription error:', err);
        else {
            console.log(`✅ Subscribed to ${topicPattern}`);
            console.log('Granted QoS:', granted[0].qos);
        }
    });

    console.log('Publishing to:', topic);

    client.publish(topic, JSON.stringify(testPayload), (err) => {
        if (err) {
            console.error('Publish error:', err);
        } else {
            console.log('✅ Message published successfully via MQTTS');
        }
        // client.end();
        // process.exit(0);
    });
});

client.on('error', (err) => {
    console.error('MQTT Error:', err);
    process.exit(1);
});
