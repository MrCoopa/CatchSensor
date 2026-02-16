const fetch = require('node-fetch');

async function testTrapCreation() {
    try {
        // 1. Login to get token
        console.log('🔐 Logging in...');
        const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'niklas.hahn97@t-online.de',
                password: 'admin123'
            })
        });

        if (!loginResponse.ok) {
            console.log('❌ Login failed');
            process.exit(1);
        }

        const { token } = await loginResponse.json();
        console.log('✅ Login successful');

        // 2. Create a trap
        console.log('\n📡 Creating trap "Brückenhof"...');
        const createResponse = await fetch('http://localhost:5000/api/traps', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: 'Brückenhof',
                location: 'Teststandort',
                imei: '123456789012345'
            })
        });

        if (!createResponse.ok) {
            const error = await createResponse.json();
            console.log('❌ Trap creation failed:', error);
            process.exit(1);
        }

        const newTrap = await createResponse.json();
        console.log('✅ Trap created successfully!');
        console.log('   Name:', newTrap.name);
        console.log('   IMEI:', newTrap.imei);
        console.log('   ID:', newTrap.id);

        // 3. Verify in database
        console.log('\n🔍 Verifying in database...');
        const Trap = require('./src/models/Trap');
        await require('./src/config/database').authenticate();
        const dbTrap = await Trap.findByPk(newTrap.id);

        if (dbTrap) {
            console.log('✅ Trap found in database!');
            console.log('   Name:', dbTrap.name);
            console.log('   IMEI:', dbTrap.imei);
        } else {
            console.log('❌ Trap NOT found in database!');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

testTrapCreation();
