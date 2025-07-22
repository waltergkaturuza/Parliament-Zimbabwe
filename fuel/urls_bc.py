# Business Central Integration URLs
from django.urls import path
from . import views_bc

app_name = 'bc'

urlpatterns = [
    # Main BC embedded views
    path('dashboard/', views_bc.BCEmbeddedDashboardView.as_view(), name='dashboard'),
    path('transactions/', views_bc.bc_transaction_list, name='transaction_list'),
    path('transaction-form/', views_bc.bc_transaction_form, name='transaction_form'),
    path('reports/', views_bc.bc_reports, name='reports'),
    
    # API endpoints for BC integration
    path('api/sync/', views_bc.bc_api_sync, name='api_sync'),
    path('webhook/', views_bc.bc_webhook_receiver, name='webhook'),
]
