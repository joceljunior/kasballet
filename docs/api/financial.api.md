# FinancialEntry (Financeiro) – API e modelo

## Modelo no Back4App (classe `FinancialEntry`)

| Campo             | Tipo   | Obrigatório | Descrição                                                                 |
|------------------|--------|-------------|---------------------------------------------------------------------------|
| type             | String | Sim         | `"entrada"` ou `"saida"`                                                  |
| subtype          | String | Sim         | Entrada: `mensalidade`, `vendas`, `outros`. Saída: `pagamento`, `contas`, `compras`, `impostos`, `outros` |
| date             | Date   | Sim         | Data do lançamento                                                        |
| value            | Number | Sim         | Valor (sempre positivo; type indica entrada/saída)                        |
| description      | String | Conforme subtipo | Obrigatório: vendas, outros (entrada); contas, compras, impostos, outros (saída) |
| studentId        | String | Se mensalidade | ObjectId da aluna (obrigatório quando subtype = mensalidade)              |
| teacherId        | String | Se pagamento | ObjectId da professora (_User) (obrigatório quando subtype = pagamento)   |
| createdByUserId  | String | Não         | ObjectId do usuário que criou (preenchido no create)                      |

## Regras de validação (formulário)

- **Entrada + mensalidade**: `studentId` obrigatório.
- **Entrada + vendas ou outros**: `description` obrigatória.
- **Saída + pagamento**: `teacherId` obrigatório.
- **Saída + contas, compras, impostos ou outros**: `description` obrigatória.

## Repository

- `findEntries(limit, skip, filters)`: filters: `type`, `subtype`, `dateFrom`, `dateTo`, `studentId`, `teacherId`. Ordenação: `date` desc.
- `findByStudent(studentId)`: entradas, mensalidade, do aluno.
- `findByTeacher(teacherId)`: saídas, pagamento, à professora.
- `sumByType(type, filters)`: soma de `value` por tipo (para totais).

## Service

- `getEntries(page, pageSize, filters)`
- `getEntryById(id)`
- `createEntry(data)`: preenche `createdByUserId` com o usuário logado.
- `updateEntry(id, data)`
- `deleteEntry(id)`
- `getEntriesByStudent(studentId)`: histórico de mensalidades.
- `getEntriesByTeacher(teacherId)`: histórico de pagamentos à professora.
- `getTotals(filters)`: `{ totalEntradas, totalSaidas, saldo }`.

## Rotas (apenas Master)

- `/financeiro` — Dashboard (totais e últimos lançamentos)
- `/financeiro/lancamentos` — Lista com filtros
- `/financeiro/lancamentos/novo` — Novo lançamento (query: `?studentId=`, `?teacherId=` para preencher)
- `/financeiro/lancamentos/:id/edit` — Editar

## Histórico em Aluno e Professora

- **Aluno** (detalhe): card "Histórico de pagamentos (mensalidades)" só para Master; link "+ Lançar mensalidade" com `?studentId=` para preencher o formulário.
- **Professora** (detalhe): card "Histórico de pagamentos" só para Master; link "+ Lançar pagamento" com `?teacherId=` para preencher.
