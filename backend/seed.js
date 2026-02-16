const sequelize = require('./src/config/database');
const Trap = require('./src/models/Trap');
const Reading = require('./src/models/Reading');

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB...');

        await sequelize.sync({ alter: true }); // Ensure tables exist

        // Clear existing data
        await Reading.destroy({ where: {} });
        await Trap.destroy({ where: {} });

        // Create Traps
        const trap1 = await Trap.create({
            name: 'North Barn Trap',
            location: 'Barn - North Entrance',
            status: 'active'
        });

        const trap2 = await Trap.create({
            name: 'Grain Silo A',
            location: 'Silo Area',
            status: 'triggered'
        });

        const trap3 = await Trap.create({
            name: 'South Gate 04',
            location: 'South Perimeter',
            status: 'inactive'
        });

        // Create initial readings
        await Reading.create({
            trapId: trap1.id,
            value: 0.12,
            type: 'vibration'
        });

        await Reading.create({
            trapId: trap2.id,
            value: 0.95,
            type: 'vibration'
        });

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
