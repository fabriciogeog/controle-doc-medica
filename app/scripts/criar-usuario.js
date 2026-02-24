// app/scripts/criar-usuario.js
// Usage: node app/scripts/criar-usuario.js
// Requires ADMIN_PASSWORD set in app/.env (or environment)

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');

async function criarUsuario() {
  const senha = process.env.ADMIN_PASSWORD;
  if (!senha) {
    console.error('❌ ADMIN_PASSWORD não definido no .env');
    console.error('   Adicione ADMIN_PASSWORD=sua_senha_segura ao arquivo app/.env');
    process.exit(1);
  }

  const email = process.env.ADMIN_EMAIL || 'admin@local';
  const nome = process.env.ADMIN_NOME || 'Administrador';

  await mongoose.connect(
    process.env.MONGODB_URI || 'mongodb://mongodb:27017/controle_doc_medica',
  );

  const existe = await Usuario.findOne({ email });
  if (existe) {
    console.log('✅ Usuário já existe:', email);
    process.exit(0);
  }

  // A senha será criptografada pelo pre-save hook do Mongoose
  const usuario = new Usuario({ nome, email, senha });
  await usuario.save();
  console.log('✅ Usuário criado com sucesso!', email);
  process.exit(0);
}

criarUsuario().catch(err => {
  console.error('❌ Erro ao criar usuário:', err);
  process.exit(1);
});
