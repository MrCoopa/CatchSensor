const express = require('express');
const Trap = require('../models/Trap');
const router = express.Router();

// Get all traps for the logged-in user
router.get('/', async (req, res) => {
    try {
        const traps = await Trap.findAll({ where: { userId: req.user.id } });
        res.json(traps);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new trap assigned to the logged-in user
router.post('/', async (req, res) => {
    try {
        const { name, location, imei } = req.body;
        const newTrap = await Trap.create({
            name,
            location,
            imei,
            userId: req.user.id
        });
        res.status(201).json(newTrap);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update trap status
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const trap = await Trap.findByPk(req.params.id);
        if (!trap) return res.status(404).json({ error: 'Trap not found' });

        trap.status = status;
        await trap.save();
        res.json(trap);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
