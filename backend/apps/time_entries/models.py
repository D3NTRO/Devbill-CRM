import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


class TimeEntry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='time_entries'
    )
    freelancer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='time_entries'
    )
    description = models.CharField(max_length=300, blank=True)
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.IntegerField(null=True, blank=True)
    is_billable = models.BooleanField(default=True)
    invoiced = models.BooleanField(default=False)
    date = models.DateField()

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.project.name} - {self.started_at}"

    def stop(self):
        self.ended_at = timezone.now()
        if self.started_at:
            duration = self.ended_at - self.started_at
            self.duration_minutes = int(duration.total_seconds() / 60)
        self.save()