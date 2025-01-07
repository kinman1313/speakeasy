const webpack = require('webpack');

module.exports = function override(config) {
    config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
        process: require.resolve('process/browser'),
        fs: false,
        path: false,
        net: false,
        tls: false,
        child_process: false,
        os: false,
        http: false,
        https: false,
        zlib: false
    };

    config.plugins = [
        ...config.plugins,
        new webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer']
        }),
        new webpack.DefinePlugin({
            'process.env': JSON.stringify(process.env)
        })
    ];

    config.module.rules.push({
        test: /\.m?js$/,
        resolve: {
            fullySpecified: false
        }
    });

    return config;
}; 