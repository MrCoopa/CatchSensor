const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./src/config/database');

// Import Models
const Trap = require('./src/models/Trap');
const Reading = require('./src/models/Reading');

// Import routes
const trapRoutes = require('./src/routes/trapRoutes');
const readingRoutes = require('./src/routes/readingRoutes');
const authRoutes = require('./src/routes/authRoutes');
const { protect } = require('./src/middleware/authMiddleware');
const { setupMQTT } = require('./src/services/mqttService');
const { setupWatchdog } = require('./src/services/watchdogService');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

// Start Background Services
setupMQTT(io);
setupWatchdog(io);

app.use(cors({
    origin: '*', // Allow all origins for easier network access during development
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Attach io to req for routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

app.get('/', (req, res) => {
    res.send('TrapSensor Backend is running!');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/traps', protect, trapRoutes);
app.use('/api/readings', protect, readingRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Sync database and start server
async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('Database connection established.');

        await sequelize.sync({ alter: true });
        console.log('Database models synced.');

        const PORT = process.env.PORT || 5000;
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to start server:', error);
    }
}

startServer();
