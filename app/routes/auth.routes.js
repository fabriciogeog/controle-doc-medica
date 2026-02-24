// routes/auth.routes.js
const express = require('express');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middlewares/validation.middleware');
const { login, logout, check } = require('../controllers/auth.controller');

const router = express.Router();

router.post(
  '/login',
  [body('senha').isLength({ min: 4 })],
  handleValidationErrors,
  login,
);

router.post('/logout', logout);

router.get('/check', check);

module.exports = router;
