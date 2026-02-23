#!/bin/bash

# Script simplificado para migração rápida
# Para uso quando você tem confiança no processo

set -e

echo "🚚 MIGRAÇÃO RÁPIDA DO SISTEMA"
echo "Origem: /home/fabricio/controle-doc-medica"
echo "Destino: /home/fabricio/Projetos/Docker/controle-doc-medica"
echo

read -p "Continuar? (y/N): " -n 1 -r
echo
[[ ! $REPLY =~ ^[Yy]$ ]] && exit 0

# 1. Backup rápido
echo "📦 Criando backup..."
cd /home/fabricio/controle-doc-medica
sudo tar -czf ~/backup-quick-$(date +%Y%m%d-%H%M%S).tar.gz data/ uploads/ *.yml

# 2. Parar containers
echo "🛑 Parando containers..."
docker compose down

# 3. Mover arquivos
echo "📁 Movendo arquivos..."
mkdir -p /home/fabricio/Projetos/Docker
mv /home/fabricio/controle-doc-medica /home/fabricio/Projetos/Docker/

# 4. Ajustar permissões e iniciar
echo "🚀 Iniciando na nova localização..."
cd /home/fabricio/Projetos/Docker/controle-doc-medica
sudo chown -R 999:999 data/mongodb 2>/dev/null || true
docker compose up -d --build

# 5. Aguardar e verificar
echo "⏳ Aguardando sistema ficar pronto..."
sleep 30

if curl -s http://localhost > /dev/null; then
    echo "✅ Migração concluída com sucesso!"
    echo "🌐 Acesse: http://localhost"
else
    echo "⚠️  Sistema iniciado, mas pode precisar de mais alguns segundos"
    echo "🌐 Teste: http://localhost"
fi

echo "📍 Nova localização: /home/fabricio/Projetos/Docker/controle-doc-medica"
