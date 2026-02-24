// controllers/profissionais.controller.js
const Profissional = require('../models/Profissional');
const Documento = require('../models/Documento');

async function listarProfissionais(req, res) {
  try {
    const {
      busca,
      especialidade,
      ativo = 'true',
      page = 1,
      limit = 50,
    } = req.query;

    const filtros = {};

    if (ativo !== 'all') {
      filtros.ativo = ativo === 'true';
    }

    if (especialidade) {
      filtros.especialidade = { $regex: especialidade, $options: 'i' };
    }

    if (busca) {
      filtros.$or = [
        { nome: { $regex: busca, $options: 'i' } },
        { numeroRegistro: { $regex: busca, $options: 'i' } },
        { especialidade: { $regex: busca, $options: 'i' } },
        { instituicoesPrincipais: { $in: [new RegExp(busca, 'i')] } },
      ];
    }

    const skip = (page - 1) * limit;
    const profissionais = await Profissional.find(filtros)
      .sort({ nome: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Profissional.countDocuments(filtros);

    res.json({
      success: true,
      count: profissionais.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: profissionais,
    });
  } catch (error) {
    console.error('Erro ao listar profissionais:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar profissionais',
      error: error.message,
    });
  }
}

async function obterProfissional(req, res) {
  try {
    const profissional = await Profissional.findById(req.params.id);
    if (!profissional) {
      return res.status(404).json({
        success: false,
        message: 'Profissional não encontrado',
      });
    }
    res.json({ success: true, data: profissional });
  } catch (error) {
    console.error('Erro ao buscar profissional:', error);
    res.status(400).json({
      success: false,
      message: 'Erro ao buscar profissional',
      error: error.message,
    });
  }
}

async function criarProfissional(req, res) {
  try {
    const profissionalExistente = await Profissional.findOne({
      numeroRegistro: req.body.numeroRegistro.toUpperCase(),
    });

    if (profissionalExistente) {
      return res.status(409).json({
        success: false,
        message: 'Já existe um profissional cadastrado com este número de registro',
      });
    }

    const dadosProfissional = {
      nome: req.body.nome,
      numeroRegistro: req.body.numeroRegistro.toUpperCase(),
      especialidade: req.body.especialidade,
      ativo: req.body.ativo !== undefined ? req.body.ativo : true,
    };

    if (req.body.telefone && req.body.telefone.trim()) {
      dadosProfissional.telefone = req.body.telefone.trim();
    }
    if (req.body.email && req.body.email.trim()) {
      dadosProfissional.email = req.body.email.trim();
    }
    if (req.body.observacoes && req.body.observacoes.trim()) {
      dadosProfissional.observacoes = req.body.observacoes.trim();
    }

    if (req.body.instituicoesPrincipais && typeof req.body.instituicoesPrincipais === 'string' && req.body.instituicoesPrincipais.trim()) {
      dadosProfissional.instituicoesPrincipais = req.body.instituicoesPrincipais
        .split(',')
        .map(inst => inst.trim())
        .filter(inst => inst.length > 0);
    } else if (Array.isArray(req.body.instituicoesPrincipais)) {
      dadosProfissional.instituicoesPrincipais = req.body.instituicoesPrincipais
        .filter(inst => inst && inst.trim().length > 0);
    }

    const profissional = new Profissional(dadosProfissional);
    await profissional.save();

    console.log(`➕ Novo profissional cadastrado: ${profissional.nome} (${profissional.numeroRegistro})`);

    res.status(201).json({
      success: true,
      message: 'Profissional cadastrado com sucesso',
      data: profissional,
    });
  } catch (error) {
    console.error('Erro ao criar profissional:', error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Já existe um profissional com este número de registro',
      });
    }
    res.status(400).json({
      success: false,
      message: 'Erro ao cadastrar profissional',
      error: error.message,
    });
  }
}

async function atualizarProfissional(req, res) {
  try {
    const profissional = await Profissional.findById(req.params.id);
    if (!profissional) {
      return res.status(404).json({
        success: false,
        message: 'Profissional não encontrado',
      });
    }

    if (req.body.numeroRegistro) {
      const registroExistente = await Profissional.findOne({
        numeroRegistro: req.body.numeroRegistro.toUpperCase(),
        _id: { $ne: req.params.id },
      });
      if (registroExistente) {
        return res.status(409).json({
          success: false,
          message: 'Já existe outro profissional com este número de registro',
        });
      }
    }

    const dadosAtualizacao = {
      nome: req.body.nome,
      numeroRegistro: req.body.numeroRegistro?.toUpperCase(),
      especialidade: req.body.especialidade,
      dataAtualizacao: Date.now(),
    };

    if (req.body.ativo !== undefined) {
      dadosAtualizacao.ativo = req.body.ativo;
    }
    if (req.body.telefone !== undefined) {
      dadosAtualizacao.telefone = req.body.telefone && req.body.telefone.trim() ? req.body.telefone.trim() : undefined;
    }
    if (req.body.email !== undefined) {
      dadosAtualizacao.email = req.body.email && req.body.email.trim() ? req.body.email.trim() : undefined;
    }
    if (req.body.observacoes !== undefined) {
      dadosAtualizacao.observacoes = req.body.observacoes && req.body.observacoes.trim() ? req.body.observacoes.trim() : undefined;
    }

    if (req.body.instituicoesPrincipais !== undefined) {
      if (req.body.instituicoesPrincipais && typeof req.body.instituicoesPrincipais === 'string' && req.body.instituicoesPrincipais.trim()) {
        dadosAtualizacao.instituicoesPrincipais = req.body.instituicoesPrincipais
          .split(',')
          .map(inst => inst.trim())
          .filter(inst => inst.length > 0);
      } else if (Array.isArray(req.body.instituicoesPrincipais)) {
        dadosAtualizacao.instituicoesPrincipais = req.body.instituicoesPrincipais
          .filter(inst => inst && inst.trim().length > 0);
      } else {
        dadosAtualizacao.instituicoesPrincipais = [];
      }
    }

    const profissionalAtualizado = await Profissional.findByIdAndUpdate(
      req.params.id,
      dadosAtualizacao,
      { new: true, runValidators: true },
    );

    console.log(`✏️ Profissional atualizado: ${profissionalAtualizado.nome}`);

    res.json({
      success: true,
      message: 'Profissional atualizado com sucesso',
      data: profissionalAtualizado,
    });
  } catch (error) {
    console.error('Erro ao atualizar profissional:', error);
    res.status(400).json({
      success: false,
      message: 'Erro ao atualizar profissional',
      error: error.message,
    });
  }
}

async function alterarStatusProfissional(req, res) {
  try {
    const { ativo } = req.body;

    const profissional = await Profissional.findByIdAndUpdate(
      req.params.id,
      { ativo, dataAtualizacao: Date.now() },
      { new: true },
    );

    if (!profissional) {
      return res.status(404).json({
        success: false,
        message: 'Profissional não encontrado',
      });
    }

    console.log(`🔄 Status do profissional alterado: ${profissional.nome} - ${ativo ? 'Ativo' : 'Inativo'}`);

    res.json({
      success: true,
      message: `Profissional ${ativo ? 'ativado' : 'inativado'} com sucesso`,
      data: profissional,
    });
  } catch (error) {
    console.error('Erro ao alterar status do profissional:', error);
    res.status(400).json({
      success: false,
      message: 'Erro ao alterar status do profissional',
      error: error.message,
    });
  }
}

async function excluirProfissional(req, res) {
  try {
    const profissional = await Profissional.findById(req.params.id);
    if (!profissional) {
      return res.status(404).json({
        success: false,
        message: 'Profissional não encontrado',
      });
    }

    const documentosDesteProfissional = await Documento.countDocuments({
      'profissionalSolicitante.numeroRegistro': profissional.numeroRegistro,
    });

    if (documentosDesteProfissional > 0) {
      return res.status(409).json({
        success: false,
        message: `Não é possível excluir este profissional pois ele está vinculado a ${documentosDesteProfissional} documento(s). Considere inativá-lo.`,
      });
    }

    await Profissional.findByIdAndDelete(req.params.id);

    console.log(`🗑️ Profissional excluído: ${profissional.nome}`);

    res.json({
      success: true,
      message: 'Profissional excluído com sucesso',
    });
  } catch (error) {
    console.error('Erro ao excluir profissional:', error);
    res.status(400).json({
      success: false,
      message: 'Erro ao excluir profissional',
      error: error.message,
    });
  }
}

async function autocompleteProfissionais(req, res) {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const profissionais = await Profissional.find({
      ativo: true,
      $or: [
        { nome: { $regex: q, $options: 'i' } },
        { numeroRegistro: { $regex: q, $options: 'i' } },
        { especialidade: { $regex: q, $options: 'i' } },
      ],
    })
      .select('nome numeroRegistro especialidade')
      .limit(parseInt(limit))
      .sort({ nome: 1 });

    res.json({ success: true, data: profissionais });
  } catch (error) {
    console.error('Erro na busca de autocomplete:', error);
    res.status(500).json({
      success: false,
      message: 'Erro na busca',
      error: error.message,
    });
  }
}

module.exports = {
  listarProfissionais,
  obterProfissional,
  criarProfissional,
  atualizarProfissional,
  alterarStatusProfissional,
  excluirProfissional,
  autocompleteProfissionais,
};
