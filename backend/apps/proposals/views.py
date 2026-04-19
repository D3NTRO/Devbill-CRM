from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from weasyprint import HTML
from django.template.loader import render_to_string
from .models import Proposal
from .serializers import ProposalSerializer


class ProposalViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ProposalSerializer

    def get_queryset(self):
        return Proposal.objects.filter(project__freelancer=self.request.user).select_related('project', 'project__client')

    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        proposal = self.get_object()
        
        from apps.users.models import FreelancerProfile
        freelancer_profile = FreelancerProfile.objects.filter(user=request.user).first()
        
        html_string = render_to_string('proposals/proposal.html', {
            'proposal': proposal,
            'freelancer': freelancer_profile,
            'user': request.user,
        })
        
        pdf = HTML(string=html_string).write_pdf()
        
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="propuesta-{proposal.id}.pdf"'
        return response

    @action(detail=True, methods=['post'])
    def mark_sent(self, request, pk=None):
        proposal = self.get_object()
        proposal.status = 'SENT'
        proposal.save()
        
        from apps.clients.models import ActivityLog
        ActivityLog.objects.create(
            client=proposal.project.client,
            event_type='PROPOSAL_SENT',
            description=f'Propuesta "{proposal.title}" enviada',
            metadata={'proposal_id': str(proposal.id)}
        )
        
        return Response(ProposalSerializer(proposal).data)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        proposal = self.get_object()
        proposal.status = 'ACCEPTED'
        proposal.save()
        
        project = proposal.project
        from apps.projects.models import PipelineStage
        project.pipeline_stage = PipelineStage.ACTIVE
        project.save()
        
        from apps.clients.models import ActivityLog
        ActivityLog.objects.create(
            client=project.client,
            event_type='PROPOSAL_ACCEPTED',
            description=f'Propuesta "{proposal.title}" aceptada',
            metadata={
                'proposal_id': str(proposal.id),
                'project_id': str(project.id)
            }
        )
        
        return Response(ProposalSerializer(proposal).data)