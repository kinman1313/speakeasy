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
        alias: {
            '@signalapp/libsignal-client': path.resolve(__dirname, 'src/utils/signal-wrapper.js')
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
            global: 'window'
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
                                corejs: 3,
                                modules: 'auto'
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

    return config;
} 