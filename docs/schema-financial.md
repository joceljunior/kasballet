# Schema: Financeiro (FinancialEntry)

## Visão geral

- **Classe no Back4App:** `FinancialEntry`
- **Uso:** lançamentos de **entradas** e **saídas**. Apenas **Master** acessa.
- **Status:** `pendente` ou `efetivado`. **Saldo efetivo** = só efetivados; **Saldo projetado** = todos (pendentes + efetivados). Permite planejar o mês com lançamentos pendentes e ver o realizado com os efetivados.
- **Histórico:** na tela do aluno, o Master vê mensalidades (entradas) desse aluno; na tela da professora, vê pagamentos (saídas) a essa professora.

## Campos

| Campo             | Tipo   | Obrigatório | Descrição                                                                 |
|-------------------|--------|-------------|---------------------------------------------------------------------------|
| type              | String | Sim         | `entrada` ou `saida`                                                      |
| subtype           | String | Sim         | Ver subtipos abaixo                                                       |
| status            | String | Sim         | `pendente` ou `efetivado`. Default `efetivado`. Pendente = projeção; efetivado = realizado. |
| date              | Date   | Sim         | Data do lançamento                                                        |
| value             | Number | Sim         | Valor (sempre positivo; na tela entradas somam, saídas subtraem)          |
| description       | String | Condicional | Obrigatório em: vendas, outros (entrada); contas, compras, impostos, outros (saída) |
| studentId         | String | Condicional | Obrigatório em: **mensalidade** (objectId do Student)                     |
| teacherId         | String | Condicional | Obrigatório em: **pagamento** (objectId do _User Professora)              |
| createdByUserId   | String | Não         | Quem criou o lançamento (objectId do _User); preenchido no create         |

## Subtipos

### Entrada (type = `entrada`)

| subtype     | Descrição obrigatória? | studentId obrigatório? | teacherId |
|-------------|------------------------|------------------------|-----------|
| mensalidade | Não                    | **Sim**                | Não       |
| vendas      | **Sim**                | Não                    | Não       |
| outros      | **Sim**                | Não                    | Não       |

### Saída (type = `saida`)

| subtype   | Descrição obrigatória? | studentId | teacherId obrigatório? |
|-----------|------------------------|-----------|------------------------|
| pagamento | Não                    | Não       | **Sim**                |
| contas    | **Sim**                | Não       | Não                    |
| compras   | **Sim**                | Não       | Não                    |
| impostos  | **Sim**                | Não       | Não                    |
| outros    | **Sim**                | Não       | Não                    |

## Back4App: criar a classe

Se a classe `FinancialEntry` ainda não existir:

1. No painel Back4App: **Core** → **Create a class** → nome `FinancialEntry`.
2. Adicione as colunas: `type` (String), `subtype` (String), `status` (String), `date` (Date), `value` (Number), `description` (String), `studentId` (String), `teacherId` (String), `createdByUserId` (String).

Ou: ao criar o primeiro lançamento pelo app, o Parse pode criar a classe com os campos enviados. Garanta que o primeiro `create` envie todos os campos acima.

## Rotas (apenas Master)

- `/financeiro` — dashboard (totais + últimos lançamentos)
- `/financeiro/lancamentos` — listagem com filtros (tipo, status, subtipo, data). Dashboard: saldo efetivo e saldo projetado.
- `/financeiro/lancamentos/novo` — novo lançamento (query `?studentId=` ou `?teacherId=` para pré-preencher)
- `/financeiro/lancamentos/:id/edit` — editar

## Histórico em Aluno e Professora

- **Aluno:** card "Histórico de pagamentos (mensalidades)" (só Master): entradas `type=entrada`, `subtype=mensalidade`, `studentId=aluno`. Link "+ Lançar mensalidade" leva ao formulário com `studentId` e mensalidade já selecionados.
- **Professora:** card "Histórico de pagamentos" (só Master): saídas `type=saida`, `subtype=pagamento`, `teacherId=professora`. Link "+ Lançar pagamento" leva ao formulário com `teacherId` e pagamento já selecionados.
