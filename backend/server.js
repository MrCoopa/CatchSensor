const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '..', '.env') }); // Load centralized .env from root
const express = require('express');
const http = require('http');
const cors = require('cors');
const sequelize = require('./src/config/database');

// Import Models
const CatchSensor = require('./src/models/CatchSensor');
const Reading = require('./src/models/Reading');
const User = require('./src/models/User');
const PushSubscription = require('./src/models/PushSubscription');
const LoraMetadata = require('./src/models/LoraMetadata');


// Associations
User.hasMany(CatchSensor, { foreignKey: 'userId' });
CatchSensor.belongsTo(User, { foreignKey: 'userId' });

CatchSensor.hasMany(Reading, { foreignKey: 'catchSensorId' });
Reading.belongsTo(CatchSensor, { foreignKey: 'catchSensorId' });

User.hasMany(PushSubscription, { foreignKey: 'userId', onDelete: 'CASCADE' });
PushSubscription.belongsTo(User, { foreignKey: 'userId' });

// Import routes
const catchRoutes = require('./src/routes/catchRoutes');
const readingRoutes = require('./src/routes/readingRoutes');
const authRoutes = require('./src/routes/authRoutes');
const { protect } = require('./src/middleware/authMiddleware');
const { setupMQTT } = require('./src/services/mqttService');
const { setupWatchdog } = require('./src/services/watchdogService');

const app = express();
app.set('trust proxy', 1); // Trust the first proxy (Nginx Proxy Manager)
const https = require('https');
const fs = require('fs');



// For local development, HTTP is easier (avoids mobile SSL warnings)
// Since the PWA uses the "insecure origin" chrome flag, HTTP is fine.
const server = http.createServer(app);
console.log('Server running in HTTP mode 🌐');

const { Server } = require('socket.io');
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Global Error Handlers
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION:', reason);
});

// Embedded MQTT Broker (Aedes)
const { Aedes } = require('aedes');
const aedes = new Aedes();
const aedesServerFactory = require('aedes-server-factory');

// Aedes event logging (Commented out for production)
// aedes.on('client', (client) => {
//     console.log(`MQTT Broker: New Client detected: ${client ? client.id : 'unknown'}`);
// });
// aedes.on('subscribe', (subs, client) => {
//     console.log(`MQTT Broker: Client ${client ? client.id : 'unknown'} subscribed to ${subs.map(s => s.topic).join(', ')}`);
// });
// aedes.on('publish', (packet, client) => {
//     if (client) console.log(`MQTT Broker: Client ${client.id} published on ${packet.topic}`);
// });

const setupEmbeddedBroker = () => {
    const mqttServer = aedesServerFactory.createServer(aedes);
    mqttServer.on('error', (err) => console.error('MQTT Server Error:', err));
    mqttServer.listen(1884, '0.0.0.0', () => {
        console.log('✅ Embedded MQTT Broker running on 0.0.0.0:1884');
    });
    return aedes;
};

// Start Background Services
console.log('--- Services Initialization ---');
try {
    const brokerInstance = setupEmbeddedBroker(); // Start Broker
    setupMQTT(io, brokerInstance); // Pass aedes instance directly
    console.log('Services: MQTT setup initiated with Direct Ingestion.');
    setupWatchdog(io);
    console.log('Services: Watchdog setup initiated.');
} catch (err) {
    console.error('CRITICAL: Service initialization failed:', err);
}

// 1. CORS Configuration (MOST IMPORTANT - MUST BE AT THE TOP)
const allowedOrigins = [
    'http://localhost',
    'capacitor://localhost',
    'https://catchsensor.home'
];

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost') || origin.startsWith('capacitor://localhost')) {
            return callback(null, true);
        }
        callback(null, true); // Allow all during transition, but with explicit headers
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Request Logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl || req.url}`);
    next();
});

// Serve static files from public folder
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/icons', express.static(path.join(__dirname, 'public/icons')));

// Explicit MIME type for PWA manifest (crucial for Android)
app.get('/manifest.webmanifest', (req, res) => {
    res.setHeader('Content-Type', 'application/manifest+json');
    res.sendFile(path.join(__dirname, '../client/dist/manifest.webmanifest'));
});

// If a frontend build exists in 'client/dist', serve it
const clientBuildPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientBuildPath)) {
    console.log('Production: Serving frontend build from client/dist');
    app.use(express.static(clientBuildPath));
}

// Attach io and aedes to req for routes
app.use((req, res, next) => {
    req.io = io;
    req.aedes = aedes; // Attach aedes for direct publishing
    next();
});

// Middleware to handle SPA/PWA routing (serves index.html for non-API GET requests)
app.use((req, res, next) => {
    // Only handle GET requests that don't start with /api, aren't /status, and aren't root
    if (req.method !== 'GET' || req.url.startsWith('/api') || req.url === '/status' || req.url === '/') {
        return next();
    }

    const indexFile = path.join(__dirname, '../client/dist/index.html');
    if (fs.existsSync(indexFile)) {
        return res.sendFile(indexFile);
    }
    next();
});

// Dedicated route for the Backend/System Status Dashboard
app.get('/status', (req, res) => {
    // Generate the status page HTML (same as before)
    const indexFile = path.join(__dirname, '../client/dist/index.html');
    res.send(`
        <!DOCTYPE html>
        <html lang="de">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>CatchSensor | System Status</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Inter', sans-serif; }
                .glass { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(10px); }
            </style>
        </head>
        <body class="bg-[#f9fafb] text-slate-900 min-h-screen flex flex-col items-center p-6 sm:p-12">
            <div class="max-w-5xl w-full space-y-8">
                <header class="flex items-start justify-between mb-12">
                    <div class="flex items-start space-x-6">
                        <img 
                            src="/icons/fox-logo.png?v=${Date.now()}" 
                            alt="Logo" 
                            class="w-32 h-32 rounded-[2.5rem] shadow-2xl border-2 border-[#1b3a2e]/10 object-contain"
                        >
                        <div class="pt-3">
                            <h1 class="text-4xl font-black tracking-tight text-[#1b3a2e]">System Status</h1>
                            <p class="text-slate-400 font-medium text-sm">Live-Monitoring & Health-Check</p>
                        </div>
                    </div>
                    <div class="hidden sm:block pt-3">
                        <span class="bg-green-100 text-green-700 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm">Server Online</span>
                    </div>
                </header>

                <div id="status-container" class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="animate-pulse bg-white p-8 rounded-3xl shadow-sm border border-slate-100 h-40"></div>
                    <div class="animate-pulse bg-white p-8 rounded-3xl shadow-sm border border-slate-100 h-40"></div>
                    <div class="animate-pulse bg-white p-8 rounded-3xl shadow-sm border border-slate-100 h-40"></div>
                </div>

                <div class="bg-[#1b3a2e] text-white rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                    <div class="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div class="text-center md:text-left">
                            <h2 class="text-4xl font-black mb-2" id="total-users">0</h2>
                            <p class="text-white/60 font-medium uppercase tracking-widest text-xs">Benutzer</p>
                        </div>
                        <div class="w-px h-12 bg-white/10 hidden md:block"></div>
                        <div class="text-center md:text-left">
                            <h2 class="text-4xl font-black mb-2" id="total-catches">0</h2>
                            <p class="text-white/60 font-medium uppercase tracking-widest text-xs">Registrierte Melder</p>
                        </div>
                        <div class="w-px h-12 bg-white/10 hidden md:block"></div>
                        <div class="text-center md:text-left">
                            <h2 class="text-4xl font-black mb-2" id="total-readings">0</h2>
                            <p class="text-white/60 font-medium uppercase tracking-widest text-xs">Messwerte Gesamt</p>
                        </div>
                        <div class="w-px h-12 bg-white/10 hidden md:block"></div>
                        <div class="text-center md:text-left">
                            <h2 class="text-lg font-bold mb-1" id="server-uptime">0m</h2>
                            <p class="text-white/60 font-medium uppercase tracking-widest text-[10px]">Server Uptime</p>
                        </div>
                    </div>
                    <div class="absolute -right-20 -bottom-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                </div>

                <footer class="text-center text-slate-400 text-sm font-medium pt-8">
                    Letztes Update: <span id="last-update" class="text-slate-900 font-bold">-</span>
                </footer>
            </div>

            <script>
                async function updateStatus() {
                    try {
                        const res = await fetch('/api/status');
                        const data = await res.json();
                        
                        document.getElementById('status-container').innerHTML = \`
                            <div class="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 transform transition-all hover:scale-[1.02]">
                                <div class="flex items-center justify-between mb-4">
                                    <div class="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                    </div>
                                    <span class="bg-green-100 text-green-700 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest">Aktiv</span>
                                </div>
                                <h3 class="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">Datenbank</h3>
                                <p class="text-xl font-black text-slate-900">Verbunden</p>
                            </div>

                            <div class="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 transform transition-all hover:scale-[1.02]">
                                <div class="flex items-center justify-between mb-4">
                                    <div class="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                                    </div>
                                    <span class="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest">Streaming</span>
                                </div>
                                <h3 class="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">MQTT Broker</h3>
                                <p class="text-xl font-black text-slate-900">Aktiv</p>
                            </div>

                            <div class="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 transform transition-all hover:scale-[1.02]">
                                <div class="flex items-center justify-between mb-4">
                                    <div class="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 6v6l4 2"/></svg>
                                    </div>
                                    <span class="bg-orange-100 text-orange-700 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest">Interval</span>
                                </div>
                                <h3 class="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">Watchdog</h3>
                                <p class="text-xl font-black text-slate-900">15 Min</p>
                            </div>
                        \`;

                        document.getElementById('total-users').innerText = data.stats.totalUsers;
                        document.getElementById('total-catches').innerText = data.stats.totalCatches;
                        document.getElementById('total-readings').innerText = data.stats.totalReadings;
                        document.getElementById('server-uptime').innerText = Math.floor(data.server.uptime / 60) + 'm ' + Math.floor(data.server.uptime % 60) + 's';
                        document.getElementById('last-update').innerText = new Date(data.timestamp).toLocaleTimeString('de-DE');

                    } catch (err) {
                        console.error('Update failed:', err);
                    }
                }

                updateStatus();
                setInterval(updateStatus, 5000);
            </script>
        </body>
        </html>
    `);
});

app.get('/api/status', async (req, res) => {
    try {
        const userCount = await User.count();
        const catchCount = await CatchSensor.count();
        const readingCount = await Reading.count();
        res.json({
            status: 'online',
            timestamp: new Date(),
            server: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
            },
            services: {
                database: 'connected',
                mqtt: 'active',
                watchdog: 'active'
            },
            stats: {
                totalUsers: userCount,
                totalCatches: catchCount,
                totalReadings: readingCount
            },
            visualDashboard: process.env.APP_BASE_URL || 'http://localhost:5000/'
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});


// Routes
app.use('/api/auth', authRoutes);
// The /simulate route is inside catchRoutes, but we want it public
app.use('/api/catches', (req, res, next) => {
    console.log(`Routing /api/catches: path=${req.path} method=${req.method}`);
    if (req.path === '/simulate') {
        console.log('Routing: Skipping protection for /simulate');
        return next();
    }
    console.log('Routing: Applying protection');
    return protect(req, res, next);
}, catchRoutes);
app.use('/api/readings', protect, readingRoutes);
app.use('/api/notifications', (req, res, next) => {
    console.log(`Routing /api/notifications: path=${req.path} method=${req.method}`);
    next();
}, require('./src/routes/notificationRoutes'));

// Socket.io connection handling
const jwt = require('jsonwebtoken');

io.use((socket, next) => {
    if (socket.handshake.auth && socket.handshake.auth.token) {
        jwt.verify(socket.handshake.auth.token, process.env.JWT_SECRET || 'fallback_secret', (err, decoded) => {
            if (err) return next(new Error('Authentication error'));
            socket.userId = decoded.id;
            next();
        });
    } else {
        next(new Error('Authentication error'));
    }
});

io.on('connection', (socket) => {
    console.log(`Socket: Client connected (${socket.id}) User: ${socket.userId}`);

    // Join user-specific room
    if (socket.userId) {
        const roomName = `user_${socket.userId}`;
        socket.join(roomName);
        console.log(`Socket: User [${socket.userId}] joined room [${roomName}]`);
    }

    socket.on('disconnect', (reason) => {
        console.log(`Socket: Client disconnected (${socket.id}). Reason: ${reason}`);
    });
});


// Sync database and start server (with retry logic for Docker cold-starts)
async function startServer() {
    let authenticated = false;
    let attempts = 0;
    const maxAttempts = 10;
    const delay = 3000; // 3 seconds

    while (!authenticated && attempts < maxAttempts) {
        try {
            attempts++;
            await sequelize.authenticate();
            authenticated = true;
            console.log('Database connection established.');
        } catch (error) {
            console.warn(`Database connection attempt ${attempts}/${maxAttempts} failed. Retrying in ${delay / 1000}s...`);
            if (attempts >= maxAttempts) {
                console.error('CRITICAL: Max database connection attempts reached. Shutting down.');
                process.exit(1);
            }
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    try {
        await sequelize.sync({ alter: true });
        console.log('Database models synced.');

        const PORT = process.env.PORT || 5000;
        server.listen(PORT, '0.0.0.0', () => {
            console.log('--- Server Status ---');
            console.log(`Server: Running on port ${PORT}`);
            console.log(`Mode: ${process.env.NODE_ENV || 'development'}`);
            console.log(`API URL: http://0.0.0.0:${PORT}`);
            console.log('-----------------------');
        });
    } catch (error) {
        console.error('CRITICAL: Unable to sync database or start server:', error);
        process.exit(1);
    }
}

startServer();

