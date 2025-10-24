# Production Deployment (Nginx + Docker Compose)

This project ships with a production-ready Docker Compose profile and an Nginx reverse proxy that serves the frontend and proxies API/WebSocket traffic to the backend.

## Prerequisites

- Docker and Docker Compose
- Domain pointing to the server (e.g., apyhub.xyz)
- TLS certificate and key (place under `nginx/ssl/` as `fullchain.pem` and `privkey.pem`)

## Environment

Copy the example and edit values:

```bash
cp .env.example .env
```

Recommended production values:
- `NEXT_PUBLIC_API_URL=/api` and `NEXT_PUBLIC_WS_URL=/ws` (relative; Nginx proxies requests)
- `CORS_ORIGIN=https://apyhub.xyz,https://www.apyhub.xyz`
- Set strong `POSTGRES_PASSWORD`
- Optionally set `OPENAI_API_KEY`

On a public server, map Nginx to 80/443 in `docker-compose.yml` (current defaults in compose map to 8080/8443 for safer local testing).

## Start (one command)

```bash
# From repo root
make prod-up
# or
./scripts/deploy-prod.sh start
```

Endpoints:
- Frontend: http://localhost:${NGINX_HTTP_PORT:-8080}
- API via Nginx: http://localhost:${NGINX_HTTP_PORT:-8080}/api
- HTTPS: https://localhost:${NGINX_HTTPS_PORT:-8443}

## Useful commands

```bash
make prod-status   # Show running services
make prod-logs     # Tail logs
make prod-restart  # Recreate and restart
make prod-rebuild  # Rebuild images and start
make prod-down     # Stop and remove
make prod-health   # Hit /api/health via Nginx
```

## TLS Certificates

Place your certificates under `nginx/ssl/`:
- `nginx/ssl/fullchain.pem`
- `nginx/ssl/privkey.pem`

If you don’t have certs yet, you can:
- Use a real Let’s Encrypt cert (recommended), or
- Temporarily comment out the HTTPS server block in `nginx/nginx.conf` and run on HTTP until certs are ready.

## Notes

- The frontend is built with relative API/WS URLs so it works behind Nginx without extra config.
- The backend trusts `CORS_ORIGIN` from `.env`—keep it restricted to your domains.
- Database storage persists via the `postgres_data` volume defined in `docker-compose.yml`.
- For tuning Nginx or enabling HSTS, see the comments in `nginx/nginx.conf`.
