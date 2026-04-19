# PROGRESS.md — DevBill
> Denis y su compañero abren este archivo al inicio de cada sesión.
> Claude Code lo actualiza al finalizar cada sesión. No editar manualmente.

---

## 🚦 Estado general del proyecto

| Módulo | Estado | Dev | Notas |
|--------|--------|-----|-------|
| Repo + Docker setup | ✅ | Denis | |
| Auth + FreelancerProfile | ✅ | Denis | JWT completo |
| Client + Tag | ⏳ Pendiente | — | |
| ActivityLog + signals | ⏳ Pendiente | — | |
| Project + PipelineStage | ⏳ Pendiente | — | |
| Pipeline Kanban (frontend) | ⏳ Pendiente | — | |
| Task + reminders Celery | ⏳ Pendiente | — | |
| ClientDetail (perfil unificado) | ⏳ Pendiente | — | |
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
SESIÓN 2 — ARRANCAR CON:
1. Client model (UUID, name, email, company, tags M2M)
2. Tag model (name, color, freelancer FK)
3. ActivityLog model + Django signals automáticos
4. Project model (pipeline_stage, column_order, lead_source)
5. Client CRUD endpoints + serializers
6. Frontend: Clients page + ClientDetail
7. Commit y push
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
