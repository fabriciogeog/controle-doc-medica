const os = require('os');
const fs = require('fs');

// Detecta ambiente Docker (usuário sem home gravável)
const homeDirWritable = (() => {
  try { fs.accessSync(os.homedir(), fs.constants.W_OK); return true; } catch { return false; }
})();

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFiles: ['./__tests__/setup/env.js'],
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  // maxWorkers=1 evita race condition no download paralelo do binário MongoDB
  maxWorkers: 1,
  coverageDirectory: homeDirWritable ? 'coverage' : '/tmp/jest-coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/public/'],
};
