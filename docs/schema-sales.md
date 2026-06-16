# Schema: Vendas (Product, Sale, ItemCategory)

## Visão geral

- **Classes no Back4App:** `Product`, `Sale`, `ItemCategory`
- **Uso:** cadastro de produtos com estoque e registro de vendas da loja da escola (sapatilhas, roupas, mochilas, etc.)
- **Integração financeira:** cada venda cria automaticamente um `FinancialEntry` com `type=entrada`, `subtype=vendas`, `status=efetivado`
- **Acesso:** apenas **Master**

## ItemCategory

Categorias configuráveis em módulo separado (`/categorias`). Cada categoria define o **uso** (produto ou venda) e quais **informações são solicitadas** ao cadastrar itens — campos opcionais, mas exibidos no formulário.

| Campo            | Tipo     | Obrigatório | Descrição                                              |
|------------------|----------|-------------|--------------------------------------------------------|
| code             | String   | Sim         | Identificador estável (slug)                           |
| label            | String   | Sim         | Nome exibido (ex: Roupas, Calçados)                    |
| scope            | String   | Sim         | `produto` ou `venda`                                   |
| attributeFields  | Array    | Não         | Campos solicitados (ver estrutura abaixo)              |
| active           | Boolean  | Sim         | Default `true`                                         |
| sortOrder        | Number   | Não         | Ordem de exibição                                      |

### Estrutura de `attributeFields`

```json
[
  {
    "key": "tamanho",
    "label": "Tamanho",
    "type": "alphanumeric",
    "options": ["P", "M", "G", "GG"]
  }
]
```

Tipos de campo: `alphanumeric` (P, M, G), `numeric` (28, 32, 48), `text`.

## Product

| Campo           | Tipo       | Obrigatório | Descrição                                      |
|-----------------|------------|-------------|------------------------------------------------|
| name            | String     | Sim         | Nome base do produto (ex: Collant)             |
| price           | Number     | Sim         | Preço de venda (R$)                            |
| stockQuantity   | Number     | Sim         | Quantidade em estoque                          |
| categoryCode    | String     | Não         | Código da ItemCategory (scope produto)         |
| category        | String     | Não         | Legado — mantido em sync com categoryCode       |
| attributes      | Object     | Não         | Valores dos campos da categoria (ex: tamanho)  |
| description     | String     | Não         | Detalhes do produto                            |
| photo           | File       | Não         | Foto do produto (Parse.File)                   |
| active          | Boolean    | Sim         | Default `true`. Produtos inativos não aparecem na venda |

### Agrupamento por tamanho

Produtos com o **mesmo nome** e **mesma categoria** são variações (ex: Collant P, Collant M, Collant G). A listagem agrupa por nome; ao abrir um grupo, exibe estoque de todos os tamanhos.

## Sale

| Campo             | Tipo     | Obrigatório | Descrição                                           |
|-------------------|----------|-------------|-----------------------------------------------------|
| date              | Date     | Sim         | Data da venda                                       |
| totalValue        | Number   | Sim         | Valor total da venda                                |
| items             | Array    | Sim         | Itens vendidos (ver estrutura abaixo)               |
| customerName      | String   | Não         | Nome do cliente (quando não vinculado a aluna)      |
| studentId         | String   | Não         | objectId do Student (opcional)                      |
| notes             | String   | Não         | Observações                                         |
| financialEntryId  | String   | Sim         | objectId do FinancialEntry criado                   |
| status            | String   | Sim         | `concluida`                                         |
| createdByUserId   | String   | Não         | Quem registrou a venda                              |

### Estrutura de `items`

```json
[
  {
    "productId": "abc123",
    "productName": "Sapatilha Capezio 35",
    "quantity": 1,
    "unitPrice": 189.90,
    "lineTotal": 189.90
  }
]
```

## FinancialEntry (campo adicional)

| Campo  | Tipo   | Descrição                          |
|--------|--------|------------------------------------|
| saleId | String | objectId da Sale (preenchido após criar a venda) |

## Fluxo ao registrar venda

1. Valida estoque de cada produto
2. Cria `FinancialEntry` (entrada/vendas/efetivado)
3. Cria `Sale` com `financialEntryId`
4. Atualiza `FinancialEntry.saleId`
5. Decrementa `Product.stockQuantity` de cada item

## Edição e exclusão

- **Editar** (`/vendas/:id/edit`): devolve o estoque anterior, valida o novo carrinho, atualiza a venda e o `FinancialEntry` vinculado.
- **Excluir**: devolve o estoque de todos os itens e remove a venda e o lançamento financeiro.

## Rotas (apenas Master)

- `/vendas` — listagem de vendas
- `/vendas/nova` — registrar nova venda
- `/vendas/:id/edit` — editar venda
- `/vendas/:id` — detalhes da venda
- `/produtos` — listagem agrupada por produto
- `/produtos/grupo?nome=...&categoria=...` — estoque por tamanho
- `/produtos/novo` — cadastrar produto/variação
- `/produtos/:id/edit` — editar produto
- `/categorias` — categorias de produto e venda

## Back4App: criar as classes

Se as classes ainda não existirem, elas serão criadas automaticamente ao salvar o primeiro registro pelo app. Recomenda-se criar manualmente no painel Back4App com as colunas acima.
