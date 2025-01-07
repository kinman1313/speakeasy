import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import http from 'http';
import socketService from './socket/socketService.js';
import messageEncryptionService from './services/messageEncryptionService.js';
import logger from './utils/logger.js';
import { notFound, errorHandler } from './middleware/error.js';
import { authLimiter } from './middleware/auth.js';

// Import routes
import userRoutes from './routes/users.js';
import messageRoutes from './routes/messages.js';
import groupRoutes from './routes/groups.js';
import giphyRoutes from './routes/giphy.js';

dotenv.config();

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
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => {
        logger.info('Connected to MongoDB');
    })
    .catch((error) => {
        logger.error('MongoDB connection error:', error);
        process.exit(1);
    });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));
app.use(compression());
app.use(helmet());

// Request logging
app.use(logger.requestMiddleware);

// Rate limiting
app.use('/api/auth', authLimiter);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/giphy', giphyRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Rejection:', err);
    // Close server & exit process
    server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    // Close server & exit process
    server.close(() => process.exit(1));
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully');
    server.close(() => {
        logger.info('Process terminated');
        mongoose.connection.close(false, () => {
            process.exit(0);
        });
    });
});

export default server; 