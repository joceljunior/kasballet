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

## Observação

Se as funções não estiverem deployadas, ao tentar criar ou editar uma professora o app exibirá erro. Confira se o Cloud Code foi implantado corretamente.
