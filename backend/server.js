const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./src/config/database');

// Import Models
const Trap = require('./src/models/Trap');
const Reading = require('./src/models/Reading');

// Import routes
const trapRoutes = require('./src/routes/trapRoutes');
const readingRoutes = require('./src/routes/readingRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('TrapSensor Backend is running!');
});

// Routes
app.use('/api/traps', trapRoutes);
app.use('/api/readings', readingRoutes);

// Sync database and start server
async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('Database connection established.');

        // Sync models (force: false in production!)
        await sequelize.sync({ alter: true });
        console.log('Database models synced.');

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to start server:', error);
    }
}

startServer();
