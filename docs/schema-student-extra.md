# Schema no Back4App

## Classe Student

- **photo** — tipo **File**  
  - Armazena a foto da aluna.

*(Se existir a coluna `crew` em Student, pode removê-la; o vínculo é feito via **StudentCrew**.)*

---

## Classe StudentCrew (nova) — vínculo aluno ↔ turma (N:N)

Uma aluna pode estar em **várias turmas**. Crie a classe **StudentCrew** com:

| Coluna  | Tipo    | Classe alvo |
|---------|---------|-------------|
| student | Pointer | Student     |
| crew    | Pointer | Crew        |

Em: [Back4App](https://dashboard.back4app.com) → **Kas Ballet** → **Core** → **Browser** → **Create a new class** → **StudentCrew** → **Add Column**.
