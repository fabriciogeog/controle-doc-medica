# 🏥 Sistema de Saúde - Docker Orchestration

Este projeto implementa um sistema de saúde completo utilizando **MongoDB**, **Node.js** e **Nginx** orquestrados com Docker Compose na rede personalizada `rede_saude`.

## 📋 Pré-requisitos

- Docker 20.10+
- Docker Compose 2.0+
- Curl (para testes de health check)

## 🚀 Início Rápido

1. **Clone e execute o projeto:**
```bash
cd projeto-saude
./deploy.sh start
```

2. **Acesse a aplicação:**
- **Interface Web:** http://localhost (via Nginx)
- **API Direta:** http://localhost:3000 (Node.js)
- **Banco de dados:** mongodb://localhost:27017

## 🏗️ Arquitetura

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Nginx    │───►│   Node.js   │───►│  MongoDB    │
│    :80      │    │    :3000    │    │   :27017    │
└─────────────┘    └─────────────┘    └─────────────┘
        │                  │                  │
        └──────────────rede_saude──────────────┘
```

### Componentes

- **Nginx** (nginx:stable-alpine3.21-perl)
  - Proxy reverso e servidor web
  - Load balancer para aplicação Node.js
  - Configurações de segurança e performance

- **Node.js** (node:iron-trixie-slim)
  - API REST para gestão de pacientes
  - Middleware de segurança (helmet, cors, rate limiting)
  - Health checks automáticos

- **MongoDB** (mongodb/mongodb-community-server:latest)
  - Banco de dados NoSQL
  - Persistência de dados em volumes
  - Configurações de autenticação

## 📁 Estrutura do Projeto

```
projeto-saude/
├── docker-compose.yml       # Orquestração dos serviços
├── deploy.sh               # Script de gerenciamento
├── README.md              # Documentação
├── app/
│   ├── Dockerfile         # Container da aplicação Node.js
│   ├── package.json       # Dependências Node.js
│   ├── app.js            # Aplicação principal
│   └── .env.example      # Variáveis de ambiente
├── nginx/
│   ├── nginx.conf        # Configuração principal do Nginx
│   └── conf.d/
│       └── saude.conf    # Configuração específica da aplicação
└── data/
    ├── mongodb/          # Dados persistentes do MongoDB
    └── logs/            # Logs da aplicação e Nginx
```

## 🛠️ Comandos de Gerenciamento

O script `deploy.sh` fornece uma interface amigável para gerenciar os containers:

```bash
# Iniciar todos os serviços
./deploy.sh start

# Parar todos os serviços
./deploy.sh stop

# Reiniciar serviços
./deploy.sh restart

# Ver status dos containers
./deploy.sh status

# Visualizar logs
./deploy.sh logs               # Todos os serviços
./deploy.sh logs mongodb       # Apenas MongoDB
./deploy.sh logs app_nodejs    # Apenas Node.js
./deploy.sh logs nginx         # Apenas Nginx

# Verificar saúde dos serviços
./deploy.sh health

# Criar backup dos dados
./deploy.sh backup

# Limpeza completa (remove volumes)
./deploy.sh cleanup
```

## 🔗 API Endpoints

### Endpoints Disponíveis

- `GET /` - Informações da API
- `GET /health` - Status da aplicação
- `GET /api/pacientes` - Listar pacientes
- `POST /api/pacientes` - Criar paciente
- `GET /api/pacientes/:id` - Buscar paciente por ID
- `PUT /api/pacientes/:id` - Atualizar paciente
- `DELETE /api/pacientes/:id` - Remover paciente

### Exemplo de Uso

```bash
# Verificar status da API
curl http://localhost/health

# Listar pacientes
curl http://localhost/api/pacientes

# Criar novo paciente
curl -X POST http://localhost/api/pacientes \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "cpf": "123.456.789-00",
    "idade": 35,
    "telefone": "(11) 99999-9999",
    "email": "joao@email.com"
  }'
```

## 🔧 Configurações

### Variáveis de Ambiente

Copie `.env.example` para `.env` e ajuste conforme necessário:

```bash
cd app
cp .env.example .env
```

### Rede Docker

O projeto utiliza uma rede personalizada chamada `rede_saude`:
- **Driver:** bridge
- **Subnet:** 172.20.0.0/16
- **Isolamento:** Containers só se comunicam dentro desta rede

### Volumes Persistentes

- **MongoDB:** `./data/mongodb:/data/db`
- **Logs:** `./data/logs:/var/log/nginx`
- **Aplicação:** `./app:/usr/src/app` (para desenvolvimento)

## 🔒 Segurança

### Configurações Implementadas

- **Rate Limiting:** 100 requests por IP a cada 15 minutos
- **CORS:** Configurado para origens específicas
- **Headers de Segurança:** Helmet.js, X-Frame-Options, etc.
- **Usuário não-root:** Container Node.js roda com usuário dedicado
- **Nginx Security:** Server tokens ocultos, headers de segurança

### Credenciais Padrão

⚠️ **Altere em produção!**

- **MongoDB:**
  - Usuário: `admin`
  - Senha: `senha_admin_123`
  - Database: `saude_db`

## 📊 Monitoramento

### Health Checks

Todos os serviços possuem health checks configurados:
- **MongoDB:** ping no banco de dados
- **Node.js:** endpoint `/health`
- **Nginx:** verificação de configuração

### Logs

- **Nginx:** `/var/log/nginx/` (mapeado para `./data/logs/`)
- **Node.js:** Console output (acessível via `docker-compose logs`)
- **MongoDB:** `/var/log/mongodb/` (mapeado para `./data/logs/`)

## 🚨 Troubleshooting

### Problemas Comuns

1. **Porta em uso:**
   ```bash
   # Verificar processos usando as portas
   sudo netstat -tulpn | grep :80
   sudo netstat -tulpn | grep :3000
   sudo netstat -tulpn | grep :27017
   ```

2. **Permissões de volume:**
   ```bash
   # Corrigir permissões do diretório de dados
   sudo chown -R $USER:$USER data/
   ```

3. **Containers não iniciam:**
   ```bash
   # Verificar logs de erro
   ./deploy.sh logs
   
   # Limpar e reiniciar
   ./deploy.sh cleanup
   ./deploy.sh start
   ```

### Verificação de Conectividade

```bash
# Testar conectividade entre containers
docker-compose exec app_nodejs ping mongodb
docker-compose exec nginx ping app_nodejs

# Verificar DNS interno
docker-compose exec app_nodejs nslookup mongodb
```

## 🔄 Backup e Recuperação

### Backup Automático

```bash
# Criar backup completo
./deploy.sh backup
```

### Restauração Manual

```bash
# Parar serviços
./deploy.sh stop

# Restaurar dados do MongoDB
docker-compose up -d mongodb
docker-compose exec mongodb mongorestore /data/backup/saude_db

# Iniciar todos os serviços
./deploy.sh start
```

## 📝 Desenvolvimento

### Modo de Desenvolvimento

Para desenvolvimento com hot reload:

1. Instale dependências localmente:
   ```bash
   cd app
   npm install
   ```

2. Execute em modo desenvolvimento:
   ```bash
   npm run dev
   ```

3. Use docker-compose para apenas MongoDB e Nginx:
   ```bash
   docker-compose up -d mongodb nginx
   ```

### Testes

```bash
cd app
npm test
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte e questões:
- Abra uma issue no repositório
- Consulte os logs: `./deploy.sh logs`
- Verifique a saúde dos serviços: `./deploy.sh health`

---

**Sistema de Saúde v1.0.0** - Desenvolvido com ❤️ usando Docker, Node.js, MongoDB e Nginx.
