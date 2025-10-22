#!/usr/bin/env bash
set -euo pipefail

# Simple production deploy helper for apyhubxyz
# Usage:
#   ./scripts/deploy-prod.sh start|stop|restart|rebuild|logs|status|health

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Load env
if [ -f .env ]; then
  export $(grep -E '^[A-Z0-9_]+=' .env | xargs) || true
fi
if [ -f .env.production ]; then
  export $(grep -E '^[A-Z0-9_]+=' .env.production | xargs) || true
fi

PROFILE="production"

compose() {
  docker compose --profile "$PROFILE" "$@"
}

cmd=${1:-start}

case "$cmd" in
  start)
    echo "Building and starting services (profile=$PROFILE)..."
    compose up -d --build
    echo "Services are up."
    echo "- Frontend: http://localhost:${NGINX_HTTP_PORT:-8080}"
    echo "- Backend via Nginx: http://localhost:${NGINX_HTTP_PORT:-8080}/api"
    echo "- HTTPS (requires certs): https://localhost:${NGINX_HTTPS_PORT:-8443}"
    ;;
  stop)
    compose down
    ;;
  restart)
    compose down
    compose up -d --build
    ;;
  rebuild)
    compose build --no-cache
    compose up -d
    ;;
  logs)
    compose logs -f
    ;;
  status)
    compose ps
    ;;
  health)
    curl -fsSL "http://localhost:${NGINX_HTTP_PORT:-8080}/api/health" || true
    echo
    ;;
  *)
    echo "Unknown command: $cmd"
    echo "Usage: $0 {start|stop|restart|rebuild|logs|status|health}"
    exit 1
    ;;
esac
