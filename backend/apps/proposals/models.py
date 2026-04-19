import uuid
from django.db import models
from django.conf import settings


class ProposalStatus(models.TextChoices):
    DRAFT = 'DRAFT', 'Borrador'
    SENT = 'SENT', 'Enviada'
    ACCEPTED = 'ACCEPTED', 'Aceptada'
    REJECTED = 'REJECTED', 'Rechazada'
    EXPIRED = 'EXPIRED', 'Expirada'


class Proposal(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='proposals'
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    items = models.JSONField(default=list)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    valid_until = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=ProposalStatus.choices,
        default=ProposalStatus.DRAFT
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def calculate_total(self):
        total = 0
        for item in self.items:
            total += item.get('quantity', 0) * item.get('unit_price', 0)
        self.total = total
        return total