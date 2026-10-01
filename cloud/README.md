# Cloud Code – Kas Ballet

Para **criar** e **atualizar** professoras (_User com Role `Professora`), o app chama as Cloud Functions `createTeacher` e `updateTeacher`. É necessário fazer o deploy deste código no Back4App.

## Deploy no Back4App

1. Acesse o [Dashboard Back4App](https://dashboard.back4app.com/) e selecione o app.
2. Vá em **Server Settings** (ou **Cloud Code**).
3. Faça o deploy do conteúdo de `main.js` (cole no editor ou use o deploy via Git/CLI, conforme a opção do Back4App).

## Funções

- **createTeacher** `({ username, password, email })`  
  - Cria um `_User` com `Role: 'Professora'`.  
  - Apenas usuários com `Role: 'Master'` podem chamar.

- **deleteTeacher** `({ userId })`  
  - Exclui Professora e zera `teacherId` nas turmas.  
  - Apenas Master pode chamar.

- **deleteItemCategory** `({ categoryId })`  
  - Exclui categoria de produto se não houver produtos vinculados.  
  - Apenas Master pode chamar.

- **notifyRegistration** `({ studentId })`  
  - Envia e-mail para `balletkas@gmail.com` quando uma matrícula é feita pelo link público.  
  - Pública, mas só aceita cadastros pendentes criados nos últimos 15 minutos e notifica uma vez por aluna (`Student.registrationNotifiedAt`).

- **reportRegistrationError** `({ reference, step, message, code, technical, form, ... })`  
  - Envia e-mail para `balletkas@gmail.com` quando ocorre erro no cadastro público (com a referência mostrada ao cliente).  
  - Pública; o destinatário é fixo, os campos são truncados e escapados, e há limite de envios por janela de tempo.

### E-mail (necessário para as duas funções acima)

As funções usam `Parse.Cloud.sendEmail`, que depende de um **mail adapter** configurado no Back4App (Server Settings → Email/Mailgun ou equivalente). Opcionalmente defina a variável de ambiente `MAIL_FROM` com o remetente verificado (padrão: `balletkas@gmail.com`). Sem o adapter, o cadastro continua funcionando, mas nenhum e-mail é enviado.

## Observação

Se as funções não estiverem deployadas, ao tentar criar ou editar uma professora o app exibirá erro. Confira se o Cloud Code foi implantado corretamente.
