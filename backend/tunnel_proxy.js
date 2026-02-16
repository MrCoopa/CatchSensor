const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const https = require('https');
const fs = require('fs');

// Allow self-signed certs globally for this script
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const app = express();

// Proxy to Frontend (HTTPS)
app.use('/', createProxyMiddleware({
    target: 'https://127.0.0.1:5173',
    changeOrigin: true,
    secure: false,
    ws: true,
    logLevel: 'debug'
}));

const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Tunnel Proxy running on http://localhost:${PORT} pointing to https://127.0.0.1:5173`);
});
