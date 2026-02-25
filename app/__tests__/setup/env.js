// Roda antes de qualquer módulo (jest setupFiles)
// Define variáveis de ambiente para o ambiente de teste
process.env.NODE_ENV = 'test';
process.env.BCRYPT_ROUNDS = '1';
process.env.SESSION_SECRET = 'test-secret-32chars-minimum-len!';
