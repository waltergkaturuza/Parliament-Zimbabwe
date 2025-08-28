# Parliament Fuel System - Render Deployment

This Django backend is configured for deployment on Render.

## Quick Deploy to Render

1. **Connect your GitHub repository to Render:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `waltergkaturuza/Parliament-Zimbabwe`
   - Select the `main` branch

2. **Configure the service:**
   - **Name**: `parliament-fuel-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `./build.sh`
   - **Start Command**: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
   - **Root Directory**: `backend`

3. **Environment Variables:**
   ```
   PYTHON_VERSION=3.12.0
   DJANGO_SETTINGS_MODULE=config.settings.render
   DATABASE_URL=postgres://postgres.ofwxvaxnqbcergdsyzkj:74XTPTBFCaVipMaZ@aws-1-us-east-1.pooler.supabase.com:6543/postgres
   SECRET_KEY=[Auto-generate in Render]
   DEBUG=false
   ```

4. **Deploy:**
   - Click "Create Web Service"
   - Render will automatically build and deploy your app

## API Endpoints

Once deployed, your API will be available at:
- `https://parliament-fuel-backend.onrender.com/api/`
- Health check: `https://parliament-fuel-backend.onrender.com/`

## Features Included

- ✅ Django 4.1.13 with REST Framework
- ✅ PostgreSQL database (Supabase)
- ✅ JWT Authentication
- ✅ CORS configured for frontend
- ✅ Static files with WhiteNoise
- ✅ Automatic SSL/HTTPS
- ✅ Database migrations on deploy
- ✅ Production logging

## Advantages over Vercel

- **Better Django support**: Native WSGI server support
- **Persistent storage**: File uploads and static files
- **Database migrations**: Automatic on deploy
- **Environment variables**: Built-in secrets management
- **Logs**: Better debugging and monitoring
- **No cold starts**: Always-warm instances

## Environment Setup

Render automatically handles:
- Python 3.12 runtime
- Package installation from `requirements.txt`
- Database migrations via `build.sh`
- Static file collection
- HTTPS certificates
- Environment variable injection

## Database

The app connects to your existing Supabase PostgreSQL database. No changes needed to your database setup.

## Monitoring

- View logs in Render dashboard
- Health checks at root endpoint `/`
- Database connection status in API response
