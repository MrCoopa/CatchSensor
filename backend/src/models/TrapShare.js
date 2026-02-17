const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TrapShare = sequelize.define('TrapShare', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    trapId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'TrapSensors',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    permission: {
        type: DataTypes.ENUM('read', 'write', 'admin'),
        defaultValue: 'read',
    }
}, {
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['trapId', 'userId']
        }
    ]
});

module.exports = TrapShare;
