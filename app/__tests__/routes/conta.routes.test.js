const supertest = require('supertest');
const Usuario = require('../../models/Usuario');
const { connect, closeDatabase } = require('../setup/db');
const { TEST_PASSWORD, createTestUser } = require('../setup/helpers');

let app;
let agent;

// Login feito uma única vez — evita rate limit (10/15min do loginLimiter).
// beforeEach recria apenas o usuário sem apagar sessões, mantendo a auth.
beforeAll(async () => {
  await connect();
  app = require('../../app');
  await createTestUser();
  agent = supertest.agent(app);
  await agent.post('/api/auth/login').send({ senha: TEST_PASSWORD });
});

afterAll(async () => {
  await closeDatabase();
});

beforeEach(async () => {
  // Recria o usuário com dados originais sem invalidar a sessão existente
  await Usuario.deleteMany({});
  await createTestUser();
});

// ==================
// GET /api/auth/perfil
// ==================

describe('GET /api/auth/perfil', () => {
  test('retorna 401 sem autenticação', async () => {
    const res = await supertest(app).get('/api/auth/perfil');
    expect(res.status).toBe(401);
  });

  test('retorna 200 com nome e email do usuário', async () => {
    const res = await agent.get('/api/auth/perfil');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.nome).toBe('Admin Teste');
    expect(res.body.data.email).toBe('admin@teste.com');
    expect(res.body.data.senha).toBeUndefined();
  });
});

// ==================
// PUT /api/auth/perfil
// ==================

describe('PUT /api/auth/perfil', () => {
  test('retorna 401 sem autenticação', async () => {
    const res = await supertest(app)
      .put('/api/auth/perfil')
      .send({ nome: 'Novo Nome', email: 'novo@email.com' });

    expect(res.status).toBe(401);
  });

  test('atualiza nome com sucesso', async () => {
    const res = await agent
      .put('/api/auth/perfil')
      .send({ nome: 'Nome Atualizado', email: 'admin@teste.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const usuario = await Usuario.findOne();
    expect(usuario.nome).toBe('Nome Atualizado');
  });

  test('atualiza email com sucesso', async () => {
    const res = await agent
      .put('/api/auth/perfil')
      .send({ nome: 'Admin Teste', email: 'novo@email.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const usuario = await Usuario.findOne();
    expect(usuario.email).toBe('novo@email.com');
  });

  test('retorna 400 com nome muito curto (1 char)', async () => {
    const res = await agent
      .put('/api/auth/perfil')
      .send({ nome: 'X', email: 'admin@teste.com' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  test('retorna 400 com email inválido', async () => {
    const res = await agent
      .put('/api/auth/perfil')
      .send({ nome: 'Admin Teste', email: 'nao-e-um-email' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });
});

// ==================
// PUT /api/auth/alterar-senha
// ==================

describe('PUT /api/auth/alterar-senha', () => {
  test('retorna 401 sem autenticação', async () => {
    const res = await supertest(app)
      .put('/api/auth/alterar-senha')
      .send({ senhaAtual: TEST_PASSWORD, novaSenha: 'novaSenha123' });

    expect(res.status).toBe(401);
  });

  test('retorna 401 com senha atual incorreta', async () => {
    const res = await agent
      .put('/api/auth/alterar-senha')
      .send({ senhaAtual: 'senha-errada', novaSenha: 'novaSenha123' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Senha atual incorreta');
  });

  test('retorna 400 com nova senha muito curta (< 6 chars)', async () => {
    const res = await agent
      .put('/api/auth/alterar-senha')
      .send({ senhaAtual: TEST_PASSWORD, novaSenha: 'abc' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  test('altera senha com sucesso e retorna 200', async () => {
    const res = await agent
      .put('/api/auth/alterar-senha')
      .send({ senhaAtual: TEST_PASSWORD, novaSenha: 'novaSenha123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('após alteração, login com nova senha funciona', async () => {
    await agent
      .put('/api/auth/alterar-senha')
      .send({ senhaAtual: TEST_PASSWORD, novaSenha: 'novaSenha123' });

    const res = await supertest(app)
      .post('/api/auth/login')
      .send({ senha: 'novaSenha123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('após alteração, login com senha antiga falha', async () => {
    await agent
      .put('/api/auth/alterar-senha')
      .send({ senhaAtual: TEST_PASSWORD, novaSenha: 'novaSenha123' });

    const res = await supertest(app)
      .post('/api/auth/login')
      .send({ senha: TEST_PASSWORD });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
