/* eslint-env node */
module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true,
        jest: true
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
    plugins: ['react', 'prettier'],
    rules: {
        'prettier/prettier': ['error', {
            singleQuote: true,
            jsxSingleQuote: true,
            semi: true,
            tabWidth: 2,
            printWidth: 100,
            trailingComma: 'es5',
            bracketSpacing: true,
            endOfLine: 'auto'
        }],
        'react/prop-types': 'off',
        'react/jsx-uses-react': 'off',
        'react/react-in-jsx-scope': 'off',
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        'no-console': ['warn', { allow: ['warn', 'error'] }]
    },
    settings: {
        react: {
            version: 'detect'
        }
    }
};
