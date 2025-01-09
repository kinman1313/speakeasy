import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { User } from '../models/User.js';
import logger from '../utils/logger.js';

const auth = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.header('Authorization');
        const token = authHeader ? authHeader.replace('Bearer ', '') : null;

        if (!token) {
            throw new Error();
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user
            const user = await User.findOne({
                _id: decoded.id,
                'tokens.token': token
            }).select('-password');

            if (!user) {
                throw new Error();
            }

            // Check if token is expired
            if (decoded.exp <= Date.now() / 1000) {
                throw new Error('Token has expired');
            }

            // Add user and token to request
            req.token = token;
            req.user = user;

            // Update last seen
            user.lastSeen = new Date();
            await user.save();

            next();
        } catch (error) {
            logger.error('Token verification error:', error);
            res.status(401).json({
                message: 'Please authenticate'
            });
        }
    } catch (error) {
        logger.error('Authentication error:', error);
        res.status(401).json({
            message: 'Please authenticate'
        });
    }
};

// Optional authentication middleware
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        const token = authHeader ? authHeader.replace('Bearer ', '') : null;

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findOne({
                    _id: decoded.id,
                    'tokens.token': token
                }).select('-password');

                if (user && decoded.exp > Date.now() / 1000) {
                    req.token = token;
                    req.user = user;

                    // Update last seen
                    user.lastSeen = new Date();
                    await user.save();
                }
            } catch (error) {
                logger.error('Optional auth token verification error:', error);
            }
        }

        next();
    } catch (error) {
        logger.error('Optional authentication error:', error);
        next();
    }
};

// Admin authentication middleware
const adminAuth = async (req, res, next) => {
    try {
        await auth(req, res, () => {
            if (req.user && req.user.role === 'admin') {
                next();
            } else {
                res.status(403).json({
                    message: 'Access denied'
                });
            }
        });
    } catch (error) {
        logger.error('Admin authentication error:', error);
        res.status(403).json({
            message: 'Access denied'
        });
    }
};

// Rate limiting middleware
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false
});

export const createAccountLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 create account requests per hour
    message: 'Too many accounts created from this IP, please try again after an hour',
    standardHeaders: true,
    legacyHeaders: false
});

export { auth, optionalAuth, adminAuth }; 