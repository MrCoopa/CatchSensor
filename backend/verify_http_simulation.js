const http = require('http');

// Simple fetch implementation for Node (if fetch not available) or just use fetch if Node 18+
// Assuming Node 18+
const BASE_URL = 'http://127.0.0.1:5000';

async function run() {
    try {
        console.log('--- Starting Verification ---');

        // 1. Auth (Login or Register)
        let token;
        let loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@example.com', password: 'password123' })
        });

        if (loginRes.ok) {
            const data = await loginRes.json();
            token = data.token;
            console.log('✅ Logged in');
        } else {
            console.log('Login failed, trying to register...');
            const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Admin', email: 'admin@example.com', password: 'password123', confirmPassword: 'password123' })
            });

            if (regRes.ok) {
                const data = await regRes.json();
                token = data.token;
                console.log('✅ Registered and logged in');
            } else {
                const err = await regRes.text();
                throw new Error('Registration failed: ' + err);
            }
        }

        // 2. Get Trap
        let trap;
        const trapsRes = await fetch(`${BASE_URL}/api/traps`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const traps = await trapsRes.json();

        if (traps.length > 0) {
            trap = traps[0];
            console.log(`✅ Found trap: ${trap.name} (${trap.imei})`);
        } else {
            console.log('Creating test trap...');
            const createRes = await fetch(`${BASE_URL}/api/traps`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: 'CacheTestTrap', imei: '999999888777', location: 'Lab' })
            });
            if (createRes.ok) {
                trap = await createRes.json();
                console.log(`✅ Created trap: ${trap.name}`);
            } else {
                throw new Error('Trap creation failed');
            }
        }

        // 3. Trigger Simulation 1 (Cache Miss)
        console.log('🚀 Triggering Simulation 1...');
        await fetch(`${BASE_URL}/api/traps/simulate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ imei: trap.imei, status: 'active', batteryVoltage: 4000, rssi: 80 })
        });
        console.log('...done');

        // Wait
        await new Promise(r => setTimeout(r, 1000));

        // 4. Trigger Simulation 2 (Cache Hit)
        console.log('🚀 Triggering Simulation 2...');
        await fetch(`${BASE_URL}/api/traps/simulate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ imei: trap.imei, status: 'active', batteryVoltage: 3990, rssi: 81 })
        });
        console.log('...done');

        console.log('--- Verification Complete. Check Server Logs for Cache/Miss ---');

    } catch (err) {
        console.error('Error:', err);
    }
}

run();
