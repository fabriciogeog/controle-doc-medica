const supertest = require('supertest');
const { connect, closeDatabase, clearDatabase } = require('../setup/db');
const { TEST_PASSWORD, createTestUser } = require('../setup/helpers');

let app;

beforeAll(async () => {
  await connect();
  app = require('../../app');
});

afterAll(async () => {
  await closeDatabase();
});

// Cada teste de auth precisa de um usuário fresco; sessions são ignoradas
// pois não estão em mongoose.connection.collections.
beforeEach(async () => {
  await clearDatabase();
  await createTestUser();
});

describe('POST /api/auth/login', () => {
  test('retorna 200 e autentica com senha correta', async () => {
    const res = await supertest(app)
      .post('/api/auth/login')
      .send({ senha: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  test('retorna 401 com senha incorreta', async () => {
    const res = await supertest(app)
      .post('/api/auth/login')
      .send({ senha: 'senha-errada' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('retorna 400 sem o campo senha', async () => {
    const res = await supertest(app)
      .post('/api/auth/login')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  test('retorna 400 com senha muito curta (< 4 chars)', async () => {
    const res = await supertest(app)
      .post('/api/auth/login')
      .send({ senha: 'ab' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/logout', () => {
  test('retorna 200 ao fazer logout', async () => {
    const agent = supertest.agent(app);
    await agent.post('/api/auth/login').send({ senha: TEST_PASSWORD });

    const res = await agent.post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/auth/check', () => {
  test('retorna authenticated: false sem sessão', async () => {
    const res = await supertest(app).get('/api/auth/check');

    expect(res.status).toBe(200);
    expect(res.body.authenticated).toBe(false);
  });

  test('retorna authenticated: true com sessão válida', async () => {
    const agent = supertest.agent(app);
    await agent.post('/api/auth/login').send({ senha: TEST_PASSWORD });

    const res = await agent.get('/api/auth/check');
    expect(res.status).toBe(200);
    expect(res.body.authenticated).toBe(true);
  });
});

describe('Proteção de rotas', () => {
  test('rota protegida retorna 401 sem autenticação', async () => {
    const res = await supertest(app).get('/api/documentos');
    expect(res.status).toBe(401);
  });

  test('rota protegida retorna 200 com autenticação', async () => {
    const agent = supertest.agent(app);
    await agent.post('/api/auth/login').send({ senha: TEST_PASSWORD });

    const res = await agent.get('/api/documentos');
    expect(res.status).toBe(200);
  });
});
