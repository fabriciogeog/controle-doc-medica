// routes/auth.routes.js
const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { handleValidationErrors } = require('../middlewares/validation.middleware');
const { requireAuth } = require('../middlewares/auth.middleware');
const { login, logout, check, getPerfil, atualizarPerfil, alterarSenha } = require('../controllers/auth.controller');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
});

router.post(
  '/login',
  loginLimiter,
  [body('senha').isLength({ min: 4 })],
  handleValidationErrors,
  login,
);

router.post('/logout', logout);

router.get('/check', check);

router.get('/perfil', requireAuth, getPerfil);

router.put(
  '/perfil',
  requireAuth,
  [
    body('nome').optional().trim().isLength({ min: 2, max: 100 }),
    body('email').optional().isEmail().normalizeEmail(),
  ],
  handleValidationErrors,
  atualizarPerfil,
);

router.put(
  '/alterar-senha',
  requireAuth,
  [
    body('senhaAtual').isLength({ min: 4 }),
    body('novaSenha').isLength({ min: 6 }),
  ],
  handleValidationErrors,
  alterarSenha,
);

module.exports = router;
