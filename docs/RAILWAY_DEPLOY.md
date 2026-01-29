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

**Erro: "Missing environment variables"**
- Verifique se todas as 3 variáveis de ambiente estão configuradas no Railway

**Erro: "Parse SDK not initialized"**
- Confirme que as credenciais do Back4App estão corretas
- Verifique se a URL do servidor está no formato correto

**Build falha**
- Verifique os logs no Railway para ver o erro específico
- Confirme que o `package.json` tem todas as dependências necessárias
