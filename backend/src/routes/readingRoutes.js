const express = require('express');
const Reading = require('../models/Reading');
const Trap = require('../models/Trap');
const router = express.Router();

// Get readings for a specific trap
router.get('/:trapId', async (req, res) => {
    try {
        const readings = await Reading.findAll({
            where: { trapId: req.params.trapId },
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
        const { trapId, value, type } = req.body;

        // Check if trap exists
        const trap = await Trap.findByPk(trapId);
        if (!trap) return res.status(404).json({ error: 'Trap not found' });

        const newReading = await Reading.create({ trapId, value, type });

        // Update trap's last reading time
        trap.lastReading = new Date();
        await trap.save();

        res.status(201).json(newReading);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
