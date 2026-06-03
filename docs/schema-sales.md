# Schema: Vendas (Product, Sale)

## Visão geral

- **Classes no Back4App:** `Product`, `Sale`
- **Uso:** cadastro de produtos com estoque e registro de vendas da loja da escola (sapatilhas, roupas, mochilas, etc.)
- **Integração financeira:** cada venda cria automaticamente um `FinancialEntry` com `type=entrada`, `subtype=vendas`, `status=efetivado`
- **Acesso:** apenas **Master**

## Product

| Campo           | Tipo       | Obrigatório | Descrição                                      |
|-----------------|------------|-------------|------------------------------------------------|
| name            | String     | Sim         | Nome do produto                                |
| price           | Number     | Sim         | Preço de venda (R$)                            |
| stockQuantity   | Number     | Sim         | Quantidade em estoque                          |
| category        | String     | Não         | Ex: Sapatilhas, Roupas, Mochilas, Acessórios   |
| description     | String     | Não         | Detalhes do produto                            |
| photo           | File       | Não         | Foto do produto (Parse.File)                   |
| active          | Boolean    | Sim         | Default `true`. Produtos inativos não aparecem na venda |

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

## Rotas (apenas Master)

- `/vendas` — listagem de vendas
- `/vendas/nova` — registrar nova venda
- `/vendas/:id` — detalhes da venda
- `/produtos` — listagem de produtos
- `/produtos/novo` — cadastrar produto
- `/produtos/:id/edit` — editar produto

## Back4App: criar as classes

Se as classes ainda não existirem, elas serão criadas automaticamente ao salvar o primeiro registro pelo app. Recomenda-se criar manualmente no painel Back4App com as colunas acima.
