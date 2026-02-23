#!/bin/bash

# =================================================================
# CORREÇÃO DA MIGRAÇÃO - MOVER PARA PASTA DOCKER
# =================================================================
# Origem: /home/fabricio/Projetos/Python/controle-doc-medica
# Destino: /home/fabricio/Projetos/Docker/controle-doc-medica
# =================================================================

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

ORIGEM="/home/fabricio/Projetos/Python/controle-doc-medica"
DESTINO="/home/fabricio/Projetos/Docker"

echo -e "${BLUE}🔧 CORREÇÃO DE MIGRAÇÃO${NC}"
echo -e "${BLUE}=================================${NC}"
echo "Origem: $ORIGEM"
echo "Destino: $DESTINO/controle-doc-medica"
echo

# Verificar se origem existe
if [ ! -d "$ORIGEM" ]; then
    echo -e "${RED}❌ Diretório origem não encontrado: $ORIGEM${NC}"
    exit 1
fi

# Confirmação
read -p "Continuar com a correção da migração? (y/N): " -n 1 -r
echo
[[ ! $REPLY =~ ^[Yy]$ ]] && exit 0

# 1. Backup rápido
echo -e "${YELLOW}📦 Criando backup de segurança...${NC}"
cd "$ORIGEM"
sudo tar -czf ~/backup-correcao-$(date +%Y%m%d-%H%M%S).tar.gz data/ uploads/ *.yml

# 2. Parar containers
echo -e "${YELLOW}🛑 Parando containers...${NC}"
docker compose down

# 3. Criar diretório destino
echo -e "${YELLOW}📁 Criando diretório destino...${NC}"
mkdir -p "$DESTINO"

# 4. Mover projeto
echo -e "${YELLOW}🚚 Movendo projeto...${NC}"
mv "$ORIGEM" "$DESTINO/"

# 5. Limpar diretório Python se vazio
if [ -d "/home/fabricio/Projetos/Python" ] && [ -z "$(ls -A /home/fabricio/Projetos/Python)" ]; then
    echo -e "${YELLOW}🧹 Removendo diretório Python vazio...${NC}"
    rmdir "/home/fabricio/Projetos/Python"
fi

# 6. Navegar para novo local e ajustar permissões
echo -e "${YELLOW}🔧 Ajustando permissões...${NC}"
cd "$DESTINO/controle-doc-medica"
sudo chown -R 999:999 data/mongodb 2>/dev/null || true
sudo chmod -R 755 data/logs 2>/dev/null || true

# 7. Iniciar containers
echo -e "${YELLOW}🚀 Iniciando containers na nova localização...${NC}"
docker compose up -d --build

# 8. Aguardar sistema ficar pronto
echo -e "${YELLOW}⏳ Aguardando sistema ficar pronto...${NC}"
sleep 30

# 9. Verificar
echo -e "${YELLOW}🔍 Verificando sistema...${NC}"
if curl -f -s http://localhost > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Correção da migração concluída com sucesso!${NC}"
    echo -e "${GREEN}📍 Nova localização: $DESTINO/controle-doc-medica${NC}"
    echo -e "${GREEN}🌐 Sistema acessível em: http://localhost${NC}"
else
    echo -e "${YELLOW}⚠️  Sistema pode precisar de mais alguns segundos para ficar totalmente pronto${NC}"
    echo -e "${BLUE}🌐 Teste em: http://localhost${NC}"
fi

echo
echo -e "${BLUE}🎯 Correção finalizada!${NC}"
echo -e "Localização atual: ${GREEN}$DESTINO/controle-doc-medica${NC}"
