# Roadmap

## Estado actual

Proyecto funcional. Todas las rutas frontend implementadas, 126 tests backend pasando, 0 warnings lint, build OK.

## Implementado

### Backend (126 tests)
- [x] Auth: registro, login, JWT refresh (users)
- [x] Clientes: CRUD, tags, actividad, notas, resumen (clients)
- [x] Proyectos: CRUD, pipeline, arrastrar entre etapas (projects)
- [x] Time tracking: start, stop, running, filtros (time_entries)
- [x] Tareas: CRUD por cliente/proyecto (tasks)
- [x] Propuestas: CRUD, items, flujo estados (proposals)
- [x] Facturas: CRUD, items, impuestos, flujo pagos, from_project (invoices)
- [x] Dashboard: stats, revenue chart, top clients, pipeline, win rate, avg payment days, billable ratio (dashboard — 11 tests)
- [x] Búsqueda global: unificada entre entidades, scoping por usuario (search — 6 tests)
- [ ] Reglas automáticas: triggers por evento (auto_rules — sin tests)

### Frontend (13 páginas)
- [x] Login / Register
- [x] Dashboard: stat cards reales, revenue chart (Recharts), pipeline bars, top clients, overdue invoices, KPIs, loading/error/empty states
- [x] Clientes: lista, buscar, crear/editar/eliminar
- [x] ClientDetail: perfil, tags, activity log, notas
- [x] Proyectos: lista con filtros/búsqueda, crear/editar/eliminar modal
- [x] ProjectDetail: resumen, horas no facturadas, time entries, editar/eliminar
- [x] Pipeline Kanban: drag & drop entre etapas
- [x] Tareas: checklist con toggle rápido, prioridad, fecha límite, CRUD
- [x] Time Tracker: timer panel, historial, entrada manual, filtros, totales
- [x] Propuestas: tabla con filtros, items dinámicos, flujo estados
- [x] Facturas: tabla con búsqueda/filtros, items + impuestos, flujo pagos, overdue highlight
- [x] NotFound 404

### UI/UX
- [x] Sidebar con NavLink active state e íconos
- [x] Skeleton loading en todas las páginas
- [x] Estados vacíos y de error
- [x] Modal de confirmación para eliminar (consistente)
- [x] Botones disabled/loading durante operaciones
- [x] Badges de estado y prioridad
- [x] Componentes reutilizables: LoadingState, EmptyState, ErrorState
- [x] Layout responsive: sidebar colapsable en mobile
- [x] TimerWidget en header (visible en todas las páginas)

### Infraestructura
- [x] Docker Compose (backend + frontend + PostgreSQL + Redis)
- [x] CI: GitHub Actions (lint, build, test con PostgreSQL)
- [x] Settings: dev (SQLite), prod (PostgreSQL), base compartida
- [x] Seed data: comando `seed_demo` con usuario + datos de prueba
- [x] ESLint max-warnings=0

## Pendiente

### Backend
- [ ] Tests para auto_rules app

### Frontend
- [ ] Error boundaries (React)
- [ ] Tests de componentes (Vitest + RTL)
- [ ] Página de detalle para tareas/propuestas/facturas (ahora son solo listas)

### Calidad
- [ ] Tests de integración frontend
- [ ] E2E tests (Playwright/Cypress)
- [ ] Dark mode — infraestructura lista (`darkMode: 'class'`, CSS vars `--bg`/`--surface`/`--text`/`--border`, `body` usa `var(--bg)`). Pendiente: migrar utility classes (`.card`, `.btn`, `.input`, bg-*, text-*, border-*) a CSS vars + agregar toggle persistido en localStorage + revisar 13 páginas con `dark:` variants.
- [ ] i18n (opcional)
- [ ] Optimización de bundles — JS >500 kB, agregar route-level code splitting con `React.lazy()`

### Infraestructura
- [ ] Deploy a producción (Railway / Fly.io / VPS)
- [ ] Sentry / monitoreo de errores
- [ ] Coverage mínimo en CI

## Prioridades

1. **Tests auto_rules** — única app backend sin tests
2. **Frontend tests** — Vitest + RTL para componentes críticos
3. **Error boundaries** — evitar pantalla blanca en producción
4. **Deploy** — llevar a producción real
5. **E2E** — Playwright para flujos críticos (login → crear factura → pagar)
