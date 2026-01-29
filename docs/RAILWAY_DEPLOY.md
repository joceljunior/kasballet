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

⚠️ **IMPORTANTE:** No Vite, as variáveis de ambiente são substituídas em **TEMPO DE BUILD**. Elas precisam estar configuradas **ANTES** do Railway executar `npm run build`.

**Passos:**

1. No Railway, vá em **Settings** > **Variables**
2. Adicione as seguintes variáveis (uma por vez ou todas de uma vez):

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

3. **Após adicionar as variáveis, faça um NOVO DEPLOY:**
   - Vá em **Deployments**
   - Clique em **"Redeploy"** ou faça um novo commit/push para triggerar um novo build
   - ⚠️ **Não basta apenas adicionar as variáveis** - é necessário fazer um novo build para que elas sejam incluídas no código

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

### Erro: "Unknown --listen endpoint scheme (protocol): undefined"

Este erro ocorre quando a variável `PORT` não está sendo expandida corretamente pelo `serve`. **Solução aplicada:**

1. **Script `start.sh` criado** - Garante que a porta seja sempre um número válido
2. **Todos os arquivos de configuração atualizados** para usar `sh start.sh`

**Se o erro persistir:**
- Certifique-se de que o arquivo `start.sh` está commitado e tem permissão de execução
- No Railway, vá em **Settings** > **Variables** e verifique se `PORT` está sendo definida automaticamente
- Como alternativa, adicione manualmente: `PORT=3000` (mas geralmente o Railway define automaticamente)

### Erro: "Missing environment variables" ou "Parse SDK: Missing environment variables"

Este erro significa que as variáveis de ambiente não estão disponíveis durante o build.

**Solução:**

1. **Verifique se as variáveis estão configuradas no Railway:**
   - Vá em **Settings** > **Variables**
   - Confirme que existem:
     - `VITE_PARSE_APPLICATION_ID`
     - `VITE_PARSE_JAVASCRIPT_KEY`
     - `VITE_PARSE_SERVER_URL`

2. **⚠️ IMPORTANTE: Faça um NOVO DEPLOY após adicionar as variáveis:**
   - No Railway, vá em **Deployments**
   - Clique em **"Redeploy"** ou faça um novo commit/push
   - As variáveis só são incluídas no código durante o BUILD
   - Se você adicionou as variáveis após o deploy, elas não estarão no código atual

3. **Verifique os nomes das variáveis:**
   - Devem começar com `VITE_` (obrigatório no Vite)
   - Não devem ter espaços antes ou depois do `=`
   - Exemplo correto: `VITE_PARSE_APPLICATION_ID=abc123`
   - Exemplo errado: `VITE_PARSE_APPLICATION_ID = abc123` (espaços)

4. **Verifique os logs de build:**
   - No Railway, veja os logs do build
   - Procure por mensagens sobre variáveis de ambiente
   - Se as variáveis não aparecerem nos logs, elas não estão disponíveis durante o build

### Erro: "Parse SDK not initialized"
- Confirme que as credenciais do Back4App estão corretas
- Verifique se a URL do servidor está no formato correto

### Build falha
- Verifique os logs no Railway para ver o erro específico
- Confirme que o `package.json` tem todas as dependências necessárias
- Certifique-se de que as `devDependencies` estão instaladas (necessárias para o build do Vite)