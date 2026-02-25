module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFiles: ['./__tests__/setup/env.js'],
  testTimeout: 30000,
  verbose: true,
  coveragePathIgnorePatterns: ['/node_modules/', '/public/'],
};
