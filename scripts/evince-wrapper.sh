#!/bin/bash

# Script wrapper para executar evince no host a partir do container
# Este script monitora um diretório por solicitações e executa o evince

REQUESTS_DIR="/tmp/evince-requests"
LOG_FILE="/tmp/evince-wrapper.log"

# Criar diretório de requests se não existir
mkdir -p "$REQUESTS_DIR"

echo "$(date): Evince wrapper iniciado, monitorando $REQUESTS_DIR" >> "$LOG_FILE"

while true; do
    # Verificar por arquivos de solicitação
    for request_file in "$REQUESTS_DIR"/*.json; do
        if [ -f "$request_file" ]; then
            echo "$(date): Processando solicitação: $request_file" >> "$LOG_FILE"
            
            # Ler o caminho do arquivo da solicitação
            ARQUIVO=$(jq -r '.arquivo' "$request_file" 2>/dev/null)
            
            if [ "$ARQUIVO" != "null" ] && [ -f "$ARQUIVO" ]; then
                echo "$(date): Abrindo arquivo: $ARQUIVO" >> "$LOG_FILE"
                
                # Executar evince no background
                DISPLAY=:0 evince "$ARQUIVO" 2>/dev/null &
                
                echo "$(date): Evince iniciado para $ARQUIVO" >> "$LOG_FILE"
            else
                echo "$(date): Arquivo não encontrado: $ARQUIVO" >> "$LOG_FILE"
            fi
            
            # Remover arquivo de solicitação
            rm "$request_file"
        fi
    done
    
    # Aguardar 1 segundo antes da próxima verificação
    sleep 1
done
