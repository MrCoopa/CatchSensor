const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Trap = require('./Trap');

const LoraMetadata = sequelize.define('LoraMetadata', {
    trapId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
            model: Trap,
            key: 'id',
        },
    },
    loraRssi: { // LoRa specific RSSI
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    snr: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    spreadingFactor: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    gatewayId: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    gatewayCount: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    fCnt: {
        type: DataTypes.INTEGER,
        allowNull: true,
    }
}, {
    tableName: 'lorawan_metadata',
    timestamps: true
});


Trap.hasOne(LoraMetadata, { foreignKey: 'trapId', as: 'lorawanTrapSensor', onDelete: 'CASCADE' });
LoraMetadata.belongsTo(Trap, { foreignKey: 'trapId' });


module.exports = LoraMetadata;
