const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');
const CatchShare = require('./CatchShare');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    password: {

        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.ENUM('user', 'admin'),
        defaultValue: 'user',
    },
    pushoverAppKey: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    pushoverUserKey: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    pushEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    batteryThreshold: {
        type: DataTypes.INTEGER,
        defaultValue: 20,
    },
    batteryAlertInterval: {
        type: DataTypes.INTEGER,
        defaultValue: 24, // hours
    },
    offlineAlertInterval: {
        type: DataTypes.INTEGER,
        defaultValue: 24, // hours
    },
    catchAlertInterval: {
        type: DataTypes.INTEGER,
        defaultValue: 1, // hours
    }
}, {

    hooks: {
        beforeSave: async (user) => {
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },
    },
});

User.prototype.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

User.hasMany(CatchShare, { foreignKey: 'userId' });
CatchShare.belongsTo(User, { foreignKey: 'userId' });

module.exports = User;

