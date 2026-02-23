# 🏗️ DOCUMENTO DE ARQUITETURA DO SISTEMA (DAS)
**Sistema de Controle de Documentação Médica**

---

## 📋 **1. INTRODUÇÃO**

### 1.1 Propósito
Este documento apresenta a arquitetura do Sistema de Controle de Documentação Médica, definindo componentes, tecnologias e padrões arquiteturais utilizados.

### 1.2 Escopo
Abrange a arquitetura completa do sistema, desde a camada de apresentação até a persistência de dados, incluindo deployment e infraestrutura.

### 1.3 Visão Geral
Sistema web moderno baseado em arquitetura MVC com API REST, containerizado com Docker e banco de dados NoSQL.

---

## 🎨 **2. VISÃO ARQUITETURAL**

### 2.1 Padrão Arquitetural Principal
**Model-View-Controller (MVC) + API REST**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PRESENTATION  │    │    BUSINESS     │    │   PERSISTENCE   │
│     LAYER       │    │     LAYER       │    │     LAYER       │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│   Frontend      │    │   API REST      │    │    MongoDB      │
│   (HTML/CSS/JS) │◄──►│   (Node.js)     │◄──►│   (NoSQL DB)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 2.2 Principios Arquiteturais Aplicados
- **Separation of Concerns**: Separação clara entre camadas
- **Single Responsibility**: Cada componente tem uma responsabilidade
- **RESTful**: API seguindo princípios REST
- **Stateless**: Operações sem estado no servidor
- **Containerização**: Isolamento de ambiente com Docker

---

## 🏭 **3. ARQUITETURA DE DEPLOYMENT**

### 3.1 Containerização com Docker

```yaml
# Estrutura de Containers
┌─────────────────────────────────────────────────────────────┐
│                    DOCKER COMPOSE                           │
├─────────────────┬─────────────────┬─────────────────────────┤
│   NGINX         │   NODE.JS APP   │      MONGODB            │
│   (Port 80/443) │   (Port 3000)   │   (Port 27017)          │
│                 │                 │                         │
│ • Reverse Proxy │ • API REST      │ • Banco NoSQL           │
│ • Static Files  │ • Business Logic│ • Persistência          │
│ • Load Balance  │ • Session Mgmt  │ • Índices               │
│ • SSL/TLS       │ • Validation    │ • Replicação            │
└─────────────────┴─────────────────┴─────────────────────────┘
```

### 3.2 Rede Docker
```yaml
networks:
  rede_doc_medica:
    driver: bridge
    subnet: 172.21.0.0/16
```

### 3.3 Volumes Persistentes
```yaml
volumes:
  - mongodb_data:/data/db          # Dados do MongoDB
  - uploads_data:/uploads          # Arquivos de usuário
  - logs_data:/var/log            # Logs do sistema
```

---

## 💾 **4. ARQUITETURA DE DADOS**

### 4.1 Modelo de Dados MongoDB

```javascript
// Collection: documentacao
{
  _id: ObjectId,
  tipoDocumento: String (enum),
  especialidadeMedica: String,
  dataSolicitacaoEmissao: Date,
  profissionalSolicitante: {
    nome: String,
    numeroRegistro: String,
    especialidade: String
  },
  descricao: String,
  instituicao: {
    nome: String,
    cnpj: String (opcional)
  },
  arquivos: [{
    nomeArquivo: String,
    caminhoAbsoluto: String,
    tipoArquivo: String,
    descricaoArquivo: String,
    dataInclusao: Date
  }],
  tags: [String],
  observacoes: String,
  dataCriacaoRegistro: Date,
  dataAtualizacao: Date
}

// Collection: profissionais
{
  _id: ObjectId,
  nome: String,
  numeroRegistro: String (unique),
  especialidade: String,
  instituicoesPrincipais: [String],
  telefone: String,
  email: String,
  observacoes: String,
  ativo: Boolean,
  dataCriacao: Date,
  dataAtualizacao: Date
}
```

### 4.2 Índices de Performance
```javascript
// Índices para otimização
db.documentacao.createIndex({
  "dataCriacaoRegistro": -1,
  "tipoDocumento": 1,
  "especialidadeMedica": 1
});

db.profissionais.createIndex({
  "nome": "text",
  "numeroRegistro": "text",
  "especialidade": "text"
});
```

---

## 🔧 **5. ARQUITETURA DA APLICAÇÃO**

### 5.1 Estrutura de Diretórios
```
controle-doc-medica/
├── app/                        # Aplicação Node.js
│   ├── app.js                 # Servidor principal
│   ├── package.json           # Dependências
│   ├── public/                # Frontend
│   │   ├── index.html        # Interface principal
│   │   ├── css/              # Estilos
│   │   └── js/               # Scripts cliente
│   └── uploads/              # Arquivos de usuário
├── nginx/                     # Configuração NGINX
│   ├── nginx.conf            # Configuração principal
│   └── conf.d/               # Configurações específicas
├── data/                      # Dados persistentes
│   ├── mongodb/              # Dados MongoDB
│   └── logs/                 # Logs do sistema
├── docs/                      # Documentação
└── docker-compose.yml         # Orquestração containers
```

### 5.2 Componentes Backend (Node.js)

```javascript
// Estrutura da aplicação
app.js
├── Middleware Stack
│   ├── Security (helmet, cors)
│   ├── Session Management
│   ├── Rate Limiting
│   ├── Body Parsing
│   └── Static Files
├── Route Handlers
│   ├── /api/auth/*           # Autenticação
│   ├── /api/documentos/*     # Gestão documentos
│   ├── /api/profissionais/*  # Gestão profissionais
│   └── /api/estatisticas     # Dashboard
├── Business Logic
│   ├── Validation
│   ├── Data Processing
│   └── Error Handling
└── Database Layer
    ├── MongoDB Connection
    ├── Schemas/Models
    └── Query Optimization
```

### 5.3 Componentes Frontend

```javascript
// Estrutura do cliente
public/js/app.js
├── Application Controller
│   ├── Authentication
│   ├── Navigation
│   ├── State Management
│   └── Error Handling
├── Module Controllers
│   ├── Dashboard
│   ├── Documentos CRUD
│   ├── Profissionais CRUD
│   ├── Search & Filters
│   └── Professional Selector
├── UI Components
│   ├── Modals
│   ├── Forms
│   ├── Tables
│   ├── Charts
│   └── Toast Notifications
└── Utilities
    ├── API Client
    ├── Date Formatting
    ├── Validation
    └── DOM Manipulation
```

---

## 🌐 **6. ARQUITETURA DE REDE**

### 6.1 Fluxo de Requisições

```
Internet/Usuario
       ↓
   ┌─────────┐
   │  NGINX  │ ← Porta 80/443 (HTTP/HTTPS)
   │ (Proxy) │
   └─────────┘
       ↓
   ┌─────────┐
   │ Node.js │ ← Porta 3000 (Internal)
   │   API   │
   └─────────┘
       ↓
   ┌─────────┐
   │MongoDB  │ ← Porta 27017 (Internal)
   │Database │
   └─────────┘
```

### 6.2 Configuração NGINX
```nginx
# Principais funcionalidades
- Proxy reverso para Node.js
- Servir arquivos estáticos
- Compressão gzip
- Headers de segurança
- Rate limiting
- SSL/TLS termination
```

---

## 🔒 **7. ARQUITETURA DE SEGURANÇA**

### 7.1 Camadas de Segurança

```
┌──────────────────────────────────────────────┐
│             SECURITY LAYERS                  │
├──────────────────────────────────────────────┤
│ 1. Network Security (NGINX, Docker Network) │
│ 2. Application Security (Helmet, CORS)      │
│ 3. Authentication (Session-based)           │
│ 4. Authorization (Route protection)         │
│ 5. Data Validation (Input sanitization)    │
│ 6. Audit Logging (Operations tracking)      │
└──────────────────────────────────────────────┘
```

### 7.2 Implementação de Segurança
```javascript
// Middlewares de segurança implementados
- helmet(): Headers de segurança
- cors(): Controle de origem cruzada  
- rateLimit(): Limitação de requisições
- session(): Gerenciamento de sessão
- express-validator: Validação de entrada
- Custom auth middleware: Proteção de rotas
```

---

## 📈 **8. ARQUITETURA DE MONITORAMENTO**

### 8.1 Estratégia de Logs
```javascript
// Tipos de logs implementados
- Application Logs: console.log estruturado
- Access Logs: NGINX access.log
- Error Logs: NGINX error.log + app errors
- Audit Logs: Operações críticas
- Health Check: /health endpoint
```

### 8.2 Health Check
```javascript
GET /health
Response: {
  status: "OK",
  timestamp: "2025-01-14T11:05:06Z",
  uptime: 1234.567,
  database: "connected",
  version: "1.0.0",
  service: "Sistema de Controle de Documentação Médica"
}
```

---

## 🚀 **9. ESTRATÉGIA DE DEPLOYMENT**

### 9.1 Ambientes

```yaml
Development:
  - Local Docker Compose
  - Hot reload habilitado
  - Logs verbosos
  - Debug mode ativo

Production:
  - Docker Compose otimizado
  - Environment variables
  - SSL/TLS obrigatório
  - Logs estruturados
  - Health checks ativos
```

### 9.2 Pipeline de Deploy
```bash
# Processo de deployment
1. git push → Repository
2. docker-compose build → Build images
3. docker-compose up -d → Start services
4. Health check → Verify deployment
5. Backup → Data protection
```

---

## 🔄 **10. PADRÕES E CONVENÇÕES**

### 10.1 Padrões de Código
```javascript
// Naming conventions
- Variáveis: camelCase
- Funções: camelCase
- Classes: PascalCase
- Constantes: UPPER_SNAKE_CASE
- Arquivos: kebab-case

// API conventions
- Endpoints: RESTful
- HTTP Methods: GET, POST, PUT, PATCH, DELETE
- Status Codes: Standard HTTP
- Response Format: JSON consistent
```

### 10.2 Padrões de Banco de Dados
```javascript
// Collection naming
- Collections: plural (documentos, profissionais)
- Fields: camelCase
- Indexes: performance-based
- Timestamps: ISO format
```

---

## 📊 **11. PERFORMANCE E ESCALABILIDADE**

### 11.1 Otimizações Implementadas
```javascript
// Frontend optimizations
- CSS minification
- JavaScript bundling
- Image optimization
- Lazy loading
- Caching strategies

// Backend optimizations
- Database indexing
- Query optimization  
- Connection pooling
- Response compression
- Rate limiting
```

### 11.2 Métricas de Performance
```javascript
// Targets estabelecidos
- Page Load Time: < 3 seconds
- API Response Time: < 500ms
- Database Query Time: < 100ms
- Concurrent Users: 50+
- Memory Usage: < 512MB
```

---

## 🔍 **12. VALIDAÇÃO DA ARQUITETURA**

### 12.1 Arquitetura vs Requisitos
| Requisito | Solução Arquitetural | Status |
|-----------|---------------------|--------|
| Performance | Índices DB + Cache | ✅ |
| Segurança | Multi-layer security | ✅ |
| Usabilidade | SPA + Responsive | ✅ |
| Manutenibilidade | Modular + Docker | ✅ |
| Portabilidade | Containerização | ✅ |

### 12.2 Pontos de Melhoria Futura
- [ ] Load balancer para múltiplas instâncias
- [ ] Cache distribuído (Redis)
- [ ] CDN para arquivos estáticos
- [ ] Microservices architecture
- [ ] Event-driven architecture

---

**Documento elaborado por**: Fabricio  
**Data**: 14/01/2025  
**Versão**: 1.0  
**Revisor**: -  
**Status**: Aprovado ✅
