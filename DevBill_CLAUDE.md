# CLAUDE.md — DevBill Master Context
> Fuente de verdad del proyecto para Claude Code y cualquier agente IA.
> REGLA #1: Leer PROGRESS.md COMPLETO al inicio de cada sesión. Sin excepción.
> REGLA #2: Actualizar PROGRESS.md y este archivo al FINALIZAR cada sesión.
> REGLA #3: Nunca romper la rama main. Siempre ramas de feature + PR.

---

## 🎯 Identidad del proyecto

**DevBill** es un CRM profesional para freelancers que integra en una sola plataforma:
pipeline visual de clientes, gestión de proyectos, time tracking con timer en vivo,
propuestas en PDF, facturación, automatizaciones (AutoRules) y un feed de actividad
unificado por cliente. Inspirado funcionalmente en Kommo CRM, adaptado al flujo
real del freelancer independiente.

**Repositorio:** [por definir — crear en GitHub antes del primer commit]
**Devs:** Denis (D3NTRO) + compañero
**Stack:** React 18 + Vite · Django 5 + DRF · PostgreSQL · Redis · Celery · WeasyPrint · Docker
**Dominio objetivo:** devbill.app

---

## 🏗️ Arquitectura del sistema

### Stack completo

```
Backend:   Django 5 · DRF · SimpleJWT · Celery · Redis · WeasyPrint · drf-spectacular
Frontend:  React 18 · Vite · Zustand · @dnd-kit · Recharts · TailwindCSS · dayjs
Infra:     PostgreSQL 16 · Redis 7 · Docker Compose · Nginx · GitHub Actions
Testing:   pytest-django · factory_boy · ESLint
```

### Estructura de carpetas

```
devbill/
├── CLAUDE.md                   ← ESTE ARCHIVO
├── PROGRESS.md                 ← estado en tiempo real
├── OPENCODE_MASTER_PROMPT.md   ← prompt para arrancar sesiones
├── docker-compose.yml
├── docker-compose.prod.yml
├── nginx/default.conf
├── .env.example
├── .github/workflows/ci.yml
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── dev.py
│   │   │   └── prod.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── celery.py
│   ├── apps/
│   │   ├── users/              ← User + FreelancerProfile
│   │   ├── clients/            ← Client + Tag + ActivityLog
│   │   ├── projects/           ← Project + PipelineStage
│   │   ├── tasks/              ← Task (vinculadas a cliente/proyecto)
│   │   ├── time_entries/       ← TimeEntry + timer start/stop
│   │   ├── proposals/          ← Proposal + PDF WeasyPrint
│   │   ├── invoices/           ← Invoice + InvoiceItem + PDF
│   │   ├── auto_rules/         ← AutoRule + Celery evaluator
│   │   ├── dashboard/          ← stats endpoints
│   │   └── search/             ← búsqueda global
│   ├── templates/
│   │   ├── proposals/
│   │   │   └── proposal.html   ← template PDF propuesta
│   │   └── invoices/
│   │       └── invoice.html    ← template PDF factura
│   └── tests/
└── frontend/
    └── src/
        ├── api/
        │   ├── client.js       ← axios + JWT interceptor
        │   ├── clients.js
        │   ├── projects.js
        │   ├── timeEntries.js
        │   ├── proposals.js
        │   ├── invoices.js
        │   ├── tasks.js
        │   └── dashboard.js
        ├── store/
        │   ├── authStore.js    ← Zustand: user, tokens
        │   ├── timerStore.js   ← Zustand: timer global (CRÍTICO)
        │   └── uiStore.js      ← Zustand: modales, sidebar
        ├── pages/
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── Dashboard.jsx
        │   ├── Pipeline.jsx    ← Kanban de proyectos por etapa
        │   ├── Clients.jsx
        │   ├── ClientDetail.jsx ← perfil unificado con feed
        │   ├── Projects.jsx
        │   ├── ProjectDetail.jsx
        │   ├── TimeTracker.jsx
        │   ├── Tasks.jsx
        │   ├── Proposals.jsx
        │   ├── ProposalDetail.jsx
        │   ├── Invoices.jsx
        │   ├── InvoiceDetail.jsx
        │   ├── Analytics.jsx
        │   └── Settings.jsx
        ├── components/
        │   ├── layout/
        │   │   ├── Sidebar.jsx
        │   │   └── TopBar.jsx  ← contiene TimerWidget siempre visible
        │   ├── pipeline/
        │   │   ├── PipelineBoard.jsx
        │   │   └── ProjectCard.jsx
        │   ├── clients/
        │   ├── timer/
        │   │   └── TimerWidget.jsx ← contador live en topbar
        │   ├── invoices/
        │   ├── proposals/
        │   └── ui/
        └── hooks/
```

---

## 📊 Modelos de Django

```python
# ── USERS ──────────────────────────────────────────────
class FreelancerProfile(Model):
    user = OneToOneField(User, on_delete=CASCADE)
    profession = CharField(max_length=100)         # "Dev", "Diseñador", "Contador"...
    default_currency = CharField(max_length=3, default='USD')
    default_hourly_rate = DecimalField()
    invoice_prefix = CharField(max_length=10, default='INV')
    logo_url = URLField(blank=True)
    address = TextField(blank=True)
    tax_id = CharField(max_length=50, blank=True)

# ── CLIENTS ────────────────────────────────────────────
class Tag(Model):
    name = CharField(max_length=50)
    color = CharField(max_length=7)               # hex color
    freelancer = FK(User, on_delete=CASCADE)

class Client(Model):
    id = UUIDField(primary_key=True)
    freelancer = FK(User, on_delete=CASCADE)
    name = CharField(max_length=200)
    email = EmailField()
    phone = CharField(max_length=30, blank=True)
    company = CharField(max_length=200, blank=True)
    address = TextField(blank=True)
    currency = CharField(max_length=3, default='USD')
    tax_id = CharField(max_length=50, blank=True)
    notes = TextField(blank=True)
    is_active = BooleanField(default=True)
    tags = ManyToManyField(Tag, blank=True)
    created_at = DateTimeField(auto_now_add=True)

class ActivityLog(Model):
    client = FK(Client, on_delete=CASCADE)
    event_type = CharField(choices=[
        'NOTE_ADDED', 'INVOICE_SENT', 'INVOICE_PAID',
        'TASK_DONE', 'STAGE_CHANGED', 'TIMER_ENTRY',
        'PROPOSAL_SENT', 'PROPOSAL_ACCEPTED'
    ])
    description = CharField(max_length=300)
    metadata = JSONField(default=dict)             # datos extras del evento
    created_at = DateTimeField(auto_now_add=True)
    # Se crea AUTOMÁTICAMENTE via Django signals — nunca manualmente

# ── PROJECTS ───────────────────────────────────────────
class Project(Model):
    id = UUIDField(primary_key=True)
    client = FK(Client, on_delete=CASCADE)
    name = CharField(max_length=200)
    description = TextField(blank=True)
    billing_type = CharField(choices=['HOURLY', 'FIXED'])
    hourly_rate = DecimalField(null=True)
    fixed_price = DecimalField(null=True)
    estimated_hours = DecimalField(null=True)
    status = CharField(choices=['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'])
    # Pipeline stage (Kommo-like)
    pipeline_stage = CharField(choices=[
        'LEAD', 'PROPOSAL', 'NEGOTIATION', 'ACTIVE', 'COMPLETED', 'BILLED'
    ], default='LEAD')
    column_order = IntegerField(default=0)         # posición en columna Kanban
    estimated_value = DecimalField(null=True)      # valor estimado del deal
    lead_source = CharField(choices=[
        'REFERRAL', 'LINKEDIN', 'WEBSITE', 'COLD_OUTREACH', 'OTHER'
    ], blank=True)
    color = CharField(max_length=7, default='#6366F1')
    start_date = DateField(null=True)
    deadline = DateField(null=True)
    created_at = DateTimeField(auto_now_add=True)

# ── TASKS ──────────────────────────────────────────────
class Task(Model):
    id = UUIDField(primary_key=True)
    freelancer = FK(User, on_delete=CASCADE)
    title = CharField(max_length=200)
    client = FK(Client, null=True, on_delete=SET_NULL)
    project = FK(Project, null=True, on_delete=SET_NULL)
    due_date = DateTimeField(null=True)
    status = CharField(choices=['PENDING', 'IN_PROGRESS', 'DONE', 'CANCELLED'])
    priority = CharField(choices=['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    reminder_sent = BooleanField(default=False)
    created_at = DateTimeField(auto_now_add=True)

# ── TIME ENTRIES ───────────────────────────────────────
class TimeEntry(Model):
    id = UUIDField(primary_key=True)
    project = FK(Project, on_delete=CASCADE)
    description = CharField(max_length=300)
    started_at = DateTimeField()
    ended_at = DateTimeField(null=True)            # null = timer corriendo ahora
    duration_minutes = IntegerField(null=True)     # calculado al parar
    is_billable = BooleanField(default=True)
    invoiced = BooleanField(default=False)
    date = DateField()                             # auto desde started_at

# ── PROPOSALS ──────────────────────────────────────────
class Proposal(Model):
    id = UUIDField(primary_key=True)
    project = FK(Project, on_delete=CASCADE)
    title = CharField(max_length=200)
    description = TextField()                      # Markdown
    items = JSONField()                            # [{name, qty, unit_price, amount}]
    total = DecimalField()
    valid_until = DateField()
    status = CharField(choices=['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'])
    notes = TextField(blank=True)
    created_at = DateTimeField(auto_now_add=True)

# ── INVOICES ───────────────────────────────────────────
class Invoice(Model):
    id = UUIDField(primary_key=True)
    client = FK(Client, on_delete=PROTECT)
    number = CharField(max_length=20)              # auto: INV-2026-001
    status = CharField(choices=['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'])
    issue_date = DateField()
    due_date = DateField()
    subtotal = DecimalField()
    tax_rate = DecimalField(default=0)
    tax_amount = DecimalField()
    total = DecimalField()
    notes = TextField(blank=True)
    paid_at = DateTimeField(null=True)

class InvoiceItem(Model):
    invoice = FK(Invoice, related_name='items', on_delete=CASCADE)
    description = CharField(max_length=300)
    quantity = DecimalField()
    unit_price = DecimalField()
    amount = DecimalField()                        # quantity × unit_price
    project = FK(Project, null=True, on_delete=SET_NULL)
    order = IntegerField()

# ── AUTO RULES ─────────────────────────────────────────
class AutoRule(Model):
    freelancer = FK(User, on_delete=CASCADE)
    name = CharField(max_length=100)
    trigger = CharField(choices=[
        'INVOICE_OVERDUE', 'PROJECT_INACTIVE',
        'STAGE_ENTERED', 'PROPOSAL_EXPIRED', 'TASK_OVERDUE'
    ])
    condition_days = IntegerField()
    action = CharField(choices=[
        'CREATE_TASK', 'SEND_NOTIFICATION',
        'MOVE_STAGE', 'CREATE_INVOICE_DRAFT'
    ])
    action_data = JSONField(default=dict)
    is_active = BooleanField(default=True)
```

---

## 🔌 Endpoints API — base: /api/v1/

```
AUTH
  POST   auth/register/           → crea User + FreelancerProfile
  POST   auth/login/
  POST   auth/refresh/
  GET    auth/me/                  → User + perfil freelancer
  PATCH  auth/me/
  DELETE auth/me/

CLIENTS
  GET/POST          clients/
  GET/PATCH/DELETE  clients/{id}/
  GET               clients/{id}/summary/       → stats totales del cliente
  GET               clients/{id}/activity/      → feed ActivityLog
  POST              clients/{id}/notes/         → nota manual al feed
  POST              clients/{id}/tags/          → asignar tags

PROJECTS + PIPELINE
  GET/POST          projects/
  GET/PATCH/DELETE  projects/{id}/
  GET               projects/{id}/time-entries/
  GET               projects/{id}/unbilled-hours/
  GET               pipeline/                   → proyectos agrupados por stage
  PATCH             pipeline/{id}/move/         → cambiar stage
  POST              pipeline/reorder/           → bulk update tras drag&drop

TASKS
  GET/POST          tasks/
  PATCH/DELETE      tasks/{id}/
  GET               tasks/today/
  GET               tasks/overdue/

TIME ENTRIES
  GET/POST          time-entries/
  PATCH/DELETE      time-entries/{id}/
  POST              time-entries/start/         → inicia timer
  POST              time-entries/stop/          → para timer, calcula duración
  GET               time-entries/running/       → timer activo actual

PROPOSALS
  GET/POST          proposals/
  PATCH             proposals/{id}/
  GET               proposals/{id}/pdf/         → descarga PDF
  POST              proposals/{id}/mark-sent/
  POST              proposals/{id}/accept/      → ACCEPTED + mueve proyecto a ACTIVE

INVOICES
  GET/POST          invoices/
  PATCH             invoices/{id}/
  GET               invoices/{id}/pdf/
  POST              invoices/{id}/mark-sent/
  POST              invoices/{id}/mark-paid/
  POST              invoices/from-project/{id}/ → factura automática de horas

DASHBOARD
  GET               dashboard/stats/
  GET               dashboard/revenue-chart/    → últimos 12 meses
  GET               dashboard/overdue-invoices/
  GET               dashboard/top-clients/
  GET               dashboard/pipeline-value/   → valor por etapa
  GET               dashboard/win-rate/
  GET               dashboard/avg-payment-days/
  GET               dashboard/billable-ratio/

AUTO RULES
  GET/POST          auto-rules/
  PATCH/DELETE      auto-rules/{id}/

SEARCH
  GET               search/?q=                  → búsqueda global
```

---

## 🗂️ Estado actual del proyecto

> ⚠️ SECCIÓN DINÁMICA — Claude Code actualiza esto en cada sesión

### Lo que está FUNCIONANDO
<!-- Claude Code actualiza esta sección -->
- [ ] (proyecto no iniciado — primer commit pendiente)

### Lo que está EN PROGRESO
<!-- Claude Code actualiza esta sección -->
- [ ] (vacío)

### BACKLOG completo (en orden de prioridad)

**Semana 1 — Base**
- [ ] Crear repo GitHub + estructura de carpetas
- [ ] Docker Compose: Django + PostgreSQL + Redis
- [ ] User model + FreelancerProfile + JWT auth
- [ ] Client model + Tag model + CRUD
- [ ] Project model + PipelineStage fields

**Semana 2 — Pipeline + Tareas + Activity**
- [ ] Pipeline Kanban (@dnd-kit) con 6 columnas
- [ ] Endpoint /pipeline/reorder/ con transaction.atomic()
- [ ] Task model + CRUD + Celery reminder
- [ ] ActivityLog + Django signals automáticos
- [ ] ClientDetail: stats cards + feed + tags

**Semana 3 — Timer + Propuestas + Búsqueda**
- [ ] TimeEntry model + /start/ /stop/ /running/
- [ ] timerStore Zustand + TimerWidget en TopBar
- [ ] Proposal model + WeasyPrint PDF
- [ ] Endpoint /proposals/{id}/accept/ → mueve a ACTIVE
- [ ] Búsqueda global /search/?q= con PostgreSQL icontains

**Semana 4 — Facturas + Dashboard + AutoRules**
- [ ] Invoice + InvoiceItem + WeasyPrint PDF
- [ ] Endpoint /invoices/from-project/{id}/
- [ ] Celery: check_overdue_invoices nightly
- [ ] AutoRule model + evaluator Celery task
- [ ] Dashboard analytics completo con Recharts

**Semana 5 — Calidad + Deploy**
- [ ] pytest-django + factory_boy (target 75% coverage)
- [ ] GitHub Actions CI (lint + tests en cada PR)
- [ ] docker-compose.prod.yml + Nginx + Gunicorn
- [ ] Seed script: manage.py seed_demo
- [ ] Deploy en Railway
- [ ] README con GIFs + badges

---

## 🤖 Instrucciones para Claude Code

### Al INICIAR cada sesión (obligatorio)
1. Leer PROGRESS.md completo — especialmente "Última sesión" y "Siguiente paso"
2. Correr diagnóstico rápido:
   ```bash
   cd backend && python manage.py check 2>&1 | head -10
   cd backend && pytest -x -q 2>&1 | tail -10
   cd frontend && npm run lint 2>&1 | tail -10
   git log --oneline -5
   ```
3. Reportar en 3 líneas qué estado encontró antes de escribir código
4. Confirmar con el dev qué módulo atacar en esta sesión

### Durante el trabajo
5. Usar sub-agentes para Backend y Frontend en paralelo cuando sea posible
6. Todo nuevo modelo Django necesita: migration + serializer + viewset + urls + tests
7. Todo nuevo endpoint necesita su permission class explícita
8. Ante decisión arquitectural → documentarla en CLAUDE.md antes de implementar
9. Django signals para ActivityLog — nunca crear ActivityLog manualmente en views
10. WeasyPrint en Docker: verificar que el Dockerfile tenga las librerías del sistema

### Al FINALIZAR cada sesión (OBLIGATORIO — sin excepción)
11. Actualizar sección "Estado actual" en CLAUDE.md
12. Añadir entrada en PROGRESS.md con el template exacto
13. Actualizar tabla de estado en PROGRESS.md
14. Commit + push:
    ```bash
    git add CLAUDE.md PROGRESS.md
    git add -A
    git commit -m "tipo(scope): descripción"
    git push origin main
    ```
15. Decir en el chat: "Sesión N finalizada. Completé X. Próximo paso: Y."

---

## 📐 Principios de escalabilidad

- Todos los IDs son UUID (portabilidad, seguridad)
- APIs stateless — JWT puro, sin sesiones de servidor
- Settings separadas: base.py / dev.py / prod.py
- WeasyPrint requiere librerías del sistema en Dockerfile:
  ```dockerfile
  RUN apt-get install -y libpango-1.0-0 libpangoft2-1.0-0 \
      libpangocairo-1.0-0 libcairo2 libffi-dev libgdk-pixbuf2.0-0
  ```
- El timerStore de Zustand persiste el timer activo entre navegaciones
  restaurando desde GET /time-entries/running/ al montar la app
- AutoRules evaluadas por Celery beat cada noche — nunca en request/response
- ActivityLog generado únicamente via Django post_save / post_delete signals

---

## 🧪 Estándares de calidad

```bash
# Backend (correr antes de cada PR)
cd backend
pytest --cov=apps --cov-report=term-missing   # target: 75%
flake8 apps/ --max-line-length=100
python manage.py check --deploy

# Frontend (correr antes de cada PR)
cd frontend
npm run lint                                   # cero warnings
npm run build                                  # build sin errores
```

---

## 📋 Convención de commits

```
feat(scope):     nueva funcionalidad
fix(scope):      corrección de bug
refactor(scope): refactor sin cambio funcional
test(scope):     tests nuevos o mejorados
docs(scope):     documentación
chore(scope):    deps, config, CI

Ejemplos reales:
feat(pipeline): add Kanban board with dnd-kit drag between stages
feat(timer): add global TimerWidget in TopBar with Zustand store
feat(invoices): add WeasyPrint PDF generation endpoint
fix(celery): fix overdue invoice detection timezone issue
test(proposals): add tests for accept flow and stage transition
```

---

## 💡 Features futuros (no implementar ahora)

- Integración Stripe para cobros dentro de DevBill
- Sync con Google Calendar (deadlines de proyectos)
- Notificaciones por email (Resend/SendGrid)
- App móvil React Native (el DRF API está listo sin cambios)
- CV/resume upload del freelancer (PDF, campo en perfil)
- White-label para micro-agencias
- Exportación contable (CSV compatible con QuickBooks)

---

*Última actualización: inicio del proyecto*
*Próxima sesión debe comenzar: git log --oneline -5 && cat PROGRESS.md*
