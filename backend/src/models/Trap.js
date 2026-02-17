const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const TrapShare = require('./TrapShare');

const Trap = sequelize.define('Trap', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: { // Keeping 'name' for backward compatibility in codebase, but using 'alias' as the main field
        type: DataTypes.STRING,
        allowNull: false,
    },
    alias: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    location: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    type: {
        type: DataTypes.ENUM('NB-IOT', 'LORAWAN'),
        defaultValue: 'NB-IOT',
    },
    // NB-IoT Identifiers
    imei: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true,
    },
    // LoRaWAN Identifiers
    deviceId: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true,
    },
    // Unified Telemetry
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'triggered'),
        defaultValue: 'inactive',
    },
    batteryVoltage: {
        type: DataTypes.INTEGER, // Always in mV
        allowNull: true,
    },
    batteryPercent: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    rssi: {
        type: DataTypes.INTEGER, // Shared/NB RSSI
        allowNull: true,
    },
    lastSeen: {
        type: DataTypes.DATE,
        allowNull: true,
    },

    // Alerting & Throttling
    batteryThreshold: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    lastBatteryAlert: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    lastOfflineAlert: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: true,
    }
}, {
    tableName: 'TrapSensors',
    timestamps: true,
    indexes: [
        { unique: true, fields: ['imei'] },
        { unique: true, fields: ['deviceId'] },
        { fields: ['userId'] },
        { fields: ['type'] },
        { fields: ['status'] }
    ]
});

Trap.hasMany(TrapShare, { foreignKey: 'trapId' });
TrapShare.belongsTo(Trap, { foreignKey: 'trapId' });

module.exports = Trap;
