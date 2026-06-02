# DevBill - Freelancer CRM

**CRM profesional para freelancers** — gestión de clientes, proyectos, pipeline Kanban, time tracking, tareas, propuestas y facturación.

> **Estado: funcional.** Todas las páginas frontend implementadas, 126 tests backend pasando, 0 warnings lint. Pendientes: E2E, dark mode, deploy producción.

![Python](https://img.shields.io/badge/python-3.11-blue)
![Django](https://img.shields.io/badge/django-5.0-092E20)
![DRF](https://img.shields.io/badge/drf-3.15-red)
![React](https://img.shields.io/badge/react-18-61DAFB)
![Vite](https://img.shields.io/badge/vite-5-646CFF)
![Tests](https://img.shields.io/badge/tests-126-green)

---

## Características

- **Dashboard** — métricas en vivo, gráfico de ingresos, pipeline, top clientes, vencidos, KPIs (win rate, pago promedio, ratio facturable)
- **Pipeline Kanban** — arrastra proyectos entre etapas (Lead → Propuesta → Negociación → Activo → Completado → Facturado)
- **Gestión de Clientes** — CRUD completo con tags, registro de actividad y notas
- **Proyectos** — facturación por hora o precio fijo, plazos y etapas
- **Time Tracking** — timer en vivo con start/stop, filtros, entradas facturables
- **Tareas** — checklist con prioridad, fecha límite, estado rápido
- **Propuestas** — creación con ítems dinámicos, subtotal/total auto, flujo Borrador → Enviada → Aceptada
- **Facturación** — numeración automática, ítems, impuestos, flujo Borrador → Enviada → Pagada
- **Reglas Automáticas** — automatizaciones configurables por evento
- **Búsqueda Global** — búsqueda unificada en clientes, proyectos, tareas, propuestas, facturas
- **Feed de Actividades** — timeline por cliente

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Python 3.11, Django 5.2, Django REST Framework 3.x |
| Autenticación | JWT (SimpleJWT) |
| API Docs | drf-spectacular (Swagger UI) |
| Base de datos | PostgreSQL 16 (producción), SQLite (desarrollo) |
| Cache / Cola | Redis 7 + Celery 5 |
| Frontend | React 18, Vite 5, TailwindCSS 3 |
| Estado | Zustand 4 (con persist) |
| Gráficos | Recharts |
| Drag & Drop | @dnd-kit |
| HTTP | Axios 1 (interceptor JWT con auto-refresh) |
| Rutas | react-router-dom 6 |
| PDF | WeasyPrint (backend), previsualización metadata (frontend local) |
| Contenedores | Docker, Docker Compose |
| CI | GitHub Actions |
| Tests | pytest, pytest-django, factory-boy |
| Lint | ESLint (frontend, max-warnings=0), flake8 + black + isort (backend) |

---

## Inicio Rápido

### Docker (recomendado)

```bash
git clone <repo-url>
cd devbill
cp .env.example backend/.env
docker compose up -d
```

- **Backend:** http://localhost:8000
- **Frontend:** http://localhost:5173
- **API Docs:** http://localhost:8000/api/docs/

### Desarrollo Local

**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Seed Data
```bash
cd backend
python manage.py seed_demo
```
Crea un usuario demo `demo@devbill.app / demo1234` con datos de prueba.

---

## Tests

```bash
cd backend
pytest -v              # 126 tests
pytest -x              # stop on first error
pytest --cov=apps      # con cobertura
```

Frontend (verificación):
```bash
cd frontend
npm run lint           # 0 warnings (max-warnings=0)
npm run build          # build production
```

---

## Estructura

```
devbill/
├── backend/
│   ├── apps/
│   │   ├── users/           # Auth + perfil freelancer
│   │   ├── clients/         # Clientes + tags + activity log
│   │   ├── projects/        # Proyectos + pipeline Kanban
│   │   ├── time_entries/    # Time tracking
│   │   ├── tasks/           # Tareas
│   │   ├── proposals/       # Propuestas + PDF
│   │   ├── invoices/        # Facturación + PDF
│   │   ├── auto_rules/      # Reglas automáticas (pendiente tests)
│   │   ├── dashboard/       # Analytics / endpoints lectura
│   │   └── search/          # Búsqueda global
│   ├── config/              # Settings Django (base/dev/prod)
│   ├── conftest.py          # Fixtures pytest compartidas
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios por dominio (9 módulos)
│   │   ├── components/      # UI (LoadingState, EmptyState, ErrorState, TimerWidget, Pipeline)
│   │   ├── pages/           # 13 páginas (Dashboard, Clients, Projects, etc.)
│   │   ├── store/           # Zustand (auth, timer)
│   │   ├── App.jsx          # Router react-router-dom v6 + layout responsive
│   │   └── main.jsx         # Entry point
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml
├── .env.example
└── .github/workflows/ci.yml
```

---

## API (visión general)

Todos los endpoints bajo `/api/v1/`. Documentación interactiva en `/api/docs/`.

### Auth
- `POST auth/login/`, `POST auth/register/`, `POST auth/refresh/`

### Core
- `clients/` — CRUD + tags + activity + notes
- `projects/` — CRUD + pipeline move
- `projects/<id>/move-stage/` — drag & drop

### Time Tracking
- `time-entries/start/`, `time-entries/stop/`, `time-entries/running/`
- `time-entries/` — CRUD con filtros (project, date, billable)

### Tasks
- `tasks/` — CRUD

### Proposals
- `proposals/` — CRUD + mark_sent + accept

### Invoices
- `invoices/` — CRUD + mark_sent + mark_paid + from_project + pdf

### Dashboard (read-only)
- `dashboard/stats/` — clientes activos, proyectos, horas, revenue, pendientes
- `dashboard/revenue-chart/` — ingresos mensuales (12 meses)
- `dashboard/overdue-invoices/` — facturas vencidas
- `dashboard/top-clients/` — top 10 por facturación
- `dashboard/pipeline-value/` — valor por etapa
- `dashboard/win-rate/` — tasa de conversión de propuestas
- `dashboard/avg-payment-days/` — días promedio de pago
- `dashboard/billable-ratio/` — ratio horas facturables

### Search
- `search/?q=` — búsqueda global

---

## Pendientes Reales

Ver [docs/roadmap.md](docs/roadmap.md) para lista completa. Resumen:
- Tests para `auto_rules` app
- Tests de frontend (Vitest + RTL)
- Error boundaries en frontend
- Dark mode
- E2E tests
- Deploy a producción

---

## CI/CD

GitHub Actions ejecuta en cada push:
- **Frontend:** `npm ci` → `npm run lint` → `npm run build`
- **Backend:** `pip install` → `check` → `makemigrations --check` → `pytest -x -q`

---

## Licencia

MIT
