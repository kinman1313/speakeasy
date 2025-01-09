// This is a wrapper for the Signal Protocol library to ensure it works within Create React App's src directory
import SignalClient from '@signalapp/libsignal-client';

// Initialize Signal Protocol components
let initialized = false;
let signalComponents = null;
let initializationPromise = null;

// Ensure Signal client is loaded before accessing any components
const loadSignalClient = () => {
    return SignalClient().catch(error => {
        console.error('Error loading Signal client:', error);
        throw error;
    });
};

const createSignalComponents = (signal) => {
    const KeyHelperModule = {
        generateIdentityKeyPair: (...args) =>
            signal.KeyHelper.generateIdentityKeyPair(...args).catch(error => {
                console.error('Error in generateIdentityKeyPair:', error);
                throw error;
            }),
        generateRegistrationId: (...args) =>
            signal.KeyHelper.generateRegistrationId(...args).catch(error => {
                console.error('Error in generateRegistrationId:', error);
                throw error;
            }),
        generatePreKey: (...args) =>
            signal.KeyHelper.generatePreKey(...args).catch(error => {
                console.error('Error in generatePreKey:', error);
                throw error;
            }),
        generateSignedPreKey: (...args) =>
            signal.KeyHelper.generateSignedPreKey(...args).catch(error => {
                console.error('Error in generateSignedPreKey:', error);
                throw error;
            })
    };

    return {
        KeyHelper: KeyHelperModule,
        SessionBuilder: class SessionBuilderWrapper extends signal.SessionBuilder {
            constructor(...args) {
                try {
                    super(...args);
                } catch (error) {
                    console.error('Error in SessionBuilder constructor:', error);
                    throw error;
                }
            }
        },
        SessionCipher: class SessionCipherWrapper extends signal.SessionCipher {
            constructor(...args) {
                try {
                    super(...args);
                } catch (error) {
                    console.error('Error in SessionCipher constructor:', error);
                    throw error;
                }
            }

            encrypt(...args) {
                return super.encrypt(...args).catch(error => {
                    console.error('Error in encrypt:', error);
                    throw error;
                });
            }

            decrypt(...args) {
                return super.decrypt(...args).catch(error => {
                    console.error('Error in decrypt:', error);
                    throw error;
                });
            }
        },
        SignalProtocolAddress: class SignalProtocolAddressWrapper extends signal.SignalProtocolAddress {
            constructor(...args) {
                try {
                    super(...args);
                } catch (error) {
                    console.error('Error in SignalProtocolAddress constructor:', error);
                    throw error;
                }
            }
        }
    };
};

const initializeSignal = () => {
    if (initializationPromise) {
        return initializationPromise;
    }

    initializationPromise = new Promise((resolve, reject) => {
        if (initialized && signalComponents) {
            resolve(signalComponents);
            return;
        }

        loadSignalClient()
            .then(signal => {
                signalComponents = createSignalComponents(signal);
                initialized = true;
                resolve(signalComponents);
            })
            .catch(error => {
                console.error('Failed to initialize Signal Protocol:', error);
                initialized = false;
                signalComponents = null;
                initializationPromise = null;
                reject(error);
            });
    });

    return initializationPromise;
};

// Export the initialization function with proper error handling
export const getSignalComponents = () => {
    return initializeSignal().then(components => {
        if (!components) {
            throw new Error('Signal components not properly initialized');
        }
        return components;
    }).catch(error => {
        console.error('Error getting Signal components:', error);
        throw error;
    });
};

// Export a pre-initialized Signal client to prevent timing issues
export default {
    init() {
        return loadSignalClient();
    }
}; 