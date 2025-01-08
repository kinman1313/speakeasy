import { createContext, useContext, useState, useCallback } from 'react';
import * as SignalClient from '@signalapp/libsignal-client';

const SignalContext = createContext();

export function useSignal() {
  return useContext(SignalContext);
}

export function SignalProvider({ children }) {
  const [store, setStore] = useState(null);

  const initializeSignal = useCallback(async userId => {
    try {
      // Initialize Signal Protocol store
      const newStore = new SignalClient.SignalProtocolStore();

      // Generate identity key pair
      const identityKeyPair = await SignalClient.KeyHelper.generateIdentityKeyPair();
      await newStore.put('identityKey', identityKeyPair);

      // Generate registration ID
      const registrationId = await SignalClient.KeyHelper.generateRegistrationId();
      await newStore.put('registrationId', registrationId);

      // Generate prekey bundle
      const preKeyBundle = await SignalClient.KeyHelper.generatePreKeyBundle(registrationId, 100);
      await newStore.put('preKeyBundle', preKeyBundle);

      setStore(newStore);
      return { identityKeyPair, registrationId, preKeyBundle };
    } catch (error) {
      console.error('Error initializing Signal Protocol:', error);
      throw error;
    }
  }, []);

  const encryptMessage = useCallback(
    async (recipientId, message) => {
      if (!store) throw new Error('Signal Protocol not initialized');

      try {
        const sessionBuilder = new SignalClient.SessionBuilder(store, recipientId);
        const sessionCipher = new SignalClient.SessionCipher(store, recipientId);

        // Encrypt the message
        const ciphertext = await sessionCipher.encrypt(Buffer.from(message));
        return ciphertext;
      } catch (error) {
        console.error('Error encrypting message:', error);
        throw error;
      }
    },
    [store]
  );

  const decryptMessage = useCallback(
    async (senderId, encryptedMessage) => {
      if (!store) throw new Error('Signal Protocol not initialized');

      try {
        const sessionCipher = new SignalClient.SessionCipher(store, senderId);

        // Decrypt the message
        const plaintext = await sessionCipher.decrypt(encryptedMessage);
        return plaintext.toString();
      } catch (error) {
        console.error('Error decrypting message:', error);
        throw error;
      }
    },
    [store]
  );

  const value = {
    store,
    initializeSignal,
    encryptMessage,
    decryptMessage,
  };

  return <SignalContext.Provider value={value}>{children}</SignalContext.Provider>;
}
