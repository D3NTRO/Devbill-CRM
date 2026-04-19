from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Proposal
from apps.clients.models import ActivityLog


@receiver(post_save, sender=Proposal)
def create_proposal_activity(sender, instance, created, **kwargs):
    if created:
        ActivityLog.objects.create(
            client=instance.project.client,
            event_type='PROPOSAL_SENT' if instance.status == 'SENT' else 'PROJECT_CREATED',
            description=f'Propuesta "{instance.title}" creada',
            metadata={
                'proposal_id': str(instance.id),
                'title': instance.title,
                'total': str(instance.total),
                'status': instance.status
            }
        )