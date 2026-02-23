// routes/index.js
const express = require('express');
const authRoutes = require('./auth.routes');
const documentosRoutes = require('./documentos.routes');
const profissionaisRoutes = require('./profissionais.routes');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/documentos', requireAuth, documentosRoutes);
router.use('/profissionais', requireAuth, profissionaisRoutes);

module.exports = router;
