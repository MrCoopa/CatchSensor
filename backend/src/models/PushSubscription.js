const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PushSubscription = sequelize.define('PushSubscription', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    endpoint: {
        type: DataTypes.STRING(512), // FCM tokens fit in 512 chars; STRING allows clean UNIQUE index
        allowNull: false,
        unique: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false
    }
});

module.exports = PushSubscription;

