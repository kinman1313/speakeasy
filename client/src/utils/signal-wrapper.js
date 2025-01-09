// This is a wrapper for the Signal Protocol library to ensure it works within Create React App's src directory
import SignalClient from '@signalapp/libsignal-client';

// Initialize Signal Protocol components
let initialized = false;
let signalComponents = null;
let initializationPromise = null;

const initializeSignal = async () => {
    if (initializationPromise) {
        return initializationPromise;
    }

    initializationPromise = new Promise(async (resolve, reject) => {
        if (initialized && signalComponents) {
            resolve(signalComponents);
            return;
        }

        try {
            // Initialize the Signal client with retries
            let signal = null;
            let retries = 3;

            while (retries > 0 && !signal) {
                try {
                    signal = await SignalClient();
                    break;
                } catch (error) {
                    console.warn(`Signal initialization attempt failed, ${retries - 1} retries left:`, error);
                    retries--;
                    if (retries === 0) throw error;
                    await new Promise(r => setTimeout(r, 1000)); // Wait 1 second between retries
                }
            }

            if (!signal) {
                throw new Error('Failed to initialize Signal client after multiple attempts');
            }

            // Create components object with proper error handling
            signalComponents = {
                KeyHelper: {
                    generateIdentityKeyPair: async (...args) => {
                        try {
                            return await signal.KeyHelper.generateIdentityKeyPair(...args);
                        } catch (error) {
                            console.error('Error in generateIdentityKeyPair:', error);
                            throw error;
                        }
                    },
                    generateRegistrationId: async (...args) => {
                        try {
                            return await signal.KeyHelper.generateRegistrationId(...args);
                        } catch (error) {
                            console.error('Error in generateRegistrationId:', error);
                            throw error;
                        }
                    },
                    generatePreKey: async (...args) => {
                        try {
                            return await signal.KeyHelper.generatePreKey(...args);
                        } catch (error) {
                            console.error('Error in generatePreKey:', error);
                            throw error;
                        }
                    },
                    generateSignedPreKey: async (...args) => {
                        try {
                            return await signal.KeyHelper.generateSignedPreKey(...args);
                        } catch (error) {
                            console.error('Error in generateSignedPreKey:', error);
                            throw error;
                        }
                    }
                },
                SessionBuilder: class extends signal.SessionBuilder {
                    constructor(...args) {
                        try {
                            super(...args);
                        } catch (error) {
                            console.error('Error in SessionBuilder constructor:', error);
                            throw error;
                        }
                    }
                },
                SessionCipher: class extends signal.SessionCipher {
                    constructor(...args) {
                        try {
                            super(...args);
                        } catch (error) {
                            console.error('Error in SessionCipher constructor:', error);
                            throw error;
                        }
                    }

                    async encrypt(...args) {
                        try {
                            return await super.encrypt(...args);
                        } catch (error) {
                            console.error('Error in encrypt:', error);
                            throw error;
                        }
                    }

                    async decrypt(...args) {
                        try {
                            return await super.decrypt(...args);
                        } catch (error) {
                            console.error('Error in decrypt:', error);
                            throw error;
                        }
                    }
                },
                SignalProtocolAddress: signal.SignalProtocolAddress
            };

            initialized = true;
            resolve(signalComponents);
        } catch (error) {
            console.error('Failed to initialize Signal Protocol:', error);
            initialized = false;
            signalComponents = null;
            initializationPromise = null;
            reject(error);
        }
    });

    return initializationPromise;
};

// Export the initialization function
export const getSignalComponents = async () => {
    try {
        return await initializeSignal();
    } catch (error) {
        console.error('Error getting Signal components:', error);
        throw error;
    }
};

// Export the entire SignalClient for advanced usage
export default SignalClient; 