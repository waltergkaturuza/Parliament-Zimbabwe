# Parliament Fuel System - Dependency Resolution Guide

## Issue: Django 5.0 Compatibility Conflict

The error occurs because `django-celery-beat==2.5.0` requires `Django<5.0`, but we're using `Django==5.0.7`.

## Solution Options

### Option 1: Use Fixed Requirements (Recommended)
```bash
pip install -r requirements.txt
```
Updated `django-celery-beat` to version 2.6.0 which supports Django 5.0.

### Option 2: Use Flexible Requirements
```bash
pip install -r requirements-flexible.txt
```
Uses version ranges (>=) instead of pinned versions for better compatibility.

### Option 3: Use Core Requirements Only
```bash
pip install -r requirements-core.txt
```
Minimal set of dependencies to get the system running.

### Option 4: Manual Installation Script
```bash
install-dependencies.bat
```
Automated script that tries different approaches and installs dependencies individually if needed.

## Dependency Conflict Details

### Main Conflict:
- `Django==5.0.7` (required by our application)
- `django-celery-beat==2.5.0` requires `Django<5.0`

### Solution Applied:
- Updated to `django-celery-beat==2.6.0` which supports Django 5.0+

### Other Potential Conflicts:
All other dependencies are compatible with Django 5.0.7:
- ✅ `djangorestframework==3.15.2` depends on `django>=4.2`
- ✅ `django-cors-headers==4.3.1` depends on `Django>=3.2`
- ✅ `channels==4.1.0` depends on `Django>=4.2`
- ✅ All other packages are compatible

## Quick Fix Commands

If you still get conflicts, try these commands in order:

1. **Update pip first:**
   ```bash
   pip install --upgrade pip
   ```

2. **Install core dependencies:**
   ```bash
   pip install Django==5.0.7 djangorestframework==3.15.2 psycopg2-binary==2.9.9
   ```

3. **Install remaining dependencies:**
   ```bash
   pip install django-cors-headers pandas gunicorn whitenoise
   ```

4. **Install task queue (optional):**
   ```bash
   pip install celery==5.3.4 redis==5.0.1
   ```

## Verification

After installation, verify with:
```bash
python -c "import django; print(f'Django: {django.get_version()}')"
python -c "import pandas; print(f'Pandas: {pandas.__version__}')"
python manage.py check
```

## For Production Deployment

The fixed requirements.txt should work for Azure deployment. If not, use requirements-core.txt for a minimal working setup.

Last updated: August 3, 2025
