# Arquitectura

## Backend (Django + DRF)

### Estructura de apps

```
backend/apps/
├── users/          # auth, registro, perfil
├── clients/        # CRUD clientes, tags, activity log, notas, resumen
├── projects/       # CRUD proyectos, pipeline Kanban, mover entre etapas
├── tasks/          # CRUD tareas por cliente/proyecto
├── time_entries/   # time tracking: start, stop, running, filtros
├── proposals/      # propuestas con items, PDF export
├── invoices/       # facturación numerada, items, PDF export
├── auto_rules/     # reglas automáticas configurables
├── dashboard/      # endpoints de solo lectura: stats, charts
└── search/         # búsqueda global unificada
```

### Patrones

- **Viewsets** — `ModelViewSet` con `permissions.IsAuthenticated` por defecto
- **Serializers** — `ModelSerializer` con validación en el serializer
- **URLs** — routers de DRF (`DefaultRouter`) bajo `/api/v1/`
- **Autenticación** — JWT (SimpleJWT), token refresh automático
- **Permisos** — base `IsAuthenticated`; objetos propios vía `get_queryset` con `request.user`
- **Paginación** — `PageNumberPagination`, 20 items por página
- **Tests** — pytest + pytest-django + factory-boy, base de datos PostgreSQL

### Sistema de settings

Tres archivos que heredan de `base.py`:

- `base.py` — config compartida, PostgreSQL por defecto, JWT, CORS, Celery
- `dev.py` — SQLite, DEBUG=True, logging verbose
- `prod.py` — PostgreSQL, DEBUG=False, SSL, HSTS, logging mínimo

### PDF generation

WeasyPrint para propuestas e invoices. Templates HTML renderizados con contexto Django, convertidos a PDF en memoria.

---

## Frontend (React + Vite)

### Estructura

```
frontend/src/
├── api/          # módulos Axios por dominio (clients, projects, dashboard)
│   └── client.js # instancia Axios con interceptor JWT + refresh
├── components/   # UI components reutilizables
│   ├── pipeline/ # PipelineColumn, ProjectCard
│   └── timer/    # TimerWidget
├── pages/        # cada ruta principal (Dashboard, Clients, Pipeline, etc.)
├── store/        # Zustand stores (authStore, timerStore)
├── App.jsx       # Router (react-router-dom v6) + layout principal
├── main.jsx      # Entry point
└── index.css     # TailwindCSS + estilos base
```

### Manejo de estado

- **Zustand** con persistencia en localStorage para auth (token, user)
- **Zustand** + persist para timer (runningEntry, elapsedSeconds)
- **Estado local** (`useState`) para datos de página (clientes, proyectos)

### API calls

Cada página usa un módulo `api/<domain>.js` que exporta un objeto con métodos Axios. La instancia base (`client.js`) tiene un interceptor que agrega el token JWT y otro que hace refresh automático en 401.

### Drag & Drop

`@dnd-kit/core` + `@dnd-kit/sortable` para el pipeline Kanban. `DndContext` envuelve las columnas, `useSortable` en cada card permite arrastrar entre etapas.

### Timer

TimerWidget en el header (visible en todas las páginas). Usa `useTimerStore` que maneja el estado del timer con intervalos de 1 segundo. Start/stop vía API REST.
