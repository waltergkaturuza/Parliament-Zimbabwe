# auth/backends.py
from django.conf import settings
from django.contrib.auth import get_user_model
from msal import ConfidentialClientApplication

class AzureADBackend:
    def authenticate(self, request, token=None):
        app = ConfidentialClientApplication(
            settings.AZURE_AD_CLIENT_ID,
            authority=f"https://login.microsoftonline.com/{settings.AZURE_AD_TENANT_ID}",
            client_credential=settings.AZURE_AD_CLIENT_SECRET
        )
        
        try:
            result = app.acquire_token_by_authorization_code(
                token,
                scopes=["https://graph.microsoft.com/.default"]
            )
            email = result.get("id_token_claims", {}).get("preferred_username")
            
            if email:
                User = get_user_model()
                user, _ = User.objects.get_or_create(email=email)
                return user
        except Exception as e:
            logger.error(f"Azure AD Auth Failed: {e}")
        return None

