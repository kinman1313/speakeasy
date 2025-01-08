const webpack = require('webpack');
const path = require('path');

module.exports = function override(config) {
    config.resolve = {
        ...config.resolve,
        fallback: {
            crypto: require.resolve('crypto-browserify'),
            stream: require.resolve('stream-browserify'),
            buffer: require.resolve('buffer'),
            process: require.resolve('process/browser.js'),
            zlib: require.resolve('browserify-zlib'),
            path: require.resolve('path-browserify'),
            os: require.resolve('os-browserify/browser'),
            vm: false,
            fs: false,
            net: false,
            tls: false,
            child_process: false,
            http: false,
            https: false
        },
        alias: {
            '@signalapp/libsignal-client': '@signalapp/libsignal-client/dist/index.js'
        },
        extensions: ['.js', '.jsx', '.json', '.wasm']
    };

    config.plugins = [
        ...config.plugins.filter(plugin => !(plugin instanceof webpack.DefinePlugin)),
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
            process: 'process/browser.js',
            require: 'process/browser.js'
        }),
        new webpack.DefinePlugin({
            'process.env': JSON.stringify({
                ...process.env,
                NODE_ENV: process.env.NODE_ENV || 'development'
            }),
            'global.TYPED_ARRAY_SUPPORT': JSON.stringify(true)
        })
    ];

    config.module = {
        ...config.module,
        rules: [
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
                type: 'webassembly/async'
            }
        ],
        noParse: /\.wasm$/
    };

    config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
        syncWebAssembly: true,
        topLevelAwait: true
    };

    config.node = {
        ...config.node,
        global: true
    };

    return config;
} 