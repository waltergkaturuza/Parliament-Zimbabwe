# Parliament Fuel System - Clean Structure

## Project Structure

```
parliament-fuel-system/
├── backend/                 # Django API (Deploy to Vercel)
│   ├── api/                # Vercel serverless functions
│   ├── config/             # Django settings
│   ├── fuel/               # Django apps
│   ├── requirements.txt    # Python dependencies
│   ├── vercel.json         # Vercel configuration
│   └── manage.py           # Django management
│
└── fuel-coupon-frontend/   # React frontend (Deploy separately)
    ├── src/
    ├── package.json
    └── vercel.json
```

## Deployment Instructions

### Backend (Django API)
1. **Set Vercel Root Directory**: `backend`
2. **Add Environment Variables**:
   - `SECRET_KEY`: `y+r)tq^@)4s9w6o2u03z*59k&6lyzn$%+2za0@vdhyv5k=^y7o`
   - `DATABASE_URL`: `postgres://postgres.ofwxvaxnqbcergdsyzkj:74XTPTBFCaVipMaZ@aws-1-us-east-1.pooler.supabase.com:6543/postgres`

### Frontend (React App)
- Deploy as a separate Vercel project
- Set API URLs to point to backend deployment

## Benefits of This Structure
✅ No more Node.js/Python conflicts  
✅ Clean separation of concerns  
✅ Easy to deploy each part independently  
✅ Professional project organization  
