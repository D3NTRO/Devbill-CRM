# PROGRESS.md — DevBill
> Denis y su compañero abren este archivo al inicio de cada sesión.
> Claude Code lo actualiza al finalizar cada sesión. No editar manualmente.

---

## 🚦 Estado general del proyecto

| Módulo | Estado | Dev | Notas |
|--------|--------|-----|-------|
| Repo + Docker setup | ✅ | Denis | |
| Auth + FreelancerProfile | ✅ | Denis | JWT completo |
| Client + Tag | ✅ | Denis | + signals ActivityLog |
| ActivityLog + signals | ✅ | Denis | automático en created/stage change |
| Project + PipelineStage | ✅ | Denis | 6 stages + signals |
| Pipeline Kanban (frontend) | ✅ | Denis | @dnd-kit drag & drop |
| Task + reminders Celery | ⏳ Pendiente | — | |
| ClientDetail (perfil unificado) | ✅ | Denis | + feed actividad |
| TimeEntry + timer | ✅ | Denis | start/stop/running endpoints |
| TimerWidget global (Zustand) | ✅ | Denis | en TopBar siempre visible |
| Proposal + PDF WeasyPrint | ✅ | Denis | /accept/ mueve a ACTIVE |
| Búsqueda global /search/ | ✅ | Denis | icontains en Client/Project/Task |
| Invoice + PDF | ✅ | Denis | auto-number, from-project |
| Dashboard analytics | ✅ | Denis | stats + revenue chart + top clients |
| AutoRule + Celery evaluator | ⏳ Pendiente | — | |
| TimeEntry + timer | ⏳ Pendiente | — | Feature estrella |
| TimerWidget global (Zustand) | ⏳ Pendiente | — | |
| Proposal + PDF WeasyPrint | ⏳ Pendiente | — | |
| Búsqueda global /search/ | ⏳ Pendiente | — | |
| Invoice + PDF | ⏳ Pendiente | — | |
| AutoRule + Celery evaluator | ⏳ Pendiente | — | |
| Dashboard analytics | ⏳ Pendiente | — | |
| Tests (pytest + factory_boy) | ⏳ Pendiente | — | Target 75% |
| GitHub Actions CI | ⏳ Pendiente | — | |
| Deploy Railway | ⏳ Pendiente | — | |
| Seed script demo | ⏳ Pendiente | — | |
| README + GIFs | ⏳ Pendiente | — | |

**Leyenda:** ✅ Completo · 🔄 En progreso · ⏳ Pendiente · 🐛 Bug activo · ⛔ Bloqueado

---

## ➡️ PRÓXIMO PASO (leer esto primero)

> Claude Code actualiza esta sección al final de cada sesión.

```
SESIÓN 5 — ARRANCAR CON:
1. Task CRUD + Celery reminder task
2. GitHub Actions CI (lint + pytest)
3. Deploy Railway
4. Seed script demo
5. README + GIFs
```

---

## 🐛 Bugs activos

| # | Descripción | Archivo | Prioridad | Desde |
|---|-------------|---------|-----------|-------|
| — | Sin bugs registrados | — | — | — |

---

## 📅 Historial de sesiones

> Claude Code añade una entrada al FINAL de cada sesión. Nunca borrar entradas anteriores.

---
**Fecha:** 2026-04-19 05:30
**Dev:** Denis
**Sesión #:** 1
**Duración:** 0.5h

#### ✅ Completado en esta sesión
- Crear repo GitHub: https://github.com/D3NTRO/Devbill-CRM
- Estructura de carpetas completa según CLAUDE.md
- docker-compose.yml con Django + PostgreSQL + Redis + Celery + Frontend
- Django config (base/dev/prod settings)
- 10 apps Django creadas (users, clients, projects, tasks, time_entries, proposals, invoices, auto_rules, dashboard, search)
- User model personalizado + FreelancerProfile
- Auth JWT completo (register, login, refresh, me endpoints)
- Frontend React 18 + Vite + TailwindCSS
- Pages: Login, Register, Dashboard básicos
- Zustand authStore con persistencia
- Primer commit: "chore(init): project structure - Django + React + Docker + JWT auth"

#### 🔄 Quedó a medias
- Ninguno (Sprint 1 completo)

#### 🐛 Bugs encontrados
- Ninguno

#### 📝 Decisiones técnicas tomadas
- Usar PostgreSQL en lugar de SQLite para producción real
- JWT con access + refresh tokens
- Zustand para estado global del frontend

#### ⚠️ Deuda técnica anotada
- Falta crear modelos de Client, Project, Task, etc.
- Frontend básico, sin páginas de verdad aún

#### ➡️ PRÓXIMO PASO exacto para la siguiente sesión
- Crear Client model + Tag model + ActivityLog
- Crear Project model con pipeline_stage
- Crear serializers y viewsets
- Frontend: Clients page

---

**Fecha:** 2026-04-19 05:45
**Dev:** Denis
**Sesión #:** 2
**Duración:** 0.5h

#### ✅ Completado en esta sesión
- Client model (UUID, name, email, company, tags M2M, currency, tax_id, notes)
- Tag model (name, color, freelancer FK)
- ActivityLog model con signals automáticos (CLIENT_CREATED, STAGE_CHANGED)
- Project model con pipeline_stage (LEAD → PROPOSAL → NEGOTIATION → ACTIVE → COMPLETED → BILLED)
- ClientViewSet + TagViewSet con todos los endpoints
- ProjectViewSet + PipelineViewSet con move/reorder
- Frontend: Clients page (lista + modal crear), ClientDetail (resumen + actividad + proyectos)
- API client.js con interceptors para JWT
- Task + TimeEntry modelos creados

#### 🔄 Quedó a medias
- Pipeline Kanban frontend (no implementado aún)
- Timer start/stop endpoints

#### 🐛 Bugs encontrados
- Ninguno

#### 📝 Decisiones técnicas tomadas
- ActivityLog via Django signals, nunca en views
- UUIDs como primary keys en todos los modelos de negocio
- Signals en apps.py con ready()

#### ⚠️ Deuda técnica anotada
- Falta serializers de TimeEntry
- Falta TimerWidget en frontend

#### ➡️ PRÓXIMO PASO exacto para la siguiente sesión
- Pipeline Kanban con @dnd-kit
- TimeEntry start/stop endpoints
- TimerWidget Zustand + TopBar

---

**Fecha:** 2026-04-19 06:00
**Dev:** Denis
**Sesión #:** 3
**Duración:** 0.5h

#### ✅ Completado en esta sesión
- Pipeline Kanban con @dnd-kit (6 columnas: LEAD → PROPOSAL → NEGOTIATION → ACTIVE → COMPLETED → BILLED)
- PipelineColumn + ProjectCard componentes con drag & drop
- TimeEntry model con freelancer FK
- TimeEntrySerializer con project_name, client_name
- TimeEntryViewSet con endpoints: /start/, /stop/, /running/
- Backend valida que no haya otro timer activo
- timerStore Zustand con startTimer, stopTimer, fetchRunning, startInterval
- TimerWidget en TopBar con selector de proyecto + descripción
- Timer persiste entre navegaciones y se restaura al cargar

#### 🔄 Quedó a medias
- Ninguno (Sprint 3 completo)

#### 🐛 Bugs encontrados
- Ninguno

#### 📝 Decisiones técnicas tomadas
- Solo 1 timer activo a la vez (validación backend)
- Interval se limpia al desmontar o detener timer
- Zustand persist para guardar estado del timer

#### ⚠️ Deuda técnica anotada
- Falta Proposal + Invoice models
- Falta búsqueda global

#### ➡️ PRÓXIMO PASO exacto para la siguiente sesión
- Proposal model + PDF WeasyPrint
- Invoice model + PDF

---

**Fecha:** 2026-04-19 06:30
**Dev:** Denis
**Sesión #:** 4
**Duración:** 0.5h

#### ✅ Completado en esta sesión
- Proposal model (title, description, items JSON, total, valid_until, status)
- ProposalSerializer con cálculo automático de total
- ProposalViewSet con /pdf/, /mark_sent/, /accept/ (mueve proyecto a ACTIVE)
- WeasyPrint template para propuesta PDF
- Invoice model (number auto INV-2026-0001, tax_rate, subtotal, total)
- InvoiceItem model (description, quantity, unit_price, amount, project FK)
- InvoiceViewSet con /pdf/, /mark_sent/, /mark_paid/, /from-project/
- WeasyPrint template para factura PDF
- SearchView con búsqueda global icontains en Client/Project/Task/Proposal/Invoice
- Dashboard endpoints: stats, revenue-chart, overdue-invoices, top-clients, pipeline-value, win-rate, avg-payment-days, billable-ratio
- Frontend APIs: proposals, invoices, dashboard

#### 🔄 Quedó a medias
- Ninguno (Sprint 4 completo)

#### 🐛 Bugs encontrados
- Ninguno

#### 📝 Decisiones técnicas tomadas
- Invoice number auto-generado con prefix desde FreelancerProfile
- mark_paid marca entradas de tiempo como invoiced
- from-project crea factura desde time entries facturables

#### ⚠️ Deuda técnica anotada
- Falta Task + reminders Celery
- Falta AutoRule + Celery evaluator

#### ➡️ PRÓXIMO PASO exacto para la siguiente sesión
- Task CRUD + Celery reminder
- GitHub Actions CI
- Deploy Railway
- Seed script demo

---

### [TEMPLATE — Claude Code copia y llena este bloque]
```
---
**Fecha:** YYYY-MM-DD HH:MM
**Dev:** Denis | Compañero | Ambos
**Sesión #:** N
**Duración:** Xh

#### ✅ Completado en esta sesión
-

#### 🔄 Quedó a medias (exactamente dónde)
-

#### 🐛 Bugs encontrados
-

#### 📝 Decisiones técnicas tomadas
-

#### ⚠️ Deuda técnica anotada
-

#### ➡️ PRÓXIMO PASO exacto para la siguiente sesión
-
---
```

---

## 🔑 Variables de entorno

```bash
# backend/.env
SECRET_KEY=cambiar-en-produccion
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DB_NAME=devbill
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=db
DB_PORT=5432
REDIS_URL=redis://redis:6379/0
FRONTEND_URL=http://localhost:5173

# frontend/.env
VITE_API_URL=http://localhost:8000/api/v1
```

---

## 🚀 Cómo correr el proyecto

```bash
# Opción 1 — Docker (recomendado, todo en un comando)
git clone [repo-url]
cd devbill
cp .env.example backend/.env
docker compose up -d
# Backend en :8000, Frontend en :5173

# Opción 2 — Local (para desarrollo activo)
# Terminal 1 — Backend
cd backend
python -m venv venv && source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Terminal 2 — Frontend
cd frontend && npm install && npm run dev

# Terminal 3 — Celery worker
cd backend && celery -A config worker -l info

# Terminal 4 — Celery beat (tareas programadas)
cd backend && celery -A config beat -l info

# Datos de demo (una vez deployado)
python manage.py seed_demo
# Usuario: demo@devbill.app | Password: demo1234
```

---

## 💡 Ideas anotadas para después

> Anotar aquí — no implementar hasta tener el MVP completo

- [ ] Integración Stripe (pagos dentro de DevBill)
- [ ] Notificaciones por email con Resend
- [ ] Sync con Google Calendar
- [ ] App móvil React Native (el API ya está preparado)
- [ ] White-label para micro-agencias
- [ ] Exportación CSV compatible con Excel/QuickBooks
- [ ] Modo oscuro / claro persistente
- [ ] PWA (Progressive Web App) para uso offline básico
- [ ] Integración WhatsApp Business API (alta demanda Latam)
- [ ] Score de salud del cliente (paga bien, paga tarde, etc.)

---

## 🔗 Links importantes

| Recurso | URL |
|---------|-----|
| Repo GitHub | https://github.com/D3NTRO/Devbill-CRM |
| Demo pública | [por deployar] |
| Railway project | [por crear] |
| Swagger/OpenAPI | /api/docs/ (local) |
| Análisis estratégico | DevBill_Analisis_Estrategico_Elite.docx |

---

*Mantenido por Claude Code. No editar manualmente excepto la sección de Ideas.*
*Última actualización automática: inicio del proyecto*
