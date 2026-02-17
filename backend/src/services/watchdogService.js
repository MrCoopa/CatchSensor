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
            // Find traps that haven't responded in 8h
            const offlineTraps = await Trap.findAll({
                where: {
                    [Op.or]: [
                        { [Op.and]: [{ type: 'NB-IOT' }, { lastReading: { [Op.lt]: eightHoursAgo } }] },
                        { [Op.and]: [{ type: 'LORAWAN' }, { lastSeen: { [Op.lt]: eightHoursAgo } }] }
                    ],
                    // Only check traps that aren't already marked inactive/offline in their respective fields
                    [Op.or]: [
                        { [Op.and]: [{ type: 'NB-IOT' }, { status: { [Op.ne]: 'inactive' } }] },
                        { [Op.and]: [{ type: 'LORAWAN' }, { lastStatus: { [Op.ne]: 'OFFLINE' } }] }
                    ]
                }
            });

            for (const trap of offlineTraps) {
                console.log(`Watchdog: Trap ${trap.alias || trap.imei} is OFFLINE`);

                if (trap.type === 'NB-IOT') {
                    await trap.update({ status: 'inactive' });
                } else {
                    await trap.update({ lastStatus: 'OFFLINE' });
                }

                io.emit('trap_update', trap);

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

