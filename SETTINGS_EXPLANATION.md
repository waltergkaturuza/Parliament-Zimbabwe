# Django Settings Structure Explanation

## Settings Architecture

Your Django project has two settings configurations:

### 1. **`config/settings.py`** (Current/Default)
- **Purpose**: Main settings file used for local development
- **Usage**: This is what your `manage.py` uses by default
- **Contains**: Basic Django configuration with SQLite for local development

### 2. **`config/settings/production.py`** (Production)
- **Purpose**: Production-specific settings for Azure deployment
- **Usage**: Should be used when deploying to Azure
- **Contains**: PostgreSQL configuration, production security settings, Azure-specific configurations

## The Relationship

The `config/settings/production.py` file imports from `config/settings/base.py` (base configuration) and overrides settings for production use. This is a Django best practice called "settings modules."

## Current Issue

Your Azure deployment is likely still using `config/settings.py` instead of `config/settings/production.py`. This means:

- ❌ Using SQLite instead of PostgreSQL
- ❌ Wrong CORS settings for Azure
- ❌ Missing production security configurations

## Solution

You need to tell Azure to use the production settings. This is done by setting the `DJANGO_SETTINGS_MODULE` environment variable in Azure to:

```
DJANGO_SETTINGS_MODULE=config.settings.production
```

Instead of the default:
```
DJANGO_SETTINGS_MODULE=config.settings
```

## How to Fix in Azure

1. **Azure Portal** → Your App Service → **Configuration** → **Application Settings**
2. Add or modify:
   - **Name**: `DJANGO_SETTINGS_MODULE`
   - **Value**: `config.settings.production`
3. **Save** and **Restart** the app service

This will ensure Azure uses the correct production settings with PostgreSQL database configuration.
