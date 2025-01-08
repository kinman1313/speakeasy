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
        'plugin:react/jsx-runtime'
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
        'react/prop-types': 'off',
        'react/jsx-uses-react': 'off',
        'react/react-in-jsx-scope': 'off',
        'no-unused-vars': ['warn', {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^React$|^useState$|^useEffect$|^useContext$|^useRef$|^useNavigate$'
        }],
        'no-console': ['warn', { allow: ['warn', 'error'] }],
        'react/jsx-no-undef': 'error'
    },
    settings: {
        react: {
            version: 'detect'
        }
    }
};
