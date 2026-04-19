from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Project
from apps.clients.models import ActivityLog


@receiver(post_save, sender=Project)
def create_project_activity(sender, instance, created, **kwargs):
    if created:
        ActivityLog.objects.create(
            client=instance.client,
            event_type='PROJECT_CREATED',
            description=f'Proyecto "{instance.name}" creado',
            metadata={
                'project_id': str(instance.id),
                'name': instance.name,
                'pipeline_stage': instance.pipeline_stage
            }
        )


@receiver(pre_save, sender=Project)
def log_stage_change(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_project = Project.objects.get(pk=instance.pk)
            if old_project.pipeline_stage != instance.pipeline_stage:
                ActivityLog.objects.create(
                    client=instance.client,
                    event_type='STAGE_CHANGED',
                    description=f'Proyecto "{instance.name}" movido a {instance.get_pipeline_stage_display()}',
                    metadata={
                        'project_id': str(instance.id),
                        'old_stage': old_project.pipeline_stage,
                        'new_stage': instance.pipeline_stage
                    }
                )
        except Project.DoesNotExist:
            pass