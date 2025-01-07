const signalProtocolManager = require('../encryption/signalProtocol');
const SignalProtocolStore = require('../encryption/signalStore');
const logger = require('../utils/logger');

class MessageEncryptionService {
    constructor() {
        this.protocolStore = new SignalProtocolStore();
    }

    async initialize() {
        try {
            await signalProtocolManager.initialize();
            logger.info('Signal Protocol initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize Signal Protocol:', error);
            throw error;
        }
    }

    async setupUserEncryption(userId) {
        try {
            // Generate identity key pair for the user
            const identityKeyPair = await signalProtocolManager.generateIdentityKeyPair(userId);
            await this.protocolStore.saveIdentity(userId, identityKeyPair.publicKey);

            // Generate initial PreKey bundle
            const preKeyBundle = await signalProtocolManager.generatePreKeyBundle(userId, 1, 10);

            return {
                identityKey: identityKeyPair.publicKey,
                preKeyBundle
            };
        } catch (error) {
            logger.error(`Failed to setup encryption for user ${userId}:`, error);
            throw error;
        }
    }

    async establishSession(senderId, recipientId) {
        try {
            // Get recipient's PreKey bundle
            const recipientPreKeyBundle = await signalProtocolManager.generatePreKeyBundle(recipientId, 1, 1);

            // Create session
            const session = await signalProtocolManager.createSession(senderId, recipientId, recipientPreKeyBundle);

            return session;
        } catch (error) {
            logger.error(`Failed to establish session between ${senderId} and ${recipientId}:`, error);
            throw error;
        }
    }

    async encryptMessage(senderId, recipientId, message) {
        try {
            // Ensure session exists
            if (!signalProtocolManager.getSessionState(senderId, recipientId)) {
                await this.establishSession(senderId, recipientId);
            }

            // Encrypt the message
            const encryptedMessage = await signalProtocolManager.encryptMessage(senderId, recipientId, message);

            return {
                type: 'signal',
                senderId,
                recipientId,
                content: encryptedMessage
            };
        } catch (error) {
            logger.error(`Failed to encrypt message from ${senderId} to ${recipientId}:`, error);
            throw error;
        }
    }

    async decryptMessage(message) {
        try {
            const { senderId, recipientId, content } = message;

            // Ensure session exists
            if (!signalProtocolManager.getSessionState(senderId, recipientId)) {
                throw new Error('No session found for decryption');
            }

            // Decrypt the message
            const decryptedMessage = await signalProtocolManager.decryptMessage(senderId, recipientId, content);

            return {
                senderId,
                recipientId,
                content: decryptedMessage
            };
        } catch (error) {
            logger.error('Failed to decrypt message:', error);
            throw error;
        }
    }

    // Group messaging encryption
    async setupGroupSession(groupId, participants) {
        try {
            const sessions = new Map();

            // Establish sessions between all participants
            for (const senderId of participants) {
                for (const recipientId of participants) {
                    if (senderId !== recipientId) {
                        const session = await this.establishSession(senderId, recipientId);
                        sessions.set(`${senderId}:${recipientId}`, session);
                    }
                }
            }

            return {
                groupId,
                sessions
            };
        } catch (error) {
            logger.error(`Failed to setup group session for ${groupId}:`, error);
            throw error;
        }
    }

    async encryptGroupMessage(groupId, senderId, message, recipients) {
        try {
            const encryptedMessages = [];

            // Encrypt message for each recipient
            for (const recipientId of recipients) {
                if (recipientId !== senderId) {
                    const encryptedMessage = await this.encryptMessage(senderId, recipientId, message);
                    encryptedMessages.push(encryptedMessage);
                }
            }

            return {
                groupId,
                messages: encryptedMessages
            };
        } catch (error) {
            logger.error(`Failed to encrypt group message for ${groupId}:`, error);
            throw error;
        }
    }

    // Clean up methods
    async closeSession(senderId, recipientId) {
        try {
            await signalProtocolManager.destroySession(senderId, recipientId);
            await this.protocolStore.removeAllSessions(`${senderId}:${recipientId}`);
        } catch (error) {
            logger.error(`Failed to close session between ${senderId} and ${recipientId}:`, error);
            throw error;
        }
    }
}

// Create a singleton instance
const messageEncryptionService = new MessageEncryptionService();

module.exports = messageEncryptionService; 