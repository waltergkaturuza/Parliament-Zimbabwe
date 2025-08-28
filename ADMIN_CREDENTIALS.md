# Django Admin Credentials

## Default Superuser Credentials

The system will create a default admin user with the following credentials:

### Login Details:
- **Username**: `admin`
- **Email**: `admin@parliament.gov.zw`
- **Password**: `Parliament2024!`

### Admin Panel Access:
- **Local Development**: http://localhost:8000/admin/
- **Render Production**: https://parliament-zimbabwe.onrender.com/admin/

### API Access:
- **Health Check**: https://parliament-zimbabwe.onrender.com/api/health/
- **API Root**: https://parliament-zimbabwe.onrender.com/api/

## Environment Variables (Optional)

You can override these credentials by setting environment variables in Render:

```bash
DJANGO_SUPERUSER_USERNAME=your_username
DJANGO_SUPERUSER_EMAIL=your_email@domain.com
DJANGO_SUPERUSER_PASSWORD=your_secure_password
```

## Security Notes:

1. **Change the default password** after first login in production
2. Consider using environment variables for custom credentials
3. The admin user is created automatically during deployment
4. If the user already exists, the command will skip creation

## First Login Steps:

1. Go to: https://parliament-zimbabwe.onrender.com/admin/
2. Login with: `admin` / `Parliament2024!`
3. Change password immediately in User settings
4. Update email address if needed
5. Create additional admin users as required

---
*Generated on deployment to Render platform*
