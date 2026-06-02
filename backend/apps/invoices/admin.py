from django.contrib import admin
from .models import Invoice, InvoiceItem


class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 0


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['number', 'client', 'status', 'total', 'issue_date', 'due_date']
    list_filter = ['status']
    search_fields = ['number', 'client__name']
    inlines = [InvoiceItemInline]
