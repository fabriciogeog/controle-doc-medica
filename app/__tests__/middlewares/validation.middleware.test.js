// Mocka express-validator antes de qualquer require
jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

const { validationResult } = require('express-validator');
const { handleValidationErrors } = require('../../middlewares/validation.middleware');

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('handleValidationErrors', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('chama next() quando não há erros de validação', () => {
    validationResult.mockReturnValue({ isEmpty: () => true });
    const req = {};
    const res = makeRes();
    const next = jest.fn();

    handleValidationErrors(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('retorna 400 com array de erros quando há falhas de validação', () => {
    const erros = [
      { field: 'nome', msg: 'Nome é obrigatório' },
      { field: 'email', msg: 'Email inválido' },
    ];
    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => erros,
    });

    const req = {};
    const res = makeRes();
    const next = jest.fn();

    handleValidationErrors(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        errors: erros,
      }),
    );
  });

  test('não chama next() quando há erros', () => {
    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [{ msg: 'Erro qualquer' }],
    });

    const req = {};
    const res = makeRes();
    const next = jest.fn();

    handleValidationErrors(req, res, next);

    expect(next).not.toHaveBeenCalled();
  });
});
