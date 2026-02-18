const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PushSubscription = sequelize.define('PushSubscription', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    endpoint: {
        type: DataTypes.TEXT, // Endpoints can be long
        allowNull: false,
        unique: true
    },
    keys: {
        type: DataTypes.JSON, // Stores p256dh and auth
        allowNull: false
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false
    }
});

module.exports = PushSubscription;

