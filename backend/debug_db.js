const Trap = require('./src/models/Trap');
const User = require('./src/models/User');
const sequelize = require('./src/config/database');

async function debugTraps() {
    try {
        await sequelize.authenticate();
        const traps = await Trap.findAll();
        console.log('--- Traps in Database ---');
        traps.forEach(t => {
            console.log(`ID: ${t.id}, Name: ${t.name}, UserID: ${t.userId}`);
        });
        const users = await User.findAll();
        console.log('--- Users in Database ---');
        users.forEach(u => {
            console.log(`ID: ${u.id}, Email: ${u.email}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugTraps();
