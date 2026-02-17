const express = require('express');
const Trap = require('../models/Trap');
const router = express.Router();

// Get all traps for the logged-in user (owned + shared)
router.get('/', async (req, res) => {
    try {
        const { Op } = require('sequelize');
        const TrapShare = require('../models/TrapShare');

        // Find IDs of traps shared with this user
        const sharedShares = await TrapShare.findAll({
            where: { userId: req.user.id },
            attributes: ['trapId']
        });
        const sharedTrapIds = sharedShares.map(s => s.trapId);

        const traps = await Trap.findAll({
            where: {
                [Op.or]: [
                    { userId: req.user.id }, // Owned traps
                    { id: { [Op.in]: sharedTrapIds } } // Shared traps
                ]
            }
        });
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

// Share a trap with another user by email
router.post('/:id/share', async (req, res) => {
    try {
        const { email } = req.body;
        const trapId = req.params.id;
        const User = require('../models/User');
        const TrapShare = require('../models/TrapShare');

        if (!email) return res.status(400).json({ error: 'E-Mail ist erforderlich' });

        // 1. Verify ownership
        const trap = await Trap.findOne({ where: { id: trapId, userId: req.user.id } });
        if (!trap) return res.status(404).json({ error: 'Falle nicht gefunden oder kein Zugriff (Nur Besitzer können teilen)' });

        // 2. Find target user
        const targetUser = await User.findOne({ where: { email } });
        if (!targetUser) return res.status(404).json({ error: 'Benutzer mit dieser E-Mail nicht gefunden' });

        if (targetUser.id === req.user.id) return res.status(400).json({ error: 'Sie können die Falle nicht mit sich selbst teilen' });

        // 3. Create Share
        await TrapShare.create({
            trapId,
            userId: targetUser.id,
            permission: 'read' // Default to read-only for now
        });

        res.status(201).json({ message: `Falle erfolgreich mit ${email} geteilt` });

    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'Falle ist bereits mit diesem Benutzer geteilt' });
        }
        res.status(500).json({ error: error.message });
    }
});

// Remove a share (Unshare)
router.delete('/:id/share/:userId', async (req, res) => {
    try {
        const trapId = req.params.id;
        const targetUserId = req.params.userId;
        const TrapShare = require('../models/TrapShare');

        // 1. Verify ownership of the trap
        const trap = await Trap.findOne({ where: { id: trapId, userId: req.user.id } });
        if (!trap) return res.status(404).json({ error: 'Falle nicht gefunden oder kein Zugriff' });

        // 2. Remove Share
        const deleted = await TrapShare.destroy({
            where: {
                trapId,
                userId: targetUserId
            }
        });

        if (deleted) {
            res.json({ message: 'Freigabe aufgehoben' });
        } else {
            res.status(404).json({ error: 'Freigabe nicht gefunden' });
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get users who have access to this trap
router.get('/:id/shares', async (req, res) => {
    try {
        const trapId = req.params.id;
        const User = require('../models/User');
        const TrapShare = require('../models/TrapShare');

        // Verify ownership
        const trap = await Trap.findOne({ where: { id: trapId, userId: req.user.id } });
        if (!trap) return res.status(403).json({ error: 'Nur der Besitzer kann Freigaben sehen' });

        const shares = await TrapShare.findAll({
            where: { trapId },
            include: [{ model: User, attributes: ['id', 'email'] }]
        });

        res.json(shares.map(s => ({
            userId: s.User.id,
            email: s.User.email,
            permission: s.permission,
            createdAt: s.createdAt
        })));

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const mqtt = require('mqtt');

// Simulate MQTT data for a trap
// This is PUBLIC for the simulator tool to work without token hurdles
router.post('/simulate', async (req, res) => {
    try {
        const { imei, status, batteryVoltage, rssi, jitter = true } = req.body;

        if (!imei) return res.status(400).json({ error: 'IMEI ist erforderlich' });

        // DIRECT PUBLISH to internal Aedes instance
        // This is 100% reliable as it bypasses the network stack
        const statusCode = status === 'triggered' ? 0x00 : 0x01;

        let voltage = parseInt(batteryVoltage) || 4200;
        let rssiVal = Math.abs(parseInt(rssi)) || 60;

        if (jitter) {
            voltage += Math.floor(Math.random() * 21) - 10;
            rssiVal += Math.floor(Math.random() * 5) - 2;
        }

        const payload = Buffer.alloc(4);
        payload.writeUInt8(statusCode, 0);
        payload.writeUInt16BE(voltage, 1);
        payload.writeUInt8(rssiVal, 3);

        const topic = `traps/${imei}/data`;

        req.aedes.publish({
            topic,
            payload,
            qos: 0,
            retain: false
        }, (err) => {
            if (err) {
                console.error('Direct Simulate Error:', err);
                return res.status(500).json({ error: 'Simulation fehlgeschlagen' });
            }
            res.json({
                message: 'Simulation (Direct) gesendet',
                topic,
                data: { status, voltage, rssi: -rssiVal },
                payload: payload.toString('hex')
            });
        });

    } catch (error) {
        console.error('Simulate Route Error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
