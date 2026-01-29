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

# Expor porta (Railway define a variável PORT)
EXPOSE 3000

# Comando para servir a aplicação
CMD ["npm", "start"]
