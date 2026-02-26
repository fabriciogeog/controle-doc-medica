![CI](https://github.com/fabriciogeog/controle-doc-medica/actions/workflows/ci.yml/badge.svg)

# Controle de Documentação Médica

Sistema pessoal para organizar documentos médicos: exames, laudos, receitas, atestados e outros registros de saúde. SPA protegida por senha, com upload de arquivos e busca por profissional, especialidade e tags.

## Arquitetura

```
Browser → NGINX (:80/:443) → Node.js/Express (:3000) → MongoDB (:27017)
```

Três serviços Docker orquestrados na rede `rede_doc_medica` (172.21.0.0/16):

- **NGINX** — proxy reverso, HTTPS (redirecionamento HTTP→HTTPS), assets estáticos
- **Node.js/Express** — API REST, autenticação por sessão, upload de arquivos
- **MongoDB** — banco de dados com Mongoose ODM, sessões via `connect-mongo`

## Pré-requisitos

- Docker 20.10+
- Docker Compose 2.0+

## Início Rápido

**1. Configure as variáveis de ambiente:**

```bash
cp app/.env.example app/.env
# Edite app/.env: SESSION_SECRET (32+ chars) e ADMIN_PASSWORD
```

**2. Crie o usuário administrador:**

```bash
node app/scripts/criar-usuario.js
```

**3. Inicie os serviços:**

```bash
./deploy.sh start
```

**4. Acesse:**

- `https://localhost` — interface web
- `http://localhost/health` — health check

## Comandos

### Deploy

```bash
./deploy.sh start      # Iniciar com verificação de saúde
./deploy.sh stop       # Parar todos os serviços
./deploy.sh restart    # Reiniciar
./deploy.sh status     # Status dos containers
./deploy.sh logs       # Ver logs
./deploy.sh health     # Checar endpoints de saúde
./deploy.sh backup     # Backup do MongoDB
./deploy.sh cleanup    # Remover containers e volumes (destrutivo)
```

### Docker direto

```bash
docker-compose up -d --build
docker-compose logs -f app_nodejs
docker-compose down
```

### Desenvolvimento local

```bash
cd app
npm install
npm run dev    # hot reload com nodemon
npm test       # 60 testes Jest + Supertest
npm run lint   # ESLint
```

## Estrutura do Projeto

```
controle-doc-medica/
├── docker-compose.yml
├── deploy.sh
├── app/
│   ├── app.js                        # Entrada da aplicação
│   ├── config/                       # DB, segurança, sessão
│   ├── controllers/                  # auth, documentos, profissionais
│   ├── middlewares/                  # auth, validação, deduplicação, filepath
│   ├── models/                       # Documento, Profissional, Usuario
│   ├── routes/                       # Montagem das rotas
│   ├── scripts/                      # criar-usuario, resetar-senha
│   ├── public/                       # SPA (HTML/CSS/JS)
│   └── __tests__/                    # Testes automatizados
├── nginx/
│   └── conf.d/saude.conf             # Proxy reverso + HTTPS
└── uploads/                          # Arquivos médicos enviados
```

## API

Todas as rotas `/api/*` requerem autenticação por sessão.

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/auth/login` | Login com senha |
| `POST` | `/auth/logout` | Logout |
| `GET` | `/auth/check` | Verificar sessão ativa |
| `GET` | `/health` | Health check |
| `GET` | `/api/documentos` | Listar documentos (com filtros e paginação) |
| `POST` | `/api/documentos` | Criar documento |
| `GET` | `/api/documentos/:id` | Obter documento |
| `PUT` | `/api/documentos/:id` | Atualizar documento |
| `DELETE` | `/api/documentos/:id` | Remover documento |
| `POST` | `/api/documentos/:id/clonar` | Clonar documento |
| `GET` | `/api/estatisticas` | Estatísticas gerais |
| `GET` | `/api/profissionais` | Listar profissionais |
| `POST` | `/api/profissionais` | Cadastrar profissional |
| `GET` | `/api/profissionais/busca/autocomplete` | Autocomplete |

### Filtros disponíveis em `GET /api/documentos`

```
?tipoDocumento=Exame
?especialidadeMedica=Cardiologia
?profissional=<nome>
?instituicao=<nome>
?busca=<texto>
?page=1&limit=20
```

### Tipos de documento

`Relatório`, `Exame`, `Receita`, `Laudo`, `Atestado`, `Cartão de Vacina`, `Resultado`, `Outro`

## Configuração

### Variáveis de ambiente (`app/.env`)

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://mongodb:27017/controle_doc_medica
SESSION_SECRET=<string aleatória com 32+ caracteres>
ADMIN_PASSWORD=<sua senha de acesso>
BCRYPT_ROUNDS=12
```

### Rede e volumes

- **Rede:** `rede_doc_medica` — bridge, 172.21.0.0/16
- `./data/mongodb` → dados do MongoDB
- `./uploads` → arquivos médicos enviados
- `./data/logs` → logs do NGINX

## Segurança

- Autenticação por sessão (MongoDB, TTL 24h)
- HTTPS com certificado autoassinado (porta 443)
- Rate limiting no login: 10 tentativas por IP a cada 15 min
- Headers de segurança via Helmet.js
- Proteção CSRF via `sameSite: strict`
- Whitelist de caminhos para acesso a arquivos

## Testes

60 testes automatizados com Jest, Supertest e mongodb-memory-server (sem Docker):

```bash
cd app && npm test
```

```
__tests__/
├── setup/          # env, db in-memory, helpers
├── middlewares/    # 23 testes unitários
└── routes/         # 37 testes de integração
```

## Troubleshooting

**Porta em uso:**
```bash
sudo ss -tlnp | grep -E ':80|:443|:3000|:27017'
```

**Containers não sobem:**
```bash
./deploy.sh logs
./deploy.sh cleanup && ./deploy.sh start
```

**Resetar senha:**
```bash
node app/scripts/resetar-senha.js
```
