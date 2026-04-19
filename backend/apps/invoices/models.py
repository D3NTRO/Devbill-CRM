import uuid
from django.db import models
from django.conf import settings


class InvoiceStatus(models.TextChoices):
    DRAFT = 'DRAFT', 'Borrador'
    SENT = 'SENT', 'Enviada'
    PAID = 'PAID', 'Pagada'
    OVERDUE = 'OVERDUE', 'Vencida'
    CANCELLED = 'CANCELLED', 'Cancelada'


class Invoice(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.PROTECT,
        related_name='invoices'
    )
    number = models.CharField(max_length=20)
    status = models.CharField(
        max_length=20,
        choices=InvoiceStatus.choices,
        default=InvoiceStatus.DRAFT
    )
    issue_date = models.DateField()
    due_date = models.DateField()
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    notes = models.TextField(blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['client', 'number']

    def __str__(self):
        return self.number

    def calculate_totals(self):
        self.tax_amount = self.subtotal * (self.tax_rate / 100)
        self.total = self.subtotal + self.tax_amount

    def save(self, *args, **kwargs):
        if not self.number:
            freelancer = self.client.freelancer
            from apps.users.models import FreelancerProfile
            profile = FreelancerProfile.objects.filter(user=freelancer).first()
            prefix = profile.invoice_prefix if profile else 'INV'
            
            last_invoice = Invoice.objects.filter(
                client__freelancer=freelancer
            ).order_by('-created_at').first()
            
            if last_invoice:
                try:
                    last_num = int(last_invoice.number.split('-')[-1])
                    new_num = last_num + 1
                except:
                    new_num = 1
            else:
                new_num = 1
            
            year = self.issue_date.year
            self.number = f'{prefix}-{year}-{str(new_num).zfill(4)}'
        
        self.calculate_totals()
        super().save(*args, **kwargs)


class InvoiceItem(models.Model):
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name='items'
    )
    description = models.CharField(max_length=300)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invoice_items'
    )
    order = models.IntegerField(default=0)

    def save(self, *args, **kwargs):
        self.amount = self.quantity * self.unit_price
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.description} - {self.amount}'