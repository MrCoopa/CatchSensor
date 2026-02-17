const Trap = require('./src/models/Trap');
const sequelize = require('./src/config/database');

async function debugTrap() {
    try {
        const traps = await Trap.findAll();
        console.log('--- Current Traps ---');
        traps.forEach(t => {
            console.log(JSON.stringify(t, null, 2));
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugTrap();
