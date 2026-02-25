const { processFormData } = require('../../middlewares/formdata.middleware');

function runMiddleware(body) {
  const req = { body: { ...body } };
  const next = jest.fn();
  processFormData(req, {}, next);
  return { req, next };
}

describe('processFormData', () => {
  test('transforma campos profissionalSolicitante.* em objeto aninhado', () => {
    const { req, next } = runMiddleware({
      'profissionalSolicitante.nome': 'Dr. Ana',
      'profissionalSolicitante.numeroRegistro': 'CRM-999',
      'profissionalSolicitante.especialidade': 'Neurologia',
    });

    expect(req.body.profissionalSolicitante).toEqual({
      nome: 'Dr. Ana',
      numeroRegistro: 'CRM-999',
      especialidade: 'Neurologia',
    });
    expect(req.body['profissionalSolicitante.nome']).toBeUndefined();
    expect(req.body['profissionalSolicitante.numeroRegistro']).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('transforma campos instituicao.* em objeto aninhado', () => {
    const { req, next } = runMiddleware({
      'instituicao.nome': 'Hospital Central',
      'instituicao.cnpj': '12.345.678/0001-99',
    });

    expect(req.body.instituicao).toEqual({
      nome: 'Hospital Central',
      cnpj: '12.345.678/0001-99',
    });
    expect(req.body['instituicao.nome']).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('mantém campos não reconhecidos sem alteração', () => {
    const { req } = runMiddleware({
      tipoDocumento: 'Exame',
      descricao: 'Eletrocardiograma',
    });

    expect(req.body.tipoDocumento).toBe('Exame');
    expect(req.body.descricao).toBe('Eletrocardiograma');
  });

  test('sempre chama next()', () => {
    const { next } = runMiddleware({});
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('funciona com body nulo', () => {
    const req = { body: null };
    const next = jest.fn();
    processFormData(req, {}, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('processa profissional e instituicao juntos', () => {
    const { req } = runMiddleware({
      tipoDocumento: 'Laudo',
      'profissionalSolicitante.nome': 'Dr. Carlos',
      'profissionalSolicitante.numeroRegistro': 'CRM-001',
      'profissionalSolicitante.especialidade': 'Ortopedia',
      'instituicao.nome': 'Clínica Norte',
    });

    expect(req.body.profissionalSolicitante.nome).toBe('Dr. Carlos');
    expect(req.body.instituicao.nome).toBe('Clínica Norte');
    expect(req.body.tipoDocumento).toBe('Laudo');
  });
});
