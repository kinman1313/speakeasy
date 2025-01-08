import Message from '../models/Message.js';
import User from '../models/User.js';
import Group from '../models/Group.js';
import messageEncryptionService from './messageEncryptionService.js';
import logger from '../utils/logger.js';

class MessageService {
    // Send direct message
    async sendDirectMessage(senderId, recipientId, messageData) {
        try {
            const [sender, recipient] = await Promise.all([
                User.findById(senderId),
                User.findById(recipientId)
            ]);

            if (!sender || !recipient) {
                throw new Error('Sender or recipient not found');
            }

            // Check if users are friends or if recipient has blocked sender
            if (!sender.friends.includes(recipientId) || recipient.blockedUsers.includes(senderId)) {
                throw new Error('Cannot send message to this user');
            }

            // Encrypt message content
            const encryptedMessage = await messageEncryptionService.encryptMessage(
                senderId,
                recipientId,
                messageData.content
            );

            const message = new Message({
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
            logger.error('Error in sending direct message:', error);
            throw error;
        }
    }

    // Send group message
    async sendGroupMessage(senderId, groupId, messageData) {
        try {
            const [sender, group] = await Promise.all([
                User.findById(senderId),
                Group.findById(groupId).populate('members.user')
            ]);

            if (!sender || !group) {
                throw new Error('Sender or group not found');
            }

            // Check if sender is group member
            const memberIndex = group.members.findIndex(
                member => member.user._id.toString() === senderId.toString()
            );

            if (memberIndex === -1) {
                throw new Error('Sender is not a group member');
            }

            // Check group posting permissions
            if (
                group.settings.onlyAdminsCanPost &&
                !group.admins.includes(senderId)
            ) {
                throw new Error('Only admins can post in this group');
            }

            // Get recipients (all group members except sender)
            const recipients = group.members
                .filter(member => member.user._id.toString() !== senderId.toString())
                .map(member => member.user._id);

            // Encrypt message for each recipient
            const encryptedMessages = await messageEncryptionService.encryptGroupMessage(
                groupId,
                senderId,
                messageData.content,
                recipients
            );

            // Create messages for each recipient
            const messages = await Promise.all(
                encryptedMessages.messages.map(async (encryptedMsg) => {
                    const message = new Message({
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
                        message.expiresAt = new Date(
                            Date.now() + group.settings.disappearingMessages.timer * 1000
                        );
                    }

                    // Handle replies
                    if (messageData.replyTo) {
                        message.replyTo = messageData.replyTo;
                    }

                    await message.save();
                    return message;
                })
            );

            // Update group metadata
            group.metadata.totalMessages += 1;
            group.metadata.lastActivity = new Date();
            await group.save();

            return messages;
        } catch (error) {
            logger.error('Error in sending group message:', error);
            throw error;
        }
    }

    // Get messages between users
    async getDirectMessages(user1Id, user2Id, options = {}) {
        try {
            const messages = await Message.getMessagesBetweenUsers(user1Id, user2Id, options);

            // Decrypt messages for the requesting user
            const decryptedMessages = await Promise.all(
                messages.map(async (message) => {
                    try {
                        const decryptedMessage = await messageEncryptionService.decryptMessage({
                            senderId: message.sender._id,
                            recipientId: message.recipient._id,
                            content: message.encryptedContent
                        });

                        return {
                            ...message,
                            content: decryptedMessage.content
                        };
                    } catch (error) {
                        logger.error(`Error decrypting message ${message._id}:`, error);
                        return {
                            ...message,
                            content: '[Unable to decrypt message]'
                        };
                    }
                })
            );

            return decryptedMessages;
        } catch (error) {
            logger.error('Error in getting direct messages:', error);
            throw error;
        }
    }

    // Get group messages
    async getGroupMessages(groupId, userId, options = {}) {
        try {
            const group = await Group.findById(groupId);
            if (!group) {
                throw new Error('Group not found');
            }

            // Check if user is group member
            if (!group.members.some(member => member.user.toString() === userId.toString())) {
                throw new Error('User is not a group member');
            }

            const messages = await Message.find({
                group: groupId,
                recipient: userId
            })
                .sort({ createdAt: options.sort || -1 })
                .limit(options.limit || 50)
                .populate('sender', 'username avatar')
                .populate('replyTo')
                .lean();

            // Decrypt messages
            const decryptedMessages = await Promise.all(
                messages.map(async (message) => {
                    try {
                        const decryptedMessage = await messageEncryptionService.decryptMessage({
                            senderId: message.sender._id,
                            recipientId: userId,
                            content: message.encryptedContent
                        });

                        return {
                            ...message,
                            content: decryptedMessage.content
                        };
                    } catch (error) {
                        logger.error(`Error decrypting message ${message._id}:`, error);
                        return {
                            ...message,
                            content: '[Unable to decrypt message]'
                        };
                    }
                })
            );

            return decryptedMessages;
        } catch (error) {
            logger.error('Error in getting group messages:', error);
            throw error;
        }
    }

    // Edit message
    async editMessage(messageId, userId, newContent) {
        try {
            const message = await Message.findById(messageId);
            if (!message) {
                throw new Error('Message not found');
            }

            // Check if user is the sender
            if (message.sender.toString() !== userId.toString()) {
                throw new Error('Not authorized to edit this message');
            }

            // Re-encrypt the new content
            const encryptedMessage = await messageEncryptionService.encryptMessage(
                userId,
                message.recipient,
                newContent
            );

            await message.edit(newContent);
            message.encryptedContent = encryptedMessage.content;
            await message.save();

            return message;
        } catch (error) {
            logger.error('Error in editing message:', error);
            throw error;
        }
    }

    // Delete message
    async deleteMessage(messageId, userId) {
        try {
            const message = await Message.findById(messageId);
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
            logger.error('Error in deleting message:', error);
            throw error;
        }
    }

    // Mark message as read
    async markAsRead(messageId, userId) {
        try {
            const message = await Message.findById(messageId);
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
            logger.error('Error in marking message as read:', error);
            throw error;
        }
    }

    // Add reaction to message
    async addReaction(messageId, userId, reactionType) {
        try {
            const message = await Message.findById(messageId);
            if (!message) {
                throw new Error('Message not found');
            }

            await message.addReaction(userId, reactionType);
            return message;
        } catch (error) {
            logger.error('Error in adding reaction:', error);
            throw error;
        }
    }

    // Remove reaction from message
    async removeReaction(messageId, userId) {
        try {
            const message = await Message.findById(messageId);
            if (!message) {
                throw new Error('Message not found');
            }

            await message.removeReaction(userId);
            return message;
        } catch (error) {
            logger.error('Error in removing reaction:', error);
            throw error;
        }
    }
}

// Create singleton instance
const messageService = new MessageService();

export default messageService; 