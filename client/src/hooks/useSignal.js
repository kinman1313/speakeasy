import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSignalComponents } from '../utils/signal-wrapper';
import { SignalProtocolStore } from '../utils/SignalStore';
import { useSnackbar } from './useSnackbar';

const store = new SignalProtocolStore();

export function useSignal() {
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [signalComponents, setSignalComponents] = useState(null);

    useEffect(() => {
        const initSignal = async () => {
            try {
              const components = await getSignalComponents();
              setSignalComponents(components);
            } catch (error) {
                console.error('Error initializing Signal client:', error);
                showSnackbar('Error initializing encryption', 'error');
            }
        };
        initSignal();
    }, [showSnackbar]);

  const encryptMessage = useCallback(
    async (recipientId, message) => {
      if (!signalComponents) {
        throw new Error('Signal client not initialized');
      }
      try {
          const { SessionBuilder, SessionCipher } = signalComponents;
          const sessionBuilder = new SessionBuilder(store, recipientId);
          const sessionCipher = new SessionCipher(store, recipientId);
          const ciphertext = await sessionCipher.encrypt(new TextEncoder().encode(message));
        return window.btoa(JSON.stringify(ciphertext));
      } catch (error) {
        console.error('Error encrypting message:', error);
        showSnackbar('Error encrypting message', 'error');
        throw error;
      }
    },
    [signalComponents, showSnackbar]
  );

  const decryptMessage = useCallback(
    async (senderId, encryptedMessage) => {
      if (!signalComponents) {
        throw new Error('Signal client not initialized');
      }
      try {
        const { SessionCipher } = signalComponents;
        const sessionCipher = new SessionCipher(store, senderId);
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
    [signalComponents, showSnackbar]
  );

  const generatePreKey = useCallback(async () => {
    if (!signalComponents) {
      throw new Error('Signal client not initialized');
      }
    try {
        const { KeyHelper } = signalComponents;
        const keyId = Math.floor(Math.random() * 10000);
        const keyPair = await KeyHelper.generatePreKey(keyId);
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
  }, [signalComponents, showSnackbar]);

  const generateSignedPreKey = useCallback(
    async identityKeyPair => {
      if (!signalComponents) {
        throw new Error('Signal client not initialized');
      }
      try {
          const { KeyHelper } = signalComponents;
          const keyId = Math.floor(Math.random() * 10000);
        const signedKeyPair = await KeyHelper.generateSignedPreKey(
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
    [signalComponents, showSnackbar]
  );

  const generateIdentityKeyPair = useCallback(async () => {
    if (!signalComponents) {
      throw new Error('Signal client not initialized');
      }
    try {
        const { KeyHelper } = signalComponents;
        const identityKeyPair = await KeyHelper.generateIdentityKeyPair();
        await store.saveIdentity(user.id, identityKeyPair.pubKey);
        return identityKeyPair;
      } catch (error) {
        console.error('Error generating identity key pair:', error);
        showSnackbar('Error generating encryption keys', 'error');
        throw error;
      }
  }, [signalComponents, user.id, showSnackbar]);

  const generateRegistrationId = useCallback(async () => {
    if (!signalComponents) {
      throw new Error('Signal client not initialized');
      }
    try {
        const { KeyHelper } = signalComponents;
        const registrationId = await KeyHelper.generateRegistrationId();
        await store.storeLocalRegistrationId(registrationId);
        return registrationId;
      } catch (error) {
        console.error('Error generating registration ID:', error);
        showSnackbar('Error generating encryption keys', 'error');
        throw error;
      }
  }, [signalComponents, showSnackbar]);

  return {
    encryptMessage,
    decryptMessage,
    generatePreKey,
    generateSignedPreKey,
    generateIdentityKeyPair,
    generateRegistrationId,
    store,
    isInitialized: !!signalComponents
  };
}
