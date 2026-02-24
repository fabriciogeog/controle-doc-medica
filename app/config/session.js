// config/session.js
const session = require('express-session');
const MongoStore = require('connect-mongo');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/controle_doc_medica';

function setupSession(app) {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'DocMed_Session_Secret_2025',
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: MONGODB_URI,
        collectionName: 'sessions',
      }),
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000,
      },
    }),
  );
}

module.exports = { setupSession };
