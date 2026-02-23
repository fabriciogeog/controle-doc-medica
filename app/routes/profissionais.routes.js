// routes/profissionais.routes.js
const express = require('express');
const multer = require('multer');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middlewares/validation.middleware');
const {
  listarProfissionais,
  obterProfissional,
  criarProfissional,
  atualizarProfissional,
  alterarStatusProfissional,
  excluirProfissional,
  autocompleteProfissionais,
} = require('../controllers/profissionais.controller');

const router = express.Router();
const upload = multer();

const profissionalValidators = [
  body('nome')
    .isLength({ min: 1, max: 200 })
    .trim()
    .withMessage('Nome é obrigatório e deve ter até 200 caracteres'),
  body('numeroRegistro')
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage(
      'Número de registro é obrigatório e deve ter até 50 caracteres',
    ),
  body('especialidade')
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Especialidade é obrigatória e deve ter até 100 caracteres'),
  body('telefone').optional({ checkFalsy: true }).isLength({ max: 20 }).trim(),
  body('email')
    .optional({ checkFalsy: true })
    .if(body('email').exists())
    .isEmail()
    .isLength({ max: 100 })
    .normalizeEmail(),
  body('observacoes').optional({ checkFalsy: true }).isLength({ max: 500 }).trim(),
  body('instituicoesPrincipais').optional({ checkFalsy: true }),
];

router.get('/', listarProfissionais);
router.get('/:id', obterProfissional);

router.post(
  '/',
  upload.none(),
  profissionalValidators,
  handleValidationErrors,
  criarProfissional,
);

router.put(
  '/:id',
  upload.none(),
  profissionalValidators,
  handleValidationErrors,
  atualizarProfissional,
);

router.patch('/:id/status', alterarStatusProfissional);

router.delete('/:id', excluirProfissional);

router.get('/busca/autocomplete', autocompleteProfissionais);

module.exports = router;
