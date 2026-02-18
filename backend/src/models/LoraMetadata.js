const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const CatchSensor = require('./CatchSensor');

const LoraMetadata = sequelize.define('LoraMetadata', {
    catchSensorId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
            model: CatchSensor,
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


CatchSensor.hasOne(LoraMetadata, { foreignKey: 'catchSensorId', as: 'lorawanCatchSensor', onDelete: 'CASCADE' });
LoraMetadata.belongsTo(CatchSensor, { foreignKey: 'catchSensorId' });


module.exports = LoraMetadata;

