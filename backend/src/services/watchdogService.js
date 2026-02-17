const cron = require('node-cron');
const Trap = require('../models/Trap');
const User = require('../models/User');
const { Op } = require('sequelize');
const { sendUnifiedNotification } = require('./notificationService');

const setupWatchdog = (io) => {
    console.log('Watchdog: Service initialized (Interval: Every 15 minutes)');

    cron.schedule('*/15 * * * *', async () => {
        console.log('Watchdog: Checking for offline traps...');
        const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000);

        try {
            // Find traps that haven't responded in 8h and are not already inactive
            const offlineTraps = await Trap.findAll({
                where: {
                    lastSeen: { [Op.lt]: eightHoursAgo },
                    status: { [Op.ne]: 'inactive' }
                }
            });

            for (const trap of offlineTraps) {
                console.log(`Watchdog: Trap ${trap.alias || trap.name || trap.deviceId || trap.imei} is OFFLINE`);

                await trap.update({ status: 'inactive' });

                io.emit('trapUpdate', trap);

                if (trap.userId) {
                    const user = await User.findByPk(trap.userId);
                    if (user) {
                        await sendUnifiedNotification(user, trap, 'CONNECTION_LOST');
                    }
                }
            }
        } catch (err) {
            console.error('Watchdog Error:', err);
        }
    });
};

module.exports = { setupWatchdog };

