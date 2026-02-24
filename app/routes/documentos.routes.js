// routes/documentos.routes.js
const express = require('express');
const multer = require('multer');
const { body } = require('express-validator');
const {
  listarDocumentos,
  criarDocumento,
  obterDocumento,
  atualizarDocumento,
  removerDocumento,
  clonarDocumento,
  removerArquivo,
} = require('../controllers/documentos.controller');
const { preventDuplication } = require('../middlewares/duplication.middleware');
const { processFormData } = require('../middlewares/formdata.middleware');
const { handleValidationErrors } = require('../middlewares/validation.middleware');

const router = express.Router();
const upload = multer();

const documentoValidators = [
  body('tipoDocumento').isIn([
    'Relatório',
    'Exame',
    'Receita',
    'Laudo',
    'Atestado',
    'Cartão de Vacina',
    'Resultado',
    'Outro',
  ]),
  body('especialidadeMedica').isLength({ min: 1, max: 200 }).trim(),
  body('dataSolicitacaoEmissao').isISO8601(),
  body('profissionalSolicitante.nome').isLength({ min: 1, max: 200 }).trim(),
  body('profissionalSolicitante.numeroRegistro').isLength({ min: 1, max: 50 }).trim(),
  body('descricao').isLength({ min: 1, max: 1000 }).trim(),
  body('instituicao.nome').isLength({ min: 1, max: 200 }).trim(),
];

router.get('/', listarDocumentos);

router.post(
  '/',
  upload.none(),
  processFormData,
  preventDuplication,
  documentoValidators,
  handleValidationErrors,
  criarDocumento,
);

router.get('/:id', obterDocumento);

router.put(
  '/:id',
  upload.none(),
  processFormData,
  documentoValidators,
  handleValidationErrors,
  atualizarDocumento,
);

router.delete('/:id', removerDocumento);

router.post('/:id/clonar', clonarDocumento);

router.delete('/:id/arquivos/:arquivo_id', removerArquivo);

module.exports = router;
