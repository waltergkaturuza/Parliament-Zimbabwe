# WebSockets Enablement (Django Channels)

## Summary

- Backend now includes Django Channels with an ASGI application and a minimal consumer at `ws/notifications/<role>/<user_id>/`.
- For production WebSocket support on Azure App Service, switch the startup command to use an ASGI server.

## Steps

1) Dependencies

   - requirements.txt now includes channels==4.1.0 and daphne==4.1.2.

2) Startup command (Azure Portal > Configuration > General settings > Startup Command)

    - Use daphne (recommended):
       python -m daphne -b 0.0.0.0 -p $PORT config.asgi:application

    - Or gunicorn with uvicorn workers:
       python -m gunicorn config.asgi:application --worker-class uvicorn.workers.UvicornWorker --bind=0.0.0.0:$PORT --timeout=600 --workers=2

3) Channel layers

   - Optional Redis (recommended for scale-out): set REDIS_URL or CHANNEL_REDIS_URL in env.
   - Without Redis, the in-memory channel layer works only for a single instance.

4) Health checks

   - Update any HEAD-only probes for POST-only endpoints to use GET or OPTIONS.

## Smoke test

- Connect to `wss://<host>/ws/notifications/admin/1/` and send a small message; expect an echo response.
