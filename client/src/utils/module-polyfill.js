// Polyfill for CommonJS modules in browser
(function (global) {
    if (typeof global.process === 'undefined') {
        global.process = {
            env: { NODE_ENV: 'production' }
        };
    }

    if (typeof global.Buffer === 'undefined') {
        global.Buffer = require('buffer/').Buffer;
    }

    if (typeof global.module === 'undefined') {
        global.module = { exports: {} };
    }

    if (typeof global.exports === 'undefined') {
        global.exports = global.module.exports;
    }

    // Ensure we have a global 'global'
    if (typeof global.global === 'undefined') {
        global.global = global;
    }

    // Add require if it doesn't exist
    if (typeof global.require === 'undefined') {
        global.require = function (module) {
            throw new Error(`Dynamic require of "${module}" is not supported`);
        };
    }
})(typeof window !== 'undefined' ? window :
    typeof global !== 'undefined' ? global :
        typeof self !== 'undefined' ? self : this);

export default global.module.exports; 