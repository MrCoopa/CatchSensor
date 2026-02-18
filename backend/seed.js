const sequelize = require('./src/config/database');
const CatchSensor = require('./src/models/CatchSensor');
const Reading = require('./src/models/Reading');

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { raw: true });
        await sequelize.sync({ force: true });
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { raw: true });
        console.log('Database cleared.');

        const CatchSensors = await CatchSensor.bulkCreate([
            {
                name: 'Hühnermobil',
                location: 'Wildacker',
                status: 'active',
                batteryVoltage: 3850,
                batteryPercent: 75,
                rssi: 95,
                imei: '862000000000004',
                lastSeen: new Date()
            }
        ]);

        console.log(`Seeded ${CatchSensors.length} real CatchSensors.`);

        for (const catchSensor of CatchSensors) {
            await Reading.create({
                catchSensorId: catchSensor.id,
                value: catchSensor.batteryVoltage,
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

