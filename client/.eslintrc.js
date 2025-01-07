/* eslint-env node */
module.exports = {
    env: {
        browser: true,
        es2021: true,
        jest: true,
        node: true
    },
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:react/jsx-runtime',
        'plugin:prettier/recommended'
    ],
    parserOptions: {
        ecmaFeatures: {
            jsx: true
        },
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    plugins: ['react'],
    rules: {
        'react/react-in-jsx-scope': 'off',
        'react/prop-types': 'off',
        'no-unused-vars': ['warn', {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_'
        }],
        'prettier/prettier': ['error', {
            'endOfLine': 'auto'
        }],
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