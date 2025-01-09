// This is a wrapper for the Signal Protocol library to ensure it works within Create React App's src directory
let SignalClient;

// Initialize Signal client immediately to avoid temporal dead zone issues
(async function loadSignalClient() {
    try {
        SignalClient = (await import('@signalapp/libsignal-client')).default;
    } catch (error) {
        console.error('Failed to load Signal client:', error);
    }
})();

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

// Initialize Signal client with proper error handling
let signalInstance = null;
let signalComponents = null;
let initializationPromise = null;

async function waitForSignalClient(timeout = 5000) {
    const start = Date.now();
    while (!SignalClient) {
        if (Date.now() - start > timeout) {
            throw new SignalError(
                ErrorTypes.INITIALIZATION_ERROR,
                'Timeout waiting for Signal client to load'
            );
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    return SignalClient;
}

async function initializeSignalClient() {
    if (signalInstance) {
        return signalInstance;
    }

    try {
        const client = await waitForSignalClient();
        signalInstance = typeof client === 'function' ? await client() : client;
        return signalInstance;
    } catch (error) {
        console.error('Failed to initialize Signal client:', error);
        signalInstance = null;
        throw new SignalError(
            ErrorTypes.INITIALIZATION_ERROR,
            'Failed to initialize Signal client',
            error
        );
    }
}

// Create Signal components with comprehensive error handling
async function createComponents(signal) {
    if (!signal) {
        throw new SignalError(
            ErrorTypes.INSTANCE_ERROR,
            'Signal instance not provided'
        );
    }

    if (!signal.KeyHelper) {
        throw new SignalError(
            ErrorTypes.COMPONENT_ERROR,
            'KeyHelper not available in Signal instance'
        );
    }

    const KeyHelper = {
        generateIdentityKeyPair: async () => {
            try {
                return await signal.KeyHelper.generateIdentityKeyPair();
            } catch (error) {
                throw new SignalError(
                    ErrorTypes.KEY_GENERATION_ERROR,
                    'Failed to generate identity key pair',
                    error
                );
            }
        },
        generateRegistrationId: async () => {
            try {
                return await signal.KeyHelper.generateRegistrationId();
            } catch (error) {
                throw new SignalError(
                    ErrorTypes.KEY_GENERATION_ERROR,
                    'Failed to generate registration ID',
                    error
                );
            }
        },
        generatePreKey: async (keyId) => {
            try {
                return await signal.KeyHelper.generatePreKey(keyId);
            } catch (error) {
                throw new SignalError(
                    ErrorTypes.KEY_GENERATION_ERROR,
                    'Failed to generate pre-key',
                    error
                );
            }
        },
        generateSignedPreKey: async (identityKeyPair, keyId) => {
            try {
                return await signal.KeyHelper.generateSignedPreKey(identityKeyPair, keyId);
            } catch (error) {
                throw new SignalError(
                    ErrorTypes.KEY_GENERATION_ERROR,
                    'Failed to generate signed pre-key',
                    error
                );
            }
        }
    };

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
            try {
                return await super.processPreKeyBundle(...args);
            } catch (error) {
                throw new SignalError(
                    ErrorTypes.SESSION_ERROR,
                    'Failed to process pre-key bundle',
                    error
                );
            }
        }
    }

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
            try {
                return await super.encrypt(...args);
            } catch (error) {
                throw new SignalError(
                    ErrorTypes.SESSION_ERROR,
                    'Failed to encrypt message',
                    error
                );
            }
        }

        async decrypt(...args) {
            try {
                return await super.decrypt(...args);
            } catch (error) {
                throw new SignalError(
                    ErrorTypes.SESSION_ERROR,
                    'Failed to decrypt message',
                    error
                );
            }
        }

        async decryptPreKeyWhisperMessage(...args) {
            try {
                return await super.decryptPreKeyWhisperMessage(...args);
            } catch (error) {
                throw new SignalError(
                    ErrorTypes.SESSION_ERROR,
                    'Failed to decrypt pre-key whisper message',
                    error
                );
            }
        }
    }

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
}

// Export the initialization function with comprehensive error handling
export async function getSignalComponents() {
    if (signalComponents) {
        return signalComponents;
    }

    if (initializationPromise) {
        return initializationPromise;
    }

    initializationPromise = (async () => {
        try {
            const signal = await initializeSignalClient();
            signalComponents = await createComponents(signal);
            return signalComponents;
        } catch (error) {
            initializationPromise = null;
            if (error instanceof SignalError) {
                throw error;
            }
            throw new SignalError(
                ErrorTypes.INITIALIZATION_ERROR,
                'Failed to get Signal components',
                error
            );
        }
    })();

    return initializationPromise;
} 