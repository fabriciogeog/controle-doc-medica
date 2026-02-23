// routes/auth.routes.js
const express = require('express');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middlewares/validation.middleware');

const router = express.Router();

router.post(
  '/login',
  [body('senha').isLength({ min: 4 })],
  handleValidationErrors,
  (req, res) => {
    const { senha } = req.body;

    if (senha === process.env.ADMIN_PASSWORD || senha === 'senha123') {
      req.session.authenticated = true;
      return res.json({
        success: true,
        message: 'Login realizado com sucesso',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Senha incorreta',
    });
  },
);

router.post('/logout', (req, res) => {
  req.session.destroy();
  return res.json({
    success: true,
    message: 'Logout realizado com sucesso',
  });
});

router.get('/check', (req, res) => {
  return res.json({
    authenticated: !!(req.session && req.session.authenticated),
  });
});

module.exports = router;
