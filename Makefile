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
	@# Kita gunakan 'cat' lalu pipe ke grep agar nama file tidak ikut tercetak
	@cat $(MAKEFILE_LIST) | grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

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
# SCAFFOLDING (Enterprise: CQRS + UseCases + Tests + Handlers)
# ==============================================================================
.PHONY: module

module: ## Create Full DDD Module. Usage: make module name=product
	@if [ -z "$(name)" ]; then echo "Error: Missing name. Usage: make module name=product"; exit 1; fi
	@# Logic Capitalize (product -> Product)
	$(eval CAP_NAME := $(shell echo $(name) | awk '{print toupper(substr($$0,1,1))substr($$0,2)}'))
	@echo "Scaffolding Enterprise Module '$(name)'... (Class Name: $(CAP_NAME))"
	
	@# 1. Create Complete Directory Structure
	@mkdir -p src/modules/$(name)/domain
	@mkdir -p src/modules/$(name)/application/use-cases
	@mkdir -p src/modules/$(name)/application/queries
	@mkdir -p src/modules/$(name)/infrastructure/persistence
	@mkdir -p src/modules/$(name)/infrastructure/adapters
	@mkdir -p src/modules/$(name)/interface/http
	@mkdir -p src/modules/$(name)/interface/dtos
	@mkdir -p src/modules/$(name)/handlers
	@mkdir -p src/modules/$(name)/mapper
	@mkdir -p src/modules/$(name)/tests/unit
	@mkdir -p src/modules/$(name)/tests/integration

	@# 2. DOMAIN ENTITY (Aggregate Root)
	@echo "const AggregateRoot = require('@shared/core/AggregateRoot');" > src/modules/$(name)/domain/$(CAP_NAME).js
	@echo "const AppError = require('@shared/core/AppError');" >> src/modules/$(name)/domain/$(CAP_NAME).js
	@echo "const { v4: uuidv4 } = require('uuid');" >> src/modules/$(name)/domain/$(CAP_NAME).js
	@echo "" >> src/modules/$(name)/domain/$(CAP_NAME).js
	@echo "class $(CAP_NAME) extends AggregateRoot {" >> src/modules/$(name)/domain/$(CAP_NAME).js
	@echo "  /**" >> src/modules/$(name)/domain/$(CAP_NAME).js
	@echo "   * @param {object} props" >> src/modules/$(name)/domain/$(CAP_NAME).js
	@echo "   * @param {string} [props.id]" >> src/modules/$(name)/domain/$(CAP_NAME).js
	@echo "   * @param {string} props.name" >> src/modules/$(name)/domain/$(CAP_NAME).js
	@echo "   * @param {Date} [props.createdAt]" >> src/modules/$(name)/domain/$(CAP_NAME).js
	@echo "   */" >> src/modules/$(name)/domain/$(CAP_NAME).js
	@echo "  constructor({ id, name, createdAt }) {" >> src/modules/$(name)/domain/$(CAP_NAME).js
	@echo "    super();" >> src/modules/$(name)/domain/$(CAP_NAME).js
	@echo "    this.id = id || uuidv4();" >> src/modules/$(name)/domain/$(CAP_NAME).js
	@echo "    this.name = name;" >> src/modules/$(name)/domain/$(CAP_NAME).js
	@echo "    this.createdAt = createdAt || new Date();" >> src/modules/$(name)/domain/$(CAP_NAME).js
	@echo "    this.validate();" >> src/modules/$(name)/domain/$(CAP_NAME).js
	@echo "  }" >> src/modules/$(name)/domain/$(CAP_NAME).js
	@echo "" >> src/modules/$(name)/domain/$(CAP_NAME).js
	@echo "  validate() {" >> src/modules/$(name)/domain/$(CAP_NAME).js
	@echo "    if (!this.name) throw new AppError('Name is required');" >> src/modules/$(name)/domain/$(CAP_NAME).js
	@echo "  }" >> src/modules/$(name)/domain/$(CAP_NAME).js
	@echo "}" >> src/modules/$(name)/domain/$(CAP_NAME).js
	@echo "module.exports = $(CAP_NAME);" >> src/modules/$(name)/domain/$(CAP_NAME).js

	@# 3. DOMAIN REPOSITORY INTERFACE
	@echo "/** @abstract */" > src/modules/$(name)/domain/I$(CAP_NAME)Repository.js
	@echo "class I$(CAP_NAME)Repository {" >> src/modules/$(name)/domain/I$(CAP_NAME)Repository.js
	@echo "  /** @param {import('./$(CAP_NAME)')} entity */" >> src/modules/$(name)/domain/I$(CAP_NAME)Repository.js
	@echo "  async save(entity) { throw new Error('Not implemented'); }" >> src/modules/$(name)/domain/I$(CAP_NAME)Repository.js
	@echo "}" >> src/modules/$(name)/domain/I$(CAP_NAME)Repository.js
	@echo "module.exports = I$(CAP_NAME)Repository;" >> src/modules/$(name)/domain/I$(CAP_NAME)Repository.js

	@# 4. MAPPER
	@echo "const $(CAP_NAME) = require('../domain/$(CAP_NAME)');" > src/modules/$(name)/mapper/$(CAP_NAME)Map.js
	@echo "const DateUtils = require('@shared/utils/DateUtils');" >> src/modules/$(name)/mapper/$(CAP_NAME)Map.js
	@echo "" >> src/modules/$(name)/mapper/$(CAP_NAME)Map.js
	@echo "class $(CAP_NAME)Map {" >> src/modules/$(name)/mapper/$(CAP_NAME)Map.js
	@echo "  /** @param {any} raw */" >> src/modules/$(name)/mapper/$(CAP_NAME)Map.js
	@echo "  static toDomain(raw) {" >> src/modules/$(name)/mapper/$(CAP_NAME)Map.js
	@echo "    if (!raw) return null;" >> src/modules/$(name)/mapper/$(CAP_NAME)Map.js
	@echo "    return new $(CAP_NAME)({" >> src/modules/$(name)/mapper/$(CAP_NAME)Map.js
	@echo "      id: raw.id," >> src/modules/$(name)/mapper/$(CAP_NAME)Map.js
	@echo "      name: raw.name," >> src/modules/$(name)/mapper/$(CAP_NAME)Map.js
	@echo "      createdAt: raw.created_at" >> src/modules/$(name)/mapper/$(CAP_NAME)Map.js
	@echo "    });" >> src/modules/$(name)/mapper/$(CAP_NAME)Map.js
	@echo "  }" >> src/modules/$(name)/mapper/$(CAP_NAME)Map.js
	@echo "" >> src/modules/$(name)/mapper/$(CAP_NAME)Map.js
	@echo "  /** @param {$(CAP_NAME)} entity */" >> src/modules/$(name)/mapper/$(CAP_NAME)Map.js
	@echo "  static toPersistence(entity) {" >> src/modules/$(name)/mapper/$(CAP_NAME)Map.js
	@echo "    return {" >> src/modules/$(name)/mapper/$(CAP_NAME)Map.js
	@echo "      id: entity.id," >> src/modules/$(name)/mapper/$(CAP_NAME)Map.js
	@echo "      name: entity.name," >> src/modules/$(name)/mapper/$(CAP_NAME)Map.js
	@echo "      created_at: entity.createdAt" >> src/modules/$(name)/mapper/$(CAP_NAME)Map.js
	@echo "    };" >> src/modules/$(name)/mapper/$(CAP_NAME)Map.js
	@echo "  }" >> src/modules/$(name)/mapper/$(CAP_NAME)Map.js
	@echo "" >> src/modules/$(name)/mapper/$(CAP_NAME)Map.js
	@echo "  /** @param {$(CAP_NAME)} entity */" >> src/modules/$(name)/mapper/$(CAP_NAME)Map.js
	@echo "  static toDTO(entity) {" >> src/modules/$(name)/mapper/$(CAP_NAME)Map.js
	@echo "    return {" >> src/modules/$(name)/mapper/$(CAP_NAME)Map.js
	@echo "      id: entity.id," >> src/modules/$(name)/mapper/$(CAP_NAME)Map.js
	@echo "      name: entity.name," >> src/modules/$(name)/mapper/$(CAP_NAME)Map.js
	@echo "      createdAt: DateUtils.toISOString(entity.createdAt)" >> src/modules/$(name)/mapper/$(CAP_NAME)Map.js
	@echo "    };" >> src/modules/$(name)/mapper/$(CAP_NAME)Map.js
	@echo "  }" >> src/modules/$(name)/mapper/$(CAP_NAME)Map.js
	@echo "}" >> src/modules/$(name)/mapper/$(CAP_NAME)Map.js
	@echo "module.exports = $(CAP_NAME)Map;" >> src/modules/$(name)/mapper/$(CAP_NAME)Map.js

	@# 5. REPOSITORY IMPLEMENTATION
	@echo "const I$(CAP_NAME)Repository = require('../../domain/I$(CAP_NAME)Repository');" > src/modules/$(name)/infrastructure/persistence/MySQL$(CAP_NAME)Repository.js
	@echo "const $(CAP_NAME)Map = require('../../mapper/$(CAP_NAME)Map');" >> src/modules/$(name)/infrastructure/persistence/MySQL$(CAP_NAME)Repository.js
	@echo "" >> src/modules/$(name)/infrastructure/persistence/MySQL$(CAP_NAME)Repository.js
	@echo "class MySQL$(CAP_NAME)Repository extends I$(CAP_NAME)Repository {" >> src/modules/$(name)/infrastructure/persistence/MySQL$(CAP_NAME)Repository.js
	@echo "  /** @param {import('mysql2/promise').Pool} dbPool */" >> src/modules/$(name)/infrastructure/persistence/MySQL$(CAP_NAME)Repository.js
	@echo "  constructor(dbPool) {" >> src/modules/$(name)/infrastructure/persistence/MySQL$(CAP_NAME)Repository.js
	@echo "    super();" >> src/modules/$(name)/infrastructure/persistence/MySQL$(CAP_NAME)Repository.js
	@echo "    this.db = dbPool;" >> src/modules/$(name)/infrastructure/persistence/MySQL$(CAP_NAME)Repository.js
	@echo "    this.tableName = '$(name)s';" >> src/modules/$(name)/infrastructure/persistence/MySQL$(CAP_NAME)Repository.js
	@echo "  }" >> src/modules/$(name)/infrastructure/persistence/MySQL$(CAP_NAME)Repository.js
	@echo "" >> src/modules/$(name)/infrastructure/persistence/MySQL$(CAP_NAME)Repository.js
	@echo "  /** @param {import('../../domain/$(CAP_NAME)')} entity */" >> src/modules/$(name)/infrastructure/persistence/MySQL$(CAP_NAME)Repository.js
	@echo "  async save(entity) {" >> src/modules/$(name)/infrastructure/persistence/MySQL$(CAP_NAME)Repository.js
	@echo "    const raw = $(CAP_NAME)Map.toPersistence(entity);" >> src/modules/$(name)/infrastructure/persistence/MySQL$(CAP_NAME)Repository.js
	@echo "    const sql = \`INSERT INTO \` + this.tableName + \` (id, name, created_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)\`;" >> src/modules/$(name)/infrastructure/persistence/MySQL$(CAP_NAME)Repository.js
	@echo "    await this.db.execute(sql, [raw.id, raw.name, raw.created_at]);" >> src/modules/$(name)/infrastructure/persistence/MySQL$(CAP_NAME)Repository.js
	@echo "    return entity;" >> src/modules/$(name)/infrastructure/persistence/MySQL$(CAP_NAME)Repository.js
	@echo "  }" >> src/modules/$(name)/infrastructure/persistence/MySQL$(CAP_NAME)Repository.js
	@echo "}" >> src/modules/$(name)/infrastructure/persistence/MySQL$(CAP_NAME)Repository.js
	@echo "module.exports = MySQL$(CAP_NAME)Repository;" >> src/modules/$(name)/infrastructure/persistence/MySQL$(CAP_NAME)Repository.js

	@# 6. USE CASE (Command)
	@echo "const $(CAP_NAME) = require('../../domain/$(CAP_NAME)');" > src/modules/$(name)/application/use-cases/Create$(CAP_NAME).js
	@echo "" >> src/modules/$(name)/application/use-cases/Create$(CAP_NAME).js
	@echo "class Create$(CAP_NAME) {" >> src/modules/$(name)/application/use-cases/Create$(CAP_NAME).js
	@echo "  /** @param {import('../../domain/I$(CAP_NAME)Repository')} repo */" >> src/modules/$(name)/application/use-cases/Create$(CAP_NAME).js
	@echo "  constructor(repo) {" >> src/modules/$(name)/application/use-cases/Create$(CAP_NAME).js
	@echo "    this.repo = repo;" >> src/modules/$(name)/application/use-cases/Create$(CAP_NAME).js
	@echo "  }" >> src/modules/$(name)/application/use-cases/Create$(CAP_NAME).js
	@echo "" >> src/modules/$(name)/application/use-cases/Create$(CAP_NAME).js
	@echo "  /** @param {{ name: string }} dto */" >> src/modules/$(name)/application/use-cases/Create$(CAP_NAME).js
	@echo "  async execute(dto) {" >> src/modules/$(name)/application/use-cases/Create$(CAP_NAME).js
	@echo "    const entity = new $(CAP_NAME)({ name: dto.name });" >> src/modules/$(name)/application/use-cases/Create$(CAP_NAME).js
	@echo "    await this.repo.save(entity);" >> src/modules/$(name)/application/use-cases/Create$(CAP_NAME).js
	@echo "    return entity;" >> src/modules/$(name)/application/use-cases/Create$(CAP_NAME).js
	@echo "  }" >> src/modules/$(name)/application/use-cases/Create$(CAP_NAME).js
	@echo "}" >> src/modules/$(name)/application/use-cases/Create$(CAP_NAME).js
	@echo "module.exports = Create$(CAP_NAME);" >> src/modules/$(name)/application/use-cases/Create$(CAP_NAME).js

	@# 7. QUERY (Read Model)
	@echo "class Get$(CAP_NAME)List {" > src/modules/$(name)/application/queries/Get$(CAP_NAME)List.js
	@echo "  /** @param {import('mysql2/promise').Pool} dbPool */" >> src/modules/$(name)/application/queries/Get$(CAP_NAME)List.js
	@echo "  constructor(dbPool) {" >> src/modules/$(name)/application/queries/Get$(CAP_NAME)List.js
	@echo "    this.db = dbPool;" >> src/modules/$(name)/application/queries/Get$(CAP_NAME)List.js
	@echo "  }" >> src/modules/$(name)/application/queries/Get$(CAP_NAME)List.js
	@echo "" >> src/modules/$(name)/application/queries/Get$(CAP_NAME)List.js
	@echo "  async execute() {" >> src/modules/$(name)/application/queries/Get$(CAP_NAME)List.js
	@echo "    const sql = \`SELECT id, name, created_at FROM $(name)s LIMIT 50\`;" >> src/modules/$(name)/application/queries/Get$(CAP_NAME)List.js
	@echo "    const [rows] = await this.db.execute(sql);" >> src/modules/$(name)/application/queries/Get$(CAP_NAME)List.js
	@echo "    return rows;" >> src/modules/$(name)/application/queries/Get$(CAP_NAME)List.js
	@echo "  }" >> src/modules/$(name)/application/queries/Get$(CAP_NAME)List.js
	@echo "}" >> src/modules/$(name)/application/queries/Get$(CAP_NAME)List.js
	@echo "module.exports = Get$(CAP_NAME)List;" >> src/modules/$(name)/application/queries/Get$(CAP_NAME)List.js

	@# 8. HANDLERS (New Added!)
	@echo "const Logger = require('@shared/infra/logging/Logger');" > src/modules/$(name)/handlers/$(CAP_NAME)EventHandler.js
	@echo "" >> src/modules/$(name)/handlers/$(CAP_NAME)EventHandler.js
	@echo "/**" >> src/modules/$(name)/handlers/$(CAP_NAME)EventHandler.js
	@echo " * Handle Domain Event: $(CAP_NAME)Created" >> src/modules/$(name)/handlers/$(CAP_NAME)EventHandler.js
	@echo " * @param {{ id: string, name: string }} event" >> src/modules/$(name)/handlers/$(CAP_NAME)EventHandler.js
	@echo " */" >> src/modules/$(name)/handlers/$(CAP_NAME)EventHandler.js
	@echo "const handleCreated = async (event) => {" >> src/modules/$(name)/handlers/$(CAP_NAME)EventHandler.js
	@echo "  Logger.info(\`[$(CAP_NAME)Handler] Handling Created Event: \${event.id}\`);" >> src/modules/$(name)/handlers/$(CAP_NAME)EventHandler.js
	@echo "  // TODO: Add side-effects here (e.g. Send Email, Update Stats)" >> src/modules/$(name)/handlers/$(CAP_NAME)EventHandler.js
	@echo "};" >> src/modules/$(name)/handlers/$(CAP_NAME)EventHandler.js
	@echo "" >> src/modules/$(name)/handlers/$(CAP_NAME)EventHandler.js
	@echo "module.exports = { handleCreated };" >> src/modules/$(name)/handlers/$(CAP_NAME)EventHandler.js

	@# 9. DTO & CONTROLLER
	@echo "const { z } = require('zod');" > src/modules/$(name)/interface/dtos/Create$(CAP_NAME)DTO.js
	@echo "const create$(CAP_NAME)Schema = z.object({ name: z.string().min(3) });" >> src/modules/$(name)/interface/dtos/Create$(CAP_NAME)DTO.js
	@echo "module.exports = { create$(CAP_NAME)Schema };" >> src/modules/$(name)/interface/dtos/Create$(CAP_NAME)DTO.js

	@echo "const $(CAP_NAME)Map = require('../../mapper/$(CAP_NAME)Map');" > src/modules/$(name)/interface/http/$(CAP_NAME)Controller.js
	@echo "const { create$(CAP_NAME)Schema } = require('../dtos/Create$(CAP_NAME)DTO');" >> src/modules/$(name)/interface/http/$(CAP_NAME)Controller.js
	@echo "" >> src/modules/$(name)/interface/http/$(CAP_NAME)Controller.js
	@echo "class $(CAP_NAME)Controller {" >> src/modules/$(name)/interface/http/$(CAP_NAME)Controller.js
	@echo "  /**" >> src/modules/$(name)/interface/http/$(CAP_NAME)Controller.js
	@echo "   * @param {import('../../application/use-cases/Create$(CAP_NAME)')} createUseCase" >> src/modules/$(name)/interface/http/$(CAP_NAME)Controller.js
	@echo "   * @param {import('../../application/queries/Get$(CAP_NAME)List')} getListQuery" >> src/modules/$(name)/interface/http/$(CAP_NAME)Controller.js
	@echo "   */" >> src/modules/$(name)/interface/http/$(CAP_NAME)Controller.js
	@echo "  constructor(createUseCase, getListQuery) {" >> src/modules/$(name)/interface/http/$(CAP_NAME)Controller.js
	@echo "    this.createUseCase = createUseCase;" >> src/modules/$(name)/interface/http/$(CAP_NAME)Controller.js
	@echo "    this.getListQuery = getListQuery;" >> src/modules/$(name)/interface/http/$(CAP_NAME)Controller.js
	@echo "  }" >> src/modules/$(name)/interface/http/$(CAP_NAME)Controller.js
	@echo "" >> src/modules/$(name)/interface/http/$(CAP_NAME)Controller.js
	@echo "  create = async (req, res, next) => {" >> src/modules/$(name)/interface/http/$(CAP_NAME)Controller.js
	@echo "    try {" >> src/modules/$(name)/interface/http/$(CAP_NAME)Controller.js
	@echo "      const dto = create$(CAP_NAME)Schema.parse(req.body);" >> src/modules/$(name)/interface/http/$(CAP_NAME)Controller.js
	@echo "      const result = await this.createUseCase.execute(dto);" >> src/modules/$(name)/interface/http/$(CAP_NAME)Controller.js
	@echo "      res.status(201).json({ success: true, data: $(CAP_NAME)Map.toDTO(result) });" >> src/modules/$(name)/interface/http/$(CAP_NAME)Controller.js
	@echo "    } catch (e) { next(e); }" >> src/modules/$(name)/interface/http/$(CAP_NAME)Controller.js
	@echo "  }" >> src/modules/$(name)/interface/http/$(CAP_NAME)Controller.js
	@echo "" >> src/modules/$(name)/interface/http/$(CAP_NAME)Controller.js
	@echo "  list = async (req, res, next) => {" >> src/modules/$(name)/interface/http/$(CAP_NAME)Controller.js
	@echo "    try {" >> src/modules/$(name)/interface/http/$(CAP_NAME)Controller.js
	@echo "      const data = await this.getListQuery.execute();" >> src/modules/$(name)/interface/http/$(CAP_NAME)Controller.js
	@echo "      res.json({ success: true, data });" >> src/modules/$(name)/interface/http/$(CAP_NAME)Controller.js
	@echo "    } catch (e) { next(e); }" >> src/modules/$(name)/interface/http/$(CAP_NAME)Controller.js
	@echo "  }" >> src/modules/$(name)/interface/http/$(CAP_NAME)Controller.js
	@echo "}" >> src/modules/$(name)/interface/http/$(CAP_NAME)Controller.js
	@echo "module.exports = $(CAP_NAME)Controller;" >> src/modules/$(name)/interface/http/$(CAP_NAME)Controller.js

	@# 10. ROUTER & WIRING
	@echo "const router = require('express').Router();" > src/modules/$(name)/interface/http/$(name)Routes.js
	@echo "module.exports = (controller) => {" >> src/modules/$(name)/interface/http/$(name)Routes.js
	@echo "  router.post('/', controller.create);" >> src/modules/$(name)/interface/http/$(name)Routes.js
	@echo "  router.get('/', controller.list);" >> src/modules/$(name)/interface/http/$(name)Routes.js
	@echo "  return router;" >> src/modules/$(name)/interface/http/$(name)Routes.js
	@echo "};" >> src/modules/$(name)/interface/http/$(name)Routes.js

	@echo "const MySQL$(CAP_NAME)Repository = require('./infrastructure/persistence/MySQL$(CAP_NAME)Repository');" > src/modules/$(name)/index.js
	@echo "const Create$(CAP_NAME) = require('./application/use-cases/Create$(CAP_NAME)');" >> src/modules/$(name)/index.js
	@echo "const Get$(CAP_NAME)List = require('./application/queries/Get$(CAP_NAME)List');" >> src/modules/$(name)/index.js
	@echo "const $(CAP_NAME)Controller = require('./interface/http/$(CAP_NAME)Controller');" >> src/modules/$(name)/index.js
	@echo "const createRouter = require('./interface/http/$(name)Routes');" >> src/modules/$(name)/index.js
	@echo "" >> src/modules/$(name)/index.js
	@echo "/** @param {import('mysql2/promise').Pool} dbPool */" >> src/modules/$(name)/index.js
	@echo "module.exports = (dbPool) => {" >> src/modules/$(name)/index.js
	@echo "  const repo = new MySQL$(CAP_NAME)Repository(dbPool);" >> src/modules/$(name)/index.js
	@echo "  const createUseCase = new Create$(CAP_NAME)(repo);" >> src/modules/$(name)/index.js
	@echo "  const getListQuery = new Get$(CAP_NAME)List(dbPool);" >> src/modules/$(name)/index.js
	@echo "  const controller = new $(CAP_NAME)Controller(createUseCase, getListQuery);" >> src/modules/$(name)/index.js
	@echo "  return createRouter(controller);" >> src/modules/$(name)/index.js
	@echo "};" >> src/modules/$(name)/index.js

	@echo "Enterprise Module '$(name)' created successfully!"
	@echo "Files generated:"
	@echo " - src/modules/$(name)/domain/$(CAP_NAME).js"
	@echo " - src/modules/$(name)/domain/I$(CAP_NAME)Repository.js"
	@echo " - src/modules/$(name)/mapper/$(CAP_NAME)Map.js"
	@echo " - src/modules/$(name)/infrastructure/persistence/MySQL$(CAP_NAME)Repository.js"
	@echo " - src/modules/$(name)/handlers/$(CAP_NAME)EventHandler.js"
	@echo " - src/modules/$(name)/application/use-cases/Create$(CAP_NAME).js"
	@echo " - src/modules/$(name)/application/queries/Get$(CAP_NAME)List.js"
	@echo " - src/modules/$(name)/interface/dtos/Create$(CAP_NAME)DTO.js"
	@echo " - src/modules/$(name)/interface/http/$(CAP_NAME)Controller.js"
	@echo " - src/modules/$(name)/interface/http/$(name)Routes.js"
	@echo " - src/modules/$(name)/tests/unit/$(CAP_NAME).test.js"
	@echo " - src/modules/$(name)/index.js"
	@echo ""
	@echo "Remember to register the module in your main app router."

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