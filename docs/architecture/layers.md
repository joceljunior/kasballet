# Arquitetura em Camadas

## Visão Geral

A aplicação segue uma arquitetura em camadas para garantir escalabilidade e manutenibilidade.

## Camadas

1. **Views/Components** - Apresentação e UI
2. **Stores (Pinia)** - Estado global
3. **Services** - Lógica de negócio
4. **Repositories** - Abstração de acesso a dados
5. **Parse SDK** - Infraestrutura BaaS

## Fluxo de Dados

```
View → Store → Service → Repository → Parse SDK → Back4App
```

## Benefícios

- Escalabilidade
- Testabilidade
- Manutenibilidade
- Flexibilidade para trocar BaaS
