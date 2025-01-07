const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const fileUpload = require('express-fileupload');
const path = require('path');
const http = require('http');
const socketService = require('./src/socket/socketService');
const messageEncryptionService = require('./src/services/messageEncryptionService');
const logger = require('./src/utils/logger');
const config = require('./src/config/config');
const { notFound, errorHandler } = require('./src/middleware/error');
const { authLimiter, createAccountLimiter } = require('./src/middleware/auth');

// Import routes
const userRoutes = require('./src/routes/users');
const messageRoutes = require('./src/routes/messages');
const groupRoutes = require('./src/routes/groups');

// Create Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
socketService.initialize(server);

// Initialize Signal Protocol
(async () => {
    try {
        await messageEncryptionService.initialize();
        logger.info('Signal Protocol initialized successfully');
    } catch (error) {
        logger.error('Failed to initialize Signal Protocol:', error);
        process.exit(1);
    }
})();

// Connect to MongoDB
mongoose.connect(config.mongodb.uri, config.mongodb.options)
    .then(() => {
        logger.info('Connected to MongoDB');
    })
    .catch((error) => {
        logger.error('MongoDB connection error:', error);
        process.exit(1);
    });

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", 'wss:', 'ws:']
        }
    }
}));

// CORS configuration
app.use(cors(config.security.cors));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// File upload middleware
app.use(fileUpload({
    limits: { fileSize: config.upload.maxSize },
    useTempFiles: true,
    tempFileDir: '/tmp/',
    createParentPath: true,
    safeFileNames: true,
    preserveExtension: true
}));

// Static files middleware
app.use('/uploads', express.static(path.join(__dirname, config.upload.path)));

// Request logging
app.use(logger.requestMiddleware);

// Rate limiting
app.use('/api/auth', authLimiter);
app.use('/api/users/register', createAccountLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Server is healthy',
        timestamp: new Date().toISOString()
    });
});

// API routes
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/groups', groupRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Export for testing
module.exports = { app, server }; 