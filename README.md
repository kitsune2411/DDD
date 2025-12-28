# DDD - Domain Driven Design Application

A scalable Node.js application built with **Domain-Driven Design (DDD)** principles using Express, MySQL, Redis, and BullMQ for asynchronous job processing.

## 📋 Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [Docker Deployment](#docker-deployment)
- [Database Migrations](#database-migrations)
- [API Documentation](#api-documentation)
- [Architecture](#architecture)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This project demonstrates enterprise-grade Node.js development using **Domain-Driven Design**, featuring:

✅ **Modular Architecture** - Independent, testable business domains  
✅ **DDD Patterns** - Aggregate Roots, Value Objects, Domain Events  
✅ **Async Processing** - BullMQ for background jobs (email, reports, etc.)  
✅ **Security** - Helmet, CORS, Rate Limiting, JWT  
✅ **Logging** - Winston with daily rotation  
✅ **Database** - MySQL with Knex migrations  
✅ **Docker Ready** - Containerized for production

---

## 🛠️ Technology Stack

| Layer              | Technology                                  |
| ------------------ | ------------------------------------------- |
| **Runtime**        | Node.js                                     |
| **Framework**      | Express 5.x                                 |
| **Database**       | MySQL 8 + Knex (Query Builder + Migrations) |
| **ORM/Query**      | Knex.js                                     |
| **Cache/Queue**    | Redis + BullMQ                              |
| **Email**          | Nodemailer                                  |
| **Security**       | Helmet, CORS, Rate Limiting, bcrypt, JWT    |
| **Logging**        | Winston                                     |
| **Testing**        | Jest + Supertest                            |
| **HTTP Templates** | Handlebars (for email templates)            |
| **Validation**     | Zod                                         |

---

## 📁 Project Structure

```
ddd/
├── src/
│   ├── config/                 # Configuration files
│   │   └── database.js         # Database connection setup
│   │
│   ├── modules/                # Business Domains (Bounded Contexts)
│   │   ├── order/              # Order Management Domain
│   │   │   ├── domain/         # Business rules (Order entity, events)
│   │   │   ├── application/    # Use cases (CreateOrderService)
│   │   │   ├── infrastructure/ # Data access (repositories, DB queries)
│   │   │   ├── interface/      # API endpoints (HTTP routes, DTOs)
│   │   │   └── workers/        # Background jobs (email, notifications)
│   │   │
│   │   ├── catalog/            # Product Catalog Domain
│   │   │   ├── domain/         # Catalog aggregate, value objects
│   │   │   ├── application/    # Queries and use-cases (GetCatalogList, CreateCatalog)
│   │   │   ├── infrastructure/ # Persistence adapters (MySQLCatalogRepository)
│   │   │   ├── interface/      # HTTP routes, DTOs, controllers
│   │   │   └── mapper/         # Mapping between domain and DTOs
│   │   │
│   │   └── partner/            # Partner/Vendor Domain
│   │       ├── domain/
│   │       ├── application/
│   │       ├── infrastructure/
│   │       └── interface/
│   │
│   └── shared/                 # Shared utilities & infrastructure
│       ├── core/               # Base classes & error handling
│       │   ├── AggregateRoot.js
│       │   ├── AppError.js
│       │   ├── Guard.js
│       │   └── ValueObject.js
│       │
│       ├── infra/              # Shared infrastructure
│       │   ├── database/       # MySQL connection (Singleton)
│       │   ├── email/          # Email service + templates
│       │   ├── http/           # Middleware, error handler
│       │   ├── logging/        # Winston logger
│       │   └── queue/          # BullMQ queue factory
│       │
│       └── utils/              # Helper functions
│           ├── DateUtils.js
│           ├── ObjectUtils.js
│           ├── PaginationUtils.js
│           └── TextUtils.js
│
├── migrations/                 # Database migration files (Knex)
├── docker-compose.yml          # Multi-container setup (App, MySQL, Redis)
├── Dockerfile                  # Container image definition
├── Makefile                    # Development commands
├── knexfile.js                 # Knex configuration
├── server.js                   # Application entry point
└── package.json                # Dependencies
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 16+ (or higher)
- **npm** or **yarn**
- **MySQL** 8+ (or Docker)
- **Redis** (or Docker)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository>
   cd ddd
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or use Makefile
   make install
   ```

3. **Create environment file**

   ```bash
   cp .env.example .env
   ```

4. **Configure `.env` file**

   ```env
   NODE_ENV=development
   PORT=3000

   # Database
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=password
   DB_NAME=ddd_db
   DB_PORT=3306

   # Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379

   # Email
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password

   # JWT
   JWT_SECRET=your-secret-key
   JWT_EXPIRY=7d
   ```

5. **Run database migrations**

   ```bash
   npm run migrate:latest
   # or
   make migrate-up
   ```

6. **Start the server**

   ```bash
   npm run dev
   # or
   make dev
   ```

   Server will run on `http://localhost:3000`

---

## 📝 Development

### Common Commands

| Command                               | Purpose                            |
| ------------------------------------- | ---------------------------------- |
| `make dev`                            | Run server in watch mode (Nodemon) |
| `make start`                          | Run server in production mode      |
| `make test`                           | Run test suite (Jest)              |
| `make module name=payment`            | Generate new DDD module scaffold   |
| `make migrate-make name=create_users` | Create new database migration      |
| `make migrate-up`                     | Run pending migrations             |
| `make migrate-down`                   | Rollback last migration            |
| `make help`                           | Show all available commands        |

### Project Aliases

The project uses `module-alias` for clean imports:

```javascript
// Instead of: require('../../../shared/core')
// You write:
const { AggregateRoot, Guard } = require("@shared/core");
const orderModule = require("@modules/order");
```

**Alias mapping** (in `package.json`):

```json
{
  "_moduleAliases": {
    "@shared": "src/shared",
    "@modules": "src/modules",
    "@config": "src/config"
  }
}
```

---

## 🐳 Docker Deployment

### Quick Start with Docker

```bash
# Build and start all services (App, MySQL, Redis)
make docker-up

# Stop services
make docker-down

# Rebuild and restart
make docker-update

# Scale app to 3 instances
make docker-scale n=3
```

### Docker Services

**docker-compose.yml** includes:

- **app** - Node.js application (Port 3000)
- **mysql** - MySQL database (Port 3306)
- **redis** - Redis cache (Port 6379)

---

## 🗄️ Database Migrations

All database changes go through migrations for version control and reproducibility.

### Create Migration

```bash
make migrate-make name=create_orders_table
```

This creates a file in `migrations/` like:

```javascript
exports.up = function (knex) {
  return knex.schema.createTable("orders", (table) => {
    table.uuid("id").primary();
    table.uuid("customer_id").notNullable();
    table.decimal("total", 10, 2);
    table.enum("status", ["PENDING", "PAID", "CANCELLED"]);
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("orders");
};
```

### Run Migrations

```bash
# Run all pending migrations
make migrate-up

# Rollback last batch
make migrate-down

# Rollback all migrations
make migrate-rollback

# Check status
make db-status
```

---

## 📚 API Documentation

Detailed API endpoints are documented in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

### Health Check

```bash
curl http://localhost:3000/health
```

**Response:**

```json
{
  "status": "OK",
  "uptime": 123.456,
  "db": "Connected"
}
```

### Order Endpoints

```bash
# Create order
POST /api/orders
Content-Type: application/json

{
  "customerId": "uuid-here",
  "items": [
    { "productId": "prod-1", "quantity": 2, "price": 50.00 }
  ],
  "email": "customer@example.com"
}
```

---

## 🏗️ Architecture

This project follows **Domain-Driven Design (DDD)** principles. See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed explanation of:

- **Bounded Contexts** - Isolated business domains
- **Aggregates** - Consistency boundaries
- **Domain Events** - Domain-driven communication
- **Repository Pattern** - Data access abstraction
- **Service Layer** - Business logic orchestration
- **Value Objects** - Immutable concepts
- **DTOs** - Data transfer objects

---

## 🔒 Security Features

✅ **Helmet** - HTTP security headers  
✅ **CORS** - Cross-origin resource sharing control  
✅ **Rate Limiting** - Anti-DDoS protection (100 req/15min per IP)  
✅ **bcrypt** - Password hashing  
✅ **JWT** - Token-based authentication  
✅ **Input Validation** - Zod schema validation  
✅ **Error Handling** - No stack traces exposed to clients

---

## 📊 Logging

Winston logger configured with:

- **Console output** (development)
- **File rotation** (daily logs in `logs/` directory)
- **Request tracking** (HTTP method, URL, duration)
- **Error logging** (stack traces in files, messages to client)

---

## 🧪 Testing

```bash
# Run tests
make test

# Watch mode
make test-watch
```

Uses **Jest** + **Supertest** for unit and integration tests.

---

## 🚨 Troubleshooting

### "Cannot find module '@shared/core'"

**Solution**: Ensure `module-alias/register` is loaded first in `server.js`

### "MySQL Connection Refused"

**Solution**: Check `DB_HOST`, `DB_USER`, `DB_PASSWORD` in `.env`

```bash
# Test MySQL connection
mysql -h localhost -u root -p
```

### "Redis Connection Refused"

**Solution**: Start Redis service

```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis-server

# Docker
docker-compose up -d redis
```

### Background Jobs Not Processing

**Solution**: Ensure Redis is running and BullMQ workers are initialized in `server.js`

---

## 📖 Documentation Files

- **[README.md](./README.md)** - Project overview & setup (you are here)
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - DDD patterns & design decisions
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - API endpoints & examples
- **[CODE_DOCUMENTATION.md](./CODE_DOCUMENTATION.md)** - JSDoc code comments

---

## 🤝 Contributing

1. Create a new branch: `git checkout -b feature/my-feature`
2. Follow DDD structure when adding features
3. Write tests for business logic
4. Submit a pull request

---

## 📄 License

ISC License

---

## 📞 Support

For issues or questions, please check:

1. [Troubleshooting](#troubleshooting) section
2. [ARCHITECTURE.md](./ARCHITECTURE.md) for design patterns
3. [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for API usage

---

**Last Updated**: December 28, 2025  
**Version**: 1.0.0
