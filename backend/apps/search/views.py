from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q


class SearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        
        if not query:
            return Response({'results': []})
        
        from apps.clients.models import Client
        from apps.projects.models import Project
        from apps.tasks.models import Task
        from apps.proposals.models import Proposal
        from apps.invoices.models import Invoice
        
        freelancer = request.user
        
        clients = Client.objects.filter(
            freelancer=freelancer
        ).filter(
            Q(name__icontains=query) |
            Q(email__icontains=query) |
            Q(company__icontains=query)
        )[:10]
        
        projects = Project.objects.filter(
            freelancer=freelancer
        ).filter(
            Q(name__icontains=query) |
            Q(description__icontains=query)
        ).select_related('client')[:10]
        
        tasks = Task.objects.filter(
            freelancer=freelancer
        ).filter(
            Q(title__icontains=query)
        ).select_related('client', 'project')[:10]
        
        proposals = Proposal.objects.filter(
            project__freelancer=freelancer
        ).filter(
            Q(title__icontains=query) |
            Q(description__icontains=query)
        ).select_related('project', 'project__client')[:10]
        
        invoices = Invoice.objects.filter(
            client__freelancer=freelancer
        ).filter(
            Q(number__icontains=query)
        ).select_related('client')[:10]
        
        results = []
        
        for client in clients:
            results.append({
                'type': 'client',
                'id': str(client.id),
                'title': client.name,
                'subtitle': client.company or client.email,
                'url': f'/clients/{client.id}'
            })
        
        for project in projects:
            results.append({
                'type': 'project',
                'id': str(project.id),
                'title': project.name,
                'subtitle': project.client.name,
                'url': f'/projects/{project.id}'
            })
        
        for task in tasks:
            results.append({
                'type': 'task',
                'id': str(task.id),
                'title': task.title,
                'subtitle': f'{task.get_status_display()} - {task.get_priority_display()}',
                'url': f'/tasks/{task.id}'
            })
        
        for proposal in proposals:
            results.append({
                'type': 'proposal',
                'id': str(proposal.id),
                'title': proposal.title,
                'subtitle': f'{proposal.project.name} - {proposal.get_status_display()}',
                'url': f'/proposals/{proposal.id}'
            })
        
        for invoice in invoices:
            results.append({
                'type': 'invoice',
                'id': str(invoice.id),
                'title': invoice.number,
                'subtitle': f'{invoice.client.name} - {invoice.get_status_display()}',
                'url': f'/invoices/{invoice.id}'
            })
        
        return Response({'results': results[:50]})