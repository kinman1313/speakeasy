import * as SignalClient from '@signalapp/libsignal-client';
import crypto from 'crypto';

export class SignalProtocolManager {
    constructor() {
        this.sessions = new Map();
        this.preKeyBundles = new Map();
        this.identityKeys = new Map();
    }

    async initialize() {
        try {
            // No initialization needed for newer versions
            return Promise.resolve();
        } catch (error) {
            console.error('Failed to initialize Signal Protocol:', error);
            throw error;
        }
    }

    async generateIdentityKeyPair(userId) {
        try {
            const identityKeyPair = SignalClient.PrivateKey.generate();
            const publicKey = identityKeyPair.getPublicKey();
            this.identityKeys.set(userId, { privateKey: identityKeyPair, publicKey });
            return { privateKey: identityKeyPair, publicKey };
        } catch (error) {
            console.error('Failed to generate identity key pair:', error);
            throw error;
        }
    }

    async generatePreKeyBundle(userId, startId, count) {
        try {
            const identityKeyPair = this.identityKeys.get(userId);
            if (!identityKeyPair) {
                throw new Error('Identity key pair not found');
            }

            const preKeys = [];
            for (let i = startId; i < startId + count; i++) {
                const preKey = SignalClient.PrivateKey.generate();
                preKeys.push({
                    id: i,
                    privateKey: preKey,
                    publicKey: preKey.getPublicKey()
                });
            }

            const signedPreKey = SignalClient.PrivateKey.generate();
            const signature = identityKeyPair.privateKey.sign(
                signedPreKey.getPublicKey().serialize()
            );

            const bundle = {
                identityKey: identityKeyPair.publicKey,
                registrationId: crypto.randomInt(1, 16383),
                preKeys,
                signedPreKey: {
                    id: startId + count,
                    publicKey: signedPreKey.getPublicKey(),
                    signature
                }
            };

            this.preKeyBundles.set(userId, bundle);
            return bundle;
        } catch (error) {
            console.error('Failed to generate pre-key bundle:', error);
            throw error;
        }
    }

    async createSession(senderId, recipientId, preKeyBundle) {
        const senderIdentityKey = this.identityKeys.get(senderId);
        if (!senderIdentityKey) {
            throw new Error('Sender identity key not found');
        }

        const sessionBuilder = new SignalClient.SessionBuilder(
            new SignalClient.SignalProtocolAddress(recipientId, 1),
            new SignalClient.SignalProtocolStore()
        );

        await sessionBuilder.processPreKeyBundle(preKeyBundle);

        const session = {
            sessionBuilder,
            sessionCipher: new SignalClient.SessionCipher(
                new SignalClient.SignalProtocolAddress(recipientId, 1),
                new SignalClient.SignalProtocolStore()
            )
        };

        this.sessions.set(`${senderId}:${recipientId}`, session);
        return session;
    }

    async encryptMessage(senderId, recipientId, message) {
        const sessionKey = `${senderId}:${recipientId}`;
        const session = this.sessions.get(sessionKey);

        if (!session) {
            throw new Error('Session not found');
        }

        const ciphertext = await session.sessionCipher.encrypt(Buffer.from(message));
        return ciphertext;
    }

    async decryptMessage(senderId, recipientId, encryptedMessage) {
        const sessionKey = `${recipientId}:${senderId}`;
        const session = this.sessions.get(sessionKey);

        if (!session) {
            throw new Error('Session not found');
        }

        const plaintext = await session.sessionCipher.decrypt(encryptedMessage);
        return plaintext.toString();
    }

    // Helper method to get the session state
    getSessionState(senderId, recipientId) {
        const sessionKey = `${senderId}:${recipientId}`;
        return this.sessions.has(sessionKey);
    }

    // Clean up method
    async destroySession(senderId, recipientId) {
        const sessionKey = `${senderId}:${recipientId}`;
        this.sessions.delete(sessionKey);
    }
}

export default new SignalProtocolManager(); 