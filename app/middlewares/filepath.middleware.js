// middlewares/filepath.middleware.js
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

function validateFilePath(filePath) {
  const resolved = path.resolve(filePath);
  const allowed = [
    UPLOAD_DIR,
    ...(process.env.ALLOWED_FILE_PATHS || '').split(',').filter(Boolean).map(p => p.trim()),
  ];
  return allowed.some(prefix => resolved === prefix || resolved.startsWith(prefix + path.sep));
}

module.exports = { validateFilePath };
