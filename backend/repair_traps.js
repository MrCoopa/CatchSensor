const Trap = require('./src/models/Trap');
const sequelize = require('./src/config/database');
const { Op } = require('sequelize');

async function repairTraps() {
    try {
        const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000);

        // Find traps that are 'inactive' but have been seen recently
        const wronglyOffline = await Trap.findAll({
            where: {
                status: 'inactive',
                lastSeen: { [Op.gt]: eightHoursAgo }
            }
        });

        console.log(`Found ${wronglyOffline.length} traps to resurrect.`);

        for (const trap of wronglyOffline) {
            console.log(`Resurrecting trap: ${trap.name} (${trap.id})`);
            await trap.update({ status: 'active' });
        }

        console.log('Repair complete.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

repairTraps();
