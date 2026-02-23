// app/models/Profissional.js
const mongoose = require('mongoose');

const ProfissionalSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true,
    index: true // para busca rápida
  },
  numeroRegistro: {
    type: String,
    required: true,
    unique: true, // RN003: registro deve ser único
    trim: true,
    index: true
  },
  especialidade: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  instituicoesPrincipais: {
    type: [String],
    default: []
  },
  telefone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Email inválido']
  },
  observacoes: {
    type: String,
    default: ''
  },
  ativo: {
    type: Boolean,
    default: true // permite "inativar" sem excluir
  },
  dataCriacao: {
    type: Date,
    default: Date.now
  },
  dataAtualizacao: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'dataCriacao', updatedAt: 'dataAtualizacao' }
});

// Índice de texto para busca avançada (DAS 4.2)
ProfissionalSchema.index({
  nome: 'text',
  numeroRegistro: 'text',
  especialidade: 'text'
});

// Validação customizada: não permite exclusão lógica se houver documentos vinculados
// (Essa regra será aplicada na camada de serviço, não no modelo)

module.exports = mongoose.model('Profissional', ProfissionalSchema);
