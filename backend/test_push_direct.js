const { sendPushNotification } = require('./src/services/pushService');
const Trap = require('./src/models/Trap');
const PushSubscription = require('./src/models/PushSubscription');
const sequelize = require('./src/config/database');
require('dotenv').config();

async function testPush() {
    try {
        await sequelize.authenticate();

        const subs = await PushSubscription.findAll();
        if (subs.length === 0) {
            console.error('❌ Keine Push-Subscriptions in der DB gefunden.');
            process.exit(1);
        }

        const sub = subs[0];
        const trap = await Trap.findOne({ where: { userId: sub.userId } });

        if (!trap) {
            console.error(`❌ Kein TrapSensor für User ${sub.userId} gefunden, der eine Subscription hat.`);
            process.exit(1);
        }
        if (!sub) {
            console.error('❌ Keine Push-Subscription für diesen User gefunden.');
            process.exit(1);
        }

        console.log(`🚀 Sende Test-Push für Falle: ${trap.name} an User: ${trap.userId}`);

        const pushSubscription = {
            endpoint: sub.endpoint,
            keys: sub.keys
        };

        await sendPushNotification(trap, 'ALARM', pushSubscription);
        console.log('✅ Test-Push wurde an den Gateway übergeben. Bitte Browser prüfen!');

        // Wait a bit for async tasks
        setTimeout(() => process.exit(0), 2000);
    } catch (err) {
        console.error('❌ Test-Push Fehler:', err);
        process.exit(1);
    }
}

testPush();
