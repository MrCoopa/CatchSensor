require('dotenv').config();
const fs = require('fs');
const https = require('https');
const express = require('express');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

// Initialize Express
const app = express();
app.use(cors());
app.use(express.json());

// Load SSL Certificates
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || './ssl/server.key';
const SSL_CERT_PATH = process.env.SSL_CERT_PATH || './ssl/server.cert';

let server;
try {
    const privateKey = fs.readFileSync(SSL_KEY_PATH, 'utf8');
    const certificate = fs.readFileSync(SSL_CERT_PATH, 'utf8');
    const credentials = { key: privateKey, cert: certificate };

    server = https.createServer(credentials, app);
    console.log('Safe HTTPS Server initialized.');
} catch (error) {
    console.error('Failed to load SSL certificates. Ensure they are mounted at /app/ssl.');
    console.error(error);
    process.exit(1);
}

// Initialize Socket.Io
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for PWA local access
        methods: ["GET", "POST"]
    }
});

// Basic Routes
app.get('/', (req, res) => {
    res.send('IoT Trap Sensor Backend Running Securely 🔒');
});

// MQTT Ingest Placeholder
// const mqttIngest = require('./mqtt/ingest');
// mqttIngest.start(io);

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend listening on port ${PORT} (HTTPS)`);
});
