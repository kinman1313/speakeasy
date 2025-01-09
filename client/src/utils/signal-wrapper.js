// This is a wrapper for the Signal Protocol library to ensure it works within Create React App's src directory
let SignalClient;

// Initialize Signal Protocol components with proper state management
let signalInstance = null;
let signalComponents = null;
let isInitializing = false;
let initializationPromise = null;

// Error types for better error handling
export const ErrorTypes = {
    INITIALIZATION_ERROR: 'INITIALIZATION_ERROR',
    INSTANCE_ERROR: 'INSTANCE_ERROR',
    COMPONENT_ERROR: 'COMPONENT_ERROR',
    KEY_GENERATION_ERROR: 'KEY_GENERATION_ERROR',
    SESSION_ERROR: 'SESSION_ERROR'
};

// Custom error class for Signal-related errors
export class SignalError extends Error {
    constructor(type, message, originalError = null) {
        super(message);
        this.name = 'SignalError';
        this.type = type;
        this.originalError = originalError;
    }
}

// Wrap async functions with proper error handling
const wrapAsync = async (fn, errorType, errorMessage) => {
    try {
        return await fn();
    } catch (error) {
        console.error(`${errorMessage}:`, error);
        throw new SignalError(errorType, errorMessage, error);
    }
};

// Dynamic import of Signal client to prevent initialization errors
const loadSignalClient = async () => {
    try {
        SignalClient = (await import('@signalapp/libsignal-client')).default;
        return SignalClient;
    } catch (error) {
        throw new SignalError(
            ErrorTypes.INITIALIZATION_ERROR,
            'Failed to load Signal client module',
            error
        );
    }
};

// Load Signal client with retries and proper error handling
const getSignalInstance = async () => {
    if (signalInstance) {
        return signalInstance;
    }

    const maxRetries = 3;
    let lastError = null;

    for (let i = 0; i < maxRetries; i++) {
        try {
            if (!SignalClient) {
                await loadSignalClient();
            }

            if (typeof SignalClient === 'function') {
                signalInstance = await SignalClient();
            } else {
                signalInstance = SignalClient;
            }
            return signalInstance;
        } catch (error) {
            console.warn(`Signal initialization attempt ${i + 1} failed:`, error);
            lastError = error;
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    }

    throw new SignalError(
        ErrorTypes.INITIALIZATION_ERROR,
        'Failed to initialize Signal client after multiple attempts',
        lastError
    );
};

// Create Signal components with comprehensive error handling
const createComponents = (signal) => {
    if (!signal) {
        throw new SignalError(
            ErrorTypes.INSTANCE_ERROR,
            'Signal instance not provided'
        );
    }

    // Wrap KeyHelper methods with proper error handling
    const KeyHelper = {
        generateIdentityKeyPair: () =>
            wrapAsync(
                () => signal.KeyHelper.generateIdentityKeyPair(),
                ErrorTypes.KEY_GENERATION_ERROR,
                'Failed to generate identity key pair'
            ),
        generateRegistrationId: () =>
            wrapAsync(
                () => signal.KeyHelper.generateRegistrationId(),
                ErrorTypes.KEY_GENERATION_ERROR,
                'Failed to generate registration ID'
            ),
        generatePreKey: (keyId) =>
            wrapAsync(
                () => signal.KeyHelper.generatePreKey(keyId),
                ErrorTypes.KEY_GENERATION_ERROR,
                'Failed to generate pre-key'
            ),
        generateSignedPreKey: (identityKeyPair, keyId) =>
            wrapAsync(
                () => signal.KeyHelper.generateSignedPreKey(identityKeyPair, keyId),
                ErrorTypes.KEY_GENERATION_ERROR,
                'Failed to generate signed pre-key'
            )
    };

    // Wrap SessionBuilder with error handling
    class SessionBuilderWrapper extends signal.SessionBuilder {
        constructor(...args) {
            try {
                super(...args);
            } catch (error) {
                throw new SignalError(
                    ErrorTypes.SESSION_ERROR,
                    'Failed to create SessionBuilder',
                    error
                );
            }
        }

        async processPreKeyBundle(...args) {
            return wrapAsync(
                () => super.processPreKeyBundle(...args),
                ErrorTypes.SESSION_ERROR,
                'Failed to process pre-key bundle'
            );
        }
    }

    // Wrap SessionCipher with error handling
    class SessionCipherWrapper extends signal.SessionCipher {
        constructor(...args) {
            try {
                super(...args);
            } catch (error) {
                throw new SignalError(
                    ErrorTypes.SESSION_ERROR,
                    'Failed to create SessionCipher',
                    error
                );
            }
        }

        async encrypt(...args) {
            return wrapAsync(
                () => super.encrypt(...args),
                ErrorTypes.SESSION_ERROR,
                'Failed to encrypt message'
            );
        }

        async decrypt(...args) {
            return wrapAsync(
                () => super.decrypt(...args),
                ErrorTypes.SESSION_ERROR,
                'Failed to decrypt message'
            );
        }

        async decryptPreKeyWhisperMessage(...args) {
            return wrapAsync(
                () => super.decryptPreKeyWhisperMessage(...args),
                ErrorTypes.SESSION_ERROR,
                'Failed to decrypt pre-key whisper message'
            );
        }
    }

    // Wrap SignalProtocolAddress with error handling
    class SignalProtocolAddressWrapper extends signal.SignalProtocolAddress {
        constructor(...args) {
            try {
                super(...args);
            } catch (error) {
                throw new SignalError(
                    ErrorTypes.COMPONENT_ERROR,
                    'Failed to create SignalProtocolAddress',
                    error
                );
            }
        }
    }

    return {
        KeyHelper,
        SessionBuilder: SessionBuilderWrapper,
        SessionCipher: SessionCipherWrapper,
        SignalProtocolAddress: SignalProtocolAddressWrapper
    };
};

// Initialize Signal components with proper state management
const initializeSignal = async () => {
    if (signalComponents) {
        return signalComponents;
    }

    if (isInitializing) {
        if (!initializationPromise) {
            throw new SignalError(
                ErrorTypes.INITIALIZATION_ERROR,
                'Signal initialization in inconsistent state'
            );
        }
        return initializationPromise;
    }

    isInitializing = true;
    initializationPromise = (async () => {
        try {
            const signal = await getSignalInstance();
            signalComponents = createComponents(signal);
            return signalComponents;
        } catch (error) {
            console.error('Failed to initialize Signal Protocol:', error);
            throw error;
        } finally {
            isInitializing = false;
            initializationPromise = null;
        }
    })();

    return initializationPromise;
};

// Export the initialization function with comprehensive error handling
export const getSignalComponents = async () => {
    try {
        const components = await initializeSignal();
        if (!components) {
            throw new SignalError(
                ErrorTypes.COMPONENT_ERROR,
                'Signal components not properly initialized'
            );
        }
        return components;
    } catch (error) {
        if (error instanceof SignalError) {
            throw error;
        }
        throw new SignalError(
            ErrorTypes.INITIALIZATION_ERROR,
            'Failed to get Signal components',
            error
        );
    }
};

// Export Signal client for direct access if needed
export default SignalClient; 