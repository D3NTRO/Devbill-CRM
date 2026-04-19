# PROGRESS.md — DevBill
> Denis y su compañero abren este archivo al inicio de cada sesión.
> Claude Code lo actualiza al finalizar cada sesión. No editar manualmente.

---

## 🚦 Estado general del proyecto

| Módulo | Estado | Dev | Notas |
|--------|--------|-----|-------|
| Repo + Docker setup | ⏳ Pendiente | — | Primer paso absoluto |
| Auth + FreelancerProfile | ⏳ Pendiente | — | |
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
SESIÓN 1 — ARRANCAR CON:
1. Crear repo en GitHub: devbill (o devbill-crm)
2. Clonar y crear estructura base de carpetas
3. docker-compose.yml con Django + PostgreSQL + Redis
4. Crear apps Django: users, clients, projects, tasks,
   time_entries, proposals, invoices, auto_rules, dashboard, search
5. User model + FreelancerProfile + JWT auth completo
6. Primer commit y push
```

---

## 🐛 Bugs activos

| # | Descripción | Archivo | Prioridad | Desde |
|---|-------------|---------|-----------|-------|
| — | Sin bugs registrados | — | — | — |

---

## 📅 Historial de sesiones

> Claude Code añade una entrada al FINAL de cada sesión. Nunca borrar entradas anteriores.

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
| Repo GitHub | [por crear] |
| Demo pública | [por deployar] |
| Railway project | [por crear] |
| Swagger/OpenAPI | /api/docs/ (local) |
| Análisis estratégico | DevBill_Analisis_Estrategico_Elite.docx |

---

*Mantenido por Claude Code. No editar manualmente excepto la sección de Ideas.*
*Última actualización automática: inicio del proyecto*
