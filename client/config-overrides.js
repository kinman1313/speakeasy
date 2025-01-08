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
        },
        alias: {
            '@signalapp/libsignal-client': '@signalapp/libsignal-client/dist/index.js'
        }
    };

    // Configure plugins with additional polyfills for Signal
    config.plugins = [
        ...config.plugins,
        new webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer'],
            require: ['process/browser', 'require']
        }),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
            'process.env.SIGNAL_ENABLE_WASM': JSON.stringify(true)
        })
    ];

    // Configure module rules with specific handling for Signal's WASM
    config.module.rules = [
        ...config.module.rules,
        {
            test: /\.m?js$/,
            resolve: {
                fullySpecified: false
            },
            exclude: /node_modules\/(?!(@signalapp)\/).*/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: [
                        ['@babel/preset-env', {
                            targets: {
                                browsers: ['last 2 versions', 'not dead', 'not ie 11']
                            },
                            modules: 'auto',
                            useBuiltIns: 'usage',
                            corejs: 3
                        }]
                    ],
                    plugins: [
                        '@babel/plugin-syntax-dynamic-import',
                        '@babel/plugin-proposal-class-properties'
                    ]
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
        topLevelAwait: true,
        syncWebAssembly: true
    };

    return config;
}; 