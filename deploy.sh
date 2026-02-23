#!/bin/bash

# Script de Deploy para Sistema de Saúde
# Autor: Desenvolvedor Saúde
# Data: $(date +%Y-%m-%d)

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    local level=$1
    shift
    case $level in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} $*"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $*"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $*"
            ;;
        "DEBUG")
            echo -e "${BLUE}[DEBUG]${NC} $*"
            ;;
    esac
}

# Verificar se Docker e Docker Compose estão instalados
check_dependencies() {
    log "INFO" "Verificando dependências..."
    
    if ! command -v docker &> /dev/null; then
        log "ERROR" "Docker não está instalado. Por favor, instale o Docker."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log "ERROR" "Docker Compose não está instalado. Por favor, instale o Docker Compose."
        exit 1
    fi
    
    log "INFO" "✅ Dependências verificadas com sucesso"
}

# Função para criar diretórios necessários
setup_directories() {
    log "INFO" "Criando diretórios necessários..."
    
    mkdir -p data/mongodb
    mkdir -p data/logs
    mkdir -p app/logs
    
    log "INFO" "✅ Diretórios criados com sucesso"
}

# Função para iniciar os serviços
start_services() {
    log "INFO" "Iniciando serviços do Sistema de Saúde..."
    
    # Build e start dos containers
    docker-compose up -d --build
    
    log "INFO" "⏳ Aguardando inicialização dos serviços..."
    sleep 10
    
    # Verificar status dos serviços
    check_services_health
}

# Função para verificar saúde dos serviços
check_services_health() {
    log "INFO" "Verificando saúde dos serviços..."
    
    # Verificar MongoDB
    if docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        log "INFO" "✅ MongoDB está funcionando"
    else
        log "WARN" "❌ MongoDB não está respondendo"
    fi
    
    # Verificar Node.js
    if wget --spider --quiet http://localhost:3000/health 2>/dev/null; then
        log "INFO" "✅ Node.js está funcionando"
    else
        log "WARN" "❌ Node.js não está respondendo"
    fi
    
    # Verificar Nginx
    if wget --spider --quiet http://localhost 2>/dev/null; then
        log "INFO" "✅ Nginx está funcionando"
    else
        log "WARN" "❌ Nginx não está respondendo"
    fi
}

# Função para parar os serviços
stop_services() {
    log "INFO" "Parando serviços do Sistema de Saúde..."
    docker-compose down
    log "INFO" "✅ Serviços parados com sucesso"
}

# Função para restart dos serviços
restart_services() {
    log "INFO" "Reiniciando serviços..."
    stop_services
    sleep 5
    start_services
}

# Função para visualizar logs
show_logs() {
    local service=${1:-""}
    if [[ -n $service ]]; then
        log "INFO" "Mostrando logs do serviço: $service"
        docker-compose logs -f "$service"
    else
        log "INFO" "Mostrando logs de todos os serviços"
        docker-compose logs -f
    fi
}

# Função para limpeza completa
cleanup() {
    log "INFO" "Realizando limpeza completa..."
    docker-compose down -v --remove-orphans
    docker system prune -f
    log "INFO" "✅ Limpeza concluída"
}

# Função para backup dos dados
backup() {
    local backup_dir="backup_$(date +%Y%m%d_%H%M%S)"
    log "INFO" "Criando backup em: $backup_dir"
    
    mkdir -p "$backup_dir"
    
    # Backup dos dados do MongoDB
    docker-compose exec -T mongodb mongodump --out /data/backup
    
    # Copiar backup do container
    docker cp $(docker-compose ps -q mongodb):/data/backup "$backup_dir/mongodb"
    
    # Backup dos logs
    cp -r data/logs "$backup_dir/"
    
    log "INFO" "✅ Backup criado em: $backup_dir"
}

# Função para mostrar status
show_status() {
    log "INFO" "Status dos containers:"
    docker-compose ps
    
    echo ""
    log "INFO" "Uso de recursos:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
}

# Menu principal
show_help() {
    echo ""
    echo "🏥 Sistema de Saúde - Script de Deploy"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  start     - Iniciar todos os serviços"
    echo "  stop      - Parar todos os serviços"
    echo "  restart   - Reiniciar todos os serviços"
    echo "  status    - Mostrar status dos containers"
    echo "  logs      - Visualizar logs de todos os serviços"
    echo "  logs [serviço] - Visualizar logs de um serviço específico"
    echo "  backup    - Criar backup dos dados"
    echo "  cleanup   - Limpeza completa (remove volumes)"
    echo "  health    - Verificar saúde dos serviços"
    echo ""
    echo "Exemplos:"
    echo "  $0 start"
    echo "  $0 logs mongodb"
    echo "  $0 status"
    echo ""
}

# Processar argumentos
case "${1:-help}" in
    "start")
        check_dependencies
        setup_directories
        start_services
        log "INFO" "🚀 Sistema de Saúde iniciado com sucesso!"
        log "INFO" "📊 Acesse: http://localhost (Nginx)"
        log "INFO" "🔗 API: http://localhost:3000 (Node.js)"
        log "INFO" "🗄️  MongoDB: localhost:27017"
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        restart_services
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs "$2"
        ;;
    "backup")
        backup
        ;;
    "cleanup")
        cleanup
        ;;
    "health")
        check_services_health
        ;;
    "help"|*)
        show_help
        ;;
esac
