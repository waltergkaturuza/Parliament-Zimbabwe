# 🚀 cPanel Quick Deployment Guide
## Parliament Fuel Coupon System

### ⚡ FASTEST DEPLOYMENT (15-30 minutes)

#### 1. **Access Your cPanel**
```bash
# SSH into your cPanel hosting
ssh your-username@your-domain.com
```

#### 2. **Setup Application Directory**
```bash
cd ~/public_html  # or your app directory
git clone https://github.com/waltergkaturuza/Parliament-Zimbabwe.git fuel-system
cd fuel-system
```

#### 3. **Setup Python Environment**
```bash
# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### 4. **Configure Database**
```bash
# Create database in cPanel
# Update settings in config/settings/cpanel.py
```

#### 5. **Deploy with Your Script**
```bash
chmod +x deploy_cpanel.sh
./deploy_cpanel.sh
```

#### 6. **Build Frontend**
```bash
cd fuel-coupon-frontend
npm install
npm run build
```

### 🎯 **Your System is PERFECT for cPanel because:**
- ✅ Django backend works seamlessly
- ✅ PostgreSQL database included
- ✅ Static file serving built-in
- ✅ File uploads/PDF generation supported
- ✅ Single-domain setup
- ✅ Cost-effective solution

### 🔥 **Go with cPanel - It's your fastest path to production!**
