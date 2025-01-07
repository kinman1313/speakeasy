const fs = require('fs-extra');
const path = require('path');
const config = require('../src/config/config');
const logger = require('../src/utils/logger');

const requiredDirs = [
    config.upload.path,
    config.signal.storePath,
    config.logging.path
];

async function setup() {
    try {
        // Create required directories if they don't exist
        for (const dir of requiredDirs) {
            await fs.ensureDir(dir);
            logger.info(`Directory created/verified: ${dir}`);
        }

        // Create .gitkeep files to preserve empty directories
        for (const dir of requiredDirs) {
            const gitkeepPath = path.join(dir, '.gitkeep');
            await fs.ensureFile(gitkeepPath);
        }

        logger.info('Setup completed successfully');
    } catch (error) {
        logger.error('Setup failed:', error);
        process.exit(1);
    }
}

// Run setup if this script is run directly
if (require.main === module) {
    setup();
}

module.exports = setup; 