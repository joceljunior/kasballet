# Schema: Professor (User) e vínculo com Turmas

## Visão geral

- **Professora** = `_User` com `Role: 'Professora'`.
- **Uma turma tem 1 professora**; **uma professora tem N turmas**.
- Vínculo: campo `teacherId` (String, objectId do _User) na classe **Crew**.

## Back4App: alterações necessárias

### 1. Classe `Crew`

Adicione a coluna:

| Nome      | Tipo   | Obrigatório |
|----------|--------|-------------|
| teacherId| String | Não         |

- `teacherId`: objectId do `_User` (Role Professora) que leciona a turma. `null`/vazio = turma sem professora atribuída.

### 2. Classe `_User`

- `Role` (String): `'Master'` ou `'Professora'`.
- `active` (Boolean, opcional): se a professora está ativa. `true` ou ausente = ativa, `false` = inativa.

### 3. Cloud Code

Para **criar** e **atualizar** professoras (operação de usuário, feita com privilégios de Master), é obrigatório usar Cloud Code.

- Copie o conteúdo de `cloud/main.js` para o Cloud Code do app no Back4App.
- Funções:
  - `createTeacher`: cria `_User` com `Role: 'Professora'` e `active` (default `true`).
  - `updateTeacher`: atualiza `email`, `password` e/ou `active` de uma Professora.

No Back4App: **Server Settings > Cloud Code** e faça o deploy do arquivo/pasta.

## Comportamento no app

- **Master**: vê todas as turmas; em Turmas > Nova/Editar pode escolher a Professora; em Professoras > Nova/Editar cria/edita usuários Professora e atribui turmas.
- **Professora**: vê só as turmas em que `Crew.teacherId` é o seu `_User.id`; não acessa Alunos, Professoras, Financeiro; acessa Dashboard e Chamadas (com restrições por turma, quando implementado).

### Regras de negócio

- **Criar turma**: a professora é opcional; pode escolher "Nenhuma" ou uma professora (ativa ou inativa).
- **Criar professora**: é obrigatório vincular a pelo menos uma turma; e-mail obrigatório. Se criar como inativa, não pode vincular a nenhuma turma (o formulário desabilita turmas e limpa a seleção).
- **E-mail**: obrigatório ao criar e ao editar professora.
- **Inativar professora**: ao marcar como inativa, todos os vínculos com turmas (`Crew.teacherId`) são removidos (teacherId=null) no Cloud Code.
- **Reativar professora**: para marcar como ativa, é obrigatório vincular a pelo menos uma turma. O formulário bloqueia o envio se estiver ativa e sem turmas.
- **Alterar professora da turma**: em Turmas > Editar é possível trocar a professora (ou deixar "Nenhuma"). Inclui professoras inativas no select (com indicação "— Inativa") para permitir vincular e depois reativar.
