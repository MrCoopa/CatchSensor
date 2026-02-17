const express = require('express');
const Reading = require('../models/Reading');
const Trap = require('../models/Trap');
const router = express.Router();

const TrapShare = require('../models/TrapShare');

// Get readings for a specific trap
router.get('/:trapId', async (req, res) => {
    try {
        const trapId = req.params.trapId;
        const userId = req.user.id;

        // Check if user is owner
        const trap = await Trap.findOne({ where: { id: trapId, userId: userId } });

        if (!trap) {
            // Check if user has shared access
            const share = await TrapShare.findOne({ where: { trapId: trapId, userId: userId } });
            if (!share) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }

        const readings = await Reading.findAll({
            where: { trapId: trapId },
            order: [['timestamp', 'DESC']],
            limit: 50
        });
        res.json(readings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Submit a new reading
router.post('/', async (req, res) => {
    try {
        const { trapId, value, type, batteryVoltage, batteryPercent, signalStrength, status } = req.body;

        // Check if trap exists
        const trap = await Trap.findByPk(trapId);
        if (!trap) return res.status(404).json({ error: 'Trap not found' });

        const newReading = await Reading.create({ trapId, value, type });

        // Update trap metrics
        const updates = { lastReading: new Date() };
        if (batteryVoltage !== undefined) updates.batteryVoltage = batteryVoltage;
        if (batteryPercent !== undefined) updates.batteryPercent = batteryPercent;
        if (signalStrength !== undefined) updates.signalStrength = signalStrength;
        if (status !== undefined) updates.status = status;

        await trap.update(updates);

        // Broadcast update via socket.io
        const updatedTrap = await Trap.findByPk(trapId);
        req.io.emit('trapUpdate', updatedTrap);

        res.status(201).json(newReading);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
