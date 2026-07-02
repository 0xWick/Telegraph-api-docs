# Telegraph API Docs — Makefile
# All the common dev/CI tasks live here.

SHELL := /bin/bash
.PHONY: install lint validate build serve clean help

SPEC_FILES := $(wildcard openapi/*.yaml)

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

install: ## Install npm dev dependencies (spectral, swagger-ui-dist, swagger-parser)
	@npm install --no-audit --no-fund

lint: ## Lint every OpenAPI spec with Spectral (house rules in .spectral.yaml)
	@for spec in $(SPEC_FILES); do \
		echo "==> spectral lint $$spec"; \
		npx spectral lint "$$spec" || exit 1; \
	done

validate: ## Validate every spec parses as valid OpenAPI 3.0 (deref + resolve)
	@node scripts/validate-all.js

build: ## Build the static Swagger UI site (vendor dist + copy specs)
	@bash scripts/build-swagger-ui.sh

serve: build ## Serve the Swagger UI locally on http://localhost:8080
	@node scripts/serve-local.js

clean: ## Remove build artifacts and node_modules
	@rm -rf node_modules swagger-ui/specs swagger-ui/swagger-ui-bundle.js swagger-ui/swagger-ui-standalone-preset.js swagger-ui/swagger-ui.css

ci: install lint validate ## Full CI sequence (run before commit)
	@echo "✓ All specs linted and validated."
