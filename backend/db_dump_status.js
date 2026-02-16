const User = require('./src/models/User');
const Trap = require('./src/models/Trap');
const Reading = require('./src/models/Reading');
const sequelize = require('./src/config/database');
require('dotenv').config();

async function debugDatabase() {
    try {
        await sequelize.authenticate();
        console.log('\n--- 📊 AKTUELLER DATENBANK-AUSZUG ---\n');

        // 1. Users
        const users = await User.findAll();
        console.log(`👥 BENUTZER (${users.length}):`);
        users.forEach(u => console.log(`  - ${u.email}`));

        // 2. Traps
        const traps = await Trap.findAll();
        console.log(`\n📡 FALLEN / MELDER (${traps.length}):`);
        traps.forEach(t => {
            console.log(`  [ID: ${t.id}] Name: ${t.name}`);
            console.log(`    IMEI: ${t.imei}`);
            console.log(`    Status: ${t.status || 'N/A'}`);
            console.log(`    Akku: ${t.batteryPercent || 0}% (${(t.batteryVoltage || 0) / 1000}V)`);
            console.log(`    Signal: ${t.rssi || 0} dBm`);
            console.log(`    Letzte Meldung: ${t.lastReading ? t.lastReading.toLocaleString('de-DE') : 'Nie'}`);
            console.log('    ---');
        });

        // 3. Readings
        const readingsCount = await Reading.count();
        const lastReadings = await Reading.findAll({
            limit: 5,
            order: [['timestamp', 'DESC']],
            include: [{ model: Trap, attributes: ['name'] }]
        });

        console.log(`\n📜 VERLAUF (Gesamt: ${readingsCount})`);
        console.log('  Letzte 5 Einträge:');
        lastReadings.forEach(r => {
            console.log(`  - [${r.timestamp.toLocaleString('de-DE')}] ${r.Trap?.name || 'Unbekannt'}: ${r.status?.toUpperCase() || r.type} | ${r.batteryPercent}% | -${r.rssi}dBm`);
        });

        console.log('\n--- ENDE AUSZUG ---');
        process.exit(0);
    } catch (err) {
        console.error('❌ Fehler beim Auslesen:', err);
        process.exit(1);
    }
}

debugDatabase();
