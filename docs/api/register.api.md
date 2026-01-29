# Register (Chamadas) – API e modelo

## Modelo no Back4App (classe `Register`)

| Campo             | Tipo  | Obrigatório | Descrição                                                                 |
|------------------|-------|-------------|---------------------------------------------------------------------------|
| crewId           | String| Sim         | ObjectId da turma (Crew)                                                  |
| dateregister     | Date  | Sim         | Data da chamada                                                           |
| studentRegisters | Array | Sim         | `[{ studentId: string, present: boolean }]` — presença por aluna          |
| calledByUserId   | String| Não         | ObjectId do _User que fez a chamada (preenchido no create pelo currentUser)|

## Repository

- `findRegisters(limit, skip, filters)`: `filters` opcionais: `crewId`, `crewIds` (array, para Professora ver só suas turmas), `dateFrom`, `dateTo`. Ordenação: `dateregister` desc.
- `findByCrew(crewId, limit, skip)`, `findByDateRange(start, end, limit, skip)`, `findById`, `create`, `update`, `delete` (via BaseRepository).

## Service

- `getRegisters(page, pageSize, filters)`: lista com filtros.
- `getRegistersByCrew(crewId, page, pageSize)`.
- `getRegisterById(id)`.
- `createRegister(data)`: preenche `calledByUserId` com `Parse.User.current()?.id`; `data`: `{ crewId, dateregister, studentRegisters }`.
- `updateRegister(id, data)`: `data` pode conter `crewId`, `dateregister`, `studentRegisters`; `calledByUserId` não é alterado.
- `deleteRegister(id)`.

## Rotas

- `/chamadas` — lista (RegisterListView)
- `/chamadas/nova` — nova chamada (RegisterFormView)
- `/chamadas/:id` — detalhe (RegisterDetailView)
- `/chamadas/:id/edit` — editar (RegisterFormView)

## Regras

- **Quem fez a chamada**: em create, `calledByUserId` = usuário logado. Em update, o campo não é alterado.
- **Presença**: `studentRegisters` é um array de `{ studentId, present }`; no formulário só aparecem alunas **ativas** da turma.
