const supertest = require('supertest');
const Usuario = require('../../models/Usuario');

const TEST_PASSWORD = 'senha123';

async function createTestUser() {
  const usuario = new Usuario({
    email: 'admin@teste.com',
    nome: 'Admin Teste',
    senha: TEST_PASSWORD,
  });
  await usuario.save();
  return usuario;
}

async function createAuthenticatedAgent(app) {
  await createTestUser();
  const agent = supertest.agent(app);
  await agent
    .post('/api/auth/login')
    .send({ senha: TEST_PASSWORD });
  return agent;
}

function makeProfissionalPayload(overrides = {}) {
  return {
    nome: 'Dr. João Silva',
    numeroRegistro: 'CRM-12345',
    especialidade: 'Cardiologia',
    telefone: '(11) 9999-0000',
    email: 'joao@hospital.com',
    ...overrides,
  };
}

// Contador garante que cada chamada gera um hash único para o preventDuplication
let _docSeq = 0;

function makeDocumentoPayload(overrides = {}) {
  _docSeq += 1;
  return {
    tipoDocumento: 'Exame',
    especialidadeMedica: 'Cardiologia',
    dataSolicitacaoEmissao: '2024-01-15',
    'profissionalSolicitante.nome': 'Dr. João Silva',
    'profissionalSolicitante.numeroRegistro': 'CRM-12345',
    descricao: `Eletrocardiograma de rotina #${_docSeq}`,
    'instituicao.nome': 'Hospital São Paulo',
    ...overrides,
  };
}

module.exports = {
  TEST_PASSWORD,
  createTestUser,
  createAuthenticatedAgent,
  makeProfissionalPayload,
  makeDocumentoPayload,
};
