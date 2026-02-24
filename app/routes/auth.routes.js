// routes/auth.routes.js
const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { handleValidationErrors } = require('../middlewares/validation.middleware');
const { login, logout, check } = require('../controllers/auth.controller');

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

module.exports = router;
