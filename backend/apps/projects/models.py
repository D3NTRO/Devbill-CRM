import uuid
from django.db import models
from django.conf import settings


class PipelineStage(models.TextChoices):
    LEAD = 'LEAD', 'Lead'
    PROPOSAL = 'PROPOSAL', 'Propuesta'
    NEGOTIATION = 'NEGOTIATION', 'Negociación'
    ACTIVE = 'ACTIVE', 'Activo'
    COMPLETED = 'COMPLETED', 'Completado'
    BILLED = 'BILLED', 'Facturado'


class LeadSource(models.TextChoices):
    REFERRAL = 'REFERRAL', 'Referido'
    LINKEDIN = 'LINKEDIN', 'LinkedIn'
    WEBSITE = 'WEBSITE', 'Sitio web'
    COLD_OUTREACH = 'COLD_OUTREACH', 'Contacto frío'
    OTHER = 'OTHER', 'Otro'


class ProjectStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', 'Activo'
    PAUSED = 'PAUSED', 'Pausado'
    COMPLETED = 'COMPLETED', 'Completado'
    CANCELLED = 'CANCELLED', 'Cancelado'


class BillingType(models.TextChoices):
    HOURLY = 'HOURLY', 'Por hora'
    FIXED = 'FIXED', 'Precio fijo'


class Project(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.CASCADE,
        related_name='projects'
    )
    freelancer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='projects'
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    billing_type = models.CharField(
        max_length=10,
        choices=BillingType.choices,
        default=BillingType.HOURLY
    )
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    fixed_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    estimated_hours = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=ProjectStatus.choices,
        default=ProjectStatus.ACTIVE
    )
    pipeline_stage = models.CharField(
        max_length=20,
        choices=PipelineStage.choices,
        default=PipelineStage.LEAD
    )
    column_order = models.IntegerField(default=0)
    estimated_value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    lead_source = models.CharField(
        max_length=20,
        choices=LeadSource.choices,
        blank=True
    )
    color = models.CharField(max_length=7, default='#6366F1')
    start_date = models.DateField(null=True, blank=True)
    deadline = models.DateField(null=True, blank=True)
    created_at = models.AutoCreatedField()
    updated_at = models.AutoNowField()

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    @property
    def total_hours(self):
        from apps.time_entries.models import TimeEntry
        result = TimeEntry.objects.filter(project=self).aggregate(
            total=models.Sum('duration_minutes')
        )
        return round((result['total'] or 0) / 60, 2)

    @property
    def total_invoiced(self):
        from apps.invoices.models import Invoice
        result = Invoice.objects.filter(
            items__project=self
        ).aggregate(total=models.Sum('total'))
        return float(result['total'] or 0)