# Usar imagem Node.js baseada na disponível no sistema
FROM node:iron-trixie-slim

# Definir diretório de trabalho
WORKDIR /usr/src/app

# Instalar wget para healthcheck
RUN apt-get update && apt-get install -y \
    wget \
    libcurl4 \
    && rm -rf /var/lib/apt/lists/*

# Copiar package.json e package-lock.json primeiro (para cache das dependências)
COPY package*.json ./

# Instalar dependências do Node.js
RUN npm install --only=production

# Copiar código da aplicação
COPY . .

# Criar usuário não-root para segurança primeiro
RUN groupadd -r nodeuser && useradd -r -g nodeuser nodeuser

# Criar diretórios necessários com permissões corretas
RUN mkdir -p /usr/src/app/uploads /usr/src/app/public
RUN chown -R nodeuser:nodeuser /usr/src/app
USER nodeuser

# Expor porta da aplicação
EXPOSE 3000

# Definir comando de saúde
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Comando para iniciar a aplicação
CMD ["node", "app.js"]
