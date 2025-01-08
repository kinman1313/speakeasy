const webpack = require('webpack');
const path = require('path');

module.exports = function override(config) {
    // Configure module resolution
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
            fs: false,
            net: false,
            tls: false,
            child_process: false,
            http: false,
            https: false
        },
        alias: {
            process: path.resolve(__dirname, 'node_modules/process/browser.js'),
            '@signalapp/libsignal-client': '@signalapp/libsignal-client/dist/index.js'
        },
        modules: ['node_modules'],
        extensions: ['.js', '.jsx', '.json', '.wasm']
    };

    // Configure plugins
    config.plugins = [
        ...config.plugins,
        new webpack.ProvidePlugin({
            process: [path.resolve(__dirname, 'node_modules/process/browser.js'), 'process'],
            Buffer: ['buffer', 'Buffer']
        }),
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
                SIGNAL_ENABLE_WASM: JSON.stringify(true)
            }
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
            exclude: /node_modules\/(?!(@signalapp)\/).*/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: [
                        ['@babel/preset-env', {
                            targets: {
                                browsers: ['last 2 versions', 'not dead', 'not ie 11']
                            },
                            modules: false,
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

    // Ensure proper source maps in development
    if (process.env.NODE_ENV === 'development') {
        config.devtool = 'eval-source-map';
    }

    return config;
}; 