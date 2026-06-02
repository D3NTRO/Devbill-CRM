from django.contrib import admin
from .models import Proposal


@admin.register(Proposal)
class ProposalAdmin(admin.ModelAdmin):
    list_display = ['title', 'project', 'status', 'total', 'valid_until', 'created_at']
    list_filter = ['status']
    search_fields = ['title', 'project__name']
