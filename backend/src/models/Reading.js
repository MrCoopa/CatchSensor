const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Trap = require('./Trap');

const Reading = sequelize.define('Reading', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    trapId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Trap,
            key: 'id',
        },
    },
    value: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false, // e.g., 'vibration', 'status'
    },
    status: {
        type: DataTypes.STRING, // 'active', 'triggered'
        allowNull: true,
    },
    batteryPercent: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    rssi: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    }
}, {
    timestamps: false,
    indexes: [
        {
            fields: ['trapId']
        },
        {
            fields: ['timestamp']
        }
    ]
});

Trap.hasMany(Reading, { foreignKey: 'trapId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Reading.belongsTo(Trap, { foreignKey: 'trapId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

module.exports = Reading;
