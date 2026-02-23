// app/scripts/criar-usuario.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Usuario = require('../models/Usuario');

async function criarUsuario() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/controle_doc_medica');

  const email = 'fabricio@local';
  const senha = 'minha_senha_segura'; // ← ALTERE para algo seguro!
  const nome = 'Fabricio';

  // Verifica se já existe
  const existe = await Usuario.findOne({ email });
  if (existe) {
    console.log('✅ Usuário já existe:', email);
    process.exit(0);
  }

  // Cria novo usuário (a senha será criptografada pelo hook do Mongoose)
  const usuario = new Usuario({ nome, email, senha });
  await usuario.save();
  console.log('✅ Usuário criado com sucesso!');
  process.exit(0);
}

criarUsuario().catch(err => {
  console.error('❌ Erro ao criar usuário:', err);
  process.exit(1);
});
