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

async function getPerfil(req, res) {
  try {
    const usuario = await Usuario.findOne().select('-senha');
    if (!usuario) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    res.json({ success: true, data: { nome: usuario.nome, email: usuario.email } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar perfil' });
  }
}

async function atualizarPerfil(req, res) {
  try {
    const { nome, email } = req.body;
    const usuario = await Usuario.findOne();
    if (!usuario) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    if (nome) usuario.nome = nome.trim();
    if (email) usuario.email = email.trim().toLowerCase();
    await usuario.save();
    res.json({ success: true, message: 'Perfil atualizado com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao atualizar perfil' });
  }
}

async function alterarSenha(req, res) {
  try {
    const { senhaAtual, novaSenha } = req.body;
    const usuario = await Usuario.findOne();
    if (!usuario) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    const correta = await usuario.compararSenha(senhaAtual);
    if (!correta) return res.status(401).json({ success: false, message: 'Senha atual incorreta' });
    usuario.senha = novaSenha;
    await usuario.save();
    res.json({ success: true, message: 'Senha alterada com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao alterar senha' });
  }
}

module.exports = { login, logout, check, getPerfil, atualizarPerfil, alterarSenha };
