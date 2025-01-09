// This is a wrapper for the Signal Protocol library to ensure it works within Create React App's src directory
import * as SignalClient from '@signalapp/libsignal-client';

// Singleton instance to manage Signal state
class SignalWrapper {
    constructor() {
        if (SignalWrapper.instance) {
            return SignalWrapper.instance;
        }
        SignalWrapper.instance = this;

        this.signalInstance = null;
        this.signalComponents = null;
        this.isInitializing = false;
        this.initializationPromise = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized && this.signalComponents) {
            return this.signalComponents;
        }

        if (this.isInitializing) {
            return this.initializationPromise;
        }

        this.isInitializing = true;
        this.initializationPromise = this._initialize();
        return this.initializationPromise;
    }

    async _initialize() {
        try {
            const signal = await this._getSignalInstance();
            this.signalComponents = await this._createComponents(signal);
            this.initialized = true;
            return this.signalComponents;
        } catch (error) {
            console.error('Failed to initialize Signal Protocol:', error);
            this.initialized = false;
            this.signalComponents = null;
            throw error;
        } finally {
            this.isInitializing = false;
            this.initializationPromise = null;
        }
    }

    async _getSignalInstance() {
        if (this.signalInstance) {
            return this.signalInstance;
        }

        const maxRetries = 3;
        let lastError = null;

        for (let i = 0; i < maxRetries; i++) {
            try {
                this.signalInstance = await this._initializeSignalClient();
                return this.signalInstance;
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
    }

    async _initializeSignalClient() {
        try {
            // Handle both ESM and CommonJS module formats
            const SignalModule = SignalClient.default || SignalClient;
            return typeof SignalModule === 'function' ? await SignalModule() : SignalModule;
        } catch (error) {
            console.error('Failed to initialize Signal client:', error);
            this.signalInstance = null;
            throw error;
        }
    }

    async _createComponents(signal) {
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
            generateIdentityKeyPair: () =>
                this._wrapAsync(
                    () => signal.KeyHelper.generateIdentityKeyPair(),
                    ErrorTypes.KEY_GENERATION_ERROR,
                    'Failed to generate identity key pair'
                ),
            generateRegistrationId: () =>
                this._wrapAsync(
                    () => signal.KeyHelper.generateRegistrationId(),
                    ErrorTypes.KEY_GENERATION_ERROR,
                    'Failed to generate registration ID'
                ),
            generatePreKey: (keyId) =>
                this._wrapAsync(
                    () => signal.KeyHelper.generatePreKey(keyId),
                    ErrorTypes.KEY_GENERATION_ERROR,
                    'Failed to generate pre-key'
                ),
            generateSignedPreKey: (identityKeyPair, keyId) =>
                this._wrapAsync(
                    () => signal.KeyHelper.generateSignedPreKey(identityKeyPair, keyId),
                    ErrorTypes.KEY_GENERATION_ERROR,
                    'Failed to generate signed pre-key'
                )
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
                return this._wrapAsync(
                    () => super.processPreKeyBundle(...args),
                    ErrorTypes.SESSION_ERROR,
                    'Failed to process pre-key bundle'
                );
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
                return this._wrapAsync(
                    () => super.encrypt(...args),
                    ErrorTypes.SESSION_ERROR,
                    'Failed to encrypt message'
                );
            }

            async decrypt(...args) {
                return this._wrapAsync(
                    () => super.decrypt(...args),
                    ErrorTypes.SESSION_ERROR,
                    'Failed to decrypt message'
                );
            }

            async decryptPreKeyWhisperMessage(...args) {
                return this._wrapAsync(
                    () => super.decryptPreKeyWhisperMessage(...args),
                    ErrorTypes.SESSION_ERROR,
                    'Failed to decrypt pre-key whisper message'
                );
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

    async _wrapAsync(fn, errorType, errorMessage) {
        try {
            return await fn();
        } catch (error) {
            console.error(`${errorMessage}:`, error);
            throw new SignalError(errorType, errorMessage, error);
        }
    }
}

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

// Create singleton instance
const signalWrapper = new SignalWrapper();

// Export the initialization function with comprehensive error handling
export const getSignalComponents = async () => {
    try {
        return await signalWrapper.initialize();
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