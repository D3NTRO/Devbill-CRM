# Testing

## Backend

### Stack
- **pytest** + `pytest-django`
- Base de datos: PostgreSQL (CI) / SQLite (local)
- Fixtures compartidas en `backend/conftest.py`

### Cómo ejecutar

```bash
cd backend

# Todos los tests (126)
pytest

# Verboso
pytest -v

# Detener en primer error
pytest -x

# Por app
pytest apps/users/
pytest apps/clients/tests/
pytest apps/dashboard/tests/

# Con cobertura
pytest --cov=apps --cov-report=term-missing
```

### Tests existentes

| App | Tests | Funcionalidad |
|-----|-------|---------------|
| users | 6 | registro, login, refresh, perfil, me |
| clients | 24 | CRUD, tags, summary, activity log, notes |
| projects | 10 | CRUD, pipeline, mover entre etapas |
| time_entries | 26 | start, stop, running, filtros, fixtures |
| tasks | 13 | CRUD |
| proposals | 15 | CRUD, items, mark_sent, accept, PDF |
| invoices | 17 | CRUD, items, tax, mark_sent, mark_paid, from_project, PDF, update metadata, update items |
| dashboard | 11 | stats, revenue chart, overdue invoices, top clients, pipeline, win rate, avg payment days, billable ratio |
| search | 6 | búsqueda global, scoping, empty query |
| auto_rules | 0 | **sin tests** |
| **Total** | **126** | +17 dashboard/search desde auditoría final |

### Tests faltantes (prioridad)

1. **auto_rules** — triggers por evento (única app sin testear)

## Frontend

Sin tests de frontend por ahora. Pendiente:
- Tests de componentes con Vitest + React Testing Library
- Tests de stores (Zustand: authStore, timerStore)
- Tests de integración de API mocking

## CI

GitHub Actions ejecuta automáticamente:
1. `pip install -r requirements.txt`
2. `python manage.py check`
3. `python manage.py makemigrations --check`
4. `pytest -x -q --tb=short`
5. `npm ci && npm run lint && npm run build`
