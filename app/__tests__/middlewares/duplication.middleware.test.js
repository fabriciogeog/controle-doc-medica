const { EventEmitter } = require('events');

function makeReq(overrides = {}) {
  const emitter = new EventEmitter();
  return Object.assign(emitter, {
    method: 'POST',
    originalUrl: '/api/documentos',
    session: { id: 'session-abc' },
    body: {
      tipoDocumento: 'Exame',
      especialidadeMedica: 'Cardiologia',
      dataSolicitacaoEmissao: '2024-01-15',
      descricao: 'ECG de rotina',
      profissionalSolicitante: { nome: 'Dr. A', numeroRegistro: 'CRM-1' },
      instituicao: { nome: 'Hospital X' },
    },
    ...overrides,
  });
}

function makeRes(statusCode = 200) {
  const res = { statusCode };
  res.status = jest.fn((code) => { res.statusCode = code; return res; });
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('preventDuplication', () => {
  // Recarrega o módulo a cada teste para limpar o Map interno
  let preventDuplication;

  beforeEach(() => {
    jest.isolateModules(() => {
      ({ preventDuplication } = require('../../middlewares/duplication.middleware'));
    });
  });

  test('chama next() na primeira requisição', () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    preventDuplication(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('retorna 409 em requisição duplicada', () => {
    const next = jest.fn();

    // Primeira requisição
    const req1 = makeReq({ session: { id: 'session-dup' } });
    preventDuplication(req1, makeRes(), next);

    // Segunda requisição com mesmos dados e mesma sessão
    const req2 = makeReq({ session: { id: 'session-dup' } });
    const res2 = makeRes();
    preventDuplication(req2, res2, next);

    expect(res2.status).toHaveBeenCalledWith(409);
    expect(next).toHaveBeenCalledTimes(1); // só a primeira chamou next
  });

  test('permite requisições com dados diferentes', () => {
    const next = jest.fn();

    const req1 = makeReq({ session: { id: 'session-diff' } });
    preventDuplication(req1, makeRes(), next);

    const req2 = makeReq({
      session: { id: 'session-diff' },
      body: { ...makeReq().body, descricao: 'Outra descrição diferente' },
    });
    preventDuplication(req2, makeRes(), next);

    expect(next).toHaveBeenCalledTimes(2);
  });

  test('usa session.id como parte da chave de cache (sessões diferentes não colidem)', () => {
    const next = jest.fn();

    const req1 = makeReq({ session: { id: 'sessao-A' } });
    preventDuplication(req1, makeRes(), next);

    // Mesmos dados, mas sessão diferente — deve passar
    const req2 = makeReq({ session: { id: 'sessao-B' } });
    const res2 = makeRes();
    preventDuplication(req2, res2, next);

    expect(next).toHaveBeenCalledTimes(2);
    expect(res2.status).not.toHaveBeenCalled();
  });

  test('ignora rotas que não são POST /api/documentos', () => {
    const next = jest.fn();

    const req = makeReq({ method: 'GET', originalUrl: '/api/documentos' });
    preventDuplication(req, makeRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
