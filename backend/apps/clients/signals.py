from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Client, ActivityLog


@receiver(post_save, sender=Client)
def create_client_activity(sender, instance, created, **kwargs):
    if created:
        ActivityLog.objects.create(
            client=instance,
            event_type='CLIENT_CREATED',
            description=f'Cliente "{instance.name}" creado',
            metadata={'name': instance.name, 'email': instance.email}
        )


@receiver(post_delete, sender=Client)
def log_client_deletion(sender, instance, **kwargs):
    pass