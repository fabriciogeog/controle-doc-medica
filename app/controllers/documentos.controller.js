// controllers/documentos.controller.js
const path = require('path');
const fs = require('fs-extra');
const Documento = require('../models/Documento');
const { validateFilePath } = require('../middlewares/filepath.middleware');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

async function listarDocumentos(req, res) {
  try {
    const {
      tipoDocumento,
      especialidadeMedica,
      profissional,
      instituicao,
      dataInicio,
      dataFim,
      busca,
      page = 1,
      limit = 20,
    } = req.query;

    const filtros = {};

    if (tipoDocumento) filtros.tipoDocumento = tipoDocumento;
    if (especialidadeMedica) filtros.especialidadeMedica = { $regex: especialidadeMedica, $options: 'i' };
    if (profissional) filtros['profissionalSolicitante.nome'] = { $regex: profissional, $options: 'i' };
    if (instituicao) filtros['instituicao.nome'] = { $regex: instituicao, $options: 'i' };

    if (dataInicio || dataFim) {
      filtros.dataSolicitacaoEmissao = {};
      if (dataInicio) filtros.dataSolicitacaoEmissao.$gte = new Date(dataInicio);
      if (dataFim) filtros.dataSolicitacaoEmissao.$lte = new Date(dataFim);
    }

    if (busca) {
      filtros.$or = [
        { descricao: { $regex: busca, $options: 'i' } },
        { 'profissionalSolicitante.nome': { $regex: busca, $options: 'i' } },
        { 'instituicao.nome': { $regex: busca, $options: 'i' } },
        { tags: { $in: [new RegExp(busca, 'i')] } },
        { observacoes: { $regex: busca, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const documentos = await Documento.find(filtros)
      .sort({ dataSolicitacaoEmissao: -1, dataCriacaoRegistro: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Documento.countDocuments(filtros);

    res.json({
      success: true,
      count: documentos.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: documentos,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar documentos',
      error: error.message,
    });
  }
}

async function criarDocumento(req, res) {
  try {
    const documentoData = req.body;

    if (documentoData.tags) {
      if (typeof documentoData.tags === 'string') {
        documentoData.tags = documentoData.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0);
      }
    }

    if (documentoData.arquivos && Array.isArray(documentoData.arquivos)) {
      documentoData.arquivos = documentoData.arquivos.map(arquivo => ({
        nomeArquivo: arquivo.nomeArquivo || 'Arquivo',
        caminhoAbsoluto: arquivo.caminhoAbsoluto,
        tipoArquivo: arquivo.tipoArquivo || 'pdf',
        descricaoArquivo: arquivo.descricaoArquivo || '',
      }));
    } else if (documentoData.caminhos && documentoData.caminhos.length > 0) {
      const caminhos = documentoData.caminhos.split('\n').map(c => c.trim()).filter(c => c);
      documentoData.arquivos = caminhos.map((caminho, index) => {
        const nomeArquivo = caminho.split('/').pop() || `Documento ${index + 1}`;
        let tipoArquivo = 'outro';
        if (caminho.toLowerCase().endsWith('.pdf')) tipoArquivo = 'pdf';
        else if (caminho.match(/\.(jpg|jpeg|png|gif|webp)$/i)) tipoArquivo = 'imagem';
        return {
          nomeArquivo,
          caminhoAbsoluto: caminho,
          tipoArquivo,
          descricaoArquivo: `Arquivo: ${nomeArquivo}`,
        };
      });
    }

    const documento = new Documento(documentoData);
    await documento.save();

    res.status(201).json({
      success: true,
      message: 'Documento criado com sucesso',
      data: documento,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erro ao criar documento',
      error: error.message,
    });
  }
}

async function obterDocumento(req, res) {
  try {
    const documento = await Documento.findById(req.params.id);
    if (!documento) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado',
      });
    }
    res.json({ success: true, data: documento });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erro ao buscar documento',
      error: error.message,
    });
  }
}

async function atualizarDocumento(req, res) {
  try {
    console.log(`📝 Tentativa de atualização do documento ID: ${req.params.id}`);

    const documento = await Documento.findById(req.params.id);
    if (!documento) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado',
      });
    }

    const updateData = req.body;
    updateData.dataAtualizacao = Date.now();

    if (updateData.tags) {
      if (typeof updateData.tags === 'string') {
        updateData.tags = updateData.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0);
      }
    }

    if (req.files && req.files.length > 0) {
      const novosArquivos = req.files.map(file => ({
        nomeArquivo: file.originalname,
        tipoArquivo: file.mimetype,
        linkArquivo: `/uploads/${file.filename}`,
        nomeArquivoSistema: file.filename,
        tamanhoArquivo: file.size,
      }));
      updateData.arquivos = [...(documento.arquivos || []), ...novosArquivos];
    }

    const documentoAtualizado = await Documento.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true },
    );

    console.log(`✅ Documento atualizado com sucesso: ${documentoAtualizado._id}`);

    res.json({
      success: true,
      message: 'Documento atualizado com sucesso',
      data: documentoAtualizado,
    });
  } catch (error) {
    console.error(`❌ Erro ao atualizar documento ${req.params.id}:`, error.message);
    res.status(400).json({
      success: false,
      message: 'Erro ao atualizar documento',
      error: error.message,
    });
  }
}

async function removerDocumento(req, res) {
  try {
    const documento = await Documento.findById(req.params.id);
    if (!documento) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado',
      });
    }

    if (documento.arquivos) {
      documento.arquivos.forEach(arquivo => {
        if (arquivo.nomeArquivoSistema) {
          const caminhoArquivo = path.join(UPLOAD_DIR, arquivo.nomeArquivoSistema);
          if (fs.existsSync(caminhoArquivo)) {
            fs.removeSync(caminhoArquivo);
          }
        }
      });
    }

    await Documento.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Documento removido com sucesso',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erro ao remover documento',
      error: error.message,
    });
  }
}

async function clonarDocumento(req, res) {
  try {
    const documentoOriginal = await Documento.findById(req.params.id);
    if (!documentoOriginal) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado para clonagem',
      });
    }

    const dadosClone = documentoOriginal.toObject();
    delete dadosClone._id;
    delete dadosClone.__v;

    const agora = new Date();
    dadosClone.dataCriacaoRegistro = agora;
    dadosClone.dataAtualizacao = agora;
    dadosClone.descricao = `[CÓPIA] ${dadosClone.descricao}`;

    if (dadosClone.arquivos && dadosClone.arquivos.length > 0) {
      dadosClone.arquivos = dadosClone.arquivos.map(arquivo => {
        const arquivoClone = { ...arquivo };
        delete arquivoClone._id;
        return arquivoClone;
      });
    }

    const documentoClonado = new Documento(dadosClone);
    await documentoClonado.save();

    console.log(`🔄 Documento clonado: ${req.params.id} → ${documentoClonado._id}`);

    res.json({
      success: true,
      message: 'Documento clonado com sucesso! Pronto para edição.',
      data: {
        documentoOriginal: req.params.id,
        documentoClonado: documentoClonado._id,
        documento: documentoClonado,
      },
    });
  } catch (error) {
    console.error('Erro ao clonar documento:', error);
    res.status(400).json({
      success: false,
      message: 'Erro ao clonar documento',
      error: error.message,
    });
  }
}

async function removerArquivo(req, res) {
  try {
    const documento = await Documento.findById(req.params.id);
    if (!documento) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado',
      });
    }

    const arquivoIndex = documento.arquivos.findIndex(
      arquivo => arquivo._id.toString() === req.params.arquivo_id,
    );

    if (arquivoIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Arquivo não encontrado',
      });
    }

    const arquivo = documento.arquivos[arquivoIndex];

    if (arquivo.nomeArquivoSistema) {
      const caminhoArquivo = path.join(UPLOAD_DIR, arquivo.nomeArquivoSistema);
      if (fs.existsSync(caminhoArquivo)) {
        fs.removeSync(caminhoArquivo);
      }
    }

    documento.arquivos.splice(arquivoIndex, 1);
    documento.dataAtualizacao = Date.now();
    await documento.save();

    res.json({
      success: true,
      message: 'Arquivo removido com sucesso',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erro ao remover arquivo',
      error: error.message,
    });
  }
}

async function abrirArquivo(req, res) {
  try {
    const { caminhoArquivo } = req.body;

    if (!caminhoArquivo) {
      return res.status(400).json({
        success: false,
        message: 'Caminho do arquivo não fornecido',
      });
    }

    if (!validateFilePath(caminhoArquivo)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso ao caminho não permitido',
      });
    }

    if (!fs.existsSync(caminhoArquivo)) {
      return res.status(404).json({
        success: false,
        message: 'Arquivo não encontrado',
      });
    }

    try {
      const requestsDir = '/tmp/evince-requests';
      const timestamp = Date.now();
      const requestFile = `${requestsDir}/request_${timestamp}.json`;

      fs.ensureDirSync(requestsDir);

      const requestData = {
        timestamp,
        arquivo: caminhoArquivo,
        usuario: 'fabricio',
        display: ':0',
      };

      fs.writeFileSync(requestFile, JSON.stringify(requestData, null, 2));

      console.log(`📂 Solicitação de abertura criada: ${requestFile}`);
      console.log(`📄 Arquivo solicitado: ${caminhoArquivo}`);

      setTimeout(() => {
        if (!fs.existsSync(requestFile)) {
          console.log('✅ Solicitação processada com sucesso pelo host');
        } else {
          console.log('⚠️ Solicitação não foi processada (wrapper pode não estar rodando)');
        }
      }, 2000);

      res.json({
        success: true,
        message: 'Solicitação de abertura enviada. Se o wrapper estiver ativo no host, o arquivo deve abrir automaticamente.',
        debug: {
          requestFile,
          targetFile: caminhoArquivo,
        },
      });
    } catch (requestError) {
      console.error('Erro ao criar solicitação:', requestError.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar solicitação de abertura do arquivo',
        error: requestError.message,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao processar a solicitação',
      error: error.message,
    });
  }
}

async function estatisticas(req, res) {
  try {
    const totalDocumentos = await Documento.countDocuments();
    const documentosPorTipo = await Documento.aggregate([
      { $group: { _id: '$tipoDocumento', total: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);
    const documentosPorEspecialidade = await Documento.aggregate([
      { $group: { _id: '$especialidadeMedica', total: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);
    const documentosRecentes = await Documento.find()
      .sort({ dataCriacaoRegistro: -1 })
      .limit(10)
      .select('descricao tipoDocumento especialidadeMedica profissionalSolicitante.nome dataSolicitacaoEmissao dataCriacaoRegistro');

    res.json({
      success: true,
      data: {
        totalDocumentos,
        documentosPorTipo,
        documentosPorEspecialidade,
        documentosRecentes,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas',
      error: error.message,
    });
  }
}

async function visualizarArquivo(req, res) {
  try {
    const { caminho } = req.query;

    if (!caminho) {
      return res.status(400).json({
        success: false,
        message: 'Caminho do arquivo não fornecido',
      });
    }

    if (!validateFilePath(caminho)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso ao caminho não permitido',
      });
    }

    if (!fs.existsSync(caminho)) {
      return res.status(404).json({
        success: false,
        message: 'Arquivo não encontrado no caminho especificado',
      });
    }

    const stats = fs.statSync(caminho);
    if (!stats.isFile()) {
      return res.status(400).json({
        success: false,
        message: 'O caminho não é um arquivo válido',
      });
    }

    const ext = path.extname(caminho).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.txt': 'text/plain',
      '.html': 'text/html',
      '.json': 'application/json',
    };
    const mimeType = mimeTypes[ext] || 'application/octet-stream';

    const nomeArquivo = path.basename(caminho);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${nomeArquivo}"`);
    res.setHeader('Content-Length', stats.size);

    const fileStream = fs.createReadStream(caminho);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('Erro ao ler arquivo:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Erro ao ler o arquivo',
          error: error.message,
        });
      }
    });
  } catch (error) {
    console.error('Erro ao servir arquivo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar solicitação',
      error: error.message,
    });
  }
}

module.exports = {
  listarDocumentos,
  criarDocumento,
  obterDocumento,
  atualizarDocumento,
  removerDocumento,
  clonarDocumento,
  removerArquivo,
  abrirArquivo,
  estatisticas,
  visualizarArquivo,
};
