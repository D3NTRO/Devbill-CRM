import uuid
from django.db import models
from django.conf import settings


class Tag(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default='#6366F1')
    freelancer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tags'
    )
    created_at = models.AutoCreatedField()

    class Meta:
        unique_together = ['name', 'freelancer']

    def __str__(self):
        return self.name


class Client(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    freelancer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='clients'
    )
    name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True)
    company = models.CharField(max_length=200, blank=True)
    address = models.TextField(blank=True)
    currency = models.CharField(max_length=3, default='USD')
    tax_id = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    tags = models.ManyToManyField(Tag, blank=True, related_name='clients')
    created_at = models.AutoCreatedField()
    updated_at = models.AutoNowField()

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class ActivityLog(models.Model):
    EVENT_TYPES = [
        ('NOTE_ADDED', 'Nota agregada'),
        ('INVOICE_SENT', 'Factura enviada'),
        ('INVOICE_PAID', 'Factura pagada'),
        ('TASK_DONE', 'Tarea completada'),
        ('STAGE_CHANGED', 'Etapa cambiada'),
        ('TIMER_ENTRY', 'Entrada de tiempo'),
        ('PROPOSAL_SENT', 'Propuesta enviada'),
        ('PROPOSAL_ACCEPTED', 'Propuesta aceptada'),
        ('CLIENT_CREATED', 'Cliente creado'),
        ('PROJECT_CREATED', 'Proyecto creado'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='activity_logs')
    event_type = models.CharField(max_length=30, choices=EVENT_TYPES)
    description = models.CharField(max_length=300)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.AutoCreatedField()

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.event_type} - {self.description[:50]}"