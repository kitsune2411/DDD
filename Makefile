# ==============================================================================
# APP MANAGEMENT CHEATSHEET
# ==============================================================================

# Load file .env jika ada
ifneq (,$(wildcard .env))
    include .env
    export
endif

# Variables with default values
APP_NAME ?= my-ddd-app
DOCKER_TAG ?= latest

# Detect OS for Clean Command
ifeq ($(OS),Windows_NT)
    RM_RF = rmdir /s /q
else
    RM_RF = rm -rf
endif

# Default action: Show help
.PHONY: help
help: ## Show all available commands
	@echo "----------------------------------------------------------------------"
	@echo "                   PROJECT COMMAND CENTER"
	@echo "----------------------------------------------------------------------"
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ==============================================================================
# DEVELOPMENT
# ==============================================================================
.PHONY: install dev start test test-watch

install: ## Install dependencies (npm install)
	npm install

dev: ## Run server in Development mode (Nodemon)
	npm run dev

start: ## Run server in Production mode
	npm start

test: ## Run Unit Tests (Jest)
	npm test

test-watch: ## Run Tests in Watch Mode
	npm run test:watch

# ==============================================================================
# SCAFFOLDING (Generator)
# ==============================================================================
.PHONY: module

module: ## Create a new DDD Module (Usage: make module name=payment)
	@if [ -z "$(name)" ]; then echo "Error: Missing name. Usage: make module name=payment"; exit 1; fi
	@echo "Scaffolding module '$(name)'..."
	
	@# 1. Create Directories
	@mkdir -p src/modules/$(name)/domain
	@mkdir -p src/modules/$(name)/application
	@mkdir -p src/modules/$(name)/infrastructure
	@mkdir -p src/modules/$(name)/interface/http
	@mkdir -p src/modules/$(name)/interface/dtos
	
	@# 2. Create Placeholder Files (Gitkeep)
	@touch src/modules/$(name)/domain/.gitkeep
	@touch src/modules/$(name)/application/.gitkeep
	@touch src/modules/$(name)/infrastructure/.gitkeep
	@touch src/modules/$(name)/interface/dtos/.gitkeep

	@# 3. Create Basic Route File
	@echo "const router = require('express').Router();" > src/modules/$(name)/interface/http/$(name)Routes.js
	@echo "" >> src/modules/$(name)/interface/http/$(name)Routes.js
	@echo "module.exports = (controller) => {" >> src/modules/$(name)/interface/http/$(name)Routes.js
	@echo "  // router.post('/', controller.create);" >> src/modules/$(name)/interface/http/$(name)Routes.js
	@echo "  return router;" >> src/modules/$(name)/interface/http/$(name)Routes.js
	@echo "};" >> src/modules/$(name)/interface/http/$(name)Routes.js

	@# 4. Create Module Entry Point (Wiring)
	@echo "const createRouter = require('./interface/http/$(name)Routes');" > src/modules/$(name)/index.js
	@echo "" >> src/modules/$(name)/index.js
	@echo "module.exports = (dbPool) => {" >> src/modules/$(name)/index.js
	@echo "  // 1. Instantiate Repository & Service" >> src/modules/$(name)/index.js
	@echo "  // const repo = new MySQL$(name)Repository(dbPool);" >> src/modules/$(name)/index.js
	@echo "  // const service = new Create$(name)Service(repo);" >> src/modules/$(name)/index.js
	@echo "  const controller = {}; // new $(name)Controller(service);" >> src/modules/$(name)/index.js
	@echo "" >> src/modules/$(name)/index.js
	@echo "  return createRouter(controller);" >> src/modules/$(name)/index.js
	@echo "};" >> src/modules/$(name)/index.js

	@echo "Module '$(name)' created successfully at src/modules/$(name)"

# ==============================================================================
# DATABASE (KNEX MIGRATIONS)
# ==============================================================================
.PHONY: db-status migrate-make migrate-up migrate-down migrate-rollback seed-make seed-run

db-status: ## Check migration status
	npx knex migrate:status

migrate-make: ## Create new migration file (Usage: make migrate-make name=create_users)
	@if [ -z "$(name)" ]; then echo "Error: Missing name. Usage: make migrate-make name=create_table"; exit 1; fi
	npx knex migrate:make $(name)

migrate-up: ## Run latest migrations (Update Database)
	npx knex migrate:latest

migrate-down: ## Undo last migration batch
	npx knex migrate:down

migrate-rollback: ## Delete ALL tables (Reset DB to empty)
	npx knex migrate:rollback

seed-make: ## Create new seed file (Usage: make seed-make name=dummy_users)
	@if [ -z "$(name)" ]; then echo "Error: Missing name. Usage: make seed-make name=initial_data"; exit 1; fi
	npx knex seed:make $(name)

seed-run: ## Populate database with dummy data
	npx knex seed:run

# ==============================================================================
# DOCKER
# ==============================================================================
.PHONY: docker-build docker-up docker-down

docker-build: ## Build docker image using .env variables
	@echo "Building image: $(APP_NAME):$(DOCKER_TAG)"
	docker build -t $(APP_NAME):$(DOCKER_TAG) .

docker-up: ## Run containers in background
	docker-compose up -d

docker-down: ## Stop and remove containers
	docker-compose down

docker-scale: ## Scale App instances (Usage: make docker-scale n=3)
	@if [ -z "$(n)" ]; then echo "Error: Missing count. Usage: make docker-scale n=3"; exit 1; fi
	@echo "Scaling app to $(n) instances..."
	docker-compose up -d --scale app=$(n)
	@echo "Scale complete! Check ports via 'docker ps'"

docker-update: ## Rebuild & Restart container (Gunakan setelah edit kodingan)
	@echo "Updating application..."
	docker-compose up -d --build
	@echo "Application updated!"

# ==============================================================================
# UTILITIES
# ==============================================================================
.PHONY: clean

clean: ## Remove node_modules and package-lock
	@echo "Cleaning up..."
	$(RM_RF) node_modules
	$(RM_RF) package-lock.json
	@echo "Project cleaned! Run 'make install' to setup again."