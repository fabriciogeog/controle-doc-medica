#!/bin/bash

# =================================================================
# SCRIPT DE MIGRAÇÃO SEGURA DO SISTEMA DE DOCUMENTAÇÃO MÉDICA
# =================================================================
# Autor: Fabricio
# Data: 14/01/2025
# Versão: 1.0
# =================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configurações
ORIGEM="/home/fabricio/controle-doc-medica"
DESTINO="/home/fabricio/Projetos/Docker"
BACKUP_DIR="$HOME"
BACKUP_NAME="backup-controle-doc-medica-$(date +%Y%m%d-%H%M%S).tar.gz"
TIMEOUT_CONTAINERS=60

# Funções auxiliares
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE} $1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_step() {
    echo -e "${CYAN}➤ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

check_requirements() {
    print_step "Verificando pré-requisitos..."
    
    # Verificar se Docker está instalado
    if ! command -v docker &> /dev/null; then
        print_error "Docker não está instalado!"
        exit 1
    fi
    
    # Verificar se Docker Compose está instalado
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose não está disponível!"
        exit 1
    fi
    
    # Verificar se diretório origem existe
    if [ ! -d "$ORIGEM" ]; then
        print_error "Diretório origem não encontrado: $ORIGEM"
        exit 1
    fi
    
    # Verificar espaço disponível (pelo menos 2GB)
    AVAILABLE_SPACE=$(df "$DESTINO" 2>/dev/null | tail -1 | awk '{print $4}' || echo "0")
    if [ "$AVAILABLE_SPACE" -lt 2097152 ]; then  # 2GB em KB
        print_warning "Pouco espaço disponível no destino (< 2GB)"
        read -p "Continuar mesmo assim? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    print_success "Pré-requisitos verificados"
}

create_backup() {
    print_step "Criando backup de segurança..."
    
    cd "$ORIGEM"
    
    # Criar backup completo
    sudo tar -czf "$BACKUP_DIR/$BACKUP_NAME" \
        data/ uploads/ app/ nginx/ docs/ \
        *.yml *.md *.sh \
        --exclude=data/mongodb/journal \
        --exclude=data/logs/*.log \
        2>/dev/null || true
    
    if [ -f "$BACKUP_DIR/$BACKUP_NAME" ]; then
        BACKUP_SIZE=$(du -sh "$BACKUP_DIR/$BACKUP_NAME" | cut -f1)
        print_success "Backup criado: $BACKUP_DIR/$BACKUP_NAME ($BACKUP_SIZE)"
    else
        print_error "Falha ao criar backup!"
        exit 1
    fi
}

stop_containers() {
    print_step "Parando containers..."
    
    cd "$ORIGEM"
    
    # Verificar se containers estão rodando
    if docker compose ps -q | grep -q .; then
        docker compose down --timeout 30
        
        # Aguardar containers pararem completamente
        local count=0
        while docker compose ps -q | grep -q . && [ $count -lt 30 ]; do
            sleep 2
            count=$((count + 1))
        done
        
        if docker compose ps -q | grep -q .; then
            print_warning "Forçando parada dos containers..."
            docker compose down --timeout 0 --volumes=false
        fi
        
        print_success "Containers parados"
    else
        print_success "Nenhum container rodando"
    fi
}

migrate_files() {
    print_step "Movendo arquivos para nova localização..."
    
    # Criar diretório de destino se não existir
    mkdir -p "$DESTINO"
    
    # Mover projeto completo
    if mv "$ORIGEM" "$DESTINO/"; then
        print_success "Arquivos movidos para $DESTINO/controle-doc-medica"
    else
        print_error "Falha ao mover arquivos!"
        print_error "Restaurando backup..."
        restore_backup
        exit 1
    fi
}

fix_permissions() {
    print_step "Ajustando permissões..."
    
    cd "$DESTINO/controle-doc-medica"
    
    # Ajustar permissões do MongoDB
    if [ -d "data/mongodb" ]; then
        sudo chown -R 999:999 data/mongodb 2>/dev/null || true
        print_success "Permissões do MongoDB ajustadas"
    fi
    
    # Ajustar permissões dos logs
    if [ -d "data/logs" ]; then
        sudo chown -R $USER:$USER data/logs 2>/dev/null || true
        sudo chmod -R 755 data/logs 2>/dev/null || true
        print_success "Permissões dos logs ajustadas"
    fi
    
    # Ajustar permissões dos uploads
    if [ -d "uploads" ]; then
        sudo chown -R $USER:$USER uploads 2>/dev/null || true
        sudo chmod -R 755 uploads 2>/dev/null || true
        print_success "Permissões dos uploads ajustadas"
    fi
}

start_containers() {
    print_step "Iniciando containers na nova localização..."
    
    cd "$DESTINO/controle-doc-medica"
    
    # Remover containers antigos se existirem
    docker compose down --remove-orphans 2>/dev/null || true
    
    # Iniciar containers
    docker compose up -d --build
    
    print_step "Aguardando containers ficarem prontos..."
    
    # Aguardar containers ficarem healthy
    local count=0
    while [ $count -lt $TIMEOUT_CONTAINERS ]; do
        local healthy_count=$(docker compose ps --format json | jq -r '.Health // "healthy"' | grep -c "healthy" || echo "0")
        local total_count=$(docker compose ps -q | wc -l)
        
        if [ "$healthy_count" -eq "$total_count" ] && [ "$total_count" -gt 0 ]; then
            print_success "Containers iniciados e prontos"
            return 0
        fi
        
        echo -n "."
        sleep 2
        count=$((count + 2))
    done
    
    print_warning "Timeout ao aguardar containers. Verificando status..."
    docker compose ps
}

verify_system() {
    print_step "Verificando sistema migrado..."
    
    cd "$DESTINO/controle-doc-medica"
    
    # Verificar containers
    local running_containers=$(docker compose ps -q | wc -l)
    if [ "$running_containers" -eq 0 ]; then
        print_error "Nenhum container está rodando!"
        return 1
    fi
    print_success "$running_containers containers rodando"
    
    # Testar conectividade HTTP
    local max_attempts=15
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s -m 5 http://localhost >/dev/null 2>&1; then
            print_success "Aplicação web acessível"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            print_error "Aplicação web não está acessível após $max_attempts tentativas"
            print_step "Logs dos containers:"
            docker compose logs --tail=10
            return 1
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    # Verificar MongoDB
    if docker exec -t mongodb_docmedica mongosh --quiet --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
        print_success "MongoDB conectado e funcionando"
    else
        print_warning "MongoDB pode não estar totalmente pronto"
    fi
    
    return 0
}

restore_backup() {
    print_step "Restaurando backup..."
    
    cd "$HOME"
    
    if [ -f "$BACKUP_NAME" ]; then
        sudo tar -xzf "$BACKUP_NAME"
        print_success "Backup restaurado"
    else
        print_error "Arquivo de backup não encontrado!"
    fi
}

cleanup() {
    print_step "Limpeza final..."
    
    # Remover redes órfãs
    docker network prune -f >/dev/null 2>&1 || true
    
    print_success "Limpeza concluída"
}

main() {
    print_header "MIGRAÇÃO DO SISTEMA DE DOCUMENTAÇÃO MÉDICA"
    
    echo -e "${PURPLE}Origem: $ORIGEM${NC}"
    echo -e "${PURPLE}Destino: $DESTINO/controle-doc-medica${NC}"
    echo
    
    # Confirmação do usuário
    read -p "Deseja continuar com a migração? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Migração cancelada pelo usuário."
        exit 0
    fi
    
    # Executar fases da migração
    check_requirements
    create_backup
    stop_containers
    migrate_files
    fix_permissions
    start_containers
    
    if verify_system; then
        cleanup
        
        print_header "MIGRAÇÃO CONCLUÍDA COM SUCESSO!"
        echo
        print_success "Nova localização: $DESTINO/controle-doc-medica"
        print_success "Aplicação disponível em: http://localhost"
        print_success "Backup disponível em: $BACKUP_DIR/$BACKUP_NAME"
        echo
        print_step "Próximos passos:"
        echo "  1. Teste o sistema no navegador"
        echo "  2. Verifique se todos os dados estão íntegros"
        echo "  3. Atualize seus bookmarks/scripts se necessário"
        echo
    else
        print_error "Falha na verificação pós-migração!"
        print_step "Para restaurar o backup, execute:"
        echo "  cd $HOME"
        echo "  sudo tar -xzf $BACKUP_NAME"
        echo "  cd /home/fabricio/controle-doc-medica"
        echo "  docker compose up -d"
        exit 1
    fi
}

# Tratamento de interrupção
trap 'echo; print_error "Migração interrompida pelo usuário!"; exit 1' INT TERM

# Executar migração
main "$@"
