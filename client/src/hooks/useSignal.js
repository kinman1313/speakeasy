import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import SignalClient from '@signalapp/libsignal-client';
import { SignalProtocolStore } from '../utils/SignalStore';
import { useSnackbar } from './useSnackbar';

const store = new SignalProtocolStore();

export function useSignal() {
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
    const [signalClient, setSignalClient] = useState(null);

    useEffect(() => {
        const initSignal = async () => {
            try {
                // Load the WASM module
                const signal = await SignalClient.load();
                setSignalClient(signal);
            } catch (error) {
                console.error('Error initializing Signal client:', error);
                showSnackbar('Error initializing encryption', 'error');
            }
        };
        initSignal();
    }, [showSnackbar]);

  const encryptMessage = useCallback(
    async (recipientId, message) => {
          if (!signalClient) {
              throw new Error('Signal client not initialized');
          }
      try {
          const sessionBuilder = new signalClient.SessionBuilder(store, recipientId);
          const sessionCipher = new signalClient.SessionCipher(store, recipientId);
          const ciphertext = await sessionCipher.encrypt(new TextEncoder().encode(message));
        return window.btoa(JSON.stringify(ciphertext));
      } catch (error) {
        console.error('Error encrypting message:', error);
        showSnackbar('Error encrypting message', 'error');
        throw error;
      }
    },
      [signalClient, showSnackbar]
  );

  const decryptMessage = useCallback(
    async (senderId, encryptedMessage) => {
          if (!signalClient) {
              throw new Error('Signal client not initialized');
          }
      try {
          const sessionCipher = new signalClient.SessionCipher(store, senderId);
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
    },
      [signalClient, showSnackbar]
  );

  const generatePreKey = useCallback(async () => {
      if (!signalClient) {
          throw new Error('Signal client not initialized');
      }
    try {
      const keyId = Math.floor(Math.random() * 10000);
        const keyPair = await signalClient.KeyHelper.generatePreKey(keyId);
      await store.storePreKey(keyId, keyPair.keyPair);
      return {
        keyId: keyPair.keyId,
        publicKey: keyPair.keyPair.pubKey,
      };
    } catch (error) {
      console.error('Error generating pre-key:', error);
      showSnackbar('Error generating encryption keys', 'error');
      throw error;
    }
  }, [signalClient, showSnackbar]);

  const generateSignedPreKey = useCallback(
    async identityKeyPair => {
          if (!signalClient) {
              throw new Error('Signal client not initialized');
          }
      try {
        const keyId = Math.floor(Math.random() * 10000);
          const signedKeyPair = await signalClient.KeyHelper.generateSignedPreKey(
          identityKeyPair,
          keyId
        );
        await store.storeSignedPreKey(signedKeyPair.keyId, signedKeyPair.keyPair);
        return {
          keyId: signedKeyPair.keyId,
          publicKey: signedKeyPair.keyPair.pubKey,
          signature: signedKeyPair.signature,
        };
      } catch (error) {
        console.error('Error generating signed pre-key:', error);
        showSnackbar('Error generating encryption keys', 'error');
        throw error;
      }
    },
      [signalClient, showSnackbar]
  );

  const generateIdentityKeyPair = useCallback(async () => {
      if (!signalClient) {
          throw new Error('Signal client not initialized');
      }
    try {
        const identityKeyPair = await signalClient.KeyHelper.generateIdentityKeyPair();
      await store.saveIdentity(user.id, identityKeyPair.pubKey);
      return identityKeyPair;
    } catch (error) {
      console.error('Error generating identity key pair:', error);
      showSnackbar('Error generating encryption keys', 'error');
      throw error;
    }
  }, [signalClient, user.id, showSnackbar]);

  const generateRegistrationId = useCallback(async () => {
      if (!signalClient) {
          throw new Error('Signal client not initialized');
      }
    try {
        const registrationId = await signalClient.KeyHelper.generateRegistrationId();
      await store.storeLocalRegistrationId(registrationId);
      return registrationId;
    } catch (error) {
      console.error('Error generating registration ID:', error);
      showSnackbar('Error generating encryption keys', 'error');
      throw error;
    }
  }, [signalClient, showSnackbar]);

  return {
    encryptMessage,
    decryptMessage,
    generatePreKey,
    generateSignedPreKey,
    generateIdentityKeyPair,
    generateRegistrationId,
    store,
      isInitialized: !!signalClient
  };
}
