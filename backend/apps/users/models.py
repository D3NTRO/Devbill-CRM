from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    pass


class FreelancerProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='freelancer_profile'
    )
    profession = models.CharField(max_length=100, blank=True)
    default_currency = models.CharField(max_length=3, default='USD')
    default_hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    invoice_prefix = models.CharField(max_length=10, default='INV')
    logo_url = models.URLField(blank=True)
    address = models.TextField(blank=True)
    tax_id = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} - {self.profession}"