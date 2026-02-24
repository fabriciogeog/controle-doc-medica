// controllers/auth.controller.js
const Usuario = require('../models/Usuario');

async function login(req, res) {
  const { senha } = req.body;

  try {
    const usuario = await Usuario.findOne();

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Senha incorreta',
      });
    }

    const senhaCorreta = await usuario.compararSenha(senha);
    if (!senhaCorreta) {
      return res.status(401).json({
        success: false,
        message: 'Senha incorreta',
      });
    }

    req.session.authenticated = true;
    return res.json({
      success: true,
      message: 'Login realizado com sucesso',
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno no servidor',
    });
  }
}

function logout(req, res) {
  req.session.destroy();
  return res.json({
    success: true,
    message: 'Logout realizado com sucesso',
  });
}

function check(req, res) {
  return res.json({
    authenticated: !!(req.session && req.session.authenticated),
  });
}

module.exports = { login, logout, check };
