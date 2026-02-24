// app/models/Documento.js
const mongoose = require('mongoose');

const DocumentoSchema = new mongoose.Schema({
  tipoDocumento: {
    type: String,
    required: true,
    enum: ['Relatório', 'Exame', 'Receita', 'Laudo', 'Atestado', 'Cartão de Vacina', 'Resultado', 'Outro'],
  },
  especialidadeMedica: {
    type: String,
    required: true,
    maxlength: 200,
  },
  dataSolicitacaoEmissao: {
    type: Date,
    required: true,
  },
  profissionalSolicitante: {
    nome: { type: String, required: true, maxlength: 200 },
    numeroRegistro: { type: String, required: true, maxlength: 50 },
    especialidade: { type: String, maxlength: 100 },
  },
  descricao: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  instituicao: {
    nome: { type: String, required: true, maxlength: 200 },
    cnpj: { type: String, maxlength: 18 },
  },
  arquivos: [{
    nomeArquivo: String,
    caminhoAbsoluto: String,
    tipoArquivo: String,
    descricaoArquivo: String,
    dataInclusao: { type: Date, default: Date.now },
  }],
  tags: [{ type: String, maxlength: 50 }],
  observacoes: { type: String, maxlength: 2000 },
  dataCriacaoRegistro: { type: Date, default: Date.now },
  dataAtualizacao: { type: Date, default: Date.now },
}, {
  collection: 'documentacao',
});

DocumentoSchema.index({ dataCriacaoRegistro: -1, tipoDocumento: 1, especialidadeMedica: 1 });

module.exports = mongoose.model('Documento', DocumentoSchema);
