const cron = require('node-cron');
const CatchSensor = require('../models/CatchSensor');
const User = require('../models/User');
const { Op } = require('sequelize');
const { sendUnifiedNotification } = require('./notificationService');

const setupWatchdog = (io) => {
    console.log('Watchdog: Service initialized (Interval: Every 15 minutes)');

    cron.schedule('*/15 * * * *', async () => {
        console.log('Watchdog: Checking for offline catches...');
        const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000);

        try {
            const offlineCatches = await CatchSensor.findAll({
                where: {
                    lastSeen: { [Op.lt]: eightHoursAgo },
                    status: { [Op.ne]: 'inactive' }
                }
            });

            for (const catchSensor of offlineCatches) {
                console.log(`Watchdog: CatchSensor ${catchSensor.alias || catchSensor.name || catchSensor.deviceId || catchSensor.imei} is OFFLINE`);

                await catchSensor.update({ status: 'inactive' });

                io.emit('catchSensorUpdate', catchSensor);

                if (catchSensor.userId) {
                    const user = await User.findByPk(catchSensor.userId);
                    if (user) {
                        await sendUnifiedNotification(user, catchSensor, 'CONNECTION_LOST');
                    }
                }
            }
        } catch (err) {
            console.error('Watchdog Error:', err);
        }
    });
};

module.exports = { setupWatchdog };


