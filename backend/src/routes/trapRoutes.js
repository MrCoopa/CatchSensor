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

        // Basic validation
        if (!name || !imei) {
            return res.status(400).json({ error: 'Name und IMEI sind erforderlich' });
        }

        const newTrap = await Trap.create({
            name,
            location,
            imei,
            userId: req.user.id
        });
        res.status(201).json(newTrap);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'Diese IMEI ist bereits registriert' });
        }
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

// Delete a trap
router.delete('/:id', async (req, res) => {
    try {
        console.log(`Attempting to delete trap ${req.params.id} for user ${req.user.id}`);
        const trap = await Trap.findOne({ where: { id: req.params.id, userId: req.user.id } });

        if (!trap) {
            console.log(`Trap ${req.params.id} not found for user ${req.user.id}`);
            return res.status(404).json({ error: 'Trap not found or access denied' });
        }

        await trap.destroy();
        console.log(`Trap ${req.params.id} deleted successfully`);
        res.json({ message: 'Trap deleted successfully' });
    } catch (error) {
        console.error('Error deleting trap:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
