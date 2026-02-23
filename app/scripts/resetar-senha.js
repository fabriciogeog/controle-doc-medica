// app/scripts/resetar-senha.js
const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');

async function resetarSenha() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/controle_doc_medica');

  const email = 'fabricio@local';
  const novaSenha = 'senha123'; // ← Senha temporária

  const usuario = await Usuario.findOne({ email });
  if (!usuario) {
    console.log('❌ Usuário não encontrado:', email);
    process.exit(1);
  }

  // Atualiza a senha (o hook do Mongoose vai criptografar)
  usuario.senha = novaSenha;
  await usuario.save();
  
  console.log('✅ Senha resetada com sucesso!');
  console.log('📧 Email:', email);
  console.log('🔑 Nova senha:', novaSenha);
  process.exit(0);
}

resetarSenha().catch(err => {
  console.error('❌ Erro ao resetar senha:', err);
  process.exit(1);
});
