const sequelize = require('./src/config/database');
const Trap = require('./src/models/Trap');
const Reading = require('./src/models/Reading');

async function seed() {
    try {
        await sequelize.sync({ force: true });
        console.log('Database cleared.');

        const traps = await Trap.bulkCreate([
            {
                name: 'Hühnermobil',
                location: 'Wildacker',
                status: 'active',
                batteryVoltage: 3850,
                batteryPercent: 75,
                signalStrength: 95,
                imei: '862000000000004',
                lastReading: new Date()
            }
        ]);

        console.log(`Seeded ${traps.length} real traps.`);

        for (const trap of traps) {
            await Reading.create({
                trapId: trap.id,
                value: trap.batteryVoltage,
                type: 'status',
                timestamp: new Date()
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
}

seed();
