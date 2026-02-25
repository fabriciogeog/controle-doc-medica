const path = require('path');

// O UPLOAD_DIR dentro do middleware resolve para <app_dir>/uploads
// Precisamos saber onde o módulo está para calcular o UPLOAD_DIR esperado
const MIDDLEWARE_DIR = path.join(__dirname, '..', '..', 'middlewares');
const UPLOAD_DIR = path.join(MIDDLEWARE_DIR, '..', 'uploads');

describe('validateFilePath', () => {
  let validateFilePath;

  beforeEach(() => {
    jest.resetModules();
    delete process.env.ALLOWED_FILE_PATHS;
    ({ validateFilePath } = require('../../middlewares/filepath.middleware'));
  });

  test('retorna true para caminho dentro de UPLOAD_DIR', () => {
    const filePath = path.join(UPLOAD_DIR, 'exames', 'resultado.pdf');
    expect(validateFilePath(filePath)).toBe(true);
  });

  test('retorna true para o próprio UPLOAD_DIR', () => {
    expect(validateFilePath(UPLOAD_DIR)).toBe(true);
  });

  test('retorna false para caminho fora de UPLOAD_DIR', () => {
    const filePath = '/etc/passwd';
    expect(validateFilePath(filePath)).toBe(false);
  });

  test('retorna false para path traversal', () => {
    const filePath = path.join(UPLOAD_DIR, '..', '..', 'etc', 'passwd');
    expect(validateFilePath(filePath)).toBe(false);
  });

  test('retorna true para caminho em ALLOWED_FILE_PATHS env', () => {
    const allowedDir = '/tmp/allowed-docs';
    process.env.ALLOWED_FILE_PATHS = allowedDir;
    jest.resetModules();
    ({ validateFilePath } = require('../../middlewares/filepath.middleware'));

    const filePath = path.join(allowedDir, 'doc.pdf');
    expect(validateFilePath(filePath)).toBe(true);
  });

  test('retorna false para caminho fora de ALLOWED_FILE_PATHS e fora de UPLOAD_DIR', () => {
    process.env.ALLOWED_FILE_PATHS = '/tmp/allowed-docs';
    jest.resetModules();
    ({ validateFilePath } = require('../../middlewares/filepath.middleware'));

    expect(validateFilePath('/tmp/outro-lugar/arquivo.pdf')).toBe(false);
  });
});
