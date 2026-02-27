// Roda antes de qualquer módulo (jest setupFiles)
// Define variáveis de ambiente para o ambiente de teste
process.env.NODE_ENV = 'test';
process.env.BCRYPT_ROUNDS = '1';
process.env.SESSION_SECRET = 'test-secret-32chars-minimum-len!';

// Em containers Docker, o usuário não-root não tem home gravável.
// Detectamos isso e redirecionamos os binários do mongodb-memory-server
// para /tmp, além de forçar MongoDB 7.x (mínimo exigido pelo Debian 13).
const os = require('os');
const fs = require('fs');
const homeDir = os.homedir();
const homeDirWritable = (() => {
  try { fs.accessSync(homeDir, fs.constants.W_OK); return true; } catch { return false; }
})();

if (!homeDirWritable) {
  process.env.MONGOMS_DOWNLOAD_DIR = '/tmp/mongodb-binaries';
  process.env.MONGOMS_VERSION = '7.0.14'; // Debian 13 (Trixie) exige MongoDB >= 7.0.3
}
