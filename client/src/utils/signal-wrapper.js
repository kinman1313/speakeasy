// This is a wrapper for the Signal Protocol library to ensure it works within Create React App's src directory
import SignalClient from '@signalapp/libsignal-client';

// Initialize Signal Protocol components
let initialized = false;
let signalComponents = null;

const initializeSignal = async () => {
    if (!initialized) {
        try {
            // Initialize the Signal client
            const signal = await SignalClient();

            signalComponents = {
                KeyHelper: {
                    generateIdentityKeyPair: signal.KeyHelper.generateIdentityKeyPair,
                    generateRegistrationId: signal.KeyHelper.generateRegistrationId,
                    generatePreKey: signal.KeyHelper.generatePreKey,
                    generateSignedPreKey: signal.KeyHelper.generateSignedPreKey
                },
                SessionBuilder: signal.SessionBuilder,
                SessionCipher: signal.SessionCipher,
                SignalProtocolAddress: signal.SignalProtocolAddress
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