const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

async function connect() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGODB_URI = uri;
  await mongoose.connect(uri);
}

async function closeDatabase() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await mongoServer.stop();
}

async function clearDatabase() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

// Limpa apenas as coleções de dados (documentacao, profissionais),
// preservando usuarios e sessions para manter auth entre testes.
async function clearDataCollections() {
  const skip = ['usuarios'];
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    if (!skip.includes(key)) {
      await collections[key].deleteMany({});
    }
  }
}

module.exports = { connect, closeDatabase, clearDatabase, clearDataCollections };
