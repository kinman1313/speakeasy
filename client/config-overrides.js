const webpack = require('webpack');
const path = require('path');

module.exports = function override(config, env) {
    config.resolve = {
        ...config.resolve,
        fallback: {
            crypto: require.resolve('crypto-browserify'),
            stream: require.resolve('stream-browserify'),
            buffer: require.resolve('buffer/'),
            process: require.resolve('process/browser'),
            path: require.resolve('path-browserify'),
            fs: false,
        },
        alias: {
            '@signalapp/libsignal-client': path.resolve(__dirname, 'src/utils/signal-wrapper.js')
        },
        extensions: ['.js', '.jsx', '.json', '.wasm']
    };

    config.plugins = [
        ...config.plugins.filter(plugin => !(plugin instanceof webpack.DefinePlugin)),
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
            process: 'process/browser'
        }),
        new webpack.DefinePlugin({
            'process.env': JSON.stringify({
                ...process.env,
                NODE_ENV: process.env.NODE_ENV || 'development'
            })
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
        ]
    };

    config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
        syncWebAssembly: true,
        topLevelAwait: true
    };

    return config;
} 