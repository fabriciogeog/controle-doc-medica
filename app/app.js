require('dotenv').config();
const express = require('express');
const path = require('path');
const multer = require('multer');
const mongoose = require('mongoose');
const { setupSecurity } = require('./config/security');
const { setupSession } = require('./config/session');
const { connectDB } = require('./config/db');
const apiRoutes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// Security middlewares (helmet, compression, cors, rate limiting)
setupSecurity(app);

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Sessions
setupSession(app);

// Database (skipped in test environment — tests manage their own connection)
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// Static files
app.use(express.static(PUBLIC_DIR));
app.use('/uploads', express.static(UPLOAD_DIR));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    version: '1.0.0',
    service: 'Sistema de Controle de Documentação Médica',
  });
});

// Main SPA route
app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// API routes
app.use('/api', apiRoutes);

// Multer error handler
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Arquivo muito grande. Limite: 10MB por arquivo.',
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Muitos arquivos. Limite: 5 arquivos por upload.',
      });
    }
  }
  next(error);
});

// Generic error handler
app.use((err, req, res, next) => {
  console.error('Erro na aplicação:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
    path: req.originalUrl,
  });
});

// Start server (skipped in test environment — supertest binds its own port)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Sistema de Documentação Médica rodando na porta ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📁 Diretório de uploads: ${UPLOAD_DIR}`);
    console.log(`🌐 Interface web: http://localhost:${PORT}`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 Fechando servidor graciosamente...');
  mongoose.connection.close(() => {
    console.log('📪 Conexão com MongoDB fechada.');
    process.exit(0);
  });
});

module.exports = app;
