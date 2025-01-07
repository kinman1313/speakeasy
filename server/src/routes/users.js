import express from 'express';
import { body, validationResult } from 'express-validator';
import { auth } from '../middleware/auth.js';
import userService from '../services/userService.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Validation middleware
const validateRegistration = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please enter a valid email')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

const validateLogin = [
    body('email').trim().isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required')
];

const validatePasswordReset = [
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

// Routes

// Register user
router.post('/register', validateRegistration, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password } = req.body;
        const result = await userService.register({ username, email, password });

        res.status(201).json({
            message: 'Registration successful',
            user: result.user,
            token: result.token
        });
    } catch (error) {
        logger.error('Registration error:', error);
        res.status(400).json({
            message: error.message || 'Registration failed'
        });
    }
});

// Login user
router.post('/login', validateLogin, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;
        const result = await userService.login(email, password);

        res.json({
            message: 'Login successful',
            user: result.user,
            token: result.token
        });
    } catch (error) {
        logger.error('Login error:', error);
        res.status(401).json({
            message: error.message || 'Invalid credentials'
        });
    }
});

// Verify email
router.get('/verify-email/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const user = await userService.verifyEmail(token);

        res.json({
            message: 'Email verified successfully',
            user
        });
    } catch (error) {
        logger.error('Email verification error:', error);
        res.status(400).json({
            message: error.message || 'Email verification failed'
        });
    }
});

// Request password reset
router.post('/request-password-reset', async (req, res) => {
    try {
        const { email } = req.body;
        const resetToken = await userService.requestPasswordReset(email);

        res.json({
            message: 'Password reset email sent',
            resetToken // In production, this should be sent via email
        });
    } catch (error) {
        logger.error('Password reset request error:', error);
        res.status(400).json({
            message: error.message || 'Password reset request failed'
        });
    }
});

// Reset password
router.post('/reset-password/:token', validatePasswordReset, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { token } = req.params;
        const { password } = req.body;
        const user = await userService.resetPassword(token, password);

        res.json({
            message: 'Password reset successful',
            user
        });
    } catch (error) {
        logger.error('Password reset error:', error);
        res.status(400).json({
            message: error.message || 'Password reset failed'
        });
    }
});

// Protected routes (require authentication)

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await userService.getProfile(req.user.id);
        res.json(user);
    } catch (error) {
        logger.error('Get profile error:', error);
        res.status(400).json({
            message: error.message || 'Failed to get profile'
        });
    }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
    try {
        const user = await userService.updateProfile(req.user.id, req.body);
        res.json(user);
    } catch (error) {
        logger.error('Update profile error:', error);
        res.status(400).json({
            message: error.message || 'Failed to update profile'
        });
    }
});

// Change password
router.put('/change-password', auth, validatePasswordReset, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { currentPassword, newPassword } = req.body;
        await userService.changePassword(req.user.id, currentPassword, newPassword);

        res.json({
            message: 'Password changed successfully'
        });
    } catch (error) {
        logger.error('Change password error:', error);
        res.status(400).json({
            message: error.message || 'Failed to change password'
        });
    }
});

// Search users
router.get('/search', auth, async (req, res) => {
    try {
        const { query } = req.query;
        const users = await userService.searchUsers(query, req.user.id);
        res.json(users);
    } catch (error) {
        logger.error('Search users error:', error);
        res.status(400).json({
            message: error.message || 'Failed to search users'
        });
    }
});

// Friend requests
router.post('/friend-request/:userId', auth, async (req, res) => {
    try {
        await userService.sendFriendRequest(req.user.id, req.params.userId);
        res.json({
            message: 'Friend request sent successfully'
        });
    } catch (error) {
        logger.error('Send friend request error:', error);
        res.status(400).json({
            message: error.message || 'Failed to send friend request'
        });
    }
});

router.post('/accept-friend-request/:userId', auth, async (req, res) => {
    try {
        await userService.acceptFriendRequest(req.user.id, req.params.userId);
        res.json({
            message: 'Friend request accepted successfully'
        });
    } catch (error) {
        logger.error('Accept friend request error:', error);
        res.status(400).json({
            message: error.message || 'Failed to accept friend request'
        });
    }
});

// Remove friend
router.delete('/friend/:userId', auth, async (req, res) => {
    try {
        await userService.removeFriend(req.user.id, req.params.userId);
        res.json({
            message: 'Friend removed successfully'
        });
    } catch (error) {
        logger.error('Remove friend error:', error);
        res.status(400).json({
            message: error.message || 'Failed to remove friend'
        });
    }
});

// Block/Unblock user
router.post('/block/:userId', auth, async (req, res) => {
    try {
        await userService.blockUser(req.user.id, req.params.userId);
        res.json({
            message: 'User blocked successfully'
        });
    } catch (error) {
        logger.error('Block user error:', error);
        res.status(400).json({
            message: error.message || 'Failed to block user'
        });
    }
});

router.post('/unblock/:userId', auth, async (req, res) => {
    try {
        await userService.unblockUser(req.user.id, req.params.userId);
        res.json({
            message: 'User unblocked successfully'
        });
    } catch (error) {
        logger.error('Unblock user error:', error);
        res.status(400).json({
            message: error.message || 'Failed to unblock user'
        });
    }
});

export default router; 