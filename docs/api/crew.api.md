# Crew API

## Repository Methods

### `findAll(limit, skip, filters)`
Busca lista de turmas com paginação.

**Parameters:**
- `limit` (Number): Quantidade de itens por página
- `skip` (Number): Quantidade de itens a pular
- `filters` (Object): Filtros de busca

**Returns:** Promise<Array<Crew>>

### `findById(id)`
Busca turma por ID.

**Parameters:**
- `id` (String): Object ID da turma

**Returns:** Promise<Crew>

## Service Methods

### `getCrews(page, pageSize)`
Obtém lista de turmas com paginação.

**Parameters:**
- `page` (Number): Número da página (0-indexed)
- `pageSize` (Number): Itens por página

**Returns:** Promise<Array<Crew>>
