# Student API

## Repository Methods

### `findAll(limit, skip, filters)`
Busca lista de alunos com paginação.

**Parameters:**
- `limit` (Number): Quantidade de itens por página
- `skip` (Number): Quantidade de itens a pular
- `filters` (Object): Filtros de busca

**Returns:** Promise<Array<Student>>

**Example:**
```javascript
const students = await studentRepository.findAll(30, 0, { active: true });
```

### `findPending(limit, skip)`
Busca alunos pendentes de aprovação.

**Parameters:**
- `limit` (Number): Quantidade de itens por página
- `skip` (Number): Quantidade de itens a pular

**Returns:** Promise<Array<Student>>

### `findById(id)`
Busca aluno por ID.

**Parameters:**
- `id` (String): Object ID do aluno

**Returns:** Promise<Student>

### `create(data)`
Cria novo aluno.

**Parameters:**
- `data` (Object): Dados do aluno

**Returns:** Promise<Student>

### `update(id, data)`
Atualiza aluno existente.

**Parameters:**
- `id` (String): Object ID do aluno
- `data` (Object): Dados para atualizar

**Returns:** Promise<Student>

## Service Methods

### `getStudents(page, pageSize, filters)`
Obtém lista de alunos com paginação.

**Parameters:**
- `page` (Number): Número da página (0-indexed)
- `pageSize` (Number): Itens por página
- `filters` (Object): Filtros opcionais

**Returns:** Promise<Array<Student>>

### `approveStudent(id)`
Aprova aluno pendente.

**Parameters:**
- `id` (String): Object ID do aluno

**Returns:** Promise<Student>
