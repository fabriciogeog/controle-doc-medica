const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { body, validationResult } = require('express-validator');
const sanitizeFilename = require('sanitize-filename');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/controle_doc_medica';

// Cache para prevenção de duplicação (30 segundos para testes)
const submissionCache = new Map();
setInterval(() => {
    const now = Date.now();
    for (const [key, timestamp] of submissionCache.entries()) {
        if (now - timestamp > 30 * 1000) { // 30 segundos para testes
            submissionCache.delete(key);
        }
    }
}, 10 * 1000); // Limpeza a cada 10 segundos

// Configurar diretórios
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Garantir que os diretórios existem (já criados no Dockerfile)
// if (!fs.existsSync(UPLOAD_DIR)) {
//     fs.mkdirSync(UPLOAD_DIR, { recursive: true });
// }
// if (!fs.existsSync(PUBLIC_DIR)) {
//     fs.mkdirSync(PUBLIC_DIR, { recursive: true });
// }

// Middlewares de segurança
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            scriptSrcAttr: ["'unsafe-inline'"], // Permitir event handlers inline
            imgSrc: ["'self'", "data:", "blob:"],
            fontSrc: ["'self'"],
        },
    },
}));
app.use(compression());

// Trust proxy for rate limiting behind nginx
app.set('trust proxy', 1);

// CORS configuration
app.use(cors({
    origin: ['http://localhost', 'http://localhost:80', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: 'Muitas requisições deste IP, tente novamente em 15 minutos.'
});
app.use('/api/', limiter);

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Conectar ao MongoDB
mongoose.connect(MONGODB_URI)
.then(() => {
    console.log('✅ Conectado ao MongoDB com sucesso');
})
.catch((error) => {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    process.exit(1);
});

// Configurar sessões
app.use(session({
    secret: process.env.SESSION_SECRET || 'DocMed_Session_Secret_2025',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: MONGODB_URI,
        collectionName: 'sessions'
    }),
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Schema baseado no documento fornecido
const documentoSchema = new mongoose.Schema({
    tipoDocumento: { 
        type: String, 
        required: true,
        enum: ['Relatório', 'Exame', 'Receita', 'Laudo', 'Atestado', 'Cartão de Vacina', 'Resultado', 'Outro']
    },
    especialidadeMedica: { 
        type: String, 
        required: true,
        maxlength: 200 
    },
    dataSolicitacaoEmissao: { 
        type: Date, 
        required: true 
    },
    profissionalSolicitante: {
        nome: { type: String, required: true, maxlength: 200 },
        numeroRegistro: { type: String, required: true, maxlength: 50 },
        especialidade: { type: String, maxlength: 100 }
    },
    descricao: { 
        type: String, 
        required: true, 
        maxlength: 1000 
    },
    instituicao: {
        nome: { type: String, required: true, maxlength: 200 },
        cnpj: { type: String, maxlength: 18 }
    },
    arquivos: [{
        nomeArquivo: String,
        caminhoAbsoluto: String,
        tipoArquivo: String, // pdf, jpg, png, etc.
        descricaoArquivo: String,
        dataInclusao: { type: Date, default: Date.now }
    }],
    tags: [{ type: String, maxlength: 50 }],
    observacoes: { type: String, maxlength: 2000 },
    dataCriacaoRegistro: { type: Date, default: Date.now },
    dataAtualizacao: { type: Date, default: Date.now }
}, {
    collection: 'documentacao'
});

const Documento = mongoose.model('Documento', documentoSchema);

// 👨‍⚕️ Schema para Profissionais de Saúde
const profissionalSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'Nome é obrigatório'],
        trim: true,
        maxlength: [200, 'Nome não pode exceder 200 caracteres']
    },
    numeroRegistro: {
        type: String,
        required: [true, 'Número de registro é obrigatório'],
        unique: true,
        trim: true,
        maxlength: [50, 'Número de registro não pode exceder 50 caracteres'],
        uppercase: true
    },
    especialidade: {
        type: String,
        required: [true, 'Especialidade é obrigatória'],
        trim: true,
        maxlength: [100, 'Especialidade não pode exceder 100 caracteres']
    },
    instituicoesPrincipais: [{
        type: String,
        trim: true,
        maxlength: [200, 'Nome da instituição não pode exceder 200 caracteres']
    }],
    telefone: {
        type: String,
        trim: true,
        maxlength: [20, 'Telefone não pode exceder 20 caracteres']
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: [100, 'Email não pode exceder 100 caracteres']
    },
    observacoes: {
        type: String,
        trim: true,
        maxlength: [500, 'Observações não podem exceder 500 caracteres']
    },
    ativo: {
        type: Boolean,
        default: true
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
    collection: 'profissionais'
});

// Índices para busca eficiente
profissionalSchema.index({ nome: 'text', especialidade: 'text', numeroRegistro: 'text' });
profissionalSchema.index({ ativo: 1 });
profissionalSchema.index({ especialidade: 1 });

// Middleware para atualizar dataAtualizacao
profissionalSchema.pre('save', function(next) {
    this.dataAtualizacao = Date.now();
    next();
});

const Profissional = mongoose.model('Profissional', profissionalSchema);

// Configurar multer para processar FormData (sem upload de arquivos)
const upload = multer();

// Não precisamos mais de upload - usando caminhos absolutos

// Servir arquivos estáticos
app.use(express.static(PUBLIC_DIR));
app.use('/uploads', express.static(UPLOAD_DIR));

// Middleware de autenticação simples
const requireAuth = (req, res, next) => {
    if (req.session && req.session.authenticated) {
        return next();
    } else {
        return res.status(401).json({
            success: false,
            message: 'Acesso não autorizado. Faça login primeiro.'
        });
    }
};

// Middleware para prevenção de duplicação
const preventDuplication = (req, res, next) => {
    if (req.method === 'POST' && req.originalUrl === '/api/documentos') {
        // Criar hash do conteúdo relevante (excluindo arquivos para performance)
        const contentToHash = {
            tipoDocumento: req.body.tipoDocumento,
            especialidadeMedica: req.body.especialidadeMedica,
            dataSolicitacaoEmissao: req.body.dataSolicitacaoEmissao,
            descricao: req.body.descricao,
            profissionalSolicitante: req.body.profissionalSolicitante,
            instituicao: req.body.instituicao
        };
        
        const contentString = JSON.stringify(contentToHash);
        const hash = crypto.createHash('sha256').update(contentString).digest('hex');
        const cacheKey = `${req.session.id}-${hash}`;
        
        if (submissionCache.has(cacheKey)) {
            return res.status(409).json({
                success: false,
                message: 'Documento duplicado detectado. Aguarde alguns segundos antes de tentar novamente.'
            });
        }
        
        // Armazenar no cache
        submissionCache.set(cacheKey, Date.now());
        
        // Limpar cache após processamento bem-sucedido
        req.on('close', () => {
            if (res.statusCode >= 400) {
                submissionCache.delete(cacheKey);
            }
        });
    }
    
    next();
};

// Middleware para processar FormData com campos aninhados
const processFormData = (req, res, next) => {
    // Processar campos aninhados do FormData
    if (req.body) {
        // Construir objeto profissionalSolicitante
        if (req.body['profissionalSolicitante.nome'] || req.body['profissionalSolicitante.numeroRegistro'] || req.body['profissionalSolicitante.especialidade']) {
            req.body.profissionalSolicitante = {
                nome: req.body['profissionalSolicitante.nome'],
                numeroRegistro: req.body['profissionalSolicitante.numeroRegistro'],
                especialidade: req.body['profissionalSolicitante.especialidade']
            };
            // Remover campos individuais para evitar conflito
            delete req.body['profissionalSolicitante.nome'];
            delete req.body['profissionalSolicitante.numeroRegistro'];
            delete req.body['profissionalSolicitante.especialidade'];
        }
        
        // Construir objeto instituicao
        if (req.body['instituicao.nome'] || req.body['instituicao.cnpj']) {
            req.body.instituicao = {
                nome: req.body['instituicao.nome'],
                cnpj: req.body['instituicao.cnpj']
            };
            // Remover campos individuais para evitar conflito
            delete req.body['instituicao.nome'];
            delete req.body['instituicao.cnpj'];
        }
    }
    
    next();
};

// Validadores
const documentoValidators = [
    body('tipoDocumento').isIn(['Relatório', 'Exame', 'Receita', 'Laudo', 'Atestado', 'Cartão de Vacina', 'Resultado', 'Outro']),
    body('especialidadeMedica').isLength({ min: 1, max: 200 }).trim(),
    body('dataSolicitacaoEmissao').isISO8601(),
    body('profissionalSolicitante.nome').isLength({ min: 1, max: 200 }).trim(),
    body('profissionalSolicitante.numeroRegistro').isLength({ min: 1, max: 50 }).trim(),
    body('descricao').isLength({ min: 1, max: 1000 }).trim(),
    body('instituicao.nome').isLength({ min: 1, max: 200 }).trim(),
];

// ROTAS

// Health check
app.get('/health', (req, res) => {
    const healthStatus = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        version: '1.0.0',
        service: 'Sistema de Controle de Documentação Médica'
    };
    res.status(200).json(healthStatus);
});

// Rota principal - servir interface web
app.get('/', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Login simples
app.post('/api/auth/login', [
    body('senha').isLength({ min: 4 }),
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Dados inválidos',
            errors: errors.array()
        });
    }

    const { senha } = req.body;
    if (senha === process.env.ADMIN_PASSWORD || senha === 'senha123') {
        req.session.authenticated = true;
        res.json({
            success: true,
            message: 'Login realizado com sucesso'
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Senha incorreta'
        });
    }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({
        success: true,
        message: 'Logout realizado com sucesso'
    });
});

// Verificar autenticação
app.get('/api/auth/check', (req, res) => {
    res.json({
        authenticated: !!(req.session && req.session.authenticated)
    });
});

// CRUD DE DOCUMENTOS

// Listar documentos com filtros
app.get('/api/documentos', requireAuth, async (req, res) => {
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
            limit = 20
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
                { observacoes: { $regex: busca, $options: 'i' } }
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
            total: total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            data: documentos
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar documentos',
            error: error.message
        });
    }
});

// Criar documento
app.post('/api/documentos', requireAuth, upload.none(), processFormData, preventDuplication, documentoValidators, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dados inválidos',
                errors: errors.array()
            });
        }
    

        const documentoData = req.body;
        
        // Processar tags
        if (documentoData.tags) {
            if (typeof documentoData.tags === 'string') {
                documentoData.tags = documentoData.tags
                    .split(',')
                    .map(tag => tag.trim())
                    .filter(tag => tag.length > 0);
            }
        }

        // Processar arquivos (caminhos absolutos)
        if (documentoData.arquivos && Array.isArray(documentoData.arquivos)) {
            // Se arquivos foi enviado como array de objetos, manter
            documentoData.arquivos = documentoData.arquivos.map(arquivo => ({
                nomeArquivo: arquivo.nomeArquivo || 'Arquivo',
                caminhoAbsoluto: arquivo.caminhoAbsoluto,
                tipoArquivo: arquivo.tipoArquivo || 'pdf',
                descricaoArquivo: arquivo.descricaoArquivo || ''
            }));
        } else if (documentoData.caminhos && documentoData.caminhos.length > 0) {
            // Se foi enviado uma lista de caminhos separados por nova linha
            const caminhos = documentoData.caminhos.split('\n').map(c => c.trim()).filter(c => c);
            documentoData.arquivos = caminhos.map((caminho, index) => {
                const nomeArquivo = caminho.split('/').pop() || `Documento ${index + 1}`;
                let tipoArquivo = 'outro';
                if (caminho.toLowerCase().endsWith('.pdf')) tipoArquivo = 'pdf';
                else if (caminho.match(/\.(jpg|jpeg|png|gif|webp)$/i)) tipoArquivo = 'imagem';
                
                return {
                    nomeArquivo: nomeArquivo,
                    caminhoAbsoluto: caminho,
                    tipoArquivo: tipoArquivo,
                    descricaoArquivo: `Arquivo: ${nomeArquivo}`
                };
            });
        }

        const documento = new Documento(documentoData);
        await documento.save();

        res.status(201).json({
            success: true,
            message: 'Documento criado com sucesso',
            data: documento
        });
    } catch (error) {
        
        res.status(400).json({
            success: false,
            message: 'Erro ao criar documento',
            error: error.message
        });
    }
});

// Buscar documento por ID
app.get('/api/documentos/:id', requireAuth, async (req, res) => {
    try {
        const documento = await Documento.findById(req.params.id);
        if (!documento) {
            return res.status(404).json({
                success: false,
                message: 'Documento não encontrado'
            });
        }
        res.json({
            success: true,
            data: documento
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erro ao buscar documento',
            error: error.message
        });
    }
});

// Atualizar documento
app.put('/api/documentos/:id', requireAuth, upload.none(), processFormData, documentoValidators, async (req, res) => {
    try {
        console.log(`📝 Tentativa de atualização do documento ID: ${req.params.id}`);
        console.log(`📝 Dados recebidos:`, JSON.stringify(req.body, null, 2));
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.error(`❌ Erros de validação:`, errors.array());
            if (req.files) {
                req.files.forEach(file => fs.removeSync(file.path));
            }
            return res.status(400).json({
                success: false,
                message: 'Dados inválidos',
                errors: errors.array()
            });
        }

        const documento = await Documento.findById(req.params.id);
        if (!documento) {
            return res.status(404).json({
                success: false,
                message: 'Documento não encontrado'
            });
        }

        const updateData = req.body;
        updateData.dataAtualizacao = Date.now();

        // Processar tags
        if (updateData.tags) {
            if (typeof updateData.tags === 'string') {
                updateData.tags = updateData.tags
                    .split(',')
                    .map(tag => tag.trim())
                    .filter(tag => tag.length > 0);
            }
        }

        // Adicionar novos arquivos se enviados
        if (req.files && req.files.length > 0) {
            const novosArquivos = req.files.map(file => ({
                nomeArquivo: file.originalname,
                tipoArquivo: file.mimetype,
                linkArquivo: `/uploads/${file.filename}`,
                nomeArquivoSistema: file.filename,
                tamanhoArquivo: file.size
            }));
            
            updateData.arquivos = [...(documento.arquivos || []), ...novosArquivos];
        }

        const documentoAtualizado = await Documento.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        console.log(`✅ Documento atualizado com sucesso: ${documentoAtualizado._id}`);
        
        res.json({
            success: true,
            message: 'Documento atualizado com sucesso',
            data: documentoAtualizado
        });
    } catch (error) {
        console.error(`❌ Erro ao atualizar documento ${req.params.id}:`, error.message);
        console.error(`❌ Stack trace:`, error.stack);
        
        if (req.files) {
            req.files.forEach(file => fs.removeSync(file.path).catch(() => {}));
        }
        
        res.status(400).json({
            success: false,
            message: 'Erro ao atualizar documento',
            error: error.message
        });
    }
});

// Remover documento (com confirmação)
app.delete('/api/documentos/:id', requireAuth, async (req, res) => {
    try {
        const documento = await Documento.findById(req.params.id);
        if (!documento) {
            return res.status(404).json({
                success: false,
                message: 'Documento não encontrado'
            });
        }

        // Remover arquivos associados
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
            message: 'Documento removido com sucesso'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erro ao remover documento',
            error: error.message
        });
    }
});

// 🔄 Clonar documento (nova funcionalidade)
app.post('/api/documentos/:id/clonar', requireAuth, async (req, res) => {
    try {
        const documentoOriginal = await Documento.findById(req.params.id);
        if (!documentoOriginal) {
            return res.status(404).json({
                success: false,
                message: 'Documento não encontrado para clonagem'
            });
        }

        // Converter o documento para objeto JavaScript puro e remover campos que não devem ser clonados
        const dadosClone = documentoOriginal.toObject();
        
        // Remover campos únicos/gerados automaticamente
        delete dadosClone._id;
        delete dadosClone.__v;
        
        // Atualizar timestamps para refletir nova criação
        const agora = new Date();
        dadosClone.dataCriacaoRegistro = agora;
        dadosClone.dataAtualizacao = agora;
        
        // Adicionar sufixo indicativo de cópia na descrição
        dadosClone.descricao = `[CÓPIA] ${dadosClone.descricao}`;
        
        // Para os arquivos, manter apenas as referências (não duplicar arquivos físicos)
        if (dadosClone.arquivos && dadosClone.arquivos.length > 0) {
            dadosClone.arquivos = dadosClone.arquivos.map(arquivo => {
                // Remover IDs internos dos arquivos para gerar novos
                const arquivoClone = { ...arquivo };
                delete arquivoClone._id;
                return arquivoClone;
            });
        }
        
        // Criar o novo documento clonado
        const documentoClonado = new Documento(dadosClone);
        await documentoClonado.save();
        
        console.log(`🔄 Documento clonado: ${req.params.id} → ${documentoClonado._id}`);
        
        res.json({
            success: true,
            message: 'Documento clonado com sucesso! Pronto para edição.',
            data: {
                documentoOriginal: req.params.id,
                documentoClonado: documentoClonado._id,
                documento: documentoClonado
            }
        });
    } catch (error) {
        console.error('Erro ao clonar documento:', error);
        res.status(400).json({
            success: false,
            message: 'Erro ao clonar documento',
            error: error.message
        });
    }
});

// Remover arquivo específico
app.delete('/api/documentos/:id/arquivos/:arquivo_id', requireAuth, async (req, res) => {
    try {
        const documento = await Documento.findById(req.params.id);
        if (!documento) {
            return res.status(404).json({
                success: false,
                message: 'Documento não encontrado'
            });
        }

        const arquivoIndex = documento.arquivos.findIndex(
            arquivo => arquivo._id.toString() === req.params.arquivo_id
        );

        if (arquivoIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Arquivo não encontrado'
            });
        }

        const arquivo = documento.arquivos[arquivoIndex];
        
        // Remover arquivo do sistema
        if (arquivo.nomeArquivoSistema) {
            const caminhoArquivo = path.join(UPLOAD_DIR, arquivo.nomeArquivoSistema);
            if (fs.existsSync(caminhoArquivo)) {
                fs.removeSync(caminhoArquivo);
            }
        }

        // Remover do array
        documento.arquivos.splice(arquivoIndex, 1);
        documento.dataAtualizacao = Date.now();
        
        await documento.save();

        res.json({
            success: true,
            message: 'Arquivo removido com sucesso'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erro ao remover arquivo',
            error: error.message
        });
    }
});

// Abrir arquivo no Evince
app.post('/api/abrir-arquivo', requireAuth, async (req, res) => {
    try {
        const { caminhoArquivo } = req.body;
        
        if (!caminhoArquivo) {
            return res.status(400).json({
                success: false,
                message: 'Caminho do arquivo não fornecido'
            });
        }
        
        // Validar o caminho para garantir que é um arquivo existente
        if (!fs.existsSync(caminhoArquivo)) {
            return res.status(404).json({
                success: false,
                message: 'Arquivo não encontrado'
            });
        }
        
        // MÉTODO DEFINITIVO: Sistema de arquivos de request para comunicação com processo do host
        const fs = require('fs-extra');
        
        try {
            // Diretório de requests (mapeado entre container e host)
            const requestsDir = '/tmp/evince-requests';
            const timestamp = Date.now();
            const requestFile = `${requestsDir}/request_${timestamp}.json`;
            
            // Garantir que o diretório existe
            fs.ensureDirSync(requestsDir);
            
            // Dados da solicitação
            const requestData = {
                timestamp: timestamp,
                arquivo: caminhoArquivo,
                usuario: 'fabricio',
                display: ':0'
            };
            
            // Escrever solicitação
            fs.writeFileSync(requestFile, JSON.stringify(requestData, null, 2));
            
            console.log(`📂 Solicitação de abertura criada: ${requestFile}`);
            console.log(`📄 Arquivo solicitado: ${caminhoArquivo}`);
            
            // Aguardar um momento para o processamento
            setTimeout(() => {
                // Verificar se o arquivo de request ainda existe (se não, foi processado)
                if (!fs.existsSync(requestFile)) {
                    console.log('✅ Solicitação processada com sucesso pelo host');
                } else {
                    console.log('⚠️ Solicitação não foi processada (wrapper pode não estar rodando)');
                }
            }, 2000);
            
            // Resposta imediata (assíncrona)
            res.json({
                success: true,
                message: 'Solicitação de abertura enviada. Se o wrapper estiver ativo no host, o arquivo deve abrir automaticamente.',
                debug: {
                    requestFile: requestFile,
                    targetFile: caminhoArquivo
                }
            });
            
        } catch (requestError) {
            console.error('Erro ao criar solicitação:', requestError.message);
            return res.status(500).json({
                success: false,
                message: 'Erro ao criar solicitação de abertura do arquivo',
                error: requestError.message
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao processar a solicitação',
            error: error.message
        });
    }
});

// 👨‍⚕️ ==================
// API DE PROFISSIONAIS
// ==================

// Validadores para profissionais
const profissionalValidators = [
    body('nome').isLength({ min: 1, max: 200 }).trim().withMessage('Nome é obrigatório e deve ter até 200 caracteres'),
    body('numeroRegistro').isLength({ min: 1, max: 50 }).trim().withMessage('Número de registro é obrigatório e deve ter até 50 caracteres'),
    body('especialidade').isLength({ min: 1, max: 100 }).trim().withMessage('Especialidade é obrigatória e deve ter até 100 caracteres'),
    body('telefone').optional({ checkFalsy: true }).isLength({ max: 20 }).trim(),
    body('email').optional({ checkFalsy: true }).if(body('email').exists()).isEmail().isLength({ max: 100 }).normalizeEmail(),
    body('observacoes').optional({ checkFalsy: true }).isLength({ max: 500 }).trim(),
    body('instituicoesPrincipais').optional({ checkFalsy: true })
];

// Listar profissionais
app.get('/api/profissionais', requireAuth, async (req, res) => {
    try {
        const { 
            busca,
            especialidade,
            ativo = 'true',
            page = 1,
            limit = 50
        } = req.query;

        const filtros = {};
        
        // Filtro por status ativo
        if (ativo !== 'all') {
            filtros.ativo = ativo === 'true';
        }
        
        // Filtro por especialidade
        if (especialidade) {
            filtros.especialidade = { $regex: especialidade, $options: 'i' };
        }
        
        // Busca textual
        if (busca) {
            filtros.$or = [
                { nome: { $regex: busca, $options: 'i' } },
                { numeroRegistro: { $regex: busca, $options: 'i' } },
                { especialidade: { $regex: busca, $options: 'i' } },
                { instituicoesPrincipais: { $in: [new RegExp(busca, 'i')] } }
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
            total: total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            data: profissionais
        });
    } catch (error) {
        console.error('Erro ao listar profissionais:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar profissionais',
            error: error.message
        });
    }
});

// Buscar profissional por ID
app.get('/api/profissionais/:id', requireAuth, async (req, res) => {
    try {
        const profissional = await Profissional.findById(req.params.id);
        if (!profissional) {
            return res.status(404).json({
                success: false,
                message: 'Profissional não encontrado'
            });
        }
        
        res.json({
            success: true,
            data: profissional
        });
    } catch (error) {
        console.error('Erro ao buscar profissional:', error);
        res.status(400).json({
            success: false,
            message: 'Erro ao buscar profissional',
            error: error.message
        });
    }
});

// Criar novo profissional
app.post('/api/profissionais', requireAuth, upload.none(), profissionalValidators, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dados inválidos',
                errors: errors.array()
            });
        }

        // Verificar se já existe profissional com esse registro
        const profissionalExistente = await Profissional.findOne({
            numeroRegistro: req.body.numeroRegistro.toUpperCase()
        });
        
        if (profissionalExistente) {
            return res.status(409).json({
                success: false,
                message: 'Já existe um profissional cadastrado com este número de registro'
            });
        }

        const dadosProfissional = {
            nome: req.body.nome,
            numeroRegistro: req.body.numeroRegistro.toUpperCase(),
            especialidade: req.body.especialidade,
            ativo: req.body.ativo !== undefined ? req.body.ativo : true
        };
        
        // Adicionar campos opcionais apenas se fornecidos
        if (req.body.telefone && req.body.telefone.trim()) {
            dadosProfissional.telefone = req.body.telefone.trim();
        }
        
        if (req.body.email && req.body.email.trim()) {
            dadosProfissional.email = req.body.email.trim();
        }
        
        if (req.body.observacoes && req.body.observacoes.trim()) {
            dadosProfissional.observacoes = req.body.observacoes.trim();
        }
        
        // Processar instituições (se vier como string separada por vírgulas)
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
            data: profissional
        });
    } catch (error) {
        console.error('Erro ao criar profissional:', error);
        
        // Tratamento especial para erro de duplicidade
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Já existe um profissional com este número de registro'
            });
        }
        
        res.status(400).json({
            success: false,
            message: 'Erro ao cadastrar profissional',
            error: error.message
        });
    }
});

// Atualizar profissional
app.put('/api/profissionais/:id', requireAuth, upload.none(), profissionalValidators, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dados inválidos',
                errors: errors.array()
            });
        }

        const profissional = await Profissional.findById(req.params.id);
        if (!profissional) {
            return res.status(404).json({
                success: false,
                message: 'Profissional não encontrado'
            });
        }

        // Verificar duplicidade de registro (exceto o próprio)
        if (req.body.numeroRegistro) {
            const registroExistente = await Profissional.findOne({
                numeroRegistro: req.body.numeroRegistro.toUpperCase(),
                _id: { $ne: req.params.id }
            });
            
            if (registroExistente) {
                return res.status(409).json({
                    success: false,
                    message: 'Já existe outro profissional com este número de registro'
                });
            }
        }

        const dadosAtualizacao = {
            nome: req.body.nome,
            numeroRegistro: req.body.numeroRegistro?.toUpperCase(),
            especialidade: req.body.especialidade,
            dataAtualizacao: Date.now()
        };
        
        // Tratar ativo (checkbox)
        if (req.body.ativo !== undefined) {
            dadosAtualizacao.ativo = req.body.ativo;
        }
        
        // Adicionar campos opcionais apenas se fornecidos
        if (req.body.telefone !== undefined) {
            dadosAtualizacao.telefone = req.body.telefone && req.body.telefone.trim() ? req.body.telefone.trim() : undefined;
        }
        
        if (req.body.email !== undefined) {
            dadosAtualizacao.email = req.body.email && req.body.email.trim() ? req.body.email.trim() : undefined;
        }
        
        if (req.body.observacoes !== undefined) {
            dadosAtualizacao.observacoes = req.body.observacoes && req.body.observacoes.trim() ? req.body.observacoes.trim() : undefined;
        }
        
        // Processar instituições
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
            { new: true, runValidators: true }
        );

        console.log(`✏️ Profissional atualizado: ${profissionalAtualizado.nome}`);

        res.json({
            success: true,
            message: 'Profissional atualizado com sucesso',
            data: profissionalAtualizado
        });
    } catch (error) {
        console.error('Erro ao atualizar profissional:', error);
        res.status(400).json({
            success: false,
            message: 'Erro ao atualizar profissional',
            error: error.message
        });
    }
});

// Inativar/ativar profissional
app.patch('/api/profissionais/:id/status', requireAuth, async (req, res) => {
    try {
        const { ativo } = req.body;
        
        const profissional = await Profissional.findByIdAndUpdate(
            req.params.id,
            { 
                ativo: ativo,
                dataAtualizacao: Date.now()
            },
            { new: true }
        );
        
        if (!profissional) {
            return res.status(404).json({
                success: false,
                message: 'Profissional não encontrado'
            });
        }

        console.log(`🔄 Status do profissional alterado: ${profissional.nome} - ${ativo ? 'Ativo' : 'Inativo'}`);

        res.json({
            success: true,
            message: `Profissional ${ativo ? 'ativado' : 'inativado'} com sucesso`,
            data: profissional
        });
    } catch (error) {
        console.error('Erro ao alterar status do profissional:', error);
        res.status(400).json({
            success: false,
            message: 'Erro ao alterar status do profissional',
            error: error.message
        });
    }
});

// Excluir profissional
app.delete('/api/profissionais/:id', requireAuth, async (req, res) => {
    try {
        // Verificar se o profissional está sendo usado em algum documento
        const documentosComProfissional = await Documento.countDocuments({
            'profissionalSolicitante.numeroRegistro': {
                $exists: true
            }
        });
        
        const profissional = await Profissional.findById(req.params.id);
        if (!profissional) {
            return res.status(404).json({
                success: false,
                message: 'Profissional não encontrado'
            });
        }
        
        // Verificar se está sendo usado especificamente
        const documentosDesteProfissional = await Documento.countDocuments({
            'profissionalSolicitante.numeroRegistro': profissional.numeroRegistro
        });
        
        if (documentosDesteProfissional > 0) {
            return res.status(409).json({
                success: false,
                message: `Não é possível excluir este profissional pois ele está vinculado a ${documentosDesteProfissional} documento(s). Considere inativá-lo.`
            });
        }

        await Profissional.findByIdAndDelete(req.params.id);
        
        console.log(`🗑️ Profissional excluído: ${profissional.nome}`);
        
        res.json({
            success: true,
            message: 'Profissional excluído com sucesso'
        });
    } catch (error) {
        console.error('Erro ao excluir profissional:', error);
        res.status(400).json({
            success: false,
            message: 'Erro ao excluir profissional',
            error: error.message
        });
    }
});

// Buscar profissionais para autocomplete
app.get('/api/profissionais/busca/autocomplete', requireAuth, async (req, res) => {
    try {
        const { q, limit = 10 } = req.query;
        
        if (!q || q.length < 2) {
            return res.json({
                success: true,
                data: []
            });
        }

        const profissionais = await Profissional.find({
            ativo: true,
            $or: [
                { nome: { $regex: q, $options: 'i' } },
                { numeroRegistro: { $regex: q, $options: 'i' } },
                { especialidade: { $regex: q, $options: 'i' } }
            ]
        })
        .select('nome numeroRegistro especialidade')
        .limit(parseInt(limit))
        .sort({ nome: 1 });

        res.json({
            success: true,
            data: profissionais
        });
    } catch (error) {
        console.error('Erro na busca de autocomplete:', error);
        res.status(500).json({
            success: false,
            message: 'Erro na busca',
            error: error.message
        });
    }
});

// Estatísticas
app.get('/api/estatisticas', requireAuth, async (req, res) => {
    try {
        const totalDocumentos = await Documento.countDocuments();
        const documentosPorTipo = await Documento.aggregate([
            { $group: { _id: '$tipoDocumento', total: { $sum: 1 } } },
            { $sort: { total: -1 } }
        ]);
        const documentosPorEspecialidade = await Documento.aggregate([
            { $group: { _id: '$especialidadeMedica', total: { $sum: 1 } } },
            { $sort: { total: -1 } }
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
                documentosRecentes
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar estatísticas',
            error: error.message
        });
    }
});

// Servir arquivos de caminhos absolutos (para visualização inline)
app.get('/api/visualizar-arquivo', requireAuth, async (req, res) => {
    try {
        const { caminho } = req.query;
        
        if (!caminho) {
            return res.status(400).json({
                success: false,
                message: 'Caminho do arquivo não fornecido'
            });
        }
        
        // Validar que o arquivo existe
        if (!fs.existsSync(caminho)) {
            return res.status(404).json({
                success: false,
                message: 'Arquivo não encontrado no caminho especificado'
            });
        }
        
        // Obter informações do arquivo
        const stats = fs.statSync(caminho);
        if (!stats.isFile()) {
            return res.status(400).json({
                success: false,
                message: 'O caminho não é um arquivo válido'
            });
        }
        
        // Determinar o tipo MIME baseado na extensão
        const ext = path.extname(caminho).toLowerCase();
        let mimeType = 'application/octet-stream';
        
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
            '.json': 'application/json'
        };
        
        if (mimeTypes[ext]) {
            mimeType = mimeTypes[ext];
        }
        
        // Configurar headers para visualização inline
        const nomeArquivo = path.basename(caminho);
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${nomeArquivo}"`);
        res.setHeader('Content-Length', stats.size);
        
        // Fazer streaming do arquivo
        const fileStream = fs.createReadStream(caminho);
        fileStream.pipe(res);
        
        fileStream.on('error', (error) => {
            console.error('Erro ao ler arquivo:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: 'Erro ao ler o arquivo',
                    error: error.message
                });
            }
        });
        
    } catch (error) {
        console.error('Erro ao servir arquivo:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao processar solicitação',
            error: error.message
        });
    }
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'Arquivo muito grande. Limite: 10MB por arquivo.'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Muitos arquivos. Limite: 5 arquivos por upload.'
            });
        }
    }
    
    next(error);
});

app.use((err, req, res, next) => {
    console.error('Erro na aplicação:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Rota não encontrada',
        path: req.originalUrl
    });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Sistema de Documentação Médica rodando na porta ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️  MongoDB URI: ${MONGODB_URI.replace(/:[^:@]*@/, ':***@')}`);
    console.log(`📁 Diretório de uploads: ${UPLOAD_DIR}`);
    console.log(`🌐 Interface web: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('👋 Fechando servidor graciosamente...');
    mongoose.connection.close(() => {
        console.log('📪 Conexão com MongoDB fechada.');
        process.exit(0);
    });
});

module.exports = app;
