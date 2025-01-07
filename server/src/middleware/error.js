const logger = require('../utils/logger');

// Custom error class for API errors
class APIError extends Error {
    constructor(message, statusCode = 500, errors = []) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

// Not Found error handler
const notFound = (req, res, next) => {
    const error = new APIError(`Not Found - ${req.originalUrl}`, 404);
    next(error);
};

// Global error handler
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log error
    logger.error('Error:', {
        message: err.message,
        stack: err.stack,
        statusCode: err.statusCode,
        path: req.path,
        method: req.method,
        ip: req.ip
    });

    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    } else {
        // Production error response
        if (err.isOperational) {
            // Operational, trusted error: send message to client
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
                errors: err.errors
            });
        } else {
            // Programming or other unknown error: don't leak error details
            logger.error('Unknown Error:', err);
            res.status(500).json({
                status: 'error',
                message: 'Something went wrong'
            });
        }
    }
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// MongoDB error handler
const handleMongooseError = (err) => {
    let errors = [];

    if (err.name === 'ValidationError') {
        errors = Object.values(err.errors).map((error) => ({
            field: error.path,
            message: error.message
        }));
        return new APIError('Validation Error', 400, errors);
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return new APIError(
            `Duplicate field value: ${field}. Please use another value`,
            400
        );
    }

    if (err.name === 'CastError') {
        return new APIError(`Invalid ${err.path}: ${err.value}`, 400);
    }

    return err;
};

// JWT error handler
const handleJWTError = (err) => {
    if (err.name === 'JsonWebTokenError') {
        return new APIError('Invalid token. Please log in again', 401);
    }

    if (err.name === 'TokenExpiredError') {
        return new APIError('Your token has expired. Please log in again', 401);
    }

    return err;
};

// Signal Protocol error handler
const handleSignalProtocolError = (err) => {
    if (err.name === 'SignalProtocolError') {
        return new APIError('Encryption error. Please try again', 400);
    }

    return err;
};

// Socket.io error handler
const handleSocketError = (err) => {
    if (err.name === 'SocketError') {
        return new APIError('Connection error. Please try again', 400);
    }

    return err;
};

// Rate limit error handler
const handleRateLimitError = (err) => {
    if (err.name === 'RateLimitError') {
        return new APIError('Too many requests. Please try again later', 429);
    }

    return err;
};

// File upload error handler
const handleFileUploadError = (err) => {
    if (err.name === 'MulterError') {
        return new APIError(err.message, 400);
    }

    return err;
};

// Database connection error handler
const handleDBConnectionError = (err) => {
    if (err.name === 'MongooseServerSelectionError') {
        return new APIError('Database connection error. Please try again later', 500);
    }

    return err;
};

// Combine all error handlers
const combineErrorHandlers = (err) => {
    let error = { ...err };
    error.message = err.message;

    error = handleMongooseError(error);
    error = handleJWTError(error);
    error = handleSignalProtocolError(error);
    error = handleSocketError(error);
    error = handleRateLimitError(error);
    error = handleFileUploadError(error);
    error = handleDBConnectionError(error);

    return error;
};

module.exports = {
    APIError,
    notFound,
    errorHandler,
    asyncHandler,
    combineErrorHandlers
}; 