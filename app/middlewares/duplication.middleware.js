// middlewares/duplication.middleware.js
const crypto = require('crypto');

const submissionCache = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of submissionCache.entries()) {
    if (now - timestamp > 30 * 1000) {
      submissionCache.delete(key);
    }
  }
}, 10 * 1000);

function preventDuplication(req, res, next) {
  if (req.method === 'POST' && req.originalUrl === '/api/documentos') {
    const contentToHash = {
      tipoDocumento: req.body.tipoDocumento,
      especialidadeMedica: req.body.especialidadeMedica,
      dataSolicitacaoEmissao: req.body.dataSolicitacaoEmissao,
      descricao: req.body.descricao,
      profissionalSolicitante: req.body.profissionalSolicitante,
      instituicao: req.body.instituicao,
    };

    const contentString = JSON.stringify(contentToHash);
    const hash = crypto.createHash('sha256').update(contentString).digest('hex');
    const cacheKey = `${req.session.id}-${hash}`;

    if (submissionCache.has(cacheKey)) {
      return res.status(409).json({
        success: false,
        message:
          'Documento duplicado detectado. Aguarde alguns segundos antes de tentar novamente.',
      });
    }

    submissionCache.set(cacheKey, Date.now());

    req.on('close', () => {
      if (res.statusCode >= 400) {
        submissionCache.delete(cacheKey);
      }
    });
  }

  next();
}

module.exports = { preventDuplication };
