const selfsigned = require('selfsigned');
const fs = require('fs');

(async () => {
    try {
        const attrs = [
            { name: 'commonName', value: '192.168.2.217' }
        ];
        const options = {
            days: 365,
            extensions: [{
                name: 'subjectAltName',
                altNames: [
                    { type: 2, value: 'localhost' },
                    { type: 7, ip: '192.168.2.217' },
                    { type: 7, ip: '127.0.0.1' }
                ]
            }]
        };
        const pems = await selfsigned.generate(attrs, options);
        console.log('Generated PEMS:', Object.keys(pems));

        fs.writeFileSync('server.key', pems.private);
        fs.writeFileSync('server.crt', pems.cert);
        console.log('SSL Certificates generated successfully.');
    } catch (e) {
        console.error('Error generating certs:', e);
    }
})();

