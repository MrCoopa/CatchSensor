const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'mariadb',
    port: 3306,
    logging: console.log,
    dialectOptions: {
        connectTimeout: 60000
    }
});

module.exports = sequelize;

