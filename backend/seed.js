const sequelize = require('./src/config/database');
const Trap = require('./src/models/Trap');
const Reading = require('./src/models/Reading');

async function seed() {
    try {
        await sequelize.sync({ force: true });
        console.log('Database cleared.');

        const Catchs = await Trap.bulkCreate([
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

        console.log(`Seeded ${Catchs.length} real Catchs.`);

        for (const trap of Catchs) {
            await Reading.create({
                CatchId: trap.id,
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

