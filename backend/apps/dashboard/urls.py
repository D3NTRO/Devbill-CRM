from django.urls import path
from .views import (
    DashboardStatsView, RevenueChartView, OverdueInvoicesView,
    TopClientsView, PipelineValueView, WinRateView, 
    AvgPaymentDaysView, BillableRatioView
)

urlpatterns = [
    path('stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('revenue-chart/', RevenueChartView.as_view(), name='revenue-chart'),
    path('overdue-invoices/', OverdueInvoicesView.as_view(), name='overdue-invoices'),
    path('top-clients/', TopClientsView.as_view(), name='top-clients'),
    path('pipeline-value/', PipelineValueView.as_view(), name='pipeline-value'),
    path('win-rate/', WinRateView.as_view(), name='win-rate'),
    path('avg-payment-days/', AvgPaymentDaysView.as_view(), name='avg-payment-days'),
    path('billable-ratio/', BillableRatioView.as_view(), name='billable-ratio'),
]