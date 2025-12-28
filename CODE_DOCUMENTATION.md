# Code Documentation

Complete JSDoc reference for all modules and utilities in the codebase.

## 📋 Table of Contents

- [Core Domain Patterns](#core-domain-patterns)
- [Shared Infrastructure](#shared-infrastructure)
- [Utilities](#utilities)
- [Module Structure](#module-structure)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)

---

## 💎 Core Domain Patterns

### AggregateRoot

**File**: [src/shared/core/AggregateRoot.js](src/shared/core/AggregateRoot.js)

Base class for all aggregate roots. An aggregate root is the entry point to an aggregate, controlling consistency and transactions.

#### Key Methods

```javascript
/**
 * Add a domain event to the event queue
 * @param {Object} event - The domain event
 * @returns {void}
 */
addDomainEvent(event)

/**
 * Get all recorded domain events
 * @returns {Array} Array of events with timestamps
 */
get domainEvents()

/**
 * Clear events after publishing
 * @returns {void}
 */
clearEvents()
```

#### Usage Example

```javascript
const { AggregateRoot } = require("@shared/core");

class Order extends AggregateRoot {
  constructor(id, customerId, items) {
    super(); // Initialize events array

    this.id = id;
    this.customerId = customerId;
    this.items = items;
    this.status = "PENDING";

    // Record the creation event
    this.addDomainEvent({
      type: "OrderCreated",
      orderId: id,
      customerId: customerId,
    });
  }

  // Business method
  pay(amount) {
    if (this.status !== "PENDING") {
      throw new Error("Can only pay pending orders");
    }

    this.status = "PAID";
    this.addDomainEvent({
      type: "OrderPaid",
      orderId: this.id,
      amount: amount,
    });
  }

  getTotal() {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
}

// Usage in application layer
async function createOrder(dto) {
  // Create aggregate
  const order = new Order(uuid(), dto.customerId, dto.items);

  // Save to database
  await orderRepository.save(order);

  // Publish events
  for (const event of order.domainEvents) {
    await eventBus.publish(event);
  }

  // Clear events after publishing
  order.clearEvents();
}
```

---

### AppError

**File**: [src/shared/core/AppError.js](src/shared/core/AppError.js)

Custom error class distinguishing operational errors (expected) from programming errors (bugs).

#### Constructor

```javascript
/**
 * @param {string} message - User-friendly error message
 * @param {number} [statusCode=500] - HTTP status code
 * @param {any} [details=null] - Additional error context
 */
constructor(message, (statusCode = 500), (details = null));
```

#### Properties

| Property        | Type    | Description                                 |
| --------------- | ------- | ------------------------------------------- |
| `message`       | string  | Error message                               |
| `statusCode`    | number  | HTTP status code                            |
| `status`        | string  | 'fail' (4xx) or 'error' (5xx)               |
| `isOperational` | boolean | Whether this is an expected error           |
| `details`       | any     | Additional context (validation errors, etc) |

#### Usage Examples

```javascript
const { AppError } = require("@shared/core");

// Simple error
throw new AppError("User not found", 404);

// Validation error with details
throw new AppError("Validation failed", 422, [
  { field: "email", message: "Invalid format" },
  { field: "age", message: "Must be >= 18" },
]);

// Server error with context
throw new AppError("Database query failed", 500, {
  query: "SELECT * FROM users",
  error: err.message,
});
```

#### In Error Handler

```javascript
// Operational errors (4xx) are sent to client
if (error.isOperational && error.statusCode < 500) {
  return res.status(error.statusCode).json({
    success: false,
    status: error.status,
    message: error.message,
    details: error.details,
  });
}

// Programming errors (bugs) crash the process
console.error("FATAL ERROR:", error);
process.exit(1);
```

---

### Guard

**File**: [src/shared/core/Guard.js](src/shared/core/Guard.js)

Defensive programming utility for guard clauses. Fail fast with clear validation.

#### Static Methods

```javascript
/**
 * Check if value is null or undefined
 */
static isNullOrUndefined(value: any): boolean

/**
 * Check if string is empty (after trim)
 */
static isEmptyString(value: any): boolean

/**
 * Throw error if value is null/undefined
 */
static againstNullOrUndefined(value: any, message?: string): void

/**
 * Throw error if string is empty
 */
static againstEmptyString(value: any, message?: string): void

/**
 * Throw error if array is empty
 */
static againstEmptyArray(value: any, message?: string): void

/**
 * Throw error if number is <= 0
 */
static againstNegativeOrZero(value: any, message?: string): void
```

#### Usage Example

```javascript
const { Guard, AppError } = require("@shared/core");

class OrderService {
  constructor(orderRepository) {
    Guard.againstNullOrUndefined(orderRepository, "Repository is required");
    this.orderRepository = orderRepository;
  }

  async execute(dto) {
    // Validate inputs at function start (guard clauses)
    Guard.againstNullOrUndefined(dto, "DTO is required");
    Guard.againstNullOrUndefined(dto.customerId, "Customer ID is required");
    Guard.againstEmptyArray(dto.items, "Order must have at least one item");

    // Now safe to use dto properties
    const order = new Order(dto.customerId, dto.items);

    for (const item of dto.items) {
      Guard.againstNegativeOrZero(item.quantity, `Item quantity must be > 0`);
      Guard.againstNegativeOrZero(item.price, `Item price must be > 0`);
    }

    // Process order...
  }
}
```

#### Why Guard Clauses?

❌ **Without guards** (nested conditions):

```javascript
function processOrder(dto) {
  if (dto !== null && dto !== undefined) {
    if (dto.customerId !== null && dto.customerId !== undefined) {
      if (Array.isArray(dto.items) && dto.items.length > 0) {
        // 3 levels of nesting just for validation!
        // Process order...
      }
    }
  }
}
```

✅ **With guards** (early returns):

```javascript
function processOrder(dto) {
  Guard.againstNullOrUndefined(dto, "DTO required");
  Guard.againstNullOrUndefined(dto.customerId, "Customer ID required");
  Guard.againstEmptyArray(dto.items, "Items required");

  // No nesting, fail fast, clear preconditions
  // Process order...
}
```

---

### ValueObject

**File**: [src/shared/core/ValueObject.js](src/shared/core/ValueObject.js)

Base class for value objects. Immutable objects with no identity.

#### Methods

```javascript
/**
 * Compare with another value object
 * @param {ValueObject} other - Object to compare
 * @returns {boolean} true if same type and values
 */
equals(other: ValueObject): boolean
```

#### Creating a Value Object

```javascript
const { ValueObject } = require("@shared/core");

class Email extends ValueObject {
  constructor(address) {
    super();

    // Validation
    if (!this.isValidEmail(address)) {
      throw new Error("Invalid email format");
    }

    // Immutable
    Object.freeze(this);
    this.address = address;
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Optional: override toString for convenience
  toString() {
    return this.address;
  }
}

// Usage
const email1 = new Email("john@example.com");
const email2 = new Email("john@example.com");

console.log(email1.equals(email2)); // true (same value)
console.log(email1 === email2); // false (different objects)

// Immutable
email1.address = "hacker@evil.com"; // Error! (frozen)
```

#### Another Example: Money

```javascript
class Money extends ValueObject {
  constructor(amount, currency = "USD") {
    super();

    if (amount < 0) throw new Error("Amount cannot be negative");
    if (typeof amount !== "number") throw new Error("Amount must be number");

    this.amount = amount;
    this.currency = currency;

    Object.freeze(this);
  }

  // Business logic on value object
  add(other) {
    if (!(other instanceof Money)) {
      throw new Error("Can only add Money to Money");
    }

    if (this.currency !== other.currency) {
      throw new Error(`Cannot add ${this.currency} to ${other.currency}`);
    }

    // Return new Money (immutable pattern)
    return new Money(this.amount + other.amount, this.currency);
  }

  multiply(factor) {
    if (factor < 0) throw new Error("Factor must be positive");
    return new Money(this.amount * factor, this.currency);
  }

  equals(other) {
    if (!(other instanceof Money)) return false;
    return super.equals(other);
  }

  toString() {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }
}

// Usage in aggregate
class OrderItem {
  constructor(productId, quantity, price) {
    Guard.againstNullOrUndefined(productId);
    Guard.againstNegativeOrZero(quantity);

    this.productId = productId;
    this.quantity = quantity;
    this.price = new Money(price); // Value object
  }

  getSubtotal() {
    return this.price.multiply(this.quantity);
  }
}
```

---

## 🔧 Shared Infrastructure

### EmailService

**File**: [src/shared/infra/email/EmailService.js](src/shared/infra/email/EmailService.js)

Send emails using Nodemailer and Handlebars templates.

```javascript
const emailService = new EmailService({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Send email
await emailService.send({
  to: "customer@example.com",
  subject: "Order Confirmation",
  template: "order-confirmation", // Without .hbs extension
  context: {
    orderId: order.id,
    total: order.total,
    items: order.items,
  },
});
```

### Logger

**File**: [src/shared/infra/logging/Logger.js](src/shared/infra/logging/Logger.js)

Winston logger for application logging.

```javascript
const logger = require("@shared/infra/logging/Logger");

// Log levels
logger.info("Server started", { port: 3000 });
logger.warn("High memory usage", { memory: "512MB" });
logger.error("Database connection failed", { error: err });

// Structured logging
logger.info("Order created", {
  orderId: order.id,
  customerId: order.customerId,
  total: order.total,
});
```

### HttpLogger

**File**: [src/shared/infra/logging/HttpLogger.js](src/shared/infra/logging/HttpLogger.js)

Express middleware for HTTP request logging.

```javascript
// Logs all HTTP requests with:
// - Method (GET, POST, etc)
// - URL
// - Status code
// - Response time
// - User IP

// Example log:
// [10:30:45] POST /api/orders 201 45ms
```

### Queue Factory

**File**: [src/shared/infra/queue/queueFactory.js](src/shared/infra/queue/queueFactory.js)

Factory for creating BullMQ queues (Redis-based job queue).

```javascript
const { createQueue } = require("@shared/infra/queue/queueFactory");

// Create queue
const emailQueue = createQueue("email-queue");

// Add job
await emailQueue.add(
  "send-confirmation",
  {
    orderId: order.id,
    email: customer.email,
    total: order.total,
  },
  {
    attempts: 3, // Retry 3 times
    backoff: 5000, // Wait 5s between retries
    removeOnComplete: true, // Clean up after success
  }
);

// Process jobs
emailQueue.process("send-confirmation", async (job) => {
  await emailService.send({
    to: job.data.email,
    subject: "Order Confirmation",
    template: "order-confirmation",
    context: job.data,
  });
});
```

---

## 🛠️ Utilities

### DateUtils

**File**: [src/shared/utils/DateUtils.js](src/shared/utils/DateUtils.js)

Date manipulation utilities using dayjs.

```javascript
const DateUtils = require("@shared/utils/DateUtils");

// Format
DateUtils.format(new Date(), "YYYY-MM-DD HH:mm:ss");
// '2025-12-28 10:30:45'

// Add days
DateUtils.addDays(new Date(), 7);
// Date 7 days from now

// Is past
DateUtils.isPast(new Date("2025-01-01"));
// true

// Is future
DateUtils.isFuture(new Date("2026-01-01"));
// true
```

### ObjectUtils

**File**: [src/shared/utils/ObjectUtils.js](src/shared/utils/ObjectUtils.js)

Object manipulation utilities.

```javascript
const ObjectUtils = require("@shared/utils/ObjectUtils");

// Deep clone
const copy = ObjectUtils.deepClone({ a: { b: 1 } });

// Merge
const merged = ObjectUtils.merge({ a: 1 }, { b: 2 });
// { a: 1, b: 2 }

// Get nested value
ObjectUtils.get({ user: { name: "John" } }, "user.name");
// 'John'

// Pick properties
ObjectUtils.pick({ a: 1, b: 2, c: 3 }, ["a", "b"]);
// { a: 1, b: 2 }
```

### PaginationUtils

**File**: [src/shared/utils/PaginationUtils.js](src/shared/utils/PaginationUtils.js)

Pagination helpers.

```javascript
const PaginationUtils = require('@shared/utils/PaginationUtils');

// Calculate offset
PaginationUtils.getOffset(page: 2, limit: 20);
// 20 (offset)

// Get pagination metadata
PaginationUtils.getPaginationMeta({
  page: 1,
  limit: 20,
  total: 150
});
// {
//   page: 1,
//   limit: 20,
//   total: 150,
//   pages: 8,
//   hasNext: true,
//   hasPrev: false
// }
```

### TextUtils

**File**: [src/shared/utils/TextUtils.js](src/shared/utils/TextUtils.js)

String manipulation utilities.

```javascript
const TextUtils = require("@shared/utils/TextUtils");

// Slugify
TextUtils.slugify("Hello World 2025");
// 'hello-world-2025'

// Capitalize
TextUtils.capitalize("john");
// 'John'

// Truncate
TextUtils.truncate("Hello world", 5);
// 'Hello...'

// camelCase to snake_case
TextUtils.toSnakeCase("userName");
// 'user_name'

// snake_case to camelCase
TextUtils.toCamelCase("user_name");
// 'userName'
```

---

## 📦 Module Structure

Each module follows this pattern:

```
module-name/
├── domain/
│   ├── Entity.js              # Aggregate root
│   ├── ValueObject.js         # Value objects
│   ├── Repository.js          # Interface (abstract)
│   └── Events.js              # Domain events
│
├── application/
│   ├── CreateService.js       # Use case 1
│   ├── UpdateService.js       # Use case 2
│   └── GetService.js          # Query service
│
├── infrastructure/
│   ├── MySQLRepository.js    # Implements Repository
│   └── ExternalService.js    # 3rd party integrations
│
├── interface/
│   ├── http/
│   │   └── moduleRoutes.js    # Express routes
│   ├── dtos/
│   │   ├── CreateDTO.js
│   │   └── ResponseDTO.js
│   └── controllers/
│       └── moduleController.js
│
├── workers/
│   └── JobWorker.js           # BullMQ job handlers
│
└── index.js                   # Module wiring & export
```

### Creating a Repository

```javascript
// domain/UserRepository.js (Interface)
class UserRepository {
  async save(user) {
    throw new Error("Not implemented");
  }
  async findById(id) {
    throw new Error("Not implemented");
  }
  async findByEmail(email) {
    throw new Error("Not implemented");
  }
}

// infrastructure/MySQLUserRepository.js (Implementation)
class MySQLUserRepository extends UserRepository {
  constructor(dbPool) {
    super();
    this.dbPool = dbPool;
  }

  async save(user) {
    const query = `
      INSERT INTO users (id, email, name)
      VALUES (?, ?, ?)
    `;
    await this.dbPool.query(query, [user.id, user.email, user.name]);
    return user;
  }

  async findById(id) {
    const [rows] = await this.dbPool.query("SELECT * FROM users WHERE id = ?", [id]);

    if (!rows.length) return null;

    const row = rows[0];
    return new User(row.id, row.email, row.name);
  }

  async findByEmail(email) {
    const [rows] = await this.dbPool.query("SELECT * FROM users WHERE email = ?", [email]);

    if (!rows.length) return null;

    const row = rows[0];
    return new User(row.id, row.email, row.name);
  }
}
```

### Creating a Service

```javascript
// application/CreateUserService.js
class CreateUserService {
  /**
   * @param {UserRepository} userRepository
   * @param {EmailService} emailService
   */
  constructor(userRepository, emailService) {
    Guard.againstNullOrUndefined(userRepository);
    Guard.againstNullOrUndefined(emailService);

    this.userRepository = userRepository;
    this.emailService = emailService;
  }

  /**
   * Create user use case
   * @param {CreateUserDTO} dto
   * @returns {Promise<User>}
   */
  async execute(dto) {
    // 1. Validate
    Guard.againstNullOrUndefined(dto.email, "Email is required");
    Guard.againstNullOrUndefined(dto.name, "Name is required");

    // 2. Check if user exists
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new AppError("Email already registered", 409);
    }

    // 3. Create domain object
    const user = new User(uuid(), dto.email, dto.name);

    // 4. Persist
    await this.userRepository.save(user);

    // 5. Send async task
    await emailService.sendWelcome(user);

    return user;
  }
}
```

---

## ✅ Best Practices

### 1. Always Use Guard Clauses

```javascript
// ✅ Good
function createOrder(dto, repository) {
  Guard.againstNullOrUndefined(dto, "DTO required");
  Guard.againstNullOrUndefined(repository, "Repository required");
  Guard.againstEmptyArray(dto.items, "Items required");

  // Safe to use dto and repository
}

// ❌ Avoid
function createOrder(dto, repository) {
  if (dto && repository && dto.items && dto.items.length > 0) {
    // Nested conditions...
  }
}
```

### 2. Use Value Objects for Domain Concepts

```javascript
// ✅ Good - Creates semantic meaning
class User {
  constructor(id, email, phone) {
    this.id = id;
    this.email = new Email(email); // Value object
    this.phone = new PhoneNumber(phone); // Value object
  }
}

// ❌ Avoid - Just strings
class User {
  constructor(id, email, phone) {
    this.id = id;
    this.email = email; // String (easy to misuse)
    this.phone = phone; // String (easy to misuse)
  }
}
```

### 3. Throw Domain Errors, Catch at Boundary

```javascript
// ✅ Good - Domain logic throws domain-specific errors
class Order extends AggregateRoot {
  pay(amount) {
    if (amount < 0) {
      throw new AppError("Amount cannot be negative", 400);
    }

    if (this.status !== "PENDING") {
      throw new AppError("Order is not pending", 400);
    }

    this.status = "PAID";
  }
}

// At the boundary (HTTP), catch and format
app.post("/orders/:id/pay", async (req, res, next) => {
  try {
    const order = await repository.findById(req.params.id);
    order.pay(req.body.amount);
    await repository.save(order);
    res.json({ orderId: order.id });
  } catch (error) {
    next(error); // Pass to error handler
  }
});
```

### 4. Use Dependency Injection

```javascript
// ✅ Good - Dependencies injected
class CreateOrderService {
  constructor(orderRepository, emailQueue) {
    this.orderRepository = orderRepository;
    this.emailQueue = emailQueue;
  }

  async execute(dto) {
    // Can use injected dependencies
  }
}

// Easy to test with mocks
const mockRepository = { save: jest.fn() };
const mockQueue = { add: jest.fn() };
const service = new CreateOrderService(mockRepository, mockQueue);

// ❌ Avoid - Hardcoded dependencies
class CreateOrderService {
  async execute(dto) {
    const repo = new OrderRepository(); // Can't test easily
    const queue = new Queue(); // Can't mock
  }
}
```

### 5. Validate at Entry Point (DTO)

```javascript
// ✅ Good - Validate as soon as data enters
app.post("/orders", async (req, res, next) => {
  try {
    // Validate incoming data
    const dto = new CreateOrderDTO(req.body);

    const service = new CreateOrderService(repo);
    const order = await service.execute(dto);

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
});

// ❌ Avoid - Validating in domain
class Order extends AggregateRoot {
  constructor(id, customerId, items) {
    // Too late - invalid data already entered the system
    if (!this.isValidCustomerId(customerId)) {
      throw new Error("Invalid customer");
    }
  }
}
```

---

## 🔄 Common Patterns

### Pattern: Aggregate + Repository + Service

```javascript
// 1. Domain: Define aggregate and behavior
class Invoice extends AggregateRoot {
  constructor(id, clientId, items) {
    super();
    Guard.againstNullOrUndefined(id, "ID required");
    Guard.againstEmptyArray(items, "Items required");

    this.id = id;
    this.clientId = clientId;
    this.items = items;
    this.status = "DRAFT";

    this.addDomainEvent({
      type: "InvoiceCreated",
      invoiceId: id,
    });
  }

  send() {
    if (this.status !== "DRAFT") {
      throw new AppError("Only drafts can be sent", 400);
    }

    this.status = "SENT";
    this.addDomainEvent({ type: "InvoiceSent", invoiceId: this.id });
  }
}

// 2. Domain: Define repository interface
class InvoiceRepository {
  async save(invoice) {
    throw new Error("Not implemented");
  }
  async findById(id) {
    throw new Error("Not implemented");
  }
}

// 3. Infrastructure: Implement repository
class MySQLInvoiceRepository extends InvoiceRepository {
  constructor(dbPool) {
    super();
    this.dbPool = dbPool;
  }

  async save(invoice) {
    await this.dbPool.query("INSERT INTO invoices (id, client_id, status) VALUES (?, ?, ?)", [invoice.id, invoice.clientId, invoice.status]);
    return invoice;
  }

  async findById(id) {
    const [rows] = await this.dbPool.query("SELECT * FROM invoices WHERE id = ?", [id]);
    if (!rows.length) return null;

    const row = rows[0];
    return new Invoice(row.id, row.client_id, []);
  }
}

// 4. Application: Create use case service
class CreateInvoiceService {
  constructor(invoiceRepository, emailQueue) {
    this.invoiceRepository = invoiceRepository;
    this.emailQueue = emailQueue;
  }

  async execute(dto) {
    const invoice = new Invoice(uuid(), dto.clientId, dto.items);
    await this.invoiceRepository.save(invoice);

    for (const event of invoice.domainEvents) {
      await this.emailQueue.add("invoice-event", event);
    }

    invoice.clearEvents();
    return invoice;
  }
}

// 5. Interface: Wire and expose via HTTP
const express = require("express");
const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const dto = new CreateInvoiceDTO(req.body);
    const service = new CreateInvoiceService(repository, emailQueue);
    const invoice = await service.execute(dto);
    res.status(201).json(invoice);
  } catch (error) {
    next(error);
  }
});
```

### Pattern: Domain Event Handler

```javascript
// Define event
class OrderCreatedEvent {
  constructor(orderId, customerId, total) {
    this.type = "OrderCreated";
    this.orderId = orderId;
    this.customerId = customerId;
    this.total = total;
  }
}

// Handler in another bounded context
class UpdatePartnerCommissionHandler {
  constructor(partnerRepository) {
    this.partnerRepository = partnerRepository;
  }

  async handle(event) {
    if (event.type !== "OrderCreated") return;

    // Get partner from order
    const partner = await this.partnerRepository.findByOrder(event.orderId);
    if (!partner) return;

    // Update commission (separate aggregate)
    const commission = event.total * 0.05;
    partner.addCommission(commission);

    await this.partnerRepository.save(partner);
  }
}

// Register handler in BullMQ worker
const orderEventQueue = createQueue("order-events");

orderEventQueue.process("OrderCreated", async (job) => {
  const handler = new UpdatePartnerCommissionHandler(partnerRepository);
  await handler.handle(job.data);
});
```

---

## 📞 Quick Reference

### Importing Core Classes

```javascript
// Named imports
const { AggregateRoot, AppError, Guard, ValueObject } = require("@shared/core");

// Individual imports
const AggregateRoot = require("@shared/core/AggregateRoot");
const AppError = require("@shared/core/AppError");
```

### Common Guard Checks

```javascript
// Null/undefined check
Guard.againstNullOrUndefined(value, "Error message");

// Empty string check
Guard.againstEmptyString(value, "Error message");

// Empty array check
Guard.againstEmptyArray(value, "Error message");

// Positive number check
Guard.againstNegativeOrZero(value, "Error message");
```

### Error Codes

| Code | Meaning       | Usage                    |
| ---- | ------------- | ------------------------ |
| 400  | Bad Request   | Input validation error   |
| 401  | Unauthorized  | Missing/invalid token    |
| 403  | Forbidden     | No permission            |
| 404  | Not Found     | Resource missing         |
| 409  | Conflict      | Duplicate resource       |
| 422  | Unprocessable | Validation error details |
| 500  | Server Error  | Unexpected error         |
| 503  | Unavailable   | Database/service down    |

---

**Last Updated**: December 28, 2025  
**Version**: 1.0.0
