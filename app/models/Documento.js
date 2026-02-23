// app/models/Documento.js
const mongoose = require('mongoose');

const arquivoSchema = new mongoose.Schema({
  nomeArquivo: {
    type: String,
    required: true,
    trim: true
  },
  caminhoAbsoluto: {
    type: String,
    required: true
  },
  tipoArquivo: {
    type: String,
    required: true,
    enum: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
  },
  descricaoArquivo: {
    type: String,
    default: ''
  },
  dataInclusao: {
    type: Date,
    default: Date.now
  }
});

const instituicaoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true
  },
  cnpj: {
    type: String,
    trim: true,
    match: [/^\d{14}$|^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido']
  }
});

const DocumentoSchema = new mongoose.Schema({
  tipoDocumento: {
    type: String,
    required: true,
    enum: ['exame', 'receita', 'laudo', 'atestado'],
    trim: true
  },
  especialidadeMedica: {
    type: String,
    required: true,
    trim: true
  },
  dataSolicitacaoEmissao: {
    type: Date,
    required: true,
    validate: {
      validator: function (v) {
        return v <= new Date(); // Não permite datas futuras
      },
      message: 'A data do documento não pode ser futura.'
    }
  },
  profissionalSolicitante: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profissional',
    required: true
  },
  descricao: {
    type: String,
    required: true,
    trim: true
  },
  instituicao: {
    type: instituicaoSchema,
    required: true
  },
  arquivos: {
    type: [arquivoSchema],
    default: []
  },
  tags: {
    type: [String],
    default: []
  },
  observacoes: {
    type: String,
    default: ''
  },
  dataCriacaoRegistro: {
    type: Date,
    default: Date.now
  },
  dataAtualizacao: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'dataCriacaoRegistro', updatedAt: 'dataAtualizacao' }
});

// Índice para busca e ordenação (DAS 4.2)
DocumentoSchema.index({
  dataCriacaoRegistro: -1,
  tipoDocumento: 1,
  especialidadeMedica: 1
});

module.exports = mongoose.model('Documento', DocumentoSchema);
