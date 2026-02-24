// middlewares/formdata.middleware.js
// Transforms flat FormData fields (e.g. "profissionalSolicitante.nome") into nested objects.

function processFormData(req, res, next) {
  if (req.body) {
    if (
      req.body['profissionalSolicitante.nome'] ||
      req.body['profissionalSolicitante.numeroRegistro'] ||
      req.body['profissionalSolicitante.especialidade']
    ) {
      req.body.profissionalSolicitante = {
        nome: req.body['profissionalSolicitante.nome'],
        numeroRegistro: req.body['profissionalSolicitante.numeroRegistro'],
        especialidade: req.body['profissionalSolicitante.especialidade'],
      };
      delete req.body['profissionalSolicitante.nome'];
      delete req.body['profissionalSolicitante.numeroRegistro'];
      delete req.body['profissionalSolicitante.especialidade'];
    }

    if (req.body['instituicao.nome'] || req.body['instituicao.cnpj']) {
      req.body.instituicao = {
        nome: req.body['instituicao.nome'],
        cnpj: req.body['instituicao.cnpj'],
      };
      delete req.body['instituicao.nome'];
      delete req.body['instituicao.cnpj'];
    }
  }

  next();
}

module.exports = { processFormData };
