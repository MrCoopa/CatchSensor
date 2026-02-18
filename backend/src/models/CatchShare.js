const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CatchShare = sequelize.define('CatchShare', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    catchSensorId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'CatchSensors',
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
            fields: ['catchSensorId', 'userId']
        }
    ]
});

module.exports = CatchShare;

