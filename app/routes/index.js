// routes/index.js
const express = require('express');
const authRoutes = require('./auth.routes');
const documentosRoutes = require('./documentos.routes');
const profissionaisRoutes = require('./profissionais.routes');
const { requireAuth } = require('../middlewares/auth.middleware');
const {
  abrirArquivo,
  visualizarArquivo,
  estatisticas,
} = require('../controllers/documentos.controller');

const router = express.Router();

router.use('/auth', authRoutes);

router.post('/abrir-arquivo', requireAuth, abrirArquivo);
router.get('/visualizar-arquivo', requireAuth, visualizarArquivo);
router.get('/estatisticas', requireAuth, estatisticas);

router.use('/documentos', requireAuth, documentosRoutes);
router.use('/profissionais', requireAuth, profissionaisRoutes);

module.exports = router;
