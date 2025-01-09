// Polyfill for CommonJS modules in browser
(function (global) {
    // Ensure global object is properly initialized
    const getGlobal = function () {
        if (typeof globalThis !== 'undefined') return globalThis;
        if (typeof self !== 'undefined') return self;
        if (typeof window !== 'undefined') return window;
        if (typeof global !== 'undefined') return global;
        throw new Error('Unable to locate global object');
    };

    const globalObject = getGlobal();

    // Initialize process
    if (!globalObject.process) {
        globalObject.process = {
            env: { NODE_ENV: process.env.NODE_ENV || 'production' },
            browser: true,
            version: '',
            versions: {},
            platform: 'browser',
            nextTick: function (cb) { setTimeout(cb, 0); }
        };
    }

    // Initialize Buffer
    if (!globalObject.Buffer) {
        const { Buffer } = require('buffer/');
        globalObject.Buffer = Buffer;
    }

    // Initialize module system
    if (!globalObject.module) {
        globalObject.module = { exports: {} };
    }

    if (!globalObject.exports) {
        globalObject.exports = globalObject.module.exports;
    }

    // Ensure global is properly set
    if (!globalObject.global) {
        globalObject.global = globalObject;
    }

    // Add require if it doesn't exist
    if (!globalObject.require) {
        globalObject.require = function (moduleName) {
            switch (moduleName) {
                case 'buffer':
                    return { Buffer: globalObject.Buffer };
                case 'process':
                    return globalObject.process;
                default:
                    throw new Error(`Dynamic require of "${moduleName}" is not supported`);
            }
        };
    }

    // Add essential crypto polyfills if needed
    if (!globalObject.crypto) {
        globalObject.crypto = {
            getRandomValues: function (arr) {
                for (let i = 0; i < arr.length; i++) {
                    arr[i] = Math.floor(Math.random() * 256);
                }
                return arr;
            }
        };
    }

    // Add TextEncoder/TextDecoder if not available
    if (!globalObject.TextEncoder) {
        globalObject.TextEncoder = require('util').TextEncoder;
    }
    if (!globalObject.TextDecoder) {
        globalObject.TextDecoder = require('util').TextDecoder;
    }

})(typeof globalThis !== 'undefined' ? globalThis :
    typeof window !== 'undefined' ? window :
        typeof global !== 'undefined' ? global :
            typeof self !== 'undefined' ? self : this);

export default module.exports; 