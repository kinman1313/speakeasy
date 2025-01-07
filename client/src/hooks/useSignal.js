import { useCallback } from 'react';
import { SignalProtocolStore } from '../utils/SignalStore';
import { useAuth } from './useAuth';
import { useSnackbar } from './useSnackbar';

const store = new SignalProtocolStore();

export function useSignal() {
    const { user } = useAuth();
    const { showSnackbar } = useSnackbar();

    const encryptMessage = useCallback(async (recipientId, message) => {
        try {
            const sessionCipher = new window.libsignal.SessionCipher(
                store,
                recipientId
            );

            const ciphertext = await sessionCipher.encrypt(
                new TextEncoder().encode(message)
            );

            return window.btoa(JSON.stringify(ciphertext));
        } catch (error) {
            console.error('Error encrypting message:', error);
            showSnackbar('Error encrypting message', 'error');
            throw error;
        }
    }, [showSnackbar]);

    const decryptMessage = useCallback(async (senderId, encryptedMessage) => {
        try {
            const sessionCipher = new window.libsignal.SessionCipher(
                store,
                senderId
            );

            const ciphertext = JSON.parse(window.atob(encryptedMessage));
            const decrypted = await sessionCipher.decryptPreKeyWhisperMessage(
                ciphertext.body,
                'binary'
            );

            return new TextDecoder().decode(decrypted);
        } catch (error) {
            console.error('Error decrypting message:', error);
            showSnackbar('Error decrypting message', 'error');
            throw error;
        }
    }, [showSnackbar]);

    const generatePreKey = useCallback(async () => {
        try {
            const keyId = Math.floor(Math.random() * 10000);
            const keyPair = await window.libsignal.KeyHelper.generatePreKey(keyId);
            await store.storePreKey(keyId, keyPair.keyPair);
            return {
                keyId: keyPair.keyId,
                publicKey: keyPair.keyPair.pubKey
            };
        } catch (error) {
            console.error('Error generating pre-key:', error);
            showSnackbar('Error generating encryption keys', 'error');
            throw error;
        }
    }, [showSnackbar]);

    const generateSignedPreKey = useCallback(async (identityKeyPair) => {
        try {
            const keyId = Math.floor(Math.random() * 10000);
            const signedKeyPair = await window.libsignal.KeyHelper.generateSignedPreKey(
                identityKeyPair,
                keyId
            );
            await store.storeSignedPreKey(signedKeyPair.keyId, signedKeyPair.keyPair);
            return {
                keyId: signedKeyPair.keyId,
                publicKey: signedKeyPair.keyPair.pubKey,
                signature: signedKeyPair.signature
            };
        } catch (error) {
            console.error('Error generating signed pre-key:', error);
            showSnackbar('Error generating encryption keys', 'error');
            throw error;
        }
    }, [showSnackbar]);

    const generateIdentityKeyPair = useCallback(async () => {
        try {
            const identityKeyPair = await window.libsignal.KeyHelper.generateIdentityKeyPair();
            await store.saveIdentity(user.id, identityKeyPair.pubKey);
            return identityKeyPair;
        } catch (error) {
            console.error('Error generating identity key pair:', error);
            showSnackbar('Error generating encryption keys', 'error');
            throw error;
        }
    }, [user.id, showSnackbar]);

    const generateRegistrationId = useCallback(async () => {
        try {
            const registrationId = await window.libsignal.KeyHelper.generateRegistrationId();
            await store.storeLocalRegistrationId(registrationId);
            return registrationId;
        } catch (error) {
            console.error('Error generating registration ID:', error);
            showSnackbar('Error generating encryption keys', 'error');
            throw error;
        }
    }, [showSnackbar]);

    return {
        encryptMessage,
        decryptMessage,
        generatePreKey,
        generateSignedPreKey,
        generateIdentityKeyPair,
        generateRegistrationId,
        store
    };
} 