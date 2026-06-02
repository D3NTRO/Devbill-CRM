from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from io import StringIO

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone as tz

from apps.clients.models import Client, Tag, ActivityLog
from apps.invoices.models import Invoice, InvoiceItem
from apps.projects.models import Project
from apps.proposals.models import Proposal
from apps.tasks.models import Task
from apps.time_entries.models import TimeEntry
from apps.users.models import FreelancerProfile

User = get_user_model()


DEMO_EMAIL = 'demo@devbill.app'
DEMO_PASSWORD = 'demo1234'


def _now():
    return tz.now()


def _today():
    return date.today()


class Command(BaseCommand):
    help = 'Puebla la base de datos con datos de demostración'

    def handle(self, *args, **options):
        if User.objects.filter(email=DEMO_EMAIL).exists():
            self.stdout.write(self.style.WARNING(
                'Los datos de demo ya existen. Ejecutá esto primero:\n'
                '  python manage.py reset_db  (o borrá manualmente db.sqlite3)'
            ))
            return

        with transaction.atomic():
            self._create_user()
            self._create_tags()
            self._create_clients()
            self._create_projects()
            self._create_time_entries()
            self._create_tasks()
            self._create_proposals()
            self._create_invoices()

        self.stdout.write(self.style.SUCCESS(
            f'\nDemo creado exitosamente.\n'
            f'  Email:    {DEMO_EMAIL}\n'
            f'  Password: {DEMO_PASSWORD}\n'
        ))

    # ------------------------------------------------------------------
    # User & profile
    # ------------------------------------------------------------------
    def _create_user(self):
        self.user = User.objects.create_user(
            username=DEMO_EMAIL,
            email=DEMO_EMAIL,
            password=DEMO_PASSWORD,
            first_name='Carlos',
            last_name='Mendoza',
        )
        FreelancerProfile.objects.create(
            user=self.user,
            profession='Desarrollador Full-Stack',
            default_currency='USD',
            default_hourly_rate=Decimal('75.00'),
            invoice_prefix='CM',
            address='Av. Principal 123, Ciudad de México',
            tax_id='CME-850101-ABC',
        )
        self.stdout.write('  OK Usuario demo creado')

    # ------------------------------------------------------------------
    # Tags
    # ------------------------------------------------------------------
    def _create_tags(self):
        self.tags = {}
        for name, color in [
            ('VIP', '#FFD700'),
            ('Tech', '#6366F1'),
            ('Design', '#EC4899'),
            ('Marketing', '#10B981'),
            ('Startup', '#F59E0B'),
            ('Enterprise', '#EF4444'),
        ]:
            tag = Tag.objects.create(
                name=name,
                color=color,
                freelancer=self.user,
            )
            self.tags[name] = tag
        self.stdout.write('  OK Tags creados')

    # ------------------------------------------------------------------
    # Clients
    # ------------------------------------------------------------------
    def _create_clients(self):
        clients_data = [
            {
                'name': 'Ana García',
                'email': 'ana@techsolve.com',
                'phone': '+52 55 1234 5678',
                'company': 'TechSolve MX',
                'currency': 'MXN',
                'tags': ['VIP', 'Tech', 'Startup'],
            },
            {
                'name': 'Roberto Lima',
                'email': 'roberto@creastudio.co',
                'phone': '+1 305 555 0142',
                'company': 'Crea Studio',
                'currency': 'USD',
                'tags': ['Design', 'Startup'],
            },
            {
                'name': 'María Torres',
                'email': 'mtorres@novuscorp.com',
                'phone': '+52 81 2345 6789',
                'company': 'Novus Corp',
                'currency': 'MXN',
                'tags': ['Enterprise'],
            },
            {
                'name': 'James Wilson',
                'email': 'james@greenleaf.io',
                'phone': '+1 650 555 0198',
                'company': 'GreenLeaf Analytics',
                'currency': 'USD',
                'tags': ['Tech', 'Startup'],
            },
            {
                'name': 'Laura Betancourt',
                'email': 'laura@socialwave.com',
                'phone': '+57 1 234 5678',
                'company': 'SocialWave Media',
                'currency': 'COP',
                'tags': ['Marketing', 'VIP'],
            },
        ]
        self.clients = []
        for data in clients_data:
            tag_names = data.pop('tags')
            client = Client.objects.create(
                freelancer=self.user,
                **data,
            )
            client.tags.set([self.tags[name] for name in tag_names])
            ActivityLog.objects.create(
                client=client,
                event_type='CLIENT_CREATED',
                description=f'Cliente {client.name} creado vía seed',
            )
            self.clients.append(client)
        self.stdout.write('  OK Clientes creados')

    # ------------------------------------------------------------------
    # Projects
    # ------------------------------------------------------------------
    def _create_projects(self):
        projects_data = [
            {
                'client': self.clients[0],
                'name': 'Rediseño plataforma e-learning',
                'description': 'Migración de UI legacy a React + Tailwind. '
                               'Incluye dashboard, perfil de usuario y módulo de cursos.',
                'billing_type': 'HOURLY',
                'hourly_rate': Decimal('80.00'),
                'estimated_hours': Decimal('120'),
                'pipeline_stage': 'ACTIVE',
                'status': 'ACTIVE',
                'estimated_value': Decimal('9600.00'),
                'lead_source': 'REFERRAL',
                'color': '#6366F1',
                'start_date': _today() - timedelta(days=45),
                'deadline': _today() + timedelta(days=30),
            },
            {
                'client': self.clients[0],
                'name': 'Landing page corporativa',
                'description': 'Landing page con formulario de contacto, '
                               'sección de precios y blog.',
                'billing_type': 'FIXED',
                'fixed_price': Decimal('3200.00'),
                'estimated_hours': Decimal('40'),
                'pipeline_stage': 'PROPOSAL',
                'status': 'ACTIVE',
                'estimated_value': Decimal('3200.00'),
                'lead_source': 'WEBSITE',
                'color': '#8B5CF6',
                'start_date': _today() + timedelta(days=7),
                'deadline': _today() + timedelta(days=37),
            },
            {
                'client': self.clients[1],
                'name': 'Sistema de reservas online',
                'description': 'Plataforma de reservas con calendario interactivo, '
                               'pasarela de pagos y panel administrativo.',
                'billing_type': 'HOURLY',
                'hourly_rate': Decimal('90.00'),
                'estimated_hours': Decimal('200'),
                'pipeline_stage': 'NEGOTIATION',
                'status': 'ACTIVE',
                'estimated_value': Decimal('18000.00'),
                'lead_source': 'LINKEDIN',
                'color': '#EC4899',
                'start_date': _today() + timedelta(days=14),
                'deadline': _today() + timedelta(days=90),
            },
            {
                'client': self.clients[2],
                'name': 'Portal de proveedores',
                'description': 'Portal interno para gestión de proveedores '
                               'con autenticación, cargue de documentos y reporting.',
                'billing_type': 'FIXED',
                'fixed_price': Decimal('15000.00'),
                'estimated_hours': Decimal('180'),
                'pipeline_stage': 'LEAD',
                'status': 'ACTIVE',
                'estimated_value': Decimal('15000.00'),
                'lead_source': 'COLD_OUTREACH',
                'color': '#EF4444',
            },
            {
                'client': self.clients[3],
                'name': 'API de datos sintéticos',
                'description': 'Microservicio REST que genera datasets sintéticos '
                               'para machine learning. Documentación OpenAPI.',
                'billing_type': 'FIXED',
                'fixed_price': Decimal('8500.00'),
                'estimated_hours': Decimal('100'),
                'pipeline_stage': 'COMPLETED',
                'status': 'COMPLETED',
                'estimated_value': Decimal('8500.00'),
                'lead_source': 'REFERRAL',
                'color': '#10B981',
                'start_date': _today() - timedelta(days=90),
                'deadline': _today() - timedelta(days=5),
            },
            {
                'client': self.clients[4],
                'name': 'CRM de influencers',
                'description': 'CRM personalizado para gestión de campañas '
                               'con influencers: briefs, entregables, reportes.',
                'billing_type': 'HOURLY',
                'hourly_rate': Decimal('70.00'),
                'estimated_hours': Decimal('150'),
                'pipeline_stage': 'ACTIVE',
                'status': 'ACTIVE',
                'estimated_value': Decimal('10500.00'),
                'lead_source': 'REFERRAL',
                'color': '#F59E0B',
                'start_date': _today() - timedelta(days=20),
                'deadline': _today() + timedelta(days=50),
            },
        ]
        self.projects_list = []
        for data in projects_data:
            project = Project.objects.create(
                freelancer=self.user,
                **data,
            )
            self.projects_list.append(project)
            ActivityLog.objects.create(
                client=project.client,
                event_type='PROJECT_CREATED',
                description=f'Proyecto "{project.name}" creado',
            )
        self.stdout.write('  OK Proyectos creados')

    # ------------------------------------------------------------------
    # Time entries
    # ------------------------------------------------------------------
    def _create_time_entries(self):
        for project in self.projects_list:
            if project.pipeline_stage not in ('ACTIVE', 'COMPLETED', 'BILLED'):
                continue
            max_days = 15
            if project.start_date:
                start = datetime.combine(project.start_date, datetime.min.time()).replace(tzinfo=timezone.utc)
                max_days = min(15, (_now() - start).days)
            for days_ago in range(1, max_days + 1):
                entry_date = _today() - timedelta(days=days_ago)
                if entry_date.weekday() >= 5:
                    continue
                start_hour = 9 + (days_ago % 4)
                start = tz.make_aware(
                    datetime(entry_date.year, entry_date.month, entry_date.day, start_hour, 0)
                )
                duration = 30 + (days_ago % 4) * 15
                end = start + timedelta(minutes=duration)
                TimeEntry.objects.create(
                    project=project,
                    freelancer=self.user,
                    description=f'Trabajo en {project.name} — sesión {days_ago}',
                    started_at=start,
                    ended_at=end,
                    duration_minutes=duration,
                    is_billable=True,
                    date=entry_date,
                )
        self.stdout.write('  OK Time entries creadas')

    # ------------------------------------------------------------------
    # Tasks
    # ------------------------------------------------------------------
    def _create_tasks(self):
        p = self.projects_list
        tasks_data = [
            {
                'title': 'Definir arquitectura de componentes',
                'client': self.clients[0],
                'project': p[0],
                'priority': 'HIGH',
                'status': 'DONE',
            },
            {
                'title': 'Configurar CI/CD del frontend',
                'client': self.clients[0],
                'project': p[0],
                'priority': 'MEDIUM',
                'status': 'IN_PROGRESS',
            },
            {
                'title': 'Revisión de diseño con cliente',
                'client': self.clients[1],
                'priority': 'HIGH',
                'status': 'PENDING',
                'due_date': _now() + timedelta(days=5),
            },
            {
                'title': 'Documentar API de datos sintéticos',
                'client': self.clients[3],
                'project': p[4],
                'priority': 'LOW',
                'status': 'DONE',
            },
            {
                'title': 'Desplegar CRM en staging',
                'client': self.clients[4],
                'project': p[5],
                'priority': 'URGENT',
                'status': 'PENDING',
                'due_date': _now() + timedelta(days=1),
            },
        ]
        for data in tasks_data:
            Task.objects.create(freelancer=self.user, **data)
        self.stdout.write('  OK Tareas creadas')

    # ------------------------------------------------------------------
    # Proposals
    # ------------------------------------------------------------------
    def _create_proposals(self):
        proposal = Proposal.objects.create(
            project=self.projects_list[0],
            title='Propuesta: Rediseño plataforma e-learning — Fase 1',
            description='Propuesta para la primera fase del rediseño '
                        'que incluye dashboard, perfil y módulo de cursos.',
            items=[
                {
                    'description': 'Dashboard analítico',
                    'quantity': 1,
                    'unit_price': 3500,
                },
                {
                    'description': 'Perfil de usuario con historial',
                    'quantity': 1,
                    'unit_price': 2800,
                },
                {
                    'description': 'Módulo de cursos (frontend)',
                    'quantity': 1,
                    'unit_price': 4200,
                },
                {
                    'description': 'Pruebas y deployment',
                    'quantity': 1,
                    'unit_price': 1200,
                },
            ],
            total=Decimal('11700.00'),
            valid_until=_today() + timedelta(days=15),
            status='SENT',
        )
        ActivityLog.objects.create(
            client=proposal.project.client,
            event_type='PROPOSAL_SENT',
            description=f'Propuesta "{proposal.title}" enviada',
        )
        self.stdout.write('  OK Propuestas creadas')

    # ------------------------------------------------------------------
    # Invoices
    # ------------------------------------------------------------------
    def _create_invoices(self):
        invoice = Invoice(
            client=self.clients[0],
            status='SENT',
            issue_date=_today() - timedelta(days=15),
            due_date=_today() + timedelta(days=15),
            subtotal=Decimal('3200.00'),
            tax_rate=Decimal('16.00'),
            notes='Pago a 30 días',
        )
        invoice.save()

        InvoiceItem.objects.create(
            invoice=invoice,
            description='Desarrollo frontend (40h × $80/h)',
            quantity=Decimal('40'),
            unit_price=Decimal('80.00'),
            project=self.projects_list[0],
            order=1,
        )

        ActivityLog.objects.create(
            client=invoice.client,
            event_type='INVOICE_SENT',
            description=f'Factura {invoice.number} enviada',
        )

        paid_invoice = Invoice(
            client=self.clients[3],
            status='PAID',
            issue_date=_today() - timedelta(days=90),
            due_date=_today() - timedelta(days=60),
            subtotal=Decimal('8500.00'),
            tax_rate=Decimal('0'),
            paid_at=_now() - timedelta(days=55),
            notes='API de datos sintéticos (completado)',
        )
        paid_invoice.save()

        InvoiceItem.objects.create(
            invoice=paid_invoice,
            description='API de datos sintéticos (precio fijo)',
            quantity=Decimal('1'),
            unit_price=Decimal('8500.00'),
            project=self.projects_list[-2],
            order=1,
        )

        ActivityLog.objects.create(
            client=paid_invoice.client,
            event_type='INVOICE_SENT',
            description=f'Factura {paid_invoice.number} enviada',
        )
        ActivityLog.objects.create(
            client=paid_invoice.client,
            event_type='INVOICE_PAID',
            description=f'Factura {paid_invoice.number} pagada',
        )

        self.stdout.write('  OK Facturas creadas')
