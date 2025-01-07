const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
};

// Define level colors
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue'
};

// Set up winston color theme
winston.addColors(colors);

// Create format for console output
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
);

// Create format for file output
const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels,
    transports: [
        // Console transport
        new winston.transports.Console({
            format: consoleFormat
        }),
        // Error log file transport
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/error.log'),
            level: 'error',
            format: fileFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Combined log file transport
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/combined.log'),
            format: fileFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ],
    // Handle exceptions and rejections
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/exceptions.log'),
            format: fileFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ],
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/rejections.log'),
            format: fileFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
});

// Create request logger middleware
logger.requestMiddleware = (req, res, next) => {
    // Log only if level is http or debug
    if (logger.levels[logger.level] >= logger.levels.http) {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            logger.http(
                `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
            );
        });
    }
    next();
};

// Create error logger middleware
logger.errorMiddleware = (err, req, res, next) => {
    logger.error(`${err.name}: ${err.message}`, {
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip
    });
    next(err);
};

// Development logging
if (process.env.NODE_ENV !== 'production') {
    logger.debug('Logging initialized at debug level');
}

module.exports = logger; 