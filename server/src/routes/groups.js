const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const groupService = require('../services/groupService');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

// Validation middleware
const validateGroup = [
    body('name')
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Group name must be between 3 and 50 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Description cannot exceed 200 characters'),
    body('settings')
        .optional()
        .isObject()
        .withMessage('Settings must be an object')
];

// Routes

// Create group
router.post('/', auth, validateGroup, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const group = await groupService.createGroup(req.user.id, req.body);
        res.status(201).json(group);
    } catch (error) {
        logger.error('Create group error:', error);
        res.status(400).json({
            message: error.message || 'Failed to create group'
        });
    }
});

// Get group details
router.get('/:groupId', auth, async (req, res) => {
    try {
        const { groupId } = req.params;
        const group = await groupService.getGroup(groupId, req.user.id);
        res.json(group);
    } catch (error) {
        logger.error('Get group error:', error);
        res.status(400).json({
            message: error.message || 'Failed to get group'
        });
    }
});

// Update group
router.put('/:groupId', auth, validateGroup, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { groupId } = req.params;
        const group = await groupService.updateGroup(groupId, req.user.id, req.body);
        res.json(group);
    } catch (error) {
        logger.error('Update group error:', error);
        res.status(400).json({
            message: error.message || 'Failed to update group'
        });
    }
});

// Add member to group
router.post('/:groupId/members/:userId', auth, async (req, res) => {
    try {
        const { groupId, userId } = req.params;
        const group = await groupService.addMember(groupId, req.user.id, userId);
        res.json(group);
    } catch (error) {
        logger.error('Add member error:', error);
        res.status(400).json({
            message: error.message || 'Failed to add member'
        });
    }
});

// Remove member from group
router.delete('/:groupId/members/:userId', auth, async (req, res) => {
    try {
        const { groupId, userId } = req.params;
        const group = await groupService.removeMember(groupId, req.user.id, userId);
        res.json(group);
    } catch (error) {
        logger.error('Remove member error:', error);
        res.status(400).json({
            message: error.message || 'Failed to remove member'
        });
    }
});

// Change member role
router.put('/:groupId/members/:userId/role', auth, async (req, res) => {
    try {
        const { groupId, userId } = req.params;
        const { role } = req.body;

        if (!role || !['admin', 'member'].includes(role)) {
            return res.status(400).json({
                message: 'Invalid role'
            });
        }

        const group = await groupService.changeMemberRole(
            groupId,
            req.user.id,
            userId,
            role
        );
        res.json(group);
    } catch (error) {
        logger.error('Change member role error:', error);
        res.status(400).json({
            message: error.message || 'Failed to change member role'
        });
    }
});

// Generate invite link
router.post('/:groupId/invite', auth, async (req, res) => {
    try {
        const { groupId } = req.params;
        const { maxUses, expiresIn } = req.body;

        const invite = await groupService.generateInviteLink(
            groupId,
            req.user.id,
            { maxUses, expiresIn }
        );
        res.json(invite);
    } catch (error) {
        logger.error('Generate invite link error:', error);
        res.status(400).json({
            message: error.message || 'Failed to generate invite link'
        });
    }
});

// Join group with invite link
router.post('/join/:inviteCode', auth, async (req, res) => {
    try {
        const { inviteCode } = req.params;
        const group = await groupService.joinGroupWithInvite(inviteCode, req.user.id);
        res.json(group);
    } catch (error) {
        logger.error('Join group error:', error);
        res.status(400).json({
            message: error.message || 'Failed to join group'
        });
    }
});

// Leave group
router.post('/:groupId/leave', auth, async (req, res) => {
    try {
        const { groupId } = req.params;
        await groupService.leaveGroup(groupId, req.user.id);
        res.json({
            message: 'Left group successfully'
        });
    } catch (error) {
        logger.error('Leave group error:', error);
        res.status(400).json({
            message: error.message || 'Failed to leave group'
        });
    }
});

// Delete group
router.delete('/:groupId', auth, async (req, res) => {
    try {
        const { groupId } = req.params;
        await groupService.deleteGroup(groupId, req.user.id);
        res.json({
            message: 'Group deleted successfully'
        });
    } catch (error) {
        logger.error('Delete group error:', error);
        res.status(400).json({
            message: error.message || 'Failed to delete group'
        });
    }
});

// Get user's groups
router.get('/', auth, async (req, res) => {
    try {
        const groups = await groupService.getUserGroups(req.user.id);
        res.json(groups);
    } catch (error) {
        logger.error('Get user groups error:', error);
        res.status(400).json({
            message: error.message || 'Failed to get user groups'
        });
    }
});

// Search groups
router.get('/search', auth, async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({
                message: 'Search query is required'
            });
        }

        const groups = await groupService.searchGroups(query, req.user.id);
        res.json(groups);
    } catch (error) {
        logger.error('Search groups error:', error);
        res.status(400).json({
            message: error.message || 'Failed to search groups'
        });
    }
});

module.exports = router; 