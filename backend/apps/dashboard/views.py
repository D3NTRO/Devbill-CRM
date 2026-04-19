from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Avg
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.clients.models import Client
        from apps.projects.models import Project
        from apps.time_entries.models import TimeEntry
        from apps.invoices.models import Invoice
        from apps.tasks.models import Task
        
        user = request.user
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        clients_count = Client.objects.filter(freelancer=user, is_active=True).count()
        projects_count = Project.objects.filter(freelancer=user).count()
        
        hours_this_month = TimeEntry.objects.filter(
            freelancer=user,
            started_at__gte=month_start
        ).aggregate(total=Sum('duration_minutes'))['total'] or 0
        hours_this_month = round(hours_this_month / 60, 1)
        
        revenue_this_month = Invoice.objects.filter(
            client__freelancer=user,
            status='PAID',
            paid_at__gte=month_start
        ).aggregate(total=Sum('total'))['total'] or 0
        
        pending_invoices = Invoice.objects.filter(
            client__freelancer=user,
            status__in=['SENT', 'OVERDUE']
        ).count()
        
        tasks_pending = Task.objects.filter(
            freelancer=user,
            status__in=['PENDING', 'IN_PROGRESS']
        ).count()
        
        return Response({
            'clients': clients_count,
            'projects': projects_count,
            'hours': hours_this_month,
            'revenue': float(revenue_this_month),
            'pending_invoices': pending_invoices,
            'tasks_pending': tasks_pending,
        })


class RevenueChartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.invoices.models import Invoice
        
        user = request.user
        now = timezone.now()
        twelve_months_ago = now - timedelta(days=365)
        
        invoices = Invoice.objects.filter(
            client__freelancer=user,
            status='PAID',
            paid_at__gte=twelve_months_ago
        ).annotate(
            month=TruncMonth('paid_at')
        ).values('month').annotate(
            total=Sum('total')
        ).order_by('month')
        
        chart_data = []
        for inv in invoices:
            chart_data.append({
                'month': inv['month'].strftime('%Y-%m'),
                'total': float(inv['total'])
            })
        
        return Response(chart_data)


class OverdueInvoicesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.invoices.models import Invoice
        
        now = timezone.now().date()
        
        invoices = Invoice.objects.filter(
            client__freelancer=request.user,
            status='SENT',
            due_date__lt=now
        ).select_related('client')[:10]
        
        data = [{
            'id': str(inv.id),
            'number': inv.number,
            'client': inv.client.name,
            'total': float(inv.total),
            'due_date': inv.due_date.isoformat(),
            'days_overdue': (now - inv.due_date).days
        } for inv in invoices]
        
        return Response(data)


class TopClientsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.invoices.models import Invoice
        
        invoices = Invoice.objects.filter(
            client__freelancer=request.user,
            status='PAID'
        ).values('client__id', 'client__name').annotate(
            total=Sum('total'),
            projects=Count('client__projects')
        ).order_by('-total')[:10]
        
        data = [{
            'id': str(inv['client__id']),
            'name': inv['client__name'],
            'total': float(inv['total']),
            'projects': inv['projects']
        } for inv in invoices]
        
        return Response(data)


class PipelineValueView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.projects.models import Project, PipelineStage
        
        projects = Project.objects.filter(
            freelancer=request.user
        ).values('pipeline_stage').annotate(
            count=Count('id'),
            total_value=Sum('estimated_value')
        )
        
        stages = {stage.value: {'label': stage.label, 'count': 0, 'value': 0} for stage in PipelineStage}
        
        for p in projects:
            if p['pipeline_stage'] in stages:
                stages[p['pipeline_stage']]['count'] = p['count']
                stages[p['pipeline_stage']]['value'] = float(p['total_value'] or 0)
        
        return Response(stages)


class WinRateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.projects.models import Project
        from apps.proposals.models import Proposal
        
        total_proposals = Proposal.objects.filter(
            project__freelancer=request.user
        ).exclude(status='DRAFT').count()
        
        accepted_proposals = Proposal.objects.filter(
            project__freelancer=request.user,
            status='ACCEPTED'
        ).count()
        
        win_rate = (accepted_proposals / total_proposals * 100) if total_proposals > 0 else 0
        
        return Response({
            'total': total_proposals,
            'accepted': accepted_proposals,
            'rate': round(win_rate, 1)
        })


class AvgPaymentDaysView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.invoices.models import Invoice
        
        invoices = Invoice.objects.filter(
            client__freelancer=request.user,
            status='PAID',
            paid_at__isnull=False
        )
        
        total_days = 0
        count = 0
        
        for inv in invoices:
            days = (inv.paid_at.date() - inv.issue_date).days
            total_days += days
            count += 1
        
        avg_days = round(total_days / count) if count > 0 else 0
        
        return Response({
            'average_days': avg_days,
            'invoices_count': count
        })


class BillableRatioView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.time_entries.models import TimeEntry
        
        total_minutes = TimeEntry.objects.filter(
            freelancer=request.user
        ).aggregate(total=Sum('duration_minutes'))['total'] or 0
        
        billable_minutes = TimeEntry.objects.filter(
            freelancer=request.user,
            is_billable=True
        ).aggregate(total=Sum('duration_minutes'))['total'] or 0
        
        ratio = (billable_minutes / total_minutes * 100) if total_minutes > 0 else 0
        
        return Response({
            'total_hours': round(total_minutes / 60, 1),
            'billable_hours': round(billable_minutes / 60, 1),
            'ratio': round(ratio, 1)
        })