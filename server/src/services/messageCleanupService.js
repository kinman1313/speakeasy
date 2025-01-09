import logger from '../utils/logger.js';
import Message from '../models/Message.js';

class MessageCleanupService {
    constructor(io) {
        this.io = io;
        this.cleanupInterval = null;
        this.isRunning = false;
    }

    start() {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredMessages();
        }, 60000); // Check every minute

        logger.info('Message cleanup service started');
    }

    stop() {
        if (!this.isRunning) {
            return;
        }

        clearInterval(this.cleanupInterval);
        this.isRunning = false;
        logger.info('Message cleanup service stopped');
    }

    async cleanupExpiredMessages() {
        try {
            const now = new Date();

            // Find and delete expired messages
            const expiredMessages = await Message.find({
                expiresAt: { $lte: now },
                expiresAt: { $ne: null }
            });

            if (expiredMessages.length > 0) {
                // Delete the messages
                await Message.deleteMany({
                    _id: { $in: expiredMessages.map(msg => msg._id) }
                });

                // Notify clients about deleted messages
                expiredMessages.forEach(message => {
                    this.io.to(message.chatId).emit('messageExpired', {
                        messageId: message._id,
                        chatId: message.chatId
                    });
                });

                logger.info(`Cleaned up ${expiredMessages.length} expired messages`);
            }
        } catch (error) {
            logger.error('Error in message cleanup:', error);
        }
    }
}

export default MessageCleanupService; 