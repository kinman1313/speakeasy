import express from 'express';
import { body, validationResult } from 'express-validator';
import messageService from '../services/messageService.js';
import auth from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Validation middleware
const validateMessage = [
    body('content')
        .trim()
        .notEmpty()
        .withMessage('Message content cannot be empty')
        .isLength({ max: 5000 })
        .withMessage('Message content cannot exceed 5000 characters'),
    body('type')
        .optional()
        .isIn(['text', 'image', 'file', 'audio', 'video'])
        .withMessage('Invalid message type'),
    body('clientMessageId')
        .notEmpty()
        .withMessage('Client message ID is required')
];

const validateGroupMessage = [
    ...validateMessage,
    body('groupId')
        .notEmpty()
        .withMessage('Group ID is required')
];

// Routes

// Send direct message
router.post('/direct/:recipientId', auth, validateMessage, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { recipientId } = req.params;
        const message = await messageService.sendDirectMessage(
            req.user.id,
            recipientId,
            req.body
        );

        res.status(201).json(message);
    } catch (error) {
        logger.error('Send direct message error:', error);
        res.status(400).json({
            message: error.message || 'Failed to send message'
        });
    }
});

// Send group message
router.post('/group/:groupId', auth, validateGroupMessage, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { groupId } = req.params;
        const messages = await messageService.sendGroupMessage(
            req.user.id,
            groupId,
            req.body
        );

        res.status(201).json(messages);
    } catch (error) {
        logger.error('Send group message error:', error);
        res.status(400).json({
            message: error.message || 'Failed to send group message'
        });
    }
});

// Get direct messages between users
router.get('/direct/:userId', auth, async (req, res) => {
    try {
        const { userId } = req.params;
        const { before, after, limit } = req.query;

        const messages = await messageService.getDirectMessages(
            req.user.id,
            userId,
            { before, after, limit: parseInt(limit) || 50 }
        );

        res.json(messages);
    } catch (error) {
        logger.error('Get direct messages error:', error);
        res.status(400).json({
            message: error.message || 'Failed to get messages'
        });
    }
});

// Get group messages
router.get('/group/:groupId', auth, async (req, res) => {
    try {
        const { groupId } = req.params;
        const { before, after, limit } = req.query;

        const messages = await messageService.getGroupMessages(
            groupId,
            req.user.id,
            { before, after, limit: parseInt(limit) || 50 }
        );

        res.json(messages);
    } catch (error) {
        logger.error('Get group messages error:', error);
        res.status(400).json({
            message: error.message || 'Failed to get group messages'
        });
    }
});

// Edit message
router.put('/:messageId', auth, validateMessage, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { messageId } = req.params;
        const { content } = req.body;

        const message = await messageService.editMessage(
            messageId,
            req.user.id,
            content
        );

        res.json(message);
    } catch (error) {
        logger.error('Edit message error:', error);
        res.status(400).json({
            message: error.message || 'Failed to edit message'
        });
    }
});

// Delete message
router.delete('/:messageId', auth, async (req, res) => {
    try {
        const { messageId } = req.params;
        await messageService.deleteMessage(messageId, req.user.id);

        res.json({
            message: 'Message deleted successfully'
        });
    } catch (error) {
        logger.error('Delete message error:', error);
        res.status(400).json({
            message: error.message || 'Failed to delete message'
        });
    }
});

// Mark message as read
router.post('/:messageId/read', auth, async (req, res) => {
    try {
        const { messageId } = req.params;
        const message = await messageService.markAsRead(messageId, req.user.id);

        res.json(message);
    } catch (error) {
        logger.error('Mark message as read error:', error);
        res.status(400).json({
            message: error.message || 'Failed to mark message as read'
        });
    }
});

// Add reaction to message
router.post('/:messageId/reactions', auth, async (req, res) => {
    try {
        const { messageId } = req.params;
        const { type } = req.body;

        if (!type) {
            return res.status(400).json({
                message: 'Reaction type is required'
            });
        }

        const message = await messageService.addReaction(
            messageId,
            req.user.id,
            type
        );

        res.json(message);
    } catch (error) {
        logger.error('Add reaction error:', error);
        res.status(400).json({
            message: error.message || 'Failed to add reaction'
        });
    }
});

// Remove reaction from message
router.delete('/:messageId/reactions', auth, async (req, res) => {
    try {
        const { messageId } = req.params;
        const message = await messageService.removeReaction(messageId, req.user.id);

        res.json(message);
    } catch (error) {
        logger.error('Remove reaction error:', error);
        res.status(400).json({
            message: error.message || 'Failed to remove reaction'
        });
    }
});

export default router; 