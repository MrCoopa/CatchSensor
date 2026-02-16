const selfsigned = require('selfsigned');
const fs = require('fs');

(async () => {
    try {
        const attrs = [{ name: 'commonName', value: 'localhost' }];
        const pems = await selfsigned.generate(attrs, { days: 365 });
        console.log('Generated PEMS:', Object.keys(pems));

        fs.writeFileSync('server.key', pems.private);
        fs.writeFileSync('server.crt', pems.cert);
        console.log('SSL Certificates generated successfully.');
    } catch (e) {
        console.error('Error generating certs:', e);
    }
})();
