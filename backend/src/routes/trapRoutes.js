const express = require('express');
const Trap = require('../models/Trap');
const router = express.Router();

// Get all traps
router.get('/', async (req, res) => {
    try {
        const traps = await Trap.findAll();
        res.json(traps);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new trap
router.post('/', async (req, res) => {
    try {
        const { name, location } = req.body;
        const newTrap = await Trap.create({ name, location });
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
