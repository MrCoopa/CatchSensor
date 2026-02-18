
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        dialect: 'mariadb'
    }
);

async function addColumns() {
    const queryInterface = sequelize.getQueryInterface();
    try {
        await queryInterface.addColumn('Users', 'pushEnabled', {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false
        });
        console.log('Added pushEnabled column');
    } catch (e) {
        console.log('pushEnabled column might already exist');
    }

    try {
        await queryInterface.addColumn('Users', 'batteryThreshold', {
            type: DataTypes.INTEGER,
            defaultValue: 20,
            allowNull: false
        });
        console.log('Added batteryThreshold column');
    } catch (e) {
        console.log('batteryThreshold column might already exist');
    }

    await sequelize.close();
}

addColumns();

