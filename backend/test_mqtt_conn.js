const mqtt = require('mqtt');
console.log('Attempting to connect to MQTT at 127.0.0.1:1883...');
const client = mqtt.connect('mqtt://127.0.0.1:1883', {
    connectTimeout: 5000
});

client.on('connect', () => {
    console.log('✅ Connected to MQTT!');
    client.end();
    process.exit(0);
});

client.on('error', (err) => {
    console.error('❌ MQTT Error:', err);
    process.exit(1);
});

setTimeout(() => {
    console.error('❌ MQTT Connection timeout after 10s');
    process.exit(1);
}, 10000);
