from django.contrib import admin
from .models import TimeEntry


@admin.register(TimeEntry)
class TimeEntryAdmin(admin.ModelAdmin):
    list_display = ['project', 'freelancer', 'date', 'duration_minutes', 'is_billable', 'invoiced']
    list_filter = ['is_billable', 'invoiced', 'date']
    search_fields = ['description', 'project__name']
