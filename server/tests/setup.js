const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const logger = require('../src/utils/logger');

let mongoServer;

// Disable logging during tests
logger.transports.forEach((t) => (t.silent = true));

// Connect to the in-memory database before running tests
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
});

// Clear all test data after each test
afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany();
    }
});

// Disconnect and stop MongoDB instance
afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
}); 