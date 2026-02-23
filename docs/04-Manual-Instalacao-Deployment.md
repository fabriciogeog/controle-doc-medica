# 🚀 MANUAL DE INSTALAÇÃO E DEPLOYMENT
**Sistema de Controle de Documentação Médica**

---

## 📋 **1. INTRODUÇÃO**

### 1.1 Objetivo
Este documento fornece instruções completas para instalação, configuração e deployment do Sistema de Controle de Documentação Médica.

### 1.2 Pré-requisitos do Sistema
- **Sistema Operacional**: Linux (Ubuntu 20.04+ recomendado) ou Windows 10+
- **Docker**: versão 20.10+
- **Docker Compose**: versão 1.29+
- **Git**: versão 2.25+
- **Portas**: 80, 443, 3000, 27017 (disponíveis)

### 1.3 Conhecimentos Necessários
- Comandos básicos de terminal/linha de comando
- Conceitos básicos de Docker e containers
- Noções de redes e portas

---

## 🔧 **2. INSTALAÇÃO DO AMBIENTE**

### 2.1 Instalação do Docker (Ubuntu/Debian)

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências
sudo apt install apt-transport-https ca-certificates curl gnupg lsb-release

# Adicionar chave GPG oficial do Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Adicionar repositório
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io

# Verificar instalação
docker --version
```

### 2.2 Instalação do Docker Compose

```bash
# Download da versão mais recente
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Dar permissão de execução
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalação
docker-compose --version
```

### 2.3 Configuração de Usuário

```bash
# Adicionar usuário ao grupo docker (evita usar sudo)
sudo usermod -aG docker $USER

# Relogar ou executar:
newgrp docker

# Verificar se funciona sem sudo
docker ps
```

---

## 📁 **3. OBTENÇÃO E CONFIGURAÇÃO DO CÓDIGO**

### 3.1 Clone do Repositório

```bash
# Clonar repositório (substitua pela URL real)
git clone https://github.com/seu-usuario/controle-doc-medica.git

# Entrar no diretório
cd controle-doc-medica

# Verificar estrutura
ls -la
```

### 3.2 Estrutura de Arquivos

```
controle-doc-medica/
├── app/                    # Aplicação Node.js
│   ├── app.js             # Servidor principal
│   ├── package.json       # Dependências
│   ├── public/            # Frontend (HTML, CSS, JS)
│   └── uploads/           # Diretório para arquivos
├── nginx/                 # Configuração do NGINX
│   ├── nginx.conf
│   └── conf.d/
├── data/                  # Dados persistentes
│   ├── mongodb/          # Dados do MongoDB
│   └── logs/             # Logs do sistema
├── docs/                  # Documentação
├── docker-compose.yml     # Orquestração dos containers
└── README.md
```

### 3.3 Configuração de Variáveis de Ambiente

```bash
# Criar arquivo .env (opcional)
cp .env.example .env

# Editar variáveis conforme necessário
nano .env
```

**Variáveis disponíveis:**
```bash
# .env
NODE_ENV=production
MONGODB_URI=mongodb://mongodb:27017/controle_doc_medica
PORT=3000
ADMIN_PASSWORD=sua_senha_aqui
SESSION_SECRET=sua_chave_secreta_aqui
```

---

## 🚀 **4. DEPLOYMENT COM DOCKER COMPOSE**

### 4.1 Primeira Instalação

```bash
# Criar diretórios necessários
mkdir -p data/mongodb data/logs

# Definir permissões corretas
sudo chown -R 999:999 data/mongodb
sudo chmod -R 755 data/logs

# Build e start dos containers
docker-compose up -d --build

# Verificar status dos containers
docker-compose ps
```

**Saída esperada:**
```
      Name                     Command                  State                 Ports           
---------------------------------------------------------------------------------------------
mongodb_docmedica   docker-entrypoint.sh --auth       Up      0.0.0.0:27017->27017/tcp
nginx_docmedica     /docker-entrypoint.sh nginx       Up      0.0.0.0:443->443/tcp, 
                                                               0.0.0.0:80->80/tcp
nodejs_docmedica    docker-entrypoint.sh node  ...    Up      0.0.0.0:3000->3000/tcp
```

### 4.2 Verificação do Deployment

```bash
# Verificar logs da aplicação
docker-compose logs nodejs_docmedica

# Verificar saúde dos containers
docker-compose ps

# Testar conectividade
curl http://localhost/health
```

**Resposta esperada do health check:**
```json
{
  "status": "OK",
  "timestamp": "2025-01-14T11:30:00Z",
  "uptime": 125.456,
  "database": "connected",
  "version": "1.0.0",
  "service": "Sistema de Controle de Documentação Médica"
}
```

### 4.3 Acesso ao Sistema

```bash
# Verificar se está funcionando
curl -I http://localhost

# Abrir no navegador
# http://localhost (porta 80)
# ou
# http://seu-ip-servidor (se remoto)
```

---

## 🔧 **5. CONFIGURAÇÕES AVANÇADAS**

### 5.1 Configuração de SSL/TLS (HTTPS)

```bash
# Criar diretório para certificados
mkdir -p nginx/ssl

# Gerar certificado auto-assinado (desenvolvimento)
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout nginx/ssl/nginx.key \
    -out nginx/ssl/nginx.crt

# Ou usar Let's Encrypt (produção)
# certbot --nginx -d seu-dominio.com
```

### 5.2 Configuração de Backup Automático

```bash
# Criar script de backup
cat > scripts/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/doc-medica"
DATE=$(date +%Y%m%d_%H%M%S)

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Backup do MongoDB
docker exec mongodb_docmedica mongodump --out /tmp/backup_$DATE
docker cp mongodb_docmedica:/tmp/backup_$DATE $BACKUP_DIR/

# Backup dos uploads
cp -r uploads $BACKUP_DIR/uploads_$DATE

# Limpar backups antigos (manter 7 dias)
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;

echo "Backup concluído: $BACKUP_DIR/backup_$DATE"
EOF

# Dar permissão de execução
chmod +x scripts/backup.sh

# Adicionar ao crontab (executa diariamente às 2h)
(crontab -l 2>/dev/null; echo "0 2 * * * /caminho/para/scripts/backup.sh") | crontab -
```

### 5.3 Monitoramento e Logs

```bash
# Visualizar logs em tempo real
docker-compose logs -f

# Logs específicos de um serviço
docker-compose logs -f nodejs_docmedica

# Logs do NGINX
docker-compose logs -f nginx

# Verificar uso de recursos
docker stats

# Monitorar espaço em disco
df -h
du -sh data/
```

---

## 🔄 **6. OPERAÇÕES DE MANUTENÇÃO**

### 6.1 Atualização do Sistema

```bash
# Parar containers
docker-compose down

# Atualizar código
git pull origin main

# Rebuild e restart
docker-compose up -d --build

# Verificar se tudo está funcionando
docker-compose ps
curl http://localhost/health
```

### 6.2 Backup e Restauração

```bash
# === BACKUP ===
# Backup completo
docker-compose down
tar -czf backup_$(date +%Y%m%d).tar.gz data/ uploads/
docker-compose up -d

# === RESTAURAÇÃO ===
# Restaurar de backup
docker-compose down
tar -xzf backup_20250114.tar.gz
docker-compose up -d
```

### 6.3 Limpeza e Manutenção

```bash
# Limpar containers parados
docker container prune -f

# Limpar imagens não utilizadas
docker image prune -a -f

# Limpar volumes órfãos
docker volume prune -f

# Limpar cache do sistema
docker system prune -a -f

# Verificar espaço liberado
docker system df
```

### 6.4 Troubleshooting Comum

```bash
# === Container não inicia ===
# Verificar logs
docker-compose logs nome_do_container

# Verificar portas em uso
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :27017

# === Banco de dados com problemas ===
# Entrar no container do MongoDB
docker exec -it mongodb_docmedica bash

# Verificar status do MongoDB
mongo --eval "db.stats()"

# === Aplicação não responde ===
# Reiniciar apenas a aplicação
docker-compose restart nodejs_docmedica

# Verificar conectividade interna
docker exec -it nodejs_docmedica ping mongodb
```

---

## 🌐 **7. CONFIGURAÇÃO DE PRODUÇÃO**

### 7.1 Otimizações de Performance

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app_nodejs:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=error

  mongodb:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
    command: --wiredTigerCacheSizeGB 0.25
```

### 7.2 Configuração de Firewall

```bash
# Ubuntu UFW
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw --force enable

# Bloquear acesso direto ao MongoDB e Node.js
sudo ufw deny 3000/tcp
sudo ufw deny 27017/tcp

# Verificar regras
sudo ufw status
```

### 7.3 Configuração de Domínio

```bash
# Atualizar /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;
    
    # Redirecionar para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com www.seu-dominio.com;
    
    ssl_certificate /etc/ssl/certs/seu-dominio.crt;
    ssl_certificate_key /etc/ssl/private/seu-dominio.key;
    
    # Configurações SSL adicionais...
}
```

---

## 📊 **8. MONITORAMENTO E ALERTAS**

### 8.1 Scripts de Monitoramento

```bash
# Script de verificação de saúde
cat > scripts/health_check.sh << 'EOF'
#!/bin/bash
HEALTH_URL="http://localhost/health"

# Verificar se a aplicação está respondendo
if curl -f -s $HEALTH_URL > /dev/null; then
    echo "$(date): Sistema funcionando normalmente"
else
    echo "$(date): ERRO - Sistema não responde!"
    # Enviar alerta (email, slack, etc.)
    # restart containers se necessário
    docker-compose restart
fi
EOF

# Executar a cada 5 minutos
(crontab -l 2>/dev/null; echo "*/5 * * * * /caminho/scripts/health_check.sh >> /var/log/health_check.log 2>&1") | crontab -
```

### 8.2 Alertas por Email (opcional)

```bash
# Instalar mailutils
sudo apt install mailutils

# Configurar script de alerta
cat > scripts/alert.sh << 'EOF'
#!/bin/bash
SUBJECT="$1"
MESSAGE="$2"
EMAIL="admin@seu-dominio.com"

echo "$MESSAGE" | mail -s "$SUBJECT" "$EMAIL"
EOF

chmod +x scripts/alert.sh
```

---

## 🔒 **9. SEGURANÇA**

### 9.1 Hardening Básico

```bash
# Atualizar senha padrão
# Editar docker-compose.yml ou .env
ADMIN_PASSWORD=SuaSenhaSeguraAqui123!

# Configurar fail2ban (opcional)
sudo apt install fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Configurar logrotate
sudo tee /etc/logrotate.d/doc-medica << 'EOF'
/var/log/doc-medica/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
}
EOF
```

### 9.2 Backup de Segurança

```bash
# Configurar backup remoto (exemplo com rsync)
cat > scripts/backup_remoto.sh << 'EOF'
#!/bin/bash
LOCAL_BACKUP="/var/backups/doc-medica"
REMOTE_SERVER="usuario@servidor-backup.com"
REMOTE_PATH="/backups/doc-medica"

# Sincronizar com servidor remoto
rsync -avz --delete $LOCAL_BACKUP/ $REMOTE_SERVER:$REMOTE_PATH/

echo "Backup remoto concluído em $(date)"
EOF
```

---

## 📞 **10. SUPORTE E TROUBLESHOOTING**

### 10.1 Comandos Úteis de Diagnóstico

```bash
# Status completo do sistema
echo "=== DOCKER STATUS ==="
docker --version
docker-compose --version
docker ps -a

echo "=== SYSTEM RESOURCES ==="
free -h
df -h
top -bn1 | head -15

echo "=== APPLICATION HEALTH ==="
curl -s http://localhost/health | jq .

echo "=== LOGS RECENTES ==="
docker-compose logs --tail=20 nodejs_docmedica
```

### 10.2 Problemas Comuns e Soluções

| Problema | Sintoma | Solução |
|----------|---------|---------|
| **Porta em uso** | `bind: address already in use` | `sudo lsof -i :80` e matar processo conflitante |
| **Sem espaço em disco** | `no space left on device` | `docker system prune -a -f` |
| **MongoDB não conecta** | `connection refused` | Verificar se container está rodando |
| **Aplicação lenta** | Timeouts frequentes | Verificar recursos com `docker stats` |
| **SSL não funciona** | Certificado inválido | Regenerar certificados SSL |

### 10.3 Contatos de Suporte

- **Desenvolvedor**: Fabricio - fabricio@exemplo.com
- **Repositório**: https://github.com/usuario/controle-doc-medica
- **Documentação**: Pasta `/docs` do projeto
- **Issues**: https://github.com/usuario/controle-doc-medica/issues

---

## ✅ **11. CHECKLIST DE DEPLOYMENT**

### 11.1 Pré-Deployment
- [ ] Docker e Docker Compose instalados
- [ ] Portas 80, 443, 3000, 27017 disponíveis
- [ ] Código fonte baixado e atualizado
- [ ] Variáveis de ambiente configuradas
- [ ] Certificados SSL configurados (se necessário)

### 11.2 Durante o Deployment
- [ ] Containers buildados com sucesso
- [ ] Todos os serviços iniciados (3/3)
- [ ] Health check respondendo OK
- [ ] Aplicação acessível via navegador
- [ ] Login funcionando corretamente

### 11.3 Pós-Deployment
- [ ] Backup inicial realizado
- [ ] Monitoramento configurado
- [ ] Logs sendo coletados
- [ ] Firewall configurado
- [ ] DNS apontando (se aplicável)
- [ ] SSL funcionando (se configurado)

---

**Manual elaborado por**: Fabricio  
**Data**: 14/01/2025  
**Versão**: 1.0  
**Próxima revisão**: 14/04/2025  
**Status**: Aprovado ✅
