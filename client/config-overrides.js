const webpack = require('webpack');

module.exports = function override(config) {
    // Configure module resolution
    config.resolve = {
        ...config.resolve,
        fallback: {
            crypto: require.resolve('crypto-browserify'),
            stream: require.resolve('stream-browserify'),
            buffer: require.resolve('buffer'),
            process: require.resolve('process/browser'),
            zlib: require.resolve('browserify-zlib'),
            path: require.resolve('path-browserify'),
            os: require.resolve('os-browserify/browser'),
            fs: false,
            net: false,
            tls: false,
            child_process: false,
            http: false,
            https: false
        }
    };

    // Configure plugins
    config.plugins = [
        ...config.plugins,
        new webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer']
        })
    ];

    // Configure module rules
    config.module.rules = [
        ...config.module.rules,
        {
            test: /\.m?js$/,
            resolve: {
                fullySpecified: false
            },
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-env'],
                    plugins: ['@babel/plugin-syntax-dynamic-import']
                }
            }
        },
        {
            test: /\.wasm$/,
            type: 'webassembly/async',
            use: {
                loader: 'wasm-loader'
            }
        }
    ];

    // Configure experiments for WebAssembly
    config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
        topLevelAwait: true
    };

    return config;
}; 