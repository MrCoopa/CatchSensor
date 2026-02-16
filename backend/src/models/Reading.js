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
        allowNull: false, // e.g., 'light', 'vibration', 'temperature'
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    }
}, {
    timestamps: false,
});

Trap.hasMany(Reading, { foreignKey: 'trapId' });
Reading.belongsTo(Trap, { foreignKey: 'trapId' });

module.exports = Reading;
