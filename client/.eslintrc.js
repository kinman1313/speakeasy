module.exports = {
    env: {
        browser: true,
        es2021: true,
        jest: true
    },
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:prettier/recommended'
    ],
    parserOptions: {
        ecmaFeatures: {
            jsx: true
        },
        ecmaVersion: 12,
        sourceType: 'module'
    },
    plugins: ['react'],
    rules: {
        'react/react-in-jsx-scope': 'off',
        'react/prop-types': 'off',
        'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        'prettier/prettier': 'error',
        'no-console': 'warn',
        'react/display-name': 'off',
        'react/no-unescaped-entities': 'off'
    },
    settings: {
        react: {
            version: 'detect'
        }
    }
}; 