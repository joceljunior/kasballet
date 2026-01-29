# Deploy no Railway

## Pré-requisitos

1. Conta no [Railway](https://railway.app)
2. Conta no [Back4App](https://www.back4app.com) com as credenciais do Parse

## Passos para Deploy

### 1. Conectar o Repositório

1. Acesse [Railway Dashboard](https://railway.app/dashboard)
2. Clique em **"New Project"**
3. Selecione **"Deploy from GitHub repo"** (ou faça upload do código)
4. Escolha o repositório `kasballet`

### 2. Configurar Variáveis de Ambiente

No Railway, vá em **Variables** e adicione:

```
VITE_PARSE_APPLICATION_ID=seu_application_id_aqui
VITE_PARSE_JAVASCRIPT_KEY=sua_javascript_key_aqui
VITE_PARSE_SERVER_URL=https://parseapi.back4app.com
```

**Onde encontrar essas credenciais:**
- Acesse seu app no Back4App
- Vá em **App Settings** > **Security & Keys**
- Copie:
  - **Application ID** → `VITE_PARSE_APPLICATION_ID`
  - **JavaScript Key** → `VITE_PARSE_JAVASCRIPT_KEY`
  - **Server URL** → `VITE_PARSE_SERVER_URL` (geralmente `https://parseapi.back4app.com`)

### 3. Deploy Automático

O Railway vai:
1. Detectar o `railway.json`
2. Executar `npm run build` para gerar o `dist/`
3. Iniciar o servidor com `npx serve -s dist -l $PORT`
4. Gerar uma URL pública automaticamente

### 4. Domínio Personalizado (Opcional)

1. No Railway, vá em **Settings** > **Domains**
2. Clique em **"Generate Domain"** ou adicione seu domínio personalizado
3. Configure o DNS conforme as instruções

## Verificação

Após o deploy:
- ✅ O frontend deve estar acessível na URL fornecida pelo Railway
- ✅ O login deve funcionar conectando ao Back4App
- ✅ Todas as funcionalidades devem estar operacionais

## Troubleshooting

### Erro: "Failed to build an image"

Este erro geralmente ocorre quando o Railway não consegue detectar ou construir a imagem corretamente. Soluções:

1. **Verifique os logs de build no Railway**
   - Clique no deploy que falhou
   - Veja os logs completos para identificar o erro específico

2. **Certifique-se de que os arquivos estão commitados**
   ```bash
   git add railway.json nixpacks.toml .nvmrc Procfile
   git commit -m "Add Railway configuration files"
   git push
   ```

3. **Configure manualmente no Railway (se necessário)**
   - No Railway, vá em **Settings** > **Service**
   - Em **Build Command**, defina: `npm ci && npm run build`
   - Em **Start Command**, defina: `npx serve -s dist -l $PORT`
   - Em **Root Directory**, deixe vazio (ou `/`)

4. **Verifique a versão do Node.js**
   - O projeto usa Node.js 20 (definido no `.nvmrc`)
   - No Railway, vá em **Settings** > **Variables**
   - Adicione: `NODE_VERSION=20` (se necessário)

5. **Tente usar Dockerfile (alternativa)**
   - Se o NIXPACKS continuar falhando, podemos criar um Dockerfile

### Erro: "Missing environment variables"
- Verifique se todas as 3 variáveis de ambiente estão configuradas no Railway
- Certifique-se de que os nomes estão corretos (começam com `VITE_`)

### Erro: "Parse SDK not initialized"
- Confirme que as credenciais do Back4App estão corretas
- Verifique se a URL do servidor está no formato correto

### Build falha
- Verifique os logs no Railway para ver o erro específico
- Confirme que o `package.json` tem todas as dependências necessárias
- Certifique-se de que as `devDependencies` estão instaladas (necessárias para o build do Vite)