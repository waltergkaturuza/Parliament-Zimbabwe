# Dynamics Integration App
# This app handles integration with Microsoft Dynamics 365 Business Central

from django.apps import AppConfig


class DynamicsIntegrationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'dynamics_integration'
    verbose_name = 'Microsoft Dynamics 365 Integration'

    def ready(self):
        # Import signals to register them
        import dynamics_integration.signals
