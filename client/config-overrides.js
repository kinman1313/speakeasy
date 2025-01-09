const webpack = require('webpack');
const path = require('path');

module.exports = function override(config, env) {
    config.resolve = {
        ...config.resolve,
        fallback: {
            crypto: require.resolve('crypto-browserify'),
            stream: require.resolve('stream-browserify'),
            buffer: require.resolve('buffer/'),
            process: require.resolve('process/browser.js'),
            path: require.resolve('path-browserify'),
            fs: false,
        },
        extensions: ['.js', '.jsx', '.json']
    };

    config.plugins = [
        ...config.plugins,
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
            process: 'process/browser.js'
        })
    ];

    return config;
} 