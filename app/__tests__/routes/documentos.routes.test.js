const supertest = require('supertest');
const mongoose = require('mongoose');
const { connect, closeDatabase } = require('../setup/db');
const { TEST_PASSWORD, createTestUser, makeDocumentoPayload } = require('../setup/helpers');

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

// Limpa documentos entre testes via model (mais robusto que iterar coleções)
beforeEach(async () => {
  const Documento = mongoose.model('Documento');
  await Documento.deleteMany({});
});

describe('GET /api/documentos', () => {
  test('retorna 401 sem autenticação', async () => {
    const res = await supertest(app).get('/api/documentos');
    expect(res.status).toBe(401);
  });

  test('retorna 200 com lista vazia para usuário autenticado', async () => {
    const res = await agent.get('/api/documentos');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.total).toBe(0);
  });
});

describe('POST /api/documentos', () => {
  test('cria documento com dados válidos', async () => {
    const res = await agent
      .post('/api/documentos')
      .send(makeDocumentoPayload());

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tipoDocumento).toBe('Exame');
  });

  test('retorna 400 com dados inválidos (sem tipoDocumento)', async () => {
    const res = await agent
      .post('/api/documentos')
      .send(makeDocumentoPayload({ tipoDocumento: '' }));

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  test('retorna 400 com tipo de documento inválido', async () => {
    const res = await agent
      .post('/api/documentos')
      .send(makeDocumentoPayload({ tipoDocumento: 'TipoInexistente' }));

    expect(res.status).toBe(400);
  });
});

describe('GET /api/documentos/:id', () => {
  test('retorna documento pelo ID', async () => {
    const created = await agent
      .post('/api/documentos')
      .send(makeDocumentoPayload());

    expect(created.status).toBe(201);
    const id = created.body.data._id;
    const res = await agent.get(`/api/documentos/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.tipoDocumento).toBe('Exame');
  });

  test('retorna 404 para ID inexistente', async () => {
    const res = await agent.get('/api/documentos/000000000000000000000000');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/documentos/:id', () => {
  test('atualiza documento com dados válidos', async () => {
    const created = await agent
      .post('/api/documentos')
      .send(makeDocumentoPayload());

    expect(created.status).toBe(201);
    const id = created.body.data._id;
    const res = await agent
      .put(`/api/documentos/${id}`)
      .send(makeDocumentoPayload({ descricao: 'Descrição atualizada' }));

    expect(res.status).toBe(200);
    expect(res.body.data.descricao).toBe('Descrição atualizada');
  });
});

describe('DELETE /api/documentos/:id', () => {
  test('remove documento existente', async () => {
    const created = await agent
      .post('/api/documentos')
      .send(makeDocumentoPayload());

    expect(created.status).toBe(201);
    const id = created.body.data._id;
    const res = await agent.delete(`/api/documentos/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('retorna 404 para ID inexistente', async () => {
    const res = await agent.delete('/api/documentos/000000000000000000000000');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/documentos/:id/clonar', () => {
  test('clona documento existente', async () => {
    const created = await agent
      .post('/api/documentos')
      .send(makeDocumentoPayload());

    expect(created.status).toBe(201);
    const id = created.body.data._id;
    const res = await agent.post(`/api/documentos/${id}/clonar`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.documentoClonado).toBeDefined();

    const clone = await agent.get(`/api/documentos/${res.body.data.documentoClonado}`);
    expect(clone.body.data.descricao).toMatch(/^\[CÓPIA\]/);
  });
});

describe('GET /api/documentos (filtros e paginação)', () => {
  test('filtra por tipo de documento', async () => {
    await agent.post('/api/documentos').send(makeDocumentoPayload({ tipoDocumento: 'Exame' }));
    await agent.post('/api/documentos').send(makeDocumentoPayload({ tipoDocumento: 'Receita', 'profissionalSolicitante.numeroRegistro': 'CRM-999' }));

    const res = await agent.get('/api/documentos?tipoDocumento=Exame');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.every(d => d.tipoDocumento === 'Exame')).toBe(true);
  });

  test('suporta paginação com page e limit', async () => {
    await agent.post('/api/documentos').send(makeDocumentoPayload({ tipoDocumento: 'Exame' }));
    await agent.post('/api/documentos').send(makeDocumentoPayload({ tipoDocumento: 'Receita', 'profissionalSolicitante.numeroRegistro': 'CRM-999' }));

    const res = await agent.get('/api/documentos?page=1&limit=1');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.pages).toBeGreaterThanOrEqual(2);
  });
});

describe('GET /api/estatisticas', () => {
  test('retorna estatísticas de documentos', async () => {
    await agent.post('/api/documentos').send(makeDocumentoPayload());

    const res = await agent.get('/api/estatisticas');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('totalDocumentos');
    expect(res.body.data).toHaveProperty('documentosPorTipo');
    expect(res.body.data).toHaveProperty('documentosRecentes');
  });

  test('retorna 401 sem autenticação', async () => {
    const res = await supertest(app).get('/api/estatisticas');
    expect(res.status).toBe(401);
  });
});
