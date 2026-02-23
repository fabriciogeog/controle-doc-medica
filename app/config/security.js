// config/security.js
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

function setupSecurity(app) {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        scriptSrcAttr: ["'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        fontSrc: ["'self'"],
      },
    },
  }));

  app.use(compression());

  app.set('trust proxy', 1);

  app.use(cors({
    origin: ['http://localhost', 'http://localhost:80', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  }));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: 'Muitas requisições deste IP, tente novamente em 15 minutos.',
  });
  app.use('/api/', limiter);
}

module.exports = { setupSecurity };
