# DevBill - Freelancer CRM

Plataforma CRM profesional para freelancers construida con React 18 + Django 5.

## Características

- Pipeline visual de clientes (Kanban)
- Gestión de proyectos
- Time tracking con timer en vivo
- Propuestas en PDF
- Facturación
- Automatizaciones configurables (AutoRules)
- Feed de actividad unificado por cliente

## Stack

- **Backend:** Django 5 + DRF + SimpleJWT + Celery + PostgreSQL
- **Frontend:** React 18 + Vite + Zustand + TailwindCSS
- **Infra:** Docker Compose + GitHub Actions

##快速开始 (Quick Start)

```bash
# Clonar el repo
git clone <repo-url>
cd devbill

# Copiar variables de entorno
cp .env.example backend/.env

# Iniciar con Docker
docker compose up -d

# Backend: http://localhost:8000
# Frontend: http://localhost:5173
# API Docs: http://localhost:8000/api/docs/
```

## Desarrollo Local

```bash
# Backend
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend
cd frontend
npm install
npm run dev
```

## Licencia

MIT