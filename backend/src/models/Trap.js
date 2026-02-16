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
        allowNull: true,
    },
    batteryPercent: {
        type: DataTypes.INTEGER, // 0-100
        allowNull: true,
    },
    signalStrength: {
        type: DataTypes.INTEGER, // 0-4 bars
        allowNull: true,
    },
    rssi: {
        type: DataTypes.INTEGER, // Absolute value (e.g., 95 for -95dBm)
        allowNull: true,
    },
    batteryThreshold: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
    tableName: 'TrapSensors',
    timestamps: true,
});

module.exports = Trap;
