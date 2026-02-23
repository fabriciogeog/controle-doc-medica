# 💾 SISTEMA DE BACKUP AUTOMATIZADO
**Sistema de Controle de Documentação Médica**

---

## 📋 **1. INTRODUÇÃO**

### 1.1 Propósito
Este documento detalha o sistema de backup integrado desenvolvido para o Sistema de Controle de Documentação Médica, garantindo a segurança e integridade dos dados médicos.

### 1.2 Importância do Backup
- **📁 Dados Críticos**: Documentos médicos são irresubstituíveis
- **🛡️ Proteção Contra Perda**: Hardware, corrupção, erro humano
- **⚖️ Conformidade**: Manutenção de registros médicos obrigatória
- **📊 Continuidade**: Garantia de operação contínua

---

## 🚀 **2. FUNCIONALIDADES DO SISTEMA**

### 2.1 Tipos de Backup
- **💾 Backup Local**: Armazenamento no disco interno
- **💿 Backup Externo**: Cópia para disco externo/USB
- **💾💿 Backup Completo**: Local + Externo simultaneamente
- **🔄 Backup Incremental**: Somente dados modificados

### 2.2 Agendamento Automático
- **📅 Diário**: Todo dia às 2:00 AM
- **📆 Semanal**: Domingos às 2:00 AM
- **⏰ Personalizado**: Horário definido pelo usuário
- **🤖 Execução Automática**: Via crontab do sistema

### 2.3 Recursos Avançados
- **🔍 Detecção Automática**: Discos externos USB
- **📊 Histórico Completo**: Log de todos os backups
- **🔄 Restauração**: Processo guiado de restauração
- **🧹 Limpeza Automática**: Remoção de backups antigos
- **📈 Relatórios**: Status e estatísticas

---

## 💻 **3. COMO USAR O SISTEMA**

### 3.1 Acesso ao Sistema
```bash
# Navegar para pasta do projeto
cd /home/fabricio/Projetos/Docker/controle-doc-medica

# Executar sistema de backup
./backup-system.sh
```

### 3.2 Menu Interativo
```
========================================
 SISTEMA DE BACKUP - DOCUMENTAÇÃO MÉDICA
========================================

Opções disponíveis:
1. 💾 Criar backup local
2. 💿 Criar backup em disco externo  
3. 💾💿 Criar backup completo (local + externo)
4. ⏰ Configurar backup automático
5. 📋 Listar backups existentes
6. 🔄 Restaurar backup
7. 🧹 Limpar backups antigos
8. ❌ Sair

Escolha uma opção (1-8):
```

---

## 🔧 **4. COMANDOS POR LINHA DE COMANDO**

### 4.1 Backup Manual
```bash
# Backup local apenas
./backup-system.sh --create-local

# Backup externo (será solicitado caminho)
./backup-system.sh --create-external

# Backup completo
./backup-system.sh --create-both /media/usb-drive

# Backup externo com caminho específico
./backup-system.sh --create-external /media/fabricio/BACKUP-USB
```

### 4.2 Configuração Automática
```bash
# Configurar backup automático (modo interativo)
./backup-system.sh --setup-auto
```

### 4.3 Gerenciamento de Backups
```bash
# Listar todos os backups
./backup-system.sh --list

# Restaurar backup específico
./backup-system.sh --restore /caminho/para/backup.tar.gz

# Limpar backups com mais de 30 dias
./backup-system.sh --cleanup

# Limpar backups com mais de 7 dias
./backup-system.sh --cleanup 7
```

---

## 📁 **5. ESTRUTURA DE ARQUIVOS BACKUP**

### 5.1 Localização dos Backups
```
🏠 Backups Locais:
/home/fabricio/backups-doc-medica/
├── backup-doc-medica-20250114_140530.tar.gz
├── backup-doc-medica-20250113_020000.tar.gz
└── backup-doc-medica-20250112_020000.tar.gz

💿 Backups Externos:
/media/fabricio/BACKUP-USB/backups-doc-medica/
├── backup-doc-medica-20250114_140530.tar.gz
├── backup-doc-medica-20250113_020000.tar.gz
└── backup-doc-medica-20250112_020000.tar.gz
```

### 5.2 Conteúdo do Backup
Cada arquivo de backup contém:
- **📊 data/**: Banco de dados MongoDB (exceto journals)
- **📁 uploads/**: Arquivos enviados pelos usuários
- **⚙️ app/**: Código da aplicação Node.js
- **🌐 nginx/**: Configurações do servidor web
- **📚 docs/**: Documentação do projeto
- **🔧 Arquivos de configuração**: docker-compose.yml, etc.

### 5.3 Exclusões Inteligentes
Não são incluídos no backup:
- 🚫 Arquivos temporários (*.tmp)
- 🚫 Logs em execução (logs/*.log)
- 🚫 Journal do MongoDB (otimização)
- 🚫 node_modules (recriado no deploy)
- 🚫 Arquivos .git

---

## ⏰ **6. BACKUP AUTOMÁTICO**

### 6.1 Configuração Inicial
```bash
# Executar configuração
./backup-system.sh --setup-auto

# O sistema perguntará:
# 1. Frequência (diária/semanal/personalizada)
# 2. Disco externo (opcional)
```

### 6.2 Agendamentos Disponíveis

| Frequência | Cron Schedule | Descrição |
|------------|---------------|-----------|
| **Diário** | `0 2 * * *` | Todo dia às 2:00 AM |
| **Semanal** | `0 2 * * 0` | Domingos às 2:00 AM |
| **Personalizado** | Definido pelo usuário | Horário customizado |

### 6.3 Verificação do Agendamento
```bash
# Ver agendamentos do cron
crontab -l

# Ver logs de backup
tail -f logs/backup.log
```

---

## 🔄 **7. RESTAURAÇÃO DE BACKUP**

### 7.1 Processo de Restauração
1. **🛑 Parada do Sistema**: Containers são parados
2. **🛡️ Backup de Segurança**: Dados atuais são salvos
3. **📦 Extração**: Backup é descompactado
4. **🔧 Ajuste de Permissões**: Permissões MongoDB corretas
5. **🚀 Reinicialização**: Sistema é reiniciado

### 7.2 Comando de Restauração
```bash
# Restauração interativa
./backup-system.sh --restore

# Restauração direta
./backup-system.sh --restore /caminho/backup-doc-medica-20250114_140530.tar.gz
```

### 7.3 Confirmação de Segurança
```
⚠️  RESTAURAÇÃO DE BACKUP ⚠️
Esta operação irá:
- Parar todos os containers
- Substituir dados atuais  
- Reiniciar o sistema

Backup: backup-doc-medica-20250114_140530.tar.gz
Tamanho: 1.2M

Tem certeza que deseja continuar? (digite 'CONFIRMAR'):
```

---

## 📊 **8. MONITORAMENTO E LOGS**

### 8.1 Arquivos de Log
```
📁 logs/
├── backup.log              # Log principal do sistema
├── backup-history.txt       # Histórico de backups
└── (outros logs do sistema)
```

### 8.2 Formato do Log
```
2025-01-14 14:05:30 - STEP: Iniciando backup (local)...
2025-01-14 14:05:31 - STEP: Sistema em execução - fazendo backup a quente
2025-01-14 14:05:32 - STEP: Compactando dados...
2025-01-14 14:05:35 - SUCCESS: Backup criado: 1.2M
2025-01-14 14:05:36 - SUCCESS: Backup local salvo: /home/fabricio/backups-doc-medica/backup-doc-medica-20250114_140530.tar.gz
```

### 8.3 Histórico de Backups
```
Data/Hora          Tipo      Tamanho  Disco Externo
==================================================
20250114_140530    local     1.2M     N/A
20250113_020000    both      1.1M     /media/usb-drive
20250112_020000    external  1.1M     /media/usb-drive
```

---

## 🛡️ **9. SEGURANÇA E BOAS PRÁTICAS**

### 9.1 Estratégia 3-2-1
- **3 Cópias**: Original + Backup Local + Backup Externo
- **2 Mídias**: Disco interno + Disco externo
- **1 Offsite**: Disco externo removível

### 9.2 Recomendações de Segurança
- **🔄 Backup Regular**: Mínimo semanal, ideal diário
- **🔍 Verificação**: Teste restauração mensalmente
- **💿 Rotação de Mídias**: Use múltiplos discos externos
- **🔒 Criptografia**: Considere criptografar discos externos
- **📍 Local Seguro**: Armazene backup externo em local diferente

### 9.3 Manutenção Recomendada
```bash
# Semanal: Verificar logs
tail -20 logs/backup.log

# Mensal: Limpeza de backups antigos
./backup-system.sh --cleanup 30

# Trimestral: Teste de restauração
# (Em ambiente de teste)
```

---

## 🔧 **10. CONFIGURAÇÃO AVANÇADA**

### 10.1 Arquivo de Configuração
```bash
# .backup-config (gerado automaticamente)
FREQUENCY=daily
EXTERNAL_PATH=/media/fabricio/BACKUP-USB
CRON_SCHEDULE=0 2 * * *
LAST_SETUP=2025-01-14 14:30:00
```

### 10.2 Customização de Paths
```bash
# Alterar pasta de backup local (no início do script)
BACKUP_LOCAL="$HOME/meus-backups-medicos"

# Alterar disco externo padrão
DEFAULT_EXTERNAL="/media/fabricio/MEU-BACKUP"
```

### 10.3 Exclusões Customizadas
Para adicionar exclusões no backup, edite a função `create_backup()`:
```bash
tar -czf "$temp_backup" \
    --exclude='minha-pasta-temp' \
    --exclude='*.cache' \
    # ... outros arquivos
```

---

## 🚨 **11. RESOLUÇÃO DE PROBLEMAS**

### 11.1 Problemas Comuns

**❌ Erro: "Disco externo não acessível"**
```bash
# Verificar se disco está montado
df -h | grep media
lsblk | grep media

# Montar manualmente se necessário
sudo mount /dev/sdb1 /media/fabricio/BACKUP-USB
```

**❌ Erro: "Permissões insuficientes"**
```bash
# Ajustar permissões do disco externo
sudo chown -R $USER:$USER /media/fabricio/BACKUP-USB
```

**❌ Backup não executa automaticamente**
```bash
# Verificar crontab
crontab -l

# Verificar logs do cron
tail -f /var/log/syslog | grep backup-system
```

### 11.2 Comandos de Diagnóstico
```bash
# Testar backup local
./backup-system.sh --create-local

# Verificar espaço em disco
df -h

# Verificar integridade do backup
tar -tzf backup-doc-medica-XXXXXX.tar.gz | head -20
```

---

## 📈 **12. ESTATÍSTICAS E RELATÓRIOS**

### 12.1 Informações do Sistema
```bash
# Tamanho atual dos dados
du -sh data/ uploads/

# Espaço disponível
df -h $HOME
df -h /media/fabricio/BACKUP-USB

# Backups existentes
./backup-system.sh --list
```

### 12.2 Exemplo de Relatório
```
💾 RELATÓRIO DE BACKUP - 14/01/2025
=====================================

📊 Dados Atuais:
- MongoDB: 1.1M
- Uploads: 100K
- Total: 1.3M

📁 Backups Locais: 5 arquivos (6.2M)
💿 Backups Externos: 3 arquivos (3.6M)

⏰ Último Backup: 14/01/2025 14:05:30
🎯 Próximo Backup: 15/01/2025 02:00:00
```

---

## ✅ **13. CHECKLIST DE IMPLEMENTAÇÃO**

### 13.1 Setup Inicial
- [ ] Sistema de backup instalado
- [ ] Permissões configuradas
- [ ] Disco externo conectado
- [ ] Backup teste executado
- [ ] Restauração teste validada

### 13.2 Configuração Automática  
- [ ] Frequência de backup definida
- [ ] Disco externo configurado
- [ ] Crontab configurado
- [ ] Logs funcionando
- [ ] Notificações (se implementadas)

### 13.3 Manutenção Regular
- [ ] Verificação semanal de logs
- [ ] Limpeza mensal de backups antigos
- [ ] Teste trimestral de restauração
- [ ] Verificação anual da estratégia

---

**✅ SISTEMA DE BACKUP COMPLETO E OPERACIONAL**

*Documentação elaborada por: Fabricio*  
*Data: 14/01/2025*  
*Versão: 1.0*  
*Sistema: Controle de Documentação Médica*
