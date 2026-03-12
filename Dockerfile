# Dockerfile para Railway (alternativa ao NIXPACKS)
FROM node:20-alpine

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências (incluindo devDependencies para o build)
RUN npm ci

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Porta padrão (Railway injeta PORT em runtime)
ENV PORT=3000
EXPOSE 3000

# Servir a pasta dist; usar shell para expandir $PORT
CMD ["sh", "-c", "npx serve dist -s -l ${PORT}"]
