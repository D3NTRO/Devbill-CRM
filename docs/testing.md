# Testing

## Backend

### Stack

- **pytest** + `pytest-django` + `factory-boy`
- Base de datos: PostgreSQL (CI) / SQLite (local)
- Fixtures compartidas en `backend/conftest.py`

### Cómo ejecutar

```bash
cd backend

# Todos los tests
pytest

# Verboso
pytest -v

# Detener en primer error
pytest -x

# Por app específico
pytest apps/users/
pytest apps/clients/tests/
pytest apps/projects/tests/

# Con cobertura
pytest --cov=apps --cov-report=term-missing

# En paralelo (requiere pytest-xdist)
pytest -n auto
```

### Tests existentes

| App | Tests | Cobertura |
|-----|-------|-----------|
| users | registro, login, perfil, token refresh | alta |
| clients | CRUD + tags + summary + activity + notes | media |
| projects | CRUD, pipeline, mover entre etapas | media |
| time_entries | start, stop, running, duración | media |
| proposals | CRUD + items + mark_sent + accept + PDF | media |
| invoices | CRUD + items + tax + mark_sent + mark_paid + from_project + PDF | media |
| auto_rules | — | **sin tests** |
| dashboard | — | **sin tests** |
| search | — | **sin tests** |

73 tests en total (+29 desde la auditoría inicial).

### Tests faltantes (prioridad)

1. **Dashboard** — stats, revenue chart, top clients, etc.
2. **Search** — búsqueda global, filtros
3. **Auto rules** — triggers por evento

## Frontend

Sin tests de frontend por ahora. Pendiente:

- Tests de componentes con Vitest + React Testing Library
- Tests de stores (Zustand)
- Tests de integración de API mocking

## CI

GitHub Actions ejecuta automáticamente:

1. `pip install -r requirements.txt`
2. `python manage.py check`
3. `python manage.py makemigrations --check`
4. `pytest -x -q --tb=short`
5. `npm ci && npm run lint && npm run build`
