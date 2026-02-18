const forge = require('node-forge');
const fs = require('fs');
const path = require('path');

// Read existing cert and key
const certPem = fs.readFileSync('server.crt', 'utf8');
const keyPem = fs.readFileSync('server.key', 'utf8');

// Parse PEM
const cert = forge.pki.certificateFromPem(certPem);
const privateKey = forge.pki.privateKeyFromPem(keyPem);

// Create P12
const p12Asn1 = forge.pkcs12.toPkcs12Asn1(privateKey, [cert], '1234', {
    algorithm: '3des',
    friendlyName: 'CatchSensor',
    generateLocalKeyId: true
});
const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
const p12Buffer = Buffer.from(p12Der, 'binary');

// Save as binary
fs.writeFileSync('server.p12', p12Buffer);

console.log('P12 Generated: server.p12 (Password: 1234)');

