const User = require('./src/models/User');
const Trap = require('./src/models/Trap');
const Reading = require('./src/models/Reading');
const PushSubscription = require('./src/models/PushSubscription');
const sequelize = require('./src/config/database');
require('dotenv').config();

async function dump() {
    try {
        await sequelize.authenticate();
        console.log('--- DATENBANK-AUSZUG ---');

        // 1. Users
        const users = await User.findAll();
        console.log(`\n👤 USERS (${users.length}):`);
        users.forEach(u => console.log(`  - ${u.email} [${u.id}]`));

        // 2. Traps
        const traps = await Trap.findAll();
        console.log(`\n🪤 TRAPS (${traps.length}):`);
        traps.forEach(t => {
            console.log(`  - ${t.name} (IMEI: ${t.imei})`);
            console.log(`    Status: ${t.status}`);
            console.log(`    Owner: ${t.userId}`);
            console.log(`    Akku: ${t.batteryPercent || 0}% (${(t.batteryVoltage || 0) / 1000}V)`);
            console.log(`    ---`);
        });

        // 3. Push Subscriptions
        const subs = await PushSubscription.findAll();
        console.log(`\n🔔 PUSH SUBSCRIPTIONS (${subs.length}):`);
        subs.forEach(s => {
            console.log(`  - User: ${s.userId}`);
            console.log(`    Endpoint: ${s.endpoint.substring(0, 60)}...`);
            console.log(`    Keys: ${JSON.stringify(s.keys).substring(0, 40)}...`);
            console.log(`    ---`);
        });

        process.exit(0);
    } catch (err) {
        console.error('Fehler:', err);
        process.exit(1);
    }
}

dump();
