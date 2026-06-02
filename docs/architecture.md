# Arquitectura

## Backend (Django + DRF)

### Estructura de apps

```
backend/apps/
├── users/          # auth, registro, perfil (6 tests)
├── clients/        # CRUD clientes, tags, activity log, notas (24 tests)
├── projects/       # CRUD proyectos, pipeline Kanban (10 tests)
├── tasks/          # CRUD tareas por cliente/proyecto (13 tests)
├── time_entries/   # time tracking: start, stop, running, filtros (26 tests)
├── proposals/      # propuestas con items, PDF, flujo estados (15 tests)
├── invoices/       # facturación numerada, items, impuestos, PDF (17 tests)
├── auto_rules/     # reglas automáticas configurables (pendiente tests)
├── dashboard/      # endpoints de solo lectura: stats, charts (11 tests)
└── search/         # búsqueda global unificada (6 tests)
```

### Patrones

- **Viewsets** — `ModelViewSet` con `permissions.IsAuthenticated` por defecto
- **Serializers** — `ModelSerializer`; un serializer separado para creación cuando hay nested items (ej: `InvoiceCreateSerializer`)
- **URLs** — routers de DRF (`DefaultRouter`) bajo `/api/v1/`
- **Autenticación** — JWT (SimpleJWT), token refresh automático
- **Permisos** — base `IsAuthenticated`; objetos propios vía `get_queryset` con `request.user`
- **Paginación** — `PageNumberPagination`, 20 items por página
- **Tests** — pytest + pytest-django, fixtures compartidas en conftest.py

### Sistema de settings

Tres archivos que heredan de `base.py`:
- `base.py` — config compartida, PostgreSQL por defecto, JWT, CORS, Celery
- `dev.py` — SQLite, DEBUG=True, logging verbose
- `prod.py` — PostgreSQL, DEBUG=False, SSL, HSTS

### PDF generation (WeasyPrint)

WeasyPrint para propuestas e invoices. Templates HTML renderizados con contexto Django. En desarrollo local (Windows sin GTK) los endpoints PDF retornan metadata JSON en lugar del PDF real.

---

## Frontend (React + Vite)

### Estructura

```
frontend/src/
├── api/            # 9 módulos Axios (clients, projects, dashboard, invoices, etc.)
│   └── client.js   # instancia Axios con interceptor JWT + refresh
├── components/     # UI components reutilizables
│   ├── pipeline/   # PipelineColumn, ProjectCard
│   ├── timer/      # TimerWidget (header)
│   └── ui/         # LoadingState, EmptyState, ErrorState
├── pages/          # 13 rutas (Dashboard, Clients, Projects, Tasks, etc.)
├── store/          # Zustand (authStore, timerStore)
├── App.jsx         # Router react-router-dom v6 + layout responsive
├── main.jsx        # Entry point
└── index.css       # TailwindCSS + clases utilitarias (btn, card, skeleton, input)
```

### Manejo de estado

- **Zustand** con persistencia en localStorage para auth (token, user)
- **Zustand** + persist para timer (runningEntry, elapsedSeconds) — compartido entre TimerWidget y TimeTracker
- **Estado local** (`useState`) para datos de página (clientes, proyectos, etc.)

### API calls

Cada página usa un módulo `api/<domain>.js` con métodos Axios. La instancia base (`client.js`) tiene un interceptor que agrega el token JWT y otro que hace refresh automático en 401.

### Routing

`react-router-dom v6` con `BrowserRouter`:
- Layout principal (`AppLayout`) envuelve todas las rutas protegidas
- Sidebar con `NavLink` y active state
- Responsive: sidebar colapsable con toggle en mobile (hamburger menu)
- Ruta `*` → NotFound

### Drag & Drop

`@dnd-kit/core` + `@dnd-kit/sortable` para pipeline Kanban. `DndContext` envuelve columnas, `useSortable` en cada card.

### Timer

TimerWidget en header (visible todas las páginas). `useTimerStore` maneja timing con intervalos de 1 segundo. Start/stop vía API REST.

### Gráficos

Recharts para dashboard: `BarChart` para revenue chart, barras horizontales para pipeline value.

### Estilos

- TailwindCSS 3
- Clases utilitarias personalizadas en `index.css`: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.input`, `.card`, `.skeleton`
- Sin dependencia de shadcn/ui ni Material UI

---

## Decisiones Técnicas

| Decisión | Razón |
|----------|-------|
| Read-only items en InvoiceSerializer | DRF no soporta nested writable serializers por defecto; se manejan en el viewset |
| PDF info en vez de blob en frontend | WeasyPrint requiere GTK; en desarrollo local se retorna metadata |
| Promise.allSettled en Dashboard | Cada sección del dashboard se carga independientemente; si una falla las demás siguen funcionando |
| Zustand en vez de Redux | Menos boilerplate, built-in persist, suficiente para el alcance del proyecto |
| Sin tests de frontend (por ahora) | Prioridad fue funcionalidad completa sobre cobertura frontend |
