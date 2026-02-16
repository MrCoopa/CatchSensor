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
console.log('--- Services Initialization ---');
try {
    setupMQTT(io);
    console.log('Services: MQTT setup initiated.');
    setupWatchdog(io);
    console.log('Services: Watchdog setup initiated.');
} catch (err) {
    console.error('CRITICAL: Service initialization failed:', err);
}

app.use(cors({
    origin: '*', // Allow all origins for easier network access during development
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
const path = require('path');
app.use('/icons', express.static(path.join(__dirname, '../client/public/icons')));

// Attach io to req for routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

app.get('/api/status', async (req, res) => {
    try {
        const trapCount = await Trap.count();
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
                totalTraps: trapCount,
                totalReadings: readingCount
            },
            visualDashboard: 'http://192.168.2.217:5000/status'
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.get('/status', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="de">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>TrapSensor | System Status</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Inter', sans-serif; }
                .glass { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(10px); }
            </style>
        </head>
        <body class="bg-[#f9fafb] text-slate-900 min-h-screen flex flex-col items-center p-6 sm:p-12">
            <div class="max-w-4xl w-full space-y-8">
                <header class="flex items-start justify-between mb-12">
                    <div class="flex items-start space-x-6">
                        <img 
                            src="/icons/fox-logo.png" 
                            alt="Logo" 
                            class="w-20 h-20 rounded-2xl shadow-xl border-2 border-[#1b3a2e]/10 object-contain"
                        >
                        <div class="pt-2">
                            <h1 class="text-4xl font-black tracking-tight text-[#1b3a2e]">System Status</h1>
                            <p class="text-slate-400 font-medium text-sm">Live-Monitoring & Health-Check</p>
                        </div>
                    </div>
                    <div class="hidden sm:block pt-2">
                        <span class="bg-green-100 text-green-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">System Online</span>
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
                            <h2 class="text-4xl font-black mb-2" id="total-traps">0</h2>
                            <p class="text-white/60 font-medium uppercase tracking-widest text-xs">Registrierte Fallen</p>
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

                        document.getElementById('total-traps').innerText = data.stats.totalTraps;
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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/traps', protect, trapRoutes);
app.use('/api/readings', protect, readingRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`Socket: Client connected (${socket.id}) from ${socket.handshake.address}`);
    socket.on('disconnect', (reason) => {
        console.log(`Socket: Client disconnected (${socket.id}). Reason: ${reason}`);
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
            console.log('--- Server Status ---');
            console.log(`Server: Running on port ${PORT}`);
            console.log(`Mode: ${process.env.NODE_ENV || 'development'}`);
            console.log(`API URL: http://localhost:${PORT}`);
            console.log('-----------------------');
        });
    } catch (error) {
        console.error('CRITICAL: Unable to start server:', error);
    }
}

startServer();
