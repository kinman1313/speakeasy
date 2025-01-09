"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _express = _interopRequireDefault(require("express"));
var _expressValidator = require("express-validator");
var _groupService = _interopRequireDefault(require("../services/groupService.js"));
var _auth = require("../middleware/auth.js");
var _logger = _interopRequireDefault(require("../utils/logger.js"));
const router = _express.default.Router();

// Validation middleware
const validateGroup = [(0, _expressValidator.body)('name').trim().isLength({
  min: 3,
  max: 50
}).withMessage('Group name must be between 3 and 50 characters'), (0, _expressValidator.body)('description').optional().trim().isLength({
  max: 200
}).withMessage('Description cannot exceed 200 characters'), (0, _expressValidator.body)('settings').optional().isObject().withMessage('Settings must be an object')];

// Routes

// Create group
router.post('/', _auth.auth, validateGroup, async (req, res) => {
  try {
    const errors = (0, _expressValidator.validationResult)(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }
    const group = await _groupService.default.createGroup(req.user.id, req.body);
    res.status(201).json(group);
  } catch (error) {
    _logger.default.error('Create group error:', error);
    res.status(400).json({
      message: error.message || 'Failed to create group'
    });
  }
});

// Get group details
router.get('/:groupId', _auth.auth, async (req, res) => {
  try {
    const {
      groupId
    } = req.params;
    const group = await _groupService.default.getGroup(groupId, req.user.id);
    res.json(group);
  } catch (error) {
    _logger.default.error('Get group error:', error);
    res.status(400).json({
      message: error.message || 'Failed to get group'
    });
  }
});

// Update group
router.put('/:groupId', _auth.auth, validateGroup, async (req, res) => {
  try {
    const errors = (0, _expressValidator.validationResult)(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }
    const {
      groupId
    } = req.params;
    const group = await _groupService.default.updateGroup(groupId, req.user.id, req.body);
    res.json(group);
  } catch (error) {
    _logger.default.error('Update group error:', error);
    res.status(400).json({
      message: error.message || 'Failed to update group'
    });
  }
});

// Add member to group
router.post('/:groupId/members/:userId', _auth.auth, async (req, res) => {
  try {
    const {
      groupId,
      userId
    } = req.params;
    const group = await _groupService.default.addMember(groupId, req.user.id, userId);
    res.json(group);
  } catch (error) {
    _logger.default.error('Add member error:', error);
    res.status(400).json({
      message: error.message || 'Failed to add member'
    });
  }
});

// Remove member from group
router.delete('/:groupId/members/:userId', _auth.auth, async (req, res) => {
  try {
    const {
      groupId,
      userId
    } = req.params;
    const group = await _groupService.default.removeMember(groupId, req.user.id, userId);
    res.json(group);
  } catch (error) {
    _logger.default.error('Remove member error:', error);
    res.status(400).json({
      message: error.message || 'Failed to remove member'
    });
  }
});

// Change member role
router.put('/:groupId/members/:userId/role', _auth.auth, async (req, res) => {
  try {
    const {
      groupId,
      userId
    } = req.params;
    const {
      role
    } = req.body;
    if (!role || !['admin', 'member'].includes(role)) {
      return res.status(400).json({
        message: 'Invalid role'
      });
    }
    const group = await _groupService.default.changeMemberRole(groupId, req.user.id, userId, role);
    res.json(group);
  } catch (error) {
    _logger.default.error('Change member role error:', error);
    res.status(400).json({
      message: error.message || 'Failed to change member role'
    });
  }
});

// Generate invite link
router.post('/:groupId/invite', _auth.auth, async (req, res) => {
  try {
    const {
      groupId
    } = req.params;
    const {
      maxUses,
      expiresIn
    } = req.body;
    const invite = await _groupService.default.generateInviteLink(groupId, req.user.id, {
      maxUses,
      expiresIn
    });
    res.json(invite);
  } catch (error) {
    _logger.default.error('Generate invite link error:', error);
    res.status(400).json({
      message: error.message || 'Failed to generate invite link'
    });
  }
});

// Join group with invite link
router.post('/join/:inviteCode', _auth.auth, async (req, res) => {
  try {
    const {
      inviteCode
    } = req.params;
    const group = await _groupService.default.joinGroupWithInvite(inviteCode, req.user.id);
    res.json(group);
  } catch (error) {
    _logger.default.error('Join group error:', error);
    res.status(400).json({
      message: error.message || 'Failed to join group'
    });
  }
});

// Leave group
router.post('/:groupId/leave', _auth.auth, async (req, res) => {
  try {
    const {
      groupId
    } = req.params;
    await _groupService.default.leaveGroup(groupId, req.user.id);
    res.json({
      message: 'Left group successfully'
    });
  } catch (error) {
    _logger.default.error('Leave group error:', error);
    res.status(400).json({
      message: error.message || 'Failed to leave group'
    });
  }
});

// Delete group
router.delete('/:groupId', _auth.auth, async (req, res) => {
  try {
    const {
      groupId
    } = req.params;
    await _groupService.default.deleteGroup(groupId, req.user.id);
    res.json({
      message: 'Group deleted successfully'
    });
  } catch (error) {
    _logger.default.error('Delete group error:', error);
    res.status(400).json({
      message: error.message || 'Failed to delete group'
    });
  }
});

// Get user's groups
router.get('/', _auth.auth, async (req, res) => {
  try {
    const groups = await _groupService.default.getUserGroups(req.user.id);
    res.json(groups);
  } catch (error) {
    _logger.default.error('Get user groups error:', error);
    res.status(400).json({
      message: error.message || 'Failed to get user groups'
    });
  }
});

// Search groups
router.get('/search', _auth.auth, async (req, res) => {
  try {
    const {
      query
    } = req.query;
    if (!query) {
      return res.status(400).json({
        message: 'Search query is required'
      });
    }
    const groups = await _groupService.default.searchGroups(query, req.user.id);
    res.json(groups);
  } catch (error) {
    _logger.default.error('Search groups error:', error);
    res.status(400).json({
      message: error.message || 'Failed to search groups'
    });
  }
});
var _default = exports.default = router;