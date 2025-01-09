const webpack = require('webpack');
const path = require('path');

module.exports = function override(config, env) {
    config.entry = [
        path.resolve(__dirname, 'src/utils/module-polyfill.js'),
        ...(Array.isArray(config.entry) ? config.entry : [config.entry])
    ];

    config.resolve = {
        ...config.resolve,
        fallback: {
            crypto: require.resolve('crypto-browserify'),
            stream: require.resolve('stream-browserify'),
            buffer: require.resolve('buffer/'),
            process: require.resolve('process/browser.js'),
            path: require.resolve('path-browserify'),
            fs: false,
            util: require.resolve('util/'),
        },
        extensions: ['.js', '.jsx', '.json', '.wasm', '.mjs'],
        mainFields: ['browser', 'module', 'main']
    };

    config.plugins = [
        ...config.plugins.filter(plugin => !(plugin instanceof webpack.DefinePlugin)),
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
            process: 'process/browser.js'
        }),
        new webpack.DefinePlugin({
            'process.env': JSON.stringify(process.env),
            'global': 'window',
            'SIGNAL_SERVER_KEY': JSON.stringify(process.env.REACT_APP_SIGNAL_SERVER_KEY || '')
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
                include: [
                    path.resolve(__dirname, 'src'),
                    path.resolve(__dirname, 'node_modules/@signalapp')
                ],
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['@babel/preset-env', {
                                targets: {
                                    browsers: ['last 2 versions', 'not dead', 'not ie 11']
                                },
                                useBuiltIns: 'usage',
                                corejs: 3,
                                modules: false
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

    config.output = {
        ...config.output,
        globalObject: 'this',
        environment: {
            arrowFunction: true,
            bigIntLiteral: false,
            const: true,
            destructuring: true,
            dynamicImport: true,
            forOf: true,
            module: true,
            optionalChaining: true,
            templateLiteral: true
        }
    };

    config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        chunkIds: 'deterministic',
        splitChunks: {
            chunks: 'all',
            minSize: 20000,
            minRemainingSize: 0,
            minChunks: 1,
            maxAsyncRequests: 30,
            maxInitialRequests: 30,
            enforceSizeThreshold: 50000,
            cacheGroups: {
                defaultVendors: {
                    test: /[\\/]node_modules[\\/]/,
                    priority: -10,
                    reuseExistingChunk: true,
                },
                default: {
                    minChunks: 2,
                    priority: -20,
                    reuseExistingChunk: true,
                },
            },
        },
    };

    return config;
} 