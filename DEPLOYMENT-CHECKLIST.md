# Parliament Fuel System - Deployment Checklist

## ✅ Local Development (Completed)
- [x] Django backend running on localhost:8000
- [x] All Django import errors fixed
- [x] Pandas dependency installed
- [x] Syntax errors in settings.py resolved
- [x] CORS configuration properly set
- [x] Frontend environment variables updated

## 🚀 Azure Backend Deployment

### Prerequisites
- [ ] Azure subscription with sufficient credits
- [ ] Azure CLI installed and configured
- [ ] Resource group created: `parliament-fuel-rg`

### Backend App Service Setup
- [ ] App Service Plan created (B1 or higher)
- [ ] Web App created with Python 3.11 runtime
- [ ] Environment variables configured:
  - [ ] `DJANGO_DEBUG=False`
  - [ ] `DJANGO_SECRET_KEY` (50+ characters)
  - [ ] `AZURE_HOSTNAME`
  - [ ] `FRONTEND_HOSTNAME`
  - [ ] `DJANGO_ALLOWED_HOSTS`
  - [ ] `CORS_ALLOWED_ORIGINS`
  - [ ] `DATABASE_URL` (PostgreSQL)
  - [ ] SSL/Security settings

### Database Setup
- [ ] Azure Database for PostgreSQL created
- [ ] Database user and permissions configured
- [ ] Firewall rules allow Azure services
- [ ] Connection string tested

### Code Deployment
- [ ] Code pushed to Azure Git repository
- [ ] Requirements.txt includes all dependencies
- [ ] Static files collected successfully
- [ ] Database migrations run successfully

### Testing
- [ ] Root endpoint accessible (/)
- [ ] Health endpoint responding (/api/health/)
- [ ] Authentication endpoint working (/auth/login/)
- [ ] CORS headers present and correct
- [ ] Admin interface accessible (/admin/)

## 🌐 Frontend Deployment

### Azure Static Web Apps
- [ ] Static Web App created
- [ ] Frontend build configured
- [ ] Environment variables set:
  - [ ] `VITE_API_BASE_URL` pointing to backend
  - [ ] Production URLs configured
- [ ] Custom domain configured (if needed)

### Testing
- [ ] Frontend loads successfully
- [ ] Can connect to backend API
- [ ] Login functionality works
- [ ] CORS issues resolved
- [ ] All routes accessible

## 🔧 Post-Deployment

### Monitoring
- [ ] Application Insights configured
- [ ] Log streaming enabled
- [ ] Health check endpoints monitored
- [ ] Error tracking active

### Security
- [ ] SSL certificates valid
- [ ] Security headers configured
- [ ] Access controls tested
- [ ] Database connections encrypted

### Performance
- [ ] Static files served efficiently
- [ ] Database queries optimized
- [ ] Caching configured
- [ ] Load testing completed

## 📝 Configuration Files Updated

### Backend
- [x] `config/settings.py` - Environment variable handling
- [x] `requirements.txt` - All dependencies listed
- [x] `startup.sh` - Azure startup script
- [x] `web.config` - IIS configuration
- [x] `azure-environment-variables.md` - Documentation

### Frontend
- [x] `.env.production` - Production environment variables
- [x] `src/api/apiClient.ts` - API base URL configuration

### Deployment Scripts
- [x] `deploy-azure.sh` - Bash deployment script
- [x] `deploy-azure.ps1` - PowerShell deployment script
- [x] `test-backend-health.py` - Health check script
- [x] `test-health.bat` - Simple connectivity test

## 🔗 URLs

### Development
- Backend: http://localhost:8000
- Frontend: http://localhost:5173

### Production (Planned)
- Backend: https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net
- Frontend: https://parliament-fuel-system.azurewebsites.net

## 📞 Support

If deployment issues occur:
1. Check Azure App Service logs
2. Verify environment variables are set
3. Ensure database connectivity
4. Test endpoints with provided scripts
5. Check CORS configuration
6. Verify SSL certificates

## 🎯 Next Steps

1. **Deploy Backend**: Use `deploy-azure.ps1` script
2. **Configure Database**: Set up PostgreSQL and run migrations
3. **Deploy Frontend**: Configure Azure Static Web Apps
4. **Test Integration**: Run health checks and test user flows
5. **Monitor**: Set up Application Insights and alerting
