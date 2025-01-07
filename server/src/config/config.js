const path = require('path');

const config = {
    // Server
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000,
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',

    // MongoDB
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app',
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            useFindAndModify: false
        }
    },

    // JWT
    jwt: {
        secret: process.env.JWT_SECRET,
        expire: process.env.JWT_EXPIRE || '7d'
    },

    // Email
    email: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
        from: process.env.EMAIL_FROM
    },

    // File Upload
    upload: {
        path: path.join(__dirname, '../../', process.env.UPLOAD_PATH || 'uploads'),
        maxSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 // 5MB
    },

    // Signal Protocol
    signal: {
        storePath: path.join(__dirname, '../../', process.env.SIGNAL_PROTOCOL_STORE_PATH || 'signal-store')
    },

    // Rate Limiting
    rateLimit: {
        window: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX) || 100
    },

    // Logging
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        path: path.join(__dirname, '../../', process.env.LOG_PATH || 'logs')
    },

    // Security
    security: {
        cors: {
            origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
            credentials: true
        },
        session: {
            secret: process.env.SESSION_SECRET,
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            }
        },
        cookie: {
            secret: process.env.COOKIE_SECRET
        }
    },

    // Socket.IO
    socket: {
        path: process.env.SOCKET_PATH || '/socket.io',
        options: {
            cors: {
                origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
                methods: ['GET', 'POST'],
                credentials: true
            }
        }
    },

    // Redis
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD
    },

    // AWS S3
    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1',
        bucketName: process.env.AWS_BUCKET_NAME
    },

    // Cloudinary
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET
    },

    // Push Notifications
    pushNotifications: {
        vapid: {
            publicKey: process.env.VAPID_PUBLIC_KEY,
            privateKey: process.env.VAPID_PRIVATE_KEY,
            subject: process.env.VAPID_SUBJECT
        }
    },

    // Message Settings
    messages: {
        maxLength: 5000,
        types: ['text', 'image', 'file', 'audio', 'video'],
        allowedMimeTypes: {
            image: ['image/jpeg', 'image/png', 'image/gif'],
            video: ['video/mp4', 'video/webm'],
            audio: ['audio/mp3', 'audio/wav', 'audio/ogg'],
            file: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        },
        maxFileSize: {
            image: 5242880, // 5MB
            video: 52428800, // 50MB
            audio: 10485760, // 10MB
            file: 10485760 // 10MB
        }
    },

    // Group Settings
    groups: {
        maxMembers: 100,
        maxNameLength: 50,
        maxDescriptionLength: 200,
        defaultMessageRetention: 30 // days
    },

    // User Settings
    users: {
        usernameMinLength: 3,
        usernameMaxLength: 30,
        passwordMinLength: 8,
        bioMaxLength: 200,
        maxFriends: 1000,
        avatarMaxSize: 5242880 // 5MB
    }
};

// Validate required environment variables
const requiredEnvVars = [
    'JWT_SECRET',
    'MONGODB_URI'
];

requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
        throw new Error(`Environment variable ${envVar} is required`);
    }
});

// Validate configuration
const validateConfig = () => {
    // Validate MongoDB URI
    if (!config.mongodb.uri.startsWith('mongodb://') && !config.mongodb.uri.startsWith('mongodb+srv://')) {
        throw new Error('Invalid MongoDB URI');
    }

    // Validate JWT secret length
    if (config.jwt.secret.length < 32) {
        throw new Error('JWT secret should be at least 32 characters long');
    }

    // Validate upload path
    try {
        require('fs').accessSync(config.upload.path);
    } catch (error) {
        require('fs').mkdirSync(config.upload.path, { recursive: true });
    }

    // Validate Signal Protocol store path
    try {
        require('fs').accessSync(config.signal.storePath);
    } catch (error) {
        require('fs').mkdirSync(config.signal.storePath, { recursive: true });
    }

    // Validate logging path
    try {
        require('fs').accessSync(config.logging.path);
    } catch (error) {
        require('fs').mkdirSync(config.logging.path, { recursive: true });
    }
};

// Validate configuration in development environment
if (config.env === 'development') {
    validateConfig();
}

module.exports = config; 