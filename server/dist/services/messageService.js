"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _Message = require("../models/Message.js");
var _User = require("../models/User.js");
var _Group = require("../models/Group.js");
var _messageEncryptionService = _interopRequireDefault(require("./messageEncryptionService.js"));
var _logger = _interopRequireDefault(require("../utils/logger.js"));
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { (0, _defineProperty2.default)(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
class MessageService {
  // Send direct message
  async sendDirectMessage(senderId, recipientId, messageData) {
    try {
      const [sender, recipient] = await Promise.all([_User.User.findById(senderId), _User.User.findById(recipientId)]);
      if (!sender || !recipient) {
        throw new Error('Sender or recipient not found');
      }

      // Check if users are friends or if recipient has blocked sender
      if (!sender.friends.includes(recipientId) || recipient.blockedUsers.includes(senderId)) {
        throw new Error('Cannot send message to this user');
      }

      // Encrypt message content
      const encryptedMessage = await _messageEncryptionService.default.encryptMessage(senderId, recipientId, messageData.content);
      const message = new _Message.Message({
        sender: senderId,
        recipient: recipientId,
        type: messageData.type || 'text',
        content: messageData.content,
        encryptedContent: encryptedMessage.content,
        encryptionType: 'signal',
        metadata: {
          clientMessageId: messageData.clientMessageId,
          deviceId: sender.deviceId,
          sessionId: `${senderId}:${recipientId}`
        }
      });

      // Handle attachments if any
      if (messageData.attachments && messageData.attachments.length > 0) {
        message.attachments = messageData.attachments;
      }

      // Handle disappearing messages
      if (messageData.expiresIn) {
        message.expiresAt = new Date(Date.now() + messageData.expiresIn * 1000);
      }

      // Handle replies
      if (messageData.replyTo) {
        message.replyTo = messageData.replyTo;
      }
      await message.save();
      return message;
    } catch (error) {
      _logger.default.error('Error in sending direct message:', error);
      throw error;
    }
  }

  // Send group message
  async sendGroupMessage(senderId, groupId, messageData) {
    try {
      const [sender, group] = await Promise.all([_User.User.findById(senderId), _Group.Group.findById(groupId).populate('members.user')]);
      if (!sender || !group) {
        throw new Error('Sender or group not found');
      }

      // Check if sender is group member
      const memberIndex = group.members.findIndex(member => member.user._id.toString() === senderId.toString());
      if (memberIndex === -1) {
        throw new Error('Sender is not a group member');
      }

      // Check group posting permissions
      if (group.settings.onlyAdminsCanPost && !group.admins.includes(senderId)) {
        throw new Error('Only admins can post in this group');
      }

      // Get recipients (all group members except sender)
      const recipients = group.members.filter(member => member.user._id.toString() !== senderId.toString()).map(member => member.user._id);

      // Encrypt message for each recipient
      const encryptedMessages = await _messageEncryptionService.default.encryptGroupMessage(groupId, senderId, messageData.content, recipients);

      // Create messages for each recipient
      const messages = await Promise.all(encryptedMessages.messages.map(async encryptedMsg => {
        const message = new _Message.Message({
          sender: senderId,
          recipient: encryptedMsg.recipientId,
          group: groupId,
          type: messageData.type || 'text',
          content: messageData.content,
          encryptedContent: encryptedMsg.content,
          encryptionType: 'signal',
          metadata: {
            clientMessageId: messageData.clientMessageId,
            deviceId: sender.deviceId,
            sessionId: `${groupId}:${senderId}:${encryptedMsg.recipientId}`
          }
        });

        // Handle attachments
        if (messageData.attachments && messageData.attachments.length > 0) {
          message.attachments = messageData.attachments;
        }

        // Handle disappearing messages
        if (group.settings.disappearingMessages.enabled) {
          message.expiresAt = new Date(Date.now() + group.settings.disappearingMessages.timer * 1000);
        }

        // Handle replies
        if (messageData.replyTo) {
          message.replyTo = messageData.replyTo;
        }
        await message.save();
        return message;
      }));

      // Update group metadata
      group.metadata.totalMessages += 1;
      group.metadata.lastActivity = new Date();
      await group.save();
      return messages;
    } catch (error) {
      _logger.default.error('Error in sending group message:', error);
      throw error;
    }
  }

  // Get messages between users
  async getDirectMessages(user1Id, user2Id, options = {}) {
    try {
      const messages = await _Message.Message.getMessagesBetweenUsers(user1Id, user2Id, options);

      // Decrypt messages for the requesting user
      const decryptedMessages = await Promise.all(messages.map(async message => {
        try {
          const decryptedMessage = await _messageEncryptionService.default.decryptMessage({
            senderId: message.sender._id,
            recipientId: message.recipient._id,
            content: message.encryptedContent
          });
          return _objectSpread(_objectSpread({}, message), {}, {
            content: decryptedMessage.content
          });
        } catch (error) {
          _logger.default.error(`Error decrypting message ${message._id}:`, error);
          return _objectSpread(_objectSpread({}, message), {}, {
            content: '[Unable to decrypt message]'
          });
        }
      }));
      return decryptedMessages;
    } catch (error) {
      _logger.default.error('Error in getting direct messages:', error);
      throw error;
    }
  }

  // Get group messages
  async getGroupMessages(groupId, userId, options = {}) {
    try {
      const group = await _Group.Group.findById(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      // Check if user is group member
      if (!group.members.some(member => member.user.toString() === userId.toString())) {
        throw new Error('User is not a group member');
      }
      const messages = await _Message.Message.find({
        group: groupId,
        recipient: userId
      }).sort({
        createdAt: options.sort || -1
      }).limit(options.limit || 50).populate('sender', 'username avatar').populate('replyTo').lean();

      // Decrypt messages
      const decryptedMessages = await Promise.all(messages.map(async message => {
        try {
          const decryptedMessage = await _messageEncryptionService.default.decryptMessage({
            senderId: message.sender._id,
            recipientId: userId,
            content: message.encryptedContent
          });
          return _objectSpread(_objectSpread({}, message), {}, {
            content: decryptedMessage.content
          });
        } catch (error) {
          _logger.default.error(`Error decrypting message ${message._id}:`, error);
          return _objectSpread(_objectSpread({}, message), {}, {
            content: '[Unable to decrypt message]'
          });
        }
      }));
      return decryptedMessages;
    } catch (error) {
      _logger.default.error('Error in getting group messages:', error);
      throw error;
    }
  }

  // Edit message
  async editMessage(messageId, userId, newContent) {
    try {
      const message = await _Message.Message.findById(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      // Check if user is the sender
      if (message.sender.toString() !== userId.toString()) {
        throw new Error('Not authorized to edit this message');
      }

      // Re-encrypt the new content
      const encryptedMessage = await _messageEncryptionService.default.encryptMessage(userId, message.recipient, newContent);
      await message.edit(newContent);
      message.encryptedContent = encryptedMessage.content;
      await message.save();
      return message;
    } catch (error) {
      _logger.default.error('Error in editing message:', error);
      throw error;
    }
  }

  // Delete message
  async deleteMessage(messageId, userId) {
    try {
      const message = await _Message.Message.findById(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      // Check if user is the sender
      if (message.sender.toString() !== userId.toString()) {
        throw new Error('Not authorized to delete this message');
      }
      await message.remove();
      return true;
    } catch (error) {
      _logger.default.error('Error in deleting message:', error);
      throw error;
    }
  }

  // Mark message as read
  async markAsRead(messageId, userId) {
    try {
      const message = await _Message.Message.findById(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      // Check if user is the recipient
      if (message.recipient.toString() !== userId.toString()) {
        throw new Error('Not authorized to mark this message as read');
      }
      await message.markAsRead();
      return message;
    } catch (error) {
      _logger.default.error('Error in marking message as read:', error);
      throw error;
    }
  }

  // Add reaction to message
  async addReaction(messageId, userId, reactionType) {
    try {
      const message = await _Message.Message.findById(messageId);
      if (!message) {
        throw new Error('Message not found');
      }
      await message.addReaction(userId, reactionType);
      return message;
    } catch (error) {
      _logger.default.error('Error in adding reaction:', error);
      throw error;
    }
  }

  // Remove reaction from message
  async removeReaction(messageId, userId) {
    try {
      const message = await _Message.Message.findById(messageId);
      if (!message) {
        throw new Error('Message not found');
      }
      await message.removeReaction(userId);
      return message;
    } catch (error) {
      _logger.default.error('Error in removing reaction:', error);
      throw error;
    }
  }
}

// Create singleton instance
const messageService = new MessageService();
var _default = exports.default = messageService;