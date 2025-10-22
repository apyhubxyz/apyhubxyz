.PHONY: prod-up prod-down prod-restart prod-rebuild prod-logs prod-status prod-health

prod-up:
	./scripts/deploy-prod.sh start

prod-down:
	./scripts/deploy-prod.sh stop

prod-restart:
	./scripts/deploy-prod.sh restart

prod-rebuild:
	./scripts/deploy-prod.sh rebuild

prod-logs:
	./scripts/deploy-prod.sh logs

prod-status:
	./scripts/deploy-prod.sh status

prod-health:
	./scripts/deploy-prod.sh health
