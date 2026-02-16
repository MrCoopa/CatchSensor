const sequelize = require('./src/config/database');
const Trap = require('./src/models/Trap');
const Reading = require('./src/models/Reading');
const PushSubscription = require('./src/models/PushSubscription');
require('dotenv').config();

async function clean() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');

        // Delete in order of constraints
        console.log('Cleaning Readings...');
        await Reading.destroy({ where: {}, truncate: false });

        console.log('Cleaning Traps...');
        await Trap.destroy({ where: {}, truncate: false });

        console.log('Cleaning PushSubscriptions...');
        await PushSubscription.destroy({ where: {}, truncate: false });

        console.log('✅ All test data removed from database.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Cleanup failed:', err);
        process.exit(1);
    }
}

clean();
