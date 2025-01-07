module.exports = {
    env: {
        node: true,
        es2021: true,
        jest: true
    },
    extends: [
        'eslint:recommended',
        'plugin:prettier/recommended'
    ],
    parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module'
    },
    rules: {
        'no-console': 'warn',
        'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        'prettier/prettier': 'error',
        'no-process-exit': 'off',
        'no-underscore-dangle': 'off',
        'class-methods-use-this': 'off',
        'prefer-destructuring': ['error', { object: true, array: false }],
        'no-return-await': 'off',
        'consistent-return': 'off',
        'no-shadow': ['error', { allow: ['_'] }],
        'no-use-before-define': ['error', { functions: false }],
        'max-len': ['error', { code: 120, ignoreUrls: true }]
    }
}; 