const supertest = require('supertest');
const { connect, closeDatabase, clearDataCollections } = require('../setup/db');
const { TEST_PASSWORD, createTestUser, makeProfissionalPayload } = require('../setup/helpers');

let app;
let agent;

// Login feito uma única vez por arquivo — evita atingir o rate limit (10/15min)
beforeAll(async () => {
  await connect();
  app = require('../../app');
  await createTestUser();
  agent = supertest.agent(app);
  const loginRes = await agent.post('/api/auth/login').send({ senha: TEST_PASSWORD });
  expect(loginRes.status).toBe(200);
});

afterAll(async () => {
  await closeDatabase();
});

// Limpa apenas dados entre testes, preservando usuário e sessão
beforeEach(async () => {
  await clearDataCollections();
});

describe('GET /api/profissionais', () => {
  test('retorna 401 sem autenticação', async () => {
    const res = await supertest(app).get('/api/profissionais');
    expect(res.status).toBe(401);
  });

  test('retorna 200 com lista vazia para usuário autenticado', async () => {
    const res = await agent.get('/api/profissionais');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.total).toBe(0);
  });
});

describe('POST /api/profissionais', () => {
  test('cria profissional com dados válidos', async () => {
    const res = await agent
      .post('/api/profissionais')
      .send(makeProfissionalPayload());

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.nome).toBe('Dr. João Silva');
  });

  test('retorna 400 com dados inválidos (sem nome)', async () => {
    const res = await agent
      .post('/api/profissionais')
      .send(makeProfissionalPayload({ nome: '' }));

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  test('retorna 409 com número de registro duplicado', async () => {
    await agent.post('/api/profissionais').send(makeProfissionalPayload());

    const res = await agent
      .post('/api/profissionais')
      .send(makeProfissionalPayload({ nome: 'Outro Médico' }));

    expect(res.status).toBe(409);
  });
});

describe('GET /api/profissionais/:id', () => {
  test('retorna profissional pelo ID', async () => {
    const created = await agent
      .post('/api/profissionais')
      .send(makeProfissionalPayload());

    const res = await agent.get(`/api/profissionais/${created.body.data._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.nome).toBe('Dr. João Silva');
  });

  test('retorna 404 para ID inexistente', async () => {
    const res = await agent.get('/api/profissionais/000000000000000000000000');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/profissionais/:id', () => {
  test('atualiza profissional com dados válidos', async () => {
    const created = await agent
      .post('/api/profissionais')
      .send(makeProfissionalPayload());

    const id = created.body.data._id;
    const res = await agent
      .put(`/api/profissionais/${id}`)
      .send(makeProfissionalPayload({ nome: 'Dr. João Atualizado' }));

    expect(res.status).toBe(200);
    expect(res.body.data.nome).toBe('Dr. João Atualizado');
  });
});

describe('PATCH /api/profissionais/:id/status', () => {
  test('alterna o status ativo do profissional', async () => {
    const created = await agent
      .post('/api/profissionais')
      .send(makeProfissionalPayload());

    const id = created.body.data._id;
    const res = await agent
      .patch(`/api/profissionais/${id}/status`)
      .send({ ativo: false });

    expect(res.status).toBe(200);
    expect(res.body.data.ativo).toBe(false);
  });
});

describe('DELETE /api/profissionais/:id', () => {
  test('exclui profissional sem vínculos', async () => {
    const created = await agent
      .post('/api/profissionais')
      .send(makeProfissionalPayload());

    const id = created.body.data._id;
    const res = await agent.delete(`/api/profissionais/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/profissionais/busca/autocomplete', () => {
  test('retorna resultados ao buscar com 2+ caracteres', async () => {
    await agent.post('/api/profissionais').send(makeProfissionalPayload());

    const res = await agent.get('/api/profissionais/busca/autocomplete?q=Jo');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('retorna array vazio para query com menos de 2 caracteres', async () => {
    const res = await agent.get('/api/profissionais/busca/autocomplete?q=J');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});
