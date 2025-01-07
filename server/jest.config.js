module.exports = {
    testEnvironment: 'node',
    verbose: true,
    collectCoverage: false,
    coverageDirectory: 'coverage',
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/tests/',
        '/dist/'
    ],
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/'
    ],
    testMatch: [
        '**/tests/**/*.test.js'
    ],
    setupFilesAfterEnv: ['./tests/setup.js'],
    testTimeout: 30000,
    clearMocks: true,
    restoreMocks: true,
    resetMocks: true
}; 