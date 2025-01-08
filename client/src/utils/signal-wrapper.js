// This is a wrapper for the Signal Protocol library to ensure it works within Create React App's src directory
import * as SignalClient from '@signalapp/libsignal-client';

// Re-export everything from the Signal Protocol library
export default SignalClient;

// Also export individual components for convenience
export const {
    PublicKey,
    PrivateKey,
    PreKeyBundle,
    PreKeyRecord,
    SignedPreKeyRecord,
    SessionRecord,
    SessionBuilder,
    SessionCipher,
    SignalProtocolAddress,
    PreKeySignalMessage,
    SignalMessage,
    KeyHelper,
} = SignalClient; 