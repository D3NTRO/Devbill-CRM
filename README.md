# DevBill - Freelancer CRM

**CRM profesional para freelancers** — gestión de clientes, proyectos, pipeline Kanban, time tracking, propuestas y facturación.

> **Estado: desarrollo activo.** Funcionalidades core implementadas. Algunas páginas frontend y tests pendientes. Ver [docs/roadmap.md](docs/roadmap.md).

![Python](https://img.shields.io/badge/python-3.11-blue)
![Django](https://img.shields.io/badge/django-5.0-092E20)
![DRF](https://img.shields.io/badge/drf-3.15-red)
![React](https://img.shields.io/badge/react-18-61DAFB)
![Vite](https://img.shields.io/badge/vite-5-646CFF)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Características

- **Pipeline Kanban** — arrastra proyectos entre etapas (Lead → Propuesta → Negociación → Activo → Completado → Facturado)
- **Gestión de Clientes** — CRUD completo con tags, registro de actividad y contactos
- **Proyectos** — facturación por hora o precio fijo, plazos y etapas
- **Time Tracking** — timer en vivo con start/stop, duración automática y control de facturables
- **Propuestas** — creación con ítems, valores y estado (Borrador/Enviada/Aceptada/Rechazada), exportación PDF
- **Facturación** — notas numeradas automáticamente, ítems, impuestos, estado de pago, PDF
- **Dashboard** — gráficos de ingresos, clientes top, tasa de conversión, vencidos, valor del pipeline
- **Reglas Automáticas** — automatizaciones configurables por evento
- **Tareas** — por cliente/proyecto con prioridad y fecha límite
- **Búsqueda Global** — búsqueda unificada en todas las entidades
- **Feed de Actividades** — timeline por cliente con todas las interacciones

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
| PDF | WeasyPrint |
| Contenedores | Docker, Docker Compose |
| CI | GitHub Actions |
| Tests | pytest, pytest-django, factory-boy |
| Lint | ESLint (frontend), flake8 + black + isort (backend) |

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
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate
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

---

## Estructura del Proyecto

```
devbill/
├── backend/
│   ├── apps/
│   │   ├── users/           # Autenticación + perfil freelancer
│   │   ├── clients/         # Clientes + tags + activity log
│   │   ├── projects/        # Proyectos + pipeline Kanban
│   │   ├── time_entries/    # Time tracking
│   │   ├── tasks/           # Gestión de tareas
│   │   ├── proposals/       # Propuestas + PDF
│   │   ├── invoices/        # Facturación + PDF
│   │   ├── auto_rules/      # Reglas automáticas
│   │   ├── dashboard/       # Analytics / endpoints de lectura
│   │   └── search/          # Búsqueda global
│   ├── config/              # Settings Django (dev, production)
│   ├── conftest.py          # Fixtures compartidas (pytest)
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── api/             # Módulos Axios por dominio
│   │   ├── components/      # Componentes UI
│   │   ├── pages/           # Páginas (Dashboard, Clients, Pipeline, etc.)
│   │   ├── store/           # Stores Zustand (auth, timer)
│   │   ├── App.jsx          # Router + layout
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

| Endpoint | Descripción |
|----------|------------|
| `auth/login/` | Login → JWT tokens |
| `auth/register/` | Registro de nuevo usuario |
| `clients/` | CRUD clientes |
| `clients/tags/` | Gestionar tags |
| `projects/` | CRUD proyectos |
| `projects/pipeline/` | Estado del pipeline |
| `time-entries/start/` | Iniciar timer |
| `time-entries/stop/` | Detener timer |
| `time-entries/running/` | Timer activo |
| `proposals/` | CRUD propuestas |
| `invoices/` | CRUD facturas |
| `dashboard/stats/` | Métricas del dashboard |
| `search/?q=` | Búsqueda global |

---

## Tests

```bash
cd backend
pytest -v              # todos los tests
pytest -x              # se detiene en el primer error
pytest --cov=apps      # con cobertura
pytest -n auto         # paralelo (requiere pytest-xdist)
```

Suite backend con cobertura smoke/funcional para auth, clients, projects, time entries, proposals e invoices (73 tests).

---

## CI/CD

GitHub Actions ejecuta en cada push:
- **Frontend:** `npm ci` → `npm run lint` → `npm run build`
- **Backend:** `pip install` → `check` → `makemigrations --check` → `pytest`

---

## Licencia

MIT
