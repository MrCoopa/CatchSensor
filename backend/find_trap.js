
const { Sequelize } = require('sequelize');
const Trap = require('./src/models/Trap');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        dialect: 'mariadb',
        logging: false
    }
);

async function findTrap() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        const traps = await Trap.findAll();
        const match = traps.find(t =>
            (t.name && t.name.includes('Brückenhof')) ||
            (t.alias && t.alias.includes('Brückenhof'))
        );

        if (match) {
            console.log(JSON.stringify(match, null, 2));
        } else {
            console.log('No trap found with name Brückenhof');
            // List all for context
            console.log('Available traps:', traps.map(t => `${t.name} (${t.alias}) - ${t.imei || t.deviceId}`).join(', '));
        }

    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
}

findTrap();
