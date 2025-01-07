const webpack = require('webpack');

module.exports = function override(config) {
    const fallback = config.resolve.fallback || {};
    Object.assign(fallback, {
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
        process: require.resolve('process/browser.js')
    });
    config.resolve.fallback = fallback;

    config.plugins = (config.plugins || []).concat([
        new webpack.ProvidePlugin({
            process: 'process/browser.js',
            Buffer: ['buffer', 'Buffer']
        }),
        new webpack.DefinePlugin({
            'process.env': JSON.stringify(process.env)
        })
    ]);

    config.resolve.extensions = [...(config.resolve.extensions || []), '.js', '.jsx'];
    config.resolve.mainFields = ['browser', 'module', 'main'];

    return config;
}; 