// app/config/database.js
const mongoose = require('mongoose');

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://mongodb:27017/controle_doc_medica';

async function connectDatabase() {
  mongoose.set('strictQuery', true);

  await mongoose.connect(MONGODB_URI);
  console.log('✅ Conectado ao MongoDB com sucesso');

  mongoose.connection.on('error', (err) => {
    console.error('❌ Erro na conexão MongoDB:', err);
  });
}

module.exports = {
  connectDatabase,
  MONGODB_URI,
};
