import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Register user
router.post(
    '/register',
    [
        body('username')
            .trim()
            .isLength({ min: 3, max: 30 })
            .withMessage('Username must be between 3 and 30 characters'),
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Please enter a valid email'),
        body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters')
            .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
            .withMessage('Password must include one uppercase, one lowercase, one number and one special character')
    ],
    async (req, res) => {
        try {
            // Check for validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { username, email, password } = req.body;

            // Check if user already exists
            let user = await User.findOne({ $or: [{ email }, { username }] });
            if (user) {
                return res.status(400).json({
                    message: 'User already exists'
                });
            }

            // Create new user
            user = new User({
                username,
                email,
                password
            });

            // Save user to database
            await user.save();

            // Generate auth token
            const token = user.generateAuthToken();

            res.status(201).json({
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email
                }
            });
        } catch (error) {
            logger.error('Registration error:', error);
            res.status(500).json({
                message: 'Server error'
            });
        }
    }
);

// Login user
router.post(
    '/login',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').exists()
    ],
    async (req, res) => {
        try {
            // Check for validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, password } = req.body;

            // Find user
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({
                    message: 'Invalid credentials'
                });
            }

            // Check password
            const isMatch = await user.matchPassword(password);
            if (!isMatch) {
                return res.status(400).json({
                    message: 'Invalid credentials'
                });
            }

            // Generate auth token
            const token = user.generateAuthToken();

            res.json({
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email
                }
            });
        } catch (error) {
            logger.error('Login error:', error);
            res.status(500).json({
                message: 'Server error'
            });
        }
    }
);

// Get current user
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        logger.error('Get current user error:', error);
        res.status(500).json({
            message: 'Server error'
        });
    }
});

// Update user profile
router.put(
    '/me',
    [auth,
        body('username')
            .optional()
            .trim()
            .isLength({ min: 3, max: 30 }),
        body('email')
            .optional()
            .isEmail()
            .normalizeEmail(),
        body('password')
            .optional()
            .isLength({ min: 8 })
            .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(404).json({
                    message: 'User not found'
                });
            }

            // Update fields
            if (req.body.username) user.username = req.body.username;
            if (req.body.email) user.email = req.body.email;
            if (req.body.password) user.password = req.body.password;

            await user.save();

            res.json({
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email
                }
            });
        } catch (error) {
            logger.error('Update profile error:', error);
            res.status(500).json({
                message: 'Server error'
            });
        }
    }
);

// Request password reset
router.post(
    '/forgot-password',
    [
        body('email')
            .isEmail()
            .normalizeEmail()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email } = req.body;
            const user = await User.findOne({ email });

            if (!user) {
                return res.status(404).json({
                    message: 'User not found'
                });
            }

            // Generate reset token
            const resetToken = user.generateResetPasswordToken();
            await user.save();

            // Send reset email
            // TODO: Implement email sending

            res.json({
                message: 'Password reset email sent'
            });
        } catch (error) {
            logger.error('Forgot password error:', error);
            res.status(500).json({
                message: 'Server error'
            });
        }
    }
);

// Reset password
router.post(
    '/reset-password/:token',
    [
        body('password')
            .isLength({ min: 8 })
            .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { token } = req.params;
            const { password } = req.body;

            // Find user by reset token
            const user = await User.findOne({
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: Date.now() }
            });

            if (!user) {
                return res.status(400).json({
                    message: 'Invalid or expired reset token'
                });
            }

            // Update password
            user.password = password;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();

            res.json({
                message: 'Password reset successful'
            });
        } catch (error) {
            logger.error('Reset password error:', error);
            res.status(500).json({
                message: 'Server error'
            });
        }
    }
);

export default router; 