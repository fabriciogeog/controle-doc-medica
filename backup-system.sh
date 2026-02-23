#!/bin/bash

# =================================================================
# SISTEMA DE BACKUP AUTOMATIZADO - DOCUMENTAÇÃO MÉDICA
# =================================================================
# Autor: Fabricio
# Data: 14/01/2025
# Versão: 1.0
# Suporte: Backup local + Disco externo + Agendamento
# =================================================================

set -e

# Configurações
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"
BACKUP_LOCAL="$HOME/backups-doc-medica"
LOG_FILE="$PROJECT_DIR/logs/backup.log"
CONFIG_FILE="$PROJECT_DIR/.backup-config"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Funções de log
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE} $1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_step() {
    echo -e "${CYAN}➤ $1${NC}"
    log "STEP: $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    log "SUCCESS: $1"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    log "ERROR: $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    log "WARNING: $1"
}

# Função para detectar discos externos
detect_external_drives() {
    print_step "Detectando discos externos..."
    
    local drives=()
    while IFS= read -r line; do
        # Filtrar apenas dispositivos USB/externos montados
        if echo "$line" | grep -E "(usb|USB)" > /dev/null || \
           echo "$line" | grep -E "/media|/mnt" > /dev/null; then
            drives+=("$line")
        fi
    done < <(lsblk -rno NAME,SIZE,MOUNTPOINT,FSTYPE | grep -v "^$" | grep -v "NAME SIZE MOUNTPOINT FSTYPE")
    
    if [ ${#drives[@]} -eq 0 ]; then
        print_warning "Nenhum disco externo detectado"
        return 1
    fi
    
    print_success "Discos externos encontrados:"
    for i in "${!drives[@]}"; do
        echo "  $((i+1)). ${drives[i]}"
    done
    
    return 0
}

# Função para listar pontos de montagem disponíveis
list_mount_points() {
    echo -e "${PURPLE}Pontos de montagem disponíveis:${NC}"
    df -h | grep -E "(media|mnt|usb)" 2>/dev/null || echo "  Nenhum disco externo montado encontrado"
    echo
    lsblk -o NAME,SIZE,MOUNTPOINT,FSTYPE | grep -E "(media|mnt|usb)" 2>/dev/null || true
}

# Função para criar backup
create_backup() {
    local backup_type="$1"  # local, external, both
    local external_path="$2"
    
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    local backup_name="backup-doc-medica-$timestamp"
    
    print_step "Iniciando backup ($backup_type)..."
    
    # Criar diretórios se necessário
    mkdir -p "$BACKUP_LOCAL"
    mkdir -p "$PROJECT_DIR/logs"
    
    # Verificar se containers estão rodando
    local containers_running=false
    if docker compose ps -q 2>/dev/null | grep -q .; then
        containers_running=true
        print_step "Sistema em execução - fazendo backup a quente"
    else
        print_step "Sistema parado - fazendo backup completo"
    fi
    
    # Criar arquivo de backup
    print_step "Compactando dados..."
    local temp_backup="/tmp/${backup_name}.tar.gz"
    
    cd "$PROJECT_DIR"
    
    # Backup dos dados essenciais
    tar -czf "$temp_backup" \
        --exclude='.git*' \
        --exclude='node_modules' \
        --exclude='logs/*.log' \
        --exclude='data/mongodb/journal' \
        --exclude='*.tmp' \
        data/ uploads/ app/ nginx/ docs/ \
        *.yml *.md *.sh .backup-config 2>/dev/null || true
    
    if [ ! -f "$temp_backup" ]; then
        print_error "Falha ao criar arquivo de backup"
        return 1
    fi
    
    local backup_size=$(du -sh "$temp_backup" | cut -f1)
    print_success "Backup criado: $backup_size"
    
    # Salvar backup local
    if [[ "$backup_type" == "local" || "$backup_type" == "both" ]]; then
        print_step "Salvando backup local..."
        cp "$temp_backup" "$BACKUP_LOCAL/${backup_name}.tar.gz"
        print_success "Backup local salvo: $BACKUP_LOCAL/${backup_name}.tar.gz"
    fi
    
    # Salvar backup externo
    if [[ "$backup_type" == "external" || "$backup_type" == "both" ]] && [ -n "$external_path" ]; then
        print_step "Salvando backup no disco externo..."
        
        if [ -d "$external_path" ] && [ -w "$external_path" ]; then
            local external_backup_dir="$external_path/backups-doc-medica"
            mkdir -p "$external_backup_dir"
            cp "$temp_backup" "$external_backup_dir/${backup_name}.tar.gz"
            print_success "Backup externo salvo: $external_backup_dir/${backup_name}.tar.gz"
        else
            print_error "Disco externo não acessível: $external_path"
            return 1
        fi
    fi
    
    # Limpar arquivo temporário
    rm -f "$temp_backup"
    
    # Salvar informações do backup
    echo "$timestamp|$backup_type|$backup_size|$external_path" >> "$PROJECT_DIR/logs/backup-history.txt"
    
    return 0
}

# Função para configurar backup automático
setup_automatic_backup() {
    print_step "Configurando backup automático..."
    
    local frequency="$1"  # daily, weekly, custom
    local external_path="$2"
    
    local cron_schedule=""
    case "$frequency" in
        "daily")
            cron_schedule="0 2 * * *"  # Todo dia às 2:00
            ;;
        "weekly")
            cron_schedule="0 2 * * 0"  # Todo domingo às 2:00
            ;;
        "custom")
            echo -n "Digite o agendamento cron (ex: '0 2 * * *'): "
            read cron_schedule
            ;;
    esac
    
    local cron_command="cd '$PROJECT_DIR' && ./backup-system.sh --auto"
    if [ -n "$external_path" ]; then
        cron_command="$cron_command --external '$external_path'"
    fi
    
    # Adicionar ao crontab
    (crontab -l 2>/dev/null | grep -v "backup-system.sh"; echo "$cron_schedule $cron_command") | crontab -
    
    # Salvar configuração
    cat > "$CONFIG_FILE" <<EOF
# Configuração do sistema de backup
FREQUENCY=$frequency
EXTERNAL_PATH=$external_path
CRON_SCHEDULE=$cron_schedule
LAST_SETUP=$(date '+%Y-%m-%d %H:%M:%S')
EOF
    
    print_success "Backup automático configurado ($frequency)"
    print_success "Agendamento: $cron_schedule"
}

# Função para listar backups
list_backups() {
    print_header "BACKUPS DISPONÍVEIS"
    
    echo -e "${PURPLE}📁 Backups Locais:${NC}"
    if [ -d "$BACKUP_LOCAL" ] && [ "$(ls -A "$BACKUP_LOCAL" 2>/dev/null)" ]; then
        ls -lah "$BACKUP_LOCAL"/backup-doc-medica-*.tar.gz 2>/dev/null | \
            awk '{print "  " $9 " (" $5 ", " $6 " " $7 " " $8 ")"}'
    else
        echo "  Nenhum backup local encontrado"
    fi
    echo
    
    echo -e "${PURPLE}📊 Histórico de Backups:${NC}"
    if [ -f "$PROJECT_DIR/logs/backup-history.txt" ]; then
        echo "  Data/Hora          Tipo      Tamanho  Disco Externo"
        echo "  =================================================="
        tail -10 "$PROJECT_DIR/logs/backup-history.txt" | while IFS='|' read -r timestamp type size external; do
            printf "  %-18s %-8s %-8s %s\n" "$timestamp" "$type" "$size" "${external:-N/A}"
        done
    else
        echo "  Nenhum histórico encontrado"
    fi
}

# Função para restaurar backup
restore_backup() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        print_error "Arquivo de backup não encontrado: $backup_file"
        return 1
    fi
    
    print_warning "⚠️  RESTAURAÇÃO DE BACKUP ⚠️"
    echo "Esta operação irá:"
    echo "- Parar todos os containers"
    echo "- Substituir dados atuais"
    echo "- Reiniciar o sistema"
    echo
    echo "Backup: $backup_file"
    echo "Tamanho: $(du -sh "$backup_file" | cut -f1)"
    echo
    
    read -p "Tem certeza que deseja continuar? (digite 'CONFIRMAR'): " confirmation
    if [ "$confirmation" != "CONFIRMAR" ]; then
        print_warning "Restauração cancelada"
        return 0
    fi
    
    print_step "Parando containers..."
    docker compose down 2>/dev/null || true
    
    print_step "Fazendo backup dos dados atuais..."
    local safety_backup="/tmp/backup-before-restore-$(date '+%Y%m%d_%H%M%S').tar.gz"
    tar -czf "$safety_backup" data/ uploads/ 2>/dev/null || true
    
    print_step "Restaurando backup..."
    tar -xzf "$backup_file" -C "$PROJECT_DIR" --overwrite
    
    print_step "Ajustando permissões..."
    sudo chown -R 999:999 data/mongodb 2>/dev/null || true
    sudo chmod -R 755 data/logs 2>/dev/null || true
    
    print_step "Reiniciando sistema..."
    docker compose up -d --build
    
    print_success "Backup restaurado com sucesso!"
    print_success "Backup de segurança salvo em: $safety_backup"
}

# Função de limpeza de backups antigos
cleanup_old_backups() {
    local days="${1:-30}"  # Default: manter backups dos últimos 30 dias
    
    print_step "Limpando backups antigos (>$days dias)..."
    
    local deleted=0
    if [ -d "$BACKUP_LOCAL" ]; then
        while IFS= read -r -d '' file; do
            rm "$file"
            deleted=$((deleted + 1))
            print_step "Removido: $(basename "$file")"
        done < <(find "$BACKUP_LOCAL" -name "backup-doc-medica-*.tar.gz" -mtime +$days -print0 2>/dev/null)
    fi
    
    if [ $deleted -gt 0 ]; then
        print_success "Removidos $deleted backups antigos"
    else
        print_success "Nenhum backup antigo para remover"
    fi
}

# Função principal
main() {
    # Criar diretório de logs
    mkdir -p "$PROJECT_DIR/logs"
    
    case "${1:-interactive}" in
        "--create-local")
            print_header "BACKUP LOCAL"
            create_backup "local" ""
            ;;
        "--create-external")
            print_header "BACKUP EXTERNO"
            local external_path="$2"
            if [ -z "$external_path" ]; then
                list_mount_points
                echo -n "Digite o caminho do disco externo: "
                read external_path
            fi
            create_backup "external" "$external_path"
            ;;
        "--create-both")
            print_header "BACKUP COMPLETO (LOCAL + EXTERNO)"
            local external_path="$2"
            if [ -z "$external_path" ]; then
                list_mount_points
                echo -n "Digite o caminho do disco externo: "
                read external_path
            fi
            create_backup "both" "$external_path"
            ;;
        "--setup-auto")
            print_header "CONFIGURAR BACKUP AUTOMÁTICO"
            echo "Frequências disponíveis:"
            echo "1. Diário (2:00 AM)"
            echo "2. Semanal (Domingos 2:00 AM)"
            echo "3. Personalizado"
            echo -n "Escolha (1-3): "
            read freq_choice
            
            case $freq_choice in
                1) frequency="daily" ;;
                2) frequency="weekly" ;;
                3) frequency="custom" ;;
                *) print_error "Opção inválida"; return 1 ;;
            esac
            
            list_mount_points
            echo -n "Caminho do disco externo (ou Enter para pular): "
            read external_path
            
            setup_automatic_backup "$frequency" "$external_path"
            ;;
        "--list")
            list_backups
            ;;
        "--restore")
            print_header "RESTAURAR BACKUP"
            local backup_file="$2"
            if [ -z "$backup_file" ]; then
                echo "Backups disponíveis:"
                ls -1 "$BACKUP_LOCAL"/backup-doc-medica-*.tar.gz 2>/dev/null | nl || echo "Nenhum backup encontrado"
                echo -n "Digite o caminho completo do backup: "
                read backup_file
            fi
            restore_backup "$backup_file"
            ;;
        "--cleanup")
            cleanup_old_backups "${2:-30}"
            ;;
        "--auto")
            # Modo automático (para cron)
            log "Iniciando backup automático"
            local external_path="$3"
            if [ -n "$external_path" ]; then
                create_backup "both" "$external_path" >> "$LOG_FILE" 2>&1
            else
                create_backup "local" "" >> "$LOG_FILE" 2>&1
            fi
            ;;
        "interactive"|*)
            # Menu interativo
            print_header "SISTEMA DE BACKUP - DOCUMENTAÇÃO MÉDICA"
            
            echo "Opções disponíveis:"
            echo "1. 💾 Criar backup local"
            echo "2. 💿 Criar backup em disco externo"
            echo "3. 💾💿 Criar backup completo (local + externo)"
            echo "4. ⏰ Configurar backup automático"
            echo "5. 📋 Listar backups existentes"
            echo "6. 🔄 Restaurar backup"
            echo "7. 🧹 Limpar backups antigos"
            echo "8. ❌ Sair"
            echo
            echo -n "Escolha uma opção (1-8): "
            read choice
            
            case $choice in
                1) main "--create-local" ;;
                2) main "--create-external" ;;
                3) main "--create-both" ;;
                4) main "--setup-auto" ;;
                5) main "--list" ;;
                6) main "--restore" ;;
                7) main "--cleanup" ;;
                8) print_success "Saindo..."; exit 0 ;;
                *) print_error "Opção inválida" ;;
            esac
            ;;
    esac
}

# Verificar se está na pasta correta
if [ ! -f "docker-compose.yml" ]; then
    print_error "Execute este script na pasta raiz do projeto (onde está o docker-compose.yml)"
    exit 1
fi

# Executar função principal
main "$@"
