"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.socketService = void 0;
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _socket = require("socket.io");
var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));
var _User = require("../models/User.js");
var _messageService = _interopRequireDefault(require("../services/messageService.js"));
var _messageEncryptionService = _interopRequireDefault(require("../services/messageEncryptionService.js"));
var _logger = _interopRequireDefault(require("../utils/logger.js"));
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { (0, _defineProperty2.default)(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
  }
  initialize(server) {
    this.io = new _socket.Server(server, {
      cors: {
        origin: process.env.CLIENT_URL,
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket'],
      upgrade: false
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }
        const decoded = _jsonwebtoken.default.verify(token, process.env.JWT_SECRET);
        const user = await _User.User.findById(decoded.id);
        if (!user) {
          return next(new Error('User not found'));
        }
        socket.user = user;
        next();
      } catch (error) {
        _logger.default.error('Socket authentication error:', error);
        next(new Error('Authentication error'));
      }
    });
    this.io.on('connection', this.handleConnection.bind(this));
  }
  handleConnection(socket) {
    const userId = socket.user._id.toString();
    _logger.default.info(`User connected: ${userId}`);

    // Store user connection
    this.connectedUsers.set(userId, socket.id);

    // Update user status
    this.updateUserStatus(userId, 'online');

    // Handle direct messages
    socket.on('direct-message', async data => {
      try {
        const {
          recipientId,
          content,
          type = 'text',
          clientMessageId
        } = data;
        const message = await _messageService.default.sendDirectMessage(userId, recipientId, {
          content,
          type,
          clientMessageId
        });

        // Emit to sender
        socket.emit('message-sent', {
          messageId: message._id,
          clientMessageId,
          status: 'sent'
        });

        // Emit to recipient if online
        const recipientSocketId = this.connectedUsers.get(recipientId);
        if (recipientSocketId) {
          // Decrypt message for recipient
          const decryptedMessage = await _messageEncryptionService.default.decryptMessage({
            senderId: userId,
            recipientId,
            content: message.encryptedContent
          });
          this.io.to(recipientSocketId).emit('new-message', _objectSpread(_objectSpread({}, message.toObject()), {}, {
            content: decryptedMessage.content
          }));
        }
      } catch (error) {
        _logger.default.error('Error handling direct message:', error);
        socket.emit('message-error', {
          error: error.message,
          clientMessageId: data.clientMessageId
        });
      }
    });

    // Handle group messages
    socket.on('group-message', async data => {
      try {
        const {
          groupId,
          content,
          type = 'text',
          clientMessageId
        } = data;
        const messages = await _messageService.default.sendGroupMessage(userId, groupId, {
          content,
          type,
          clientMessageId
        });

        // Emit to sender
        socket.emit('message-sent', {
          messageId: messages[0]._id,
          clientMessageId,
          status: 'sent'
        });

        // Emit to all online group members
        messages.forEach(async message => {
          const recipientSocketId = this.connectedUsers.get(message.recipient.toString());
          if (recipientSocketId) {
            // Decrypt message for recipient
            const decryptedMessage = await _messageEncryptionService.default.decryptMessage({
              senderId: userId,
              recipientId: message.recipient,
              content: message.encryptedContent
            });
            this.io.to(recipientSocketId).emit('new-group-message', _objectSpread(_objectSpread({}, message.toObject()), {}, {
              content: decryptedMessage.content,
              groupId
            }));
          }
        });
      } catch (error) {
        _logger.default.error('Error handling group message:', error);
        socket.emit('message-error', {
          error: error.message,
          clientMessageId: data.clientMessageId
        });
      }
    });

    // Handle message read status
    socket.on('mark-as-read', async data => {
      try {
        const {
          messageId
        } = data;
        await _messageService.default.markAsRead(messageId, userId);

        // Emit to message sender if online
        const message = await Message.findById(messageId);
        if (message) {
          const senderSocketId = this.connectedUsers.get(message.sender.toString());
          if (senderSocketId) {
            this.io.to(senderSocketId).emit('message-read', {
              messageId,
              readBy: userId,
              readAt: new Date()
            });
          }
        }
      } catch (error) {
        _logger.default.error('Error marking message as read:', error);
      }
    });

    // Handle typing status
    socket.on('typing-start', data => {
      const {
        recipientId,
        groupId
      } = data;
      if (groupId) {
        socket.to(groupId).emit('user-typing', {
          userId,
          groupId
        });
      } else if (recipientId) {
        const recipientSocketId = this.connectedUsers.get(recipientId);
        if (recipientSocketId) {
          this.io.to(recipientSocketId).emit('user-typing', {
            userId
          });
        }
      }
    });
    socket.on('typing-stop', data => {
      const {
        recipientId,
        groupId
      } = data;
      if (groupId) {
        socket.to(groupId).emit('user-stopped-typing', {
          userId,
          groupId
        });
      } else if (recipientId) {
        const recipientSocketId = this.connectedUsers.get(recipientId);
        if (recipientSocketId) {
          this.io.to(recipientSocketId).emit('user-stopped-typing', {
            userId
          });
        }
      }
    });

    // Handle user presence
    socket.on('set-status', async status => {
      try {
        await this.updateUserStatus(userId, status);
      } catch (error) {
        _logger.default.error('Error updating user status:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      _logger.default.info(`User disconnected: ${userId}`);
      this.connectedUsers.delete(userId);
      await this.updateUserStatus(userId, 'offline');
    });

    // Handle errors
    socket.on('error', error => {
      _logger.default.error('Socket error:', error);
    });
  }
  async updateUserStatus(userId, status) {
    try {
      const user = await _User.User.findById(userId);
      if (user) {
        user.status = status;
        user.lastSeen = new Date();
        await user.save();

        // Broadcast status change to friends
        const friends = user.friends;
        friends.forEach(friendId => {
          const friendSocketId = this.connectedUsers.get(friendId.toString());
          if (friendSocketId) {
            this.io.to(friendSocketId).emit('user-status-changed', {
              userId,
              status,
              lastSeen: user.lastSeen
            });
          }
        });
      }
    } catch (error) {
      _logger.default.error('Error updating user status:', error);
    }
  }

  // Utility methods
  isUserOnline(userId) {
    return this.connectedUsers.has(userId.toString());
  }
  getUserSocketId(userId) {
    return this.connectedUsers.get(userId.toString());
  }
  broadcastToUser(userId, event, data) {
    const socketId = this.getUserSocketId(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }
  broadcastToUsers(userIds, event, data) {
    userIds.forEach(userId => {
      this.broadcastToUser(userId, event, data);
    });
  }
  broadcastToRoom(room, event, data) {
    this.io.to(room).emit(event, data);
  }
}

// Create singleton instance
const socketService = exports.socketService = new SocketService();