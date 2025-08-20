#!/usr/bin/env bash

# Azure App Service (Linux) startup script
# - Ensures Django migrates the production DB on container start
# - Optionally collects static files
# - Starts the HTTP server (Gunicorn by default, or Daphne for ASGI/WebSockets)

set -euo pipefail

# Detect the application directory. Oryx often extracts the app to /tmp/<id> and
# sets APP_PATH in the generated /opt/startup/startup.sh before running this script.
# Prefer any provided APP_DIR, then APP_PATH/ORYX_APP_PATH (from Oryx), then default.
APP_DIR=${APP_DIR:-${APP_PATH:-${ORYX_APP_PATH:-/home/site/wwwroot}}}
export APP_DIR

echo "[entrypoint] Booting container…"

# Default to production settings on Azure
export DJANGO_SETTINGS_MODULE=${DJANGO_SETTINGS_MODULE:-config.settings.production}
export PORT=${PORT:-8000}

# Ensure we run from the app root
cd "$APP_DIR" 2>/dev/null || cd "$(dirname "$0")" 2>/dev/null || true

# Make sure the application directory is on PYTHONPATH for module imports like `config` to work
export PYTHONPATH="${APP_DIR}:${PYTHONPATH:-}"

echo "[entrypoint] Using APP_DIR=$(pwd)"
echo "[entrypoint] Tree check: manage.py=$(if [ -f manage.py ]; then echo present; else echo missing; fi), config/=$(if [ -d config ]; then echo present; else echo missing; fi)"

echo "[entrypoint] Using DJANGO_SETTINGS_MODULE=${DJANGO_SETTINGS_MODULE}"
python --version || true

# Optionally collect static (safe to skip if using CDN/Storage)
if [ "${COLLECTSTATIC_ON_STARTUP:-true}" = "true" ]; then
  echo "[entrypoint] Collecting static files…"
  python manage.py collectstatic --noinput || echo "[entrypoint] collectstatic skipped/failed (non-fatal)"
fi

# Run migrations (idempotent). Can be disabled via MIGRATE_ON_STARTUP=false
if [ "${MIGRATE_ON_STARTUP:-true}" = "true" ]; then
  echo "[entrypoint] Applying database migrations…"
  if ! python manage.py migrate --noinput; then
    echo "[entrypoint] migrate failed (first attempt). Retrying once after 5s…" >&2
    sleep 5
    python manage.py migrate --noinput
  fi
fi

# Server selection
SERVER_KIND=${SERVER_KIND:-gunicorn} # gunicorn | daphne | gunicorn-asgi

case "$SERVER_KIND" in
  daphne)
    # Start Daphne (ASGI) for Django Channels/WebSockets
    ASGI_APP=${ASGI_MODULE:-config.asgi:application}
    echo "[entrypoint] Starting daphne (${ASGI_APP}) on 0.0.0.0:${PORT}"
    exec daphne -b 0.0.0.0 -p "${PORT}" "${ASGI_APP}"
    ;;
  gunicorn-asgi)
    # Start Gunicorn using Uvicorn worker to serve ASGI (WebSockets)
    WORKERS=${GUNICORN_WORKERS:-3}
    TIMEOUT=${GUNICORN_TIMEOUT:-180}
    ASGI_APP=${ASGI_MODULE:-config.asgi:application}
    echo "[entrypoint] Starting gunicorn (uvicorn worker) ${ASGI_APP} on 0.0.0.0:${PORT} (workers=${WORKERS}, timeout=${TIMEOUT})"
    exec gunicorn "${ASGI_APP}" \
      --chdir "${APP_DIR}" \
      --bind 0.0.0.0:${PORT} \
      --workers ${WORKERS} \
      -k uvicorn.workers.UvicornWorker \
      --timeout ${TIMEOUT}
    ;;
  gunicorn|*)
    # Start gunicorn (WSGI)
    WORKERS=${GUNICORN_WORKERS:-3}
    THREADS=${GUNICORN_THREADS:-2}
    TIMEOUT=${GUNICORN_TIMEOUT:-180}
    APP_MODULE=${WSGI_MODULE:-config.wsgi:application}
    echo "[entrypoint] Starting gunicorn (${APP_MODULE}) on 0.0.0.0:${PORT} (workers=${WORKERS}, threads=${THREADS}, timeout=${TIMEOUT})"
    exec gunicorn "${APP_MODULE}" \
      --chdir "${APP_DIR}" \
      --bind 0.0.0.0:${PORT} \
      --workers ${WORKERS} \
      --threads ${THREADS} \
      --timeout ${TIMEOUT}
    ;;
esac
