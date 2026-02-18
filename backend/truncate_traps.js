const sequelize = require('./src/config/database');
const Trap = require('./src/models/Trap');
const Reading = require('./src/models/Reading');
const LoraMetadata = require('./src/models/LoraMetadata'); // Ensure model is loaded for hooks

(async () => {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');

        console.log('🗑️  Deleting all READINGS...');
        await Reading.destroy({ where: {}, truncate: false });
        console.log('✅ Readings cleared.');

        console.log('🗑️  Deleting all CatchS (Cascades to Metadata & Shares)...');
        await Trap.destroy({ where: {}, truncate: false });
        console.log('✅ Catchs cleared.');

        // Verify LoraMetadata is empty
        const metadataCount = await LoraMetadata.count();
        if (metadataCount > 0) {
            console.log(`⚠️  Warning: ${metadataCount} LoraMetadata records remained. Cleaning explicitly...`);
            await LoraMetadata.destroy({ where: {}, truncate: false });
            console.log('✅ LoraMetadata cleared explicitly.');
        } else {
            console.log('✅ LoraMetadata cleared via Cascade.');
        }

        console.log('Start fresh! Users are preserved.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Truncate failed:', err);
        process.exit(1);
    }
})();

