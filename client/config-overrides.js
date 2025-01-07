const webpack = require('webpack');

module.exports = function override(config) {
    const fallback = config.resolve.fallback || {};
    Object.assign(fallback, {
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
        process: require.resolve('process/browser.js'),
        path: require.resolve('path-browserify'),
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        os: require.resolve('os-browserify/browser'),
        zlib: require.resolve('browserify-zlib')
    });
    config.resolve.fallback = fallback;

    config.plugins = (config.plugins || []).concat([
        new webpack.ProvidePlugin({
            process: 'process/browser.js',
            Buffer: ['buffer', 'Buffer']
        }),
        new webpack.DefinePlugin({
            'process.env': JSON.stringify(process.env)
        }),
        new webpack.NormalModuleReplacementPlugin(/node:/, (resource) => {
            const mod = resource.request.replace(/^node:/, '');
            switch (mod) {
                case 'buffer':
                    resource.request = 'buffer';
                    break;
                case 'stream':
                    resource.request = 'readable-stream';
                    break;
                default:
                    break;
            }
        }),
        new webpack.NormalModuleReplacementPlugin(/^node-gyp-build$/, (resource) => {
            resource.request = 'node-gyp-build/build.js';
        })
    ]);

    // Ignore native addons
    config.externals = {
        ...config.externals,
        'node-gyp-build': 'node-gyp-build'
    };

    config.resolve.extensions = [...(config.resolve.extensions || []), '.js', '.jsx'];
    config.resolve.mainFields = ['browser', 'module', 'main'];

    return config;
}; 