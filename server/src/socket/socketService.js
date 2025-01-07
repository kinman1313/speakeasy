const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const messageService = require('../services/messageService');
const messageEncryptionService = require('../services/messageEncryptionService');
const logger = require('../utils/logger');

class SocketService {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map();
    }

    initialize(server) {
        this.io = socketIo(server, {
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

                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.id);

                if (!user) {
                    return next(new Error('User not found'));
                }

                socket.user = user;
                next();
            } catch (error) {
                logger.error('Socket authentication error:', error);
                next(new Error('Authentication error'));
            }
        });

        this.io.on('connection', this.handleConnection.bind(this));
    }

    handleConnection(socket) {
        const userId = socket.user._id.toString();
        logger.info(`User connected: ${userId}`);

        // Store user connection
        this.connectedUsers.set(userId, socket.id);

        // Update user status
        this.updateUserStatus(userId, 'online');

        // Handle direct messages
        socket.on('direct-message', async (data) => {
            try {
                const { recipientId, content, type = 'text', clientMessageId } = data;

                const message = await messageService.sendDirectMessage(userId, recipientId, {
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
                    const decryptedMessage = await messageEncryptionService.decryptMessage({
                        senderId: userId,
                        recipientId,
                        content: message.encryptedContent
                    });

                    this.io.to(recipientSocketId).emit('new-message', {
                        ...message.toObject(),
                        content: decryptedMessage.content
                    });
                }
            } catch (error) {
                logger.error('Error handling direct message:', error);
                socket.emit('message-error', {
                    error: error.message,
                    clientMessageId: data.clientMessageId
                });
            }
        });

        // Handle group messages
        socket.on('group-message', async (data) => {
            try {
                const { groupId, content, type = 'text', clientMessageId } = data;

                const messages = await messageService.sendGroupMessage(userId, groupId, {
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
                messages.forEach(async (message) => {
                    const recipientSocketId = this.connectedUsers.get(message.recipient.toString());
                    if (recipientSocketId) {
                        // Decrypt message for recipient
                        const decryptedMessage = await messageEncryptionService.decryptMessage({
                            senderId: userId,
                            recipientId: message.recipient,
                            content: message.encryptedContent
                        });

                        this.io.to(recipientSocketId).emit('new-group-message', {
                            ...message.toObject(),
                            content: decryptedMessage.content,
                            groupId
                        });
                    }
                });
            } catch (error) {
                logger.error('Error handling group message:', error);
                socket.emit('message-error', {
                    error: error.message,
                    clientMessageId: data.clientMessageId
                });
            }
        });

        // Handle message read status
        socket.on('mark-as-read', async (data) => {
            try {
                const { messageId } = data;
                await messageService.markAsRead(messageId, userId);

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
                logger.error('Error marking message as read:', error);
            }
        });

        // Handle typing status
        socket.on('typing-start', (data) => {
            const { recipientId, groupId } = data;

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

        socket.on('typing-stop', (data) => {
            const { recipientId, groupId } = data;

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
        socket.on('set-status', async (status) => {
            try {
                await this.updateUserStatus(userId, status);
            } catch (error) {
                logger.error('Error updating user status:', error);
            }
        });

        // Handle disconnection
        socket.on('disconnect', async () => {
            logger.info(`User disconnected: ${userId}`);

            this.connectedUsers.delete(userId);
            await this.updateUserStatus(userId, 'offline');
        });

        // Handle errors
        socket.on('error', (error) => {
            logger.error('Socket error:', error);
        });
    }

    async updateUserStatus(userId, status) {
        try {
            const user = await User.findById(userId);
            if (user) {
                user.status = status;
                user.lastSeen = new Date();
                await user.save();

                // Broadcast status change to friends
                const friends = user.friends;
                friends.forEach((friendId) => {
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
            logger.error('Error updating user status:', error);
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
        userIds.forEach((userId) => {
            this.broadcastToUser(userId, event, data);
        });
    }

    broadcastToRoom(room, event, data) {
        this.io.to(room).emit(event, data);
    }
}

// Create singleton instance
const socketService = new SocketService();

module.exports = socketService; 