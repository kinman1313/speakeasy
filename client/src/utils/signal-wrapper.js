// This is a wrapper for the Signal Protocol library to ensure it works within Create React App's src directory
import * as SignalClient from '@signalapp/libsignal-client';

// Initialize Signal Protocol components
let initialized = false;
let signalComponents = null;

const initializeSignal = async () => {
    if (!initialized) {
        try {
            signalComponents = {
                PublicKey: SignalClient.PublicKey,
                PrivateKey: SignalClient.PrivateKey,
                PreKeyBundle: SignalClient.PreKeyBundle,
                PreKeyRecord: SignalClient.PreKeyRecord,
                SignedPreKeyRecord: SignalClient.SignedPreKeyRecord,
                SessionRecord: SignalClient.SessionRecord,
                SessionBuilder: SignalClient.SessionBuilder,
                SessionCipher: SignalClient.SessionCipher,
                SignalProtocolAddress: SignalClient.SignalProtocolAddress,
                PreKeySignalMessage: SignalClient.PreKeySignalMessage,
                SignalMessage: SignalClient.SignalMessage,
                KeyHelper: SignalClient.KeyHelper
            };

            initialized = true;
        } catch (error) {
            console.error('Failed to initialize Signal Protocol:', error);
            throw error;
        }
    }
    return signalComponents;
};

// Export the initialization function
export const getSignalComponents = async () => {
    if (!initialized) {
        await initializeSignal();
    }
    return signalComponents;
};

// Export the entire SignalClient for advanced usage
export default SignalClient; 