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
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'triggered'),
        defaultValue: 'inactive',
    },
    lastReading: {
        type: DataTypes.DATE,
        allowNull: true,
    }
}, {
    timestamps: true,
});

module.exports = Trap;
