"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _express = _interopRequireDefault(require("express"));
var _expressValidator = require("express-validator");
var _messageService = _interopRequireDefault(require("../services/messageService.js"));
var _auth = require("../middleware/auth.js");
var _logger = _interopRequireDefault(require("../utils/logger.js"));
const router = _express.default.Router();

// Validation middleware
const validateMessage = [(0, _expressValidator.body)('content').trim().notEmpty().withMessage('Message content cannot be empty').isLength({
  max: 5000
}).withMessage('Message content cannot exceed 5000 characters'), (0, _expressValidator.body)('type').optional().isIn(['text', 'image', 'file', 'audio', 'video']).withMessage('Invalid message type'), (0, _expressValidator.body)('clientMessageId').notEmpty().withMessage('Client message ID is required')];
const validateGroupMessage = [...validateMessage, (0, _expressValidator.body)('groupId').notEmpty().withMessage('Group ID is required')];

// Routes

// Send direct message
router.post('/direct/:recipientId', _auth.auth, validateMessage, async (req, res) => {
  try {
    const errors = (0, _expressValidator.validationResult)(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }
    const {
      recipientId
    } = req.params;
    const message = await _messageService.default.sendDirectMessage(req.user.id, recipientId, req.body);
    res.status(201).json(message);
  } catch (error) {
    _logger.default.error('Send direct message error:', error);
    res.status(400).json({
      message: error.message || 'Failed to send message'
    });
  }
});

// Send group message
router.post('/group/:groupId', _auth.auth, validateGroupMessage, async (req, res) => {
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
    const messages = await _messageService.default.sendGroupMessage(req.user.id, groupId, req.body);
    res.status(201).json(messages);
  } catch (error) {
    _logger.default.error('Send group message error:', error);
    res.status(400).json({
      message: error.message || 'Failed to send group message'
    });
  }
});

// Get direct messages between users
router.get('/direct/:userId', _auth.auth, async (req, res) => {
  try {
    const {
      userId
    } = req.params;
    const {
      before,
      after,
      limit
    } = req.query;
    const messages = await _messageService.default.getDirectMessages(req.user.id, userId, {
      before,
      after,
      limit: parseInt(limit) || 50
    });
    res.json(messages);
  } catch (error) {
    _logger.default.error('Get direct messages error:', error);
    res.status(400).json({
      message: error.message || 'Failed to get messages'
    });
  }
});

// Get group messages
router.get('/group/:groupId', _auth.auth, async (req, res) => {
  try {
    const {
      groupId
    } = req.params;
    const {
      before,
      after,
      limit
    } = req.query;
    const messages = await _messageService.default.getGroupMessages(groupId, req.user.id, {
      before,
      after,
      limit: parseInt(limit) || 50
    });
    res.json(messages);
  } catch (error) {
    _logger.default.error('Get group messages error:', error);
    res.status(400).json({
      message: error.message || 'Failed to get group messages'
    });
  }
});

// Edit message
router.put('/:messageId', _auth.auth, validateMessage, async (req, res) => {
  try {
    const errors = (0, _expressValidator.validationResult)(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }
    const {
      messageId
    } = req.params;
    const {
      content
    } = req.body;
    const message = await _messageService.default.editMessage(messageId, req.user.id, content);
    res.json(message);
  } catch (error) {
    _logger.default.error('Edit message error:', error);
    res.status(400).json({
      message: error.message || 'Failed to edit message'
    });
  }
});

// Delete message
router.delete('/:messageId', _auth.auth, async (req, res) => {
  try {
    const {
      messageId
    } = req.params;
    await _messageService.default.deleteMessage(messageId, req.user.id);
    res.json({
      message: 'Message deleted successfully'
    });
  } catch (error) {
    _logger.default.error('Delete message error:', error);
    res.status(400).json({
      message: error.message || 'Failed to delete message'
    });
  }
});

// Mark message as read
router.post('/:messageId/read', _auth.auth, async (req, res) => {
  try {
    const {
      messageId
    } = req.params;
    const message = await _messageService.default.markAsRead(messageId, req.user.id);
    res.json(message);
  } catch (error) {
    _logger.default.error('Mark message as read error:', error);
    res.status(400).json({
      message: error.message || 'Failed to mark message as read'
    });
  }
});

// Add reaction to message
router.post('/:messageId/reactions', _auth.auth, async (req, res) => {
  try {
    const {
      messageId
    } = req.params;
    const {
      type
    } = req.body;
    if (!type) {
      return res.status(400).json({
        message: 'Reaction type is required'
      });
    }
    const message = await _messageService.default.addReaction(messageId, req.user.id, type);
    res.json(message);
  } catch (error) {
    _logger.default.error('Add reaction error:', error);
    res.status(400).json({
      message: error.message || 'Failed to add reaction'
    });
  }
});

// Remove reaction from message
router.delete('/:messageId/reactions', _auth.auth, async (req, res) => {
  try {
    const {
      messageId
    } = req.params;
    const message = await _messageService.default.removeReaction(messageId, req.user.id);
    res.json(message);
  } catch (error) {
    _logger.default.error('Remove reaction error:', error);
    res.status(400).json({
      message: error.message || 'Failed to remove reaction'
    });
  }
});
var _default = exports.default = router;