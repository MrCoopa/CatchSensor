const cron = require('node-cron');
const Trap = require('../models/Trap');
const { Op } = require('sequelize');

const setupWatchdog = (io) => {
    // Run every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
        console.log('Watchdog: Checking for offline traps...');

        const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000);

        try {
            const offlineTraps = await Trap.findAll({
                where: {
                    lastReading: {
                        [Op.lt]: eightHoursAgo
                    },
                    status: {
                        [Op.ne]: 'inactive' // Only check active/triggered ones
                    }
                }
            });

            for (const trap of offlineTraps) {
                if (trap.status !== 'inactive') {
                    await trap.update({ status: 'inactive' }); // Set to Offline (Grey)
                    io.emit('trap_update', trap);
                    console.log(`Watchdog: Trap ${trap.name} set to OFFLINE`);

                    // TODO: Trigger "Trap is offline" Push Notification
                }
            }
        } catch (err) {
            console.error('Watchdog Error:', err);
        }
    });
};

module.exports = { setupWatchdog };
