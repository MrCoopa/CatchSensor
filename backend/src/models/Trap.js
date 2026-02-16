const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Trap = sequelize.define('Trap', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    location: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    imei: {
        type: DataTypes.STRING,
        unique: true,
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'triggered'),
        defaultValue: 'inactive',
    },
    batteryVoltage: {
        type: DataTypes.INTEGER, // in mV (e.g., 3700)
        defaultValue: 3800,
    },
    batteryPercent: {
        type: DataTypes.INTEGER, // 0-100
        defaultValue: 100,
    },
    signalStrength: {
        type: DataTypes.INTEGER, // 0-4 bars
        defaultValue: 4,
    },
    batteryThreshold: {
        type: DataTypes.INTEGER,
        defaultValue: 3400, // Defaul-Warnung bei 3.4V
    },
    lastBatteryAlert: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    lastReading: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: true, // Allow null for existing traps or MQTT ingest
    }
}, {
    timestamps: true,
});

module.exports = Trap;
