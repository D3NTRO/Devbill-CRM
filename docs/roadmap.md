# Roadmap

## Estado actual

Proyecto en desarrollo activo. Funcionalidades core implementadas, CI pasando, 73 tests backend, frontend lint estricto.

## Implementado

### Backend
- [x] Auth: registro, login, JWT refresh
- [x] Clientes: CRUD, tags, actividad, notas, resumen
- [x] Proyectos: CRUD, pipeline, arrastrar entre etapas
- [x] Time tracking: start, stop, running, filtros
- [x] Tareas: CRUD por cliente/proyecto
- [x] Propuestas: CRUD, items, PDF export
- [x] Facturas: CRUD, items, PDF export, estados de pago
- [x] Dashboard: stats, revenue chart, top clients
- [x] Reglas automáticas: triggers por evento
- [x] Búsqueda global: unificada entre entidades

### Frontend
- [x] Login / Register
- [x] Dashboard: layout + stat cards con datos reales desde API
- [x] Clientes: lista, crear, detalle con actividad y resumen
- [x] Pipeline Kanban: drag & drop entre etapas
- [x] Timer: widget en header, start/stop
- [x] Layout: sidebar con NavLink active state, íconos, skeleton loading
- [x] Estados vacíos con skeletons en Dashboard, Clientes, ClientDetail, Pipeline
- [x] Botones con estado disabled consistente

### Backend Tests (73 tests)
- [x] Auth: registro, login, refresh, me
- [x] Clientes: CRUD, tags, summary, activity, notes
- [x] Proyectos: CRUD, pipeline
- [x] Time entries: start, stop, running
- [x] Propuestas: CRUD, items, PDF
- [x] Facturas: CRUD, items, totals, PDF

### Infraestructura
- [x] Docker Compose (backend + frontend + PostgreSQL + Redis)
- [x] CI: GitHub Actions (lint, build, test con PostgreSQL)
- [x] Settings: dev (SQLite) y prod (PostgreSQL)
- [x] Seed data: demo user + datos de prueba

## Pendiente

### Frontend (páginas faltantes)
- [ ] Página de listado de proyectos
- [ ] Página de tareas
- [ ] Página de time tracker (vista completa)
- [ ] Página de propuestas
- [ ] Página de facturas
- [ ] Editar / eliminar clientes desde la UI
- [ ] Editar proyectos

### Backend (tests faltantes)
- [ ] Tests para auto_rules
- [ ] Tests para dashboard endpoints
- [ ] Tests para search endpoint

### Calidad
- [ ] Error boundaries en frontend
- [ ] Responsive design en páginas existentes
- [ ] Tests de integración frontend
- [ ] E2E tests
- [ ] Dark mode

## Prioridades

1. **Páginas frontend faltantes** — listado de proyectos, propuestas, facturas
2. **CRUD faltante en UI** — editar/eliminar clientes, editar proyectos
3. **QA backend** — tests para dashboard, auto_rules y search
4. **Calidad** — error boundaries, responsive, dark mode
5. **CI/CD** — coverage, lint backend automático
