# Architecture Guide - Domain Driven Design

## 📚 Table of Contents

1. [DDD Core Concepts](#ddd-core-concepts)
2. [Project Structure](#project-structure)
3. [Bounded Contexts](#bounded-contexts)
4. [Core Domain Patterns](#core-domain-patterns)
5. [Application Layer](#application-layer)
6. [Infrastructure Layer](#infrastructure-layer)
7. [Communication Between Domains](#communication-between-domains)
8. [Design Decisions](#design-decisions)

---

## 🎯 DDD Core Concepts

### Domain-Driven Design Overview

**Domain-Driven Design (DDD)** is an approach to software development focusing on the **business domain** rather than technical implementation.

Key principle: _The code structure mirrors the business reality._

### What Problem Does DDD Solve?

❌ **Without DDD** (Traditional architecture):

```
src/
  models/
    User.js, Order.js, Payment.js, Partner.js  (everything mixed)
  controllers/
    controller1.js, controller2.js, ...
  services/
    service1.js, service2.js, ...  (500+ lines each, high coupling)
  routes/
    routes.js (1000+ lines)

Challenges:
- Hard to understand business logic
- Difficult to test in isolation
- Tightly coupled services
- Impossible to scale teams
```

✅ **With DDD** (This project):

```
src/modules/
  order/                    ← Business domain for orders
    domain/                 ← Business rules
    application/            ← Use cases
    infrastructure/         ← Data access
    interface/              ← API endpoints

  partner/                  ← Separate domain for partners
    domain/
    application/
    infrastructure/
    interface/

Advantages:
- Clear business context
- Easy to test each domain independently
- Low coupling between domains
- Easy to scale teams (one team per domain)
```

---

## 🏗️ Project Structure

### Layered Architecture (Per Module)

Each module follows a **4-layer architecture**:

```
order/                              ← Bounded Context
├── domain/                         ← Layer 1: Business Rules
│   ├── Order.js                   (Aggregate Root)
│   ├── OrderCreatedEvent.js       (Domain Event)
│   └── OrderRepository.js         (Repository Interface)
│
├── application/                    ← Layer 2: Use Cases
│   ├── CreateOrderService.js      (Orchestrates business logic)
│   └── GetOrderService.js         (Query service)
│
├── infrastructure/                 ← Layer 3: Technical Concerns
│   └── MySQLOrderRepository.js   (Implements database queries)
│
└── interface/                      ← Layer 4: API Exposure
    ├── http/
    │   └── orderRoutes.js        (Express routes)
    ├── dtos/
    │   ├── CreateOrderDTO.js     (Input validation)
    │   └── OrderResponseDTO.js   (Output format)
    └── controllers/
        └── OrderController.js    (Request handling)
```

### Layer Responsibilities

| Layer              | Responsibility                                  | Example                                        |
| ------------------ | ----------------------------------------------- | ---------------------------------------------- |
| **Domain**         | Business rules, entities, value objects         | "Can't create order without items"             |
| **Application**    | Orchestrate domain objects, implement use cases | "Save order → Queue email job → Return result" |
| **Infrastructure** | Technical implementation (DB, API calls, files) | "Execute SQL query, write to MySQL"            |
| **Interface**      | HTTP requests/responses, validation             | "Parse JSON, return 200 OK"                    |

### Dependency Direction

```
┌─────────────────────────────────┐
│     Interface (HTTP/REST)       │
│  (orderRoutes.js)               │
└──────────────┬──────────────────┘
               │ depends on
┌──────────────▼──────────────────┐
│   Application (Use Cases)       │
│  (CreateOrderService.js)        │
└──────────────┬──────────────────┘
               │ depends on
┌──────────────▼──────────────────┐
│    Domain (Business Logic)      │
│  (Order.js, Aggregate Root)     │
└──────────────┬──────────────────┘
               │ depends on
┌──────────────▼──────────────────┐
│  Infrastructure (Repositories)  │
│  (MySQLOrderRepository.js)      │
└─────────────────────────────────┘

⚠️ RULE: Outer layers depend on inner layers
         Inner layers NEVER depend on outer layers
```

---

## 📦 Bounded Contexts

A **Bounded Context** is an isolated domain with its own language, rules, and data models.

### Example: Order Context vs Partner Context

#### Order Context (order/)

- **What**: Handles customer orders, payments, fulfillment
- **Language**: "Create order", "Process payment", "Confirm email"
- **Entities**: Order, OrderItem, Customer
- **Events**: `OrderCreated`, `OrderPaid`, `OrderShipped`

#### Partner Context (partner/)

- **What**: Manages vendor/partner accounts
- **Language**: "Register vendor", "Update profile", "Set commission"
- **Entities**: Partner, Partnership, CommissionRate
- **Events**: `PartnerRegistered`, `PartnerSuspended`

### Isolation Benefits

- **Different databases** (optional) - Order uses MySQL, Partner uses MongoDB
- **Different rules** - Order validates inventory, Partner validates tax ID
- **Different teams** - Order team ≠ Partner team
- **Different deployment** - Can scale Order service independently

---

## 💎 Core Domain Patterns

### 1. Aggregate Root

An **Aggregate Root** is the entity that controls consistency within an aggregate.

```javascript
// src/modules/order/domain/Order.js
const { AggregateRoot } = require("@shared/core");

class Order extends AggregateRoot {
  constructor(id, customerId, items) {
    super(); // Initialize domain events array

    this.id = id;
    this.customerId = customerId;
    this.items = items;
    this.status = "PENDING";

    // Record that this order was created
    this.addDomainEvent({
      type: "OrderCreated",
      orderId: id,
      customerId: customerId,
    });
  }

  // Business method - encapsulates business rule
  pay(amount) {
    // RULE: Can only pay pending orders
    if (this.status !== "PENDING") {
      throw new Error("Only pending orders can be paid");
    }

    // RULE: Payment must equal total
    if (amount !== this.getTotal()) {
      throw new Error("Payment amount must match order total");
    }

    this.status = "PAID";
    this.addDomainEvent({ type: "OrderPaid", orderId: this.id });
  }

  getTotal() {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
}
```

**Key Points**:

- Contains business rules (validation, state transitions)
- Controls its own data consistency
- Records domain events
- Has identity (id)

### 2. Value Objects

A **Value Object** is an immutable object that has no identity, only value.

```javascript
// Example: Money value object
class Money {
  constructor(amount, currency = "USD") {
    if (amount < 0) throw new Error("Amount cannot be negative");
    this.amount = Object.freeze({ value: amount }); // Immutable
    this.currency = currency;
  }

  add(other) {
    if (this.currency !== other.currency) {
      throw new Error("Cannot add different currencies");
    }
    return new Money(this.amount.value + other.amount.value, this.currency);
  }

  equals(other) {
    return this.amount.value === other.amount.value && this.currency === other.currency;
  }
}

// Usage
const price1 = new Money(100, "USD");
const price2 = new Money(50, "USD");
const total = price1.add(price2); // Returns new Money(150, 'USD')
```

**Characteristics**:

- Immutable (cannot change after creation)
- No identity (two Money(100) are the same)
- Reusable across aggregates

### 3. Domain Events

**Domain Events** represent something meaningful that happened in the business.

```javascript
// Domain Event Example
class OrderCreatedEvent {
  constructor(orderId, customerId, total, occurredOn = new Date()) {
    this.orderId = orderId;
    this.customerId = customerId;
    this.total = total;
    this.occurredOn = occurredOn;
  }
}

// Usage in domain
class Order extends AggregateRoot {
  constructor(id, customerId, items) {
    super();
    this.id = id;
    this.customerId = customerId;
    this.items = items;

    // Record the event
    this.addDomainEvent(new OrderCreatedEvent(id, customerId, this.getTotal()));
  }
}

// Handler (in Application layer)
class SendOrderConfirmationEmail {
  constructor(emailService) {
    this.emailService = emailService;
  }

  handle(orderCreatedEvent) {
    // Send email when OrderCreated event occurs
    this.emailService.send({
      to: orderCreatedEvent.customerEmail,
      subject: "Order Confirmed",
      body: `Your order ${orderCreatedEvent.orderId} is confirmed`,
    });
  }
}
```

**When to use Domain Events**:

- ✅ Orders paid → Send confirmation email (async)
- ✅ Order created → Update inventory (async)
- ✅ Payment failed → Notify customer (async)
- ❌ Database query (use repositories instead)
- ❌ Validation logic (use value objects instead)

### 4. Repository Pattern

A **Repository** provides access to aggregate roots, abstracting database details.

```javascript
// Domain Layer (Interface/Contract)
class OrderRepository {
  // Contracts - must be implemented
  async save(order) {
    throw new Error("Not implemented");
  }
  async findById(orderId) {
    throw new Error("Not implemented");
  }
  async findByCustomerId(customerId) {
    throw new Error("Not implemented");
  }
}

// Infrastructure Layer (Implementation)
class MySQLOrderRepository extends OrderRepository {
  constructor(dbPool) {
    super();
    this.dbPool = dbPool;
  }

  async save(order) {
    const query = `
      INSERT INTO orders (id, customer_id, status, total, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `;

    await this.dbPool.query(query, [order.id, order.customerId, order.status, order.getTotal()]);

    // Also save items
    for (const item of order.items) {
      await this.dbPool.query("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)", [order.id, item.productId, item.quantity, item.price]);
    }

    return order;
  }

  async findById(orderId) {
    const [rows] = await this.dbPool.query("SELECT * FROM orders WHERE id = ?", [orderId]);

    if (!rows.length) return null;

    // Reconstruct aggregate from database
    return new Order(rows[0].id, rows[0].customer_id, [
      /* items */
    ]);
  }
}

// Usage in Application Layer
class CreateOrderService {
  constructor(orderRepository) {
    this.orderRepository = orderRepository;
  }

  async execute(dto) {
    // Create domain object
    const order = new Order(uuid(), dto.customerId, dto.items);

    // Save via repository (abstraction hides DB details)
    await this.orderRepository.save(order);

    return order;
  }
}
```

**Benefits**:

- ✅ Easy to test (mock repository)
- ✅ Can swap MySQL for MongoDB without changing domain logic
- ✅ Domain logic stays clean (no SQL queries)

### 5. Services (Domain vs Application)

#### Domain Service

Encapsulates business logic that **doesn't belong to a single entity**.

```javascript
// Example: Order pricing rules
class OrderPricingService {
  calculateTotal(order) {
    let subtotal = 0;

    // Calculate item subtotal
    for (const item of order.items) {
      subtotal += item.price * item.quantity;
    }

    // Apply order-level discount
    const discount = this.calculateDiscount(order);

    // Calculate tax
    const tax = (subtotal - discount) * 0.1;

    return {
      subtotal,
      discount,
      tax,
      total: subtotal - discount + tax,
    };
  }

  calculateDiscount(order) {
    // RULE: 10% off for orders > $500
    const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return subtotal > 500 ? subtotal * 0.1 : 0;
  }
}
```

#### Application Service

Orchestrates domain objects to implement a **use case**.

```javascript
// Application Layer
class CreateOrderService {
  constructor(orderRepository, orderPricingService, emailQueue) {
    this.orderRepository = orderRepository;
    this.orderPricingService = orderPricingService;
    this.emailQueue = emailQueue;
  }

  async execute(dto) {
    // 1. Create order aggregate
    const order = new Order(uuid(), dto.customerId, dto.items);

    // 2. Calculate pricing using domain service
    const pricing = this.orderPricingService.calculateTotal(order);
    order.total = pricing.total;

    // 3. Save to database via repository
    await this.orderRepository.save(order);

    // 4. Queue async job (send email)
    await this.emailQueue.add("send-confirmation", {
      orderId: order.id,
      email: dto.email,
    });

    // 5. Return to user
    return { orderId: order.id, status: "CREATED" };
  }
}
```

---

## 🎬 Application Layer

The **Application Layer** contains **Use Case Services** that orchestrate domain objects.

### Service Structure

```javascript
// src/modules/order/application/CreateOrderService.js

/**
 * CreateOrderService
 *
 * Use Case: A customer creates a new order
 *
 * Flow:
 * 1. Create Order aggregate from DTO
 * 2. Validate order using domain rules
 * 3. Save to database via repository
 * 4. Queue async job (send confirmation email)
 * 5. Return result
 */
class CreateOrderService {
  constructor(orderRepository, emailQueue) {
    this.orderRepository = orderRepository;
    this.emailQueue = emailQueue;
  }

  /**
   * @param {Object} dto - CreateOrderDTO
   * @returns {Promise<Object>} { orderId, status }
   */
  async execute(dto) {
    // Domain object creation (with validation)
    const order = new Order(uuid(), dto.customerId, dto.items);

    // Persist
    await this.orderRepository.save(order);

    // Background task
    await this.emailQueue.add(
      "send-confirmation",
      {
        orderId: order.id,
        email: dto.email,
        total: order.getTotal(),
      },
      {
        attempts: 3,
        backoff: 5000,
      }
    );

    // Fast response to user
    return { orderId: order.id, status: "CREATED" };
  }
}

module.exports = CreateOrderService;
```

### Key Principles

1. **Thin Services** - Orchestration only, not business logic
2. **Dependency Injection** - Pass dependencies in constructor
3. **DTO Usage** - Input validation at boundary
4. **Async Awareness** - Use queues for long operations

---

## 🔧 Infrastructure Layer

The **Infrastructure Layer** implements technical concerns.

### Repository Implementation

```javascript
// src/modules/order/infrastructure/MySQLOrderRepository.js

const Order = require("../domain/Order");

class MySQLOrderRepository {
  constructor(dbPool) {
    this.dbPool = dbPool;
  }

  async save(order) {
    // Insert order
    await this.dbPool.query(
      `INSERT INTO orders (id, customer_id, status, total, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [order.id, order.customerId, order.status, order.getTotal()]
    );

    // Insert items
    for (const item of order.items) {
      await this.dbPool.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES (?, ?, ?, ?)`,
        [order.id, item.productId, item.quantity, item.price]
      );
    }

    return order;
  }

  async findById(orderId) {
    const [orderRows] = await this.dbPool.query("SELECT * FROM orders WHERE id = ?", [orderId]);

    if (!orderRows.length) return null;

    const [itemRows] = await this.dbPool.query("SELECT * FROM order_items WHERE order_id = ?", [orderId]);

    // Reconstruct aggregate
    const order = new Order(
      orderRows[0].id,
      orderRows[0].customer_id,
      itemRows.map((row) => ({
        productId: row.product_id,
        quantity: row.quantity,
        price: row.price,
      }))
    );

    order.status = orderRows[0].status;
    return order;
  }
}

module.exports = MySQLOrderRepository;
```

---

## 🌉 Communication Between Domains

### Scenario 1: Domain Events (Async)

When **Order** needs to notify **Partner** of a sale:

```
Order Domain          Queue/Bus          Partner Domain
─────────────        ────────────        ──────────────
Create Order
    ↓
Add DomainEvent
    ├─ OrderCreated
    ├─ OrderPaid
    └─ OrderShipped
    ↓
Save to DB
    ├─ Emit Events
    └─ → Redis Queue
                         Async Handler
                              ↓
                         Update Partner
                         Commission Balance
                              ↓
                         Emit PartnerEarned
```

**Code Example**:

```javascript
// order/application/CreateOrderService.js
class CreateOrderService {
  async execute(dto) {
    const order = new Order(...);
    await this.orderRepository.save(order);

    // Fire events to queue
    for (const event of order.domainEvents) {
      await this.eventBus.publish(event);
    }
  }
}

// partner/workers/UpdateCommissionWorker.js
class UpdateCommissionWorker {
  async handle(event) {
    if (event.type === 'OrderPaid') {
      const commission = event.total * 0.05;
      await this.partnerRepository.updateCommission(
        event.partnerId,
        commission
      );
    }
  }
}
```

### Scenario 2: API Calls (Sync)

When **Order** needs immediate data from **Partner**:

```javascript
// order/application/CreateOrderService.js
class CreateOrderService {
  constructor(orderRepository, partnerClient) {
    this.orderRepository = orderRepository;
    this.partnerClient = partnerClient; // HTTP client
  }

  async execute(dto) {
    // Get partner details via API
    const partner = await this.partnerClient.getPartner(dto.partnerId);

    if (!partner.isActive) {
      throw new AppError('Partner is inactive', 400);
    }

    // Create order
    const order = new Order(...);
    await this.orderRepository.save(order);
  }
}
```

⚠️ **Note**: Use async events when possible to avoid tight coupling.

---

## 🎨 Design Decisions

### Why This Architecture?

| Decision                  | Reason                                               |
| ------------------------- | ---------------------------------------------------- |
| **Modules over Features** | Aligns with business domains, not technical features |
| **Repositories**          | Abstract DB implementation, easier to test           |
| **Domain Events**         | Decouple domains, enable async processing            |
| **Value Objects**         | Ensure data integrity, encapsulate rules             |
| **DTOs**                  | Validate input at boundaries, document contracts     |
| **Aggregate Roots**       | Clear consistency boundaries, easier transactions    |

### Trade-offs

| Pro                 | Con                              |
| ------------------- | -------------------------------- |
| ✅ Clear structure  | ❌ More boilerplate initially    |
| ✅ Easy to test     | ❌ Learning curve (DDD concepts) |
| ✅ Scalable teams   | ❌ Overkill for small projects   |
| ✅ Business-focused | ❌ Requires discipline           |

---

## 📋 Checklist: Creating a New Module

When adding a new bounded context (e.g., `payment`):

```bash
# 1. Generate scaffold
make module name=payment

# 2. Create domain layer
# src/modules/payment/domain/Payment.js (Aggregate Root)
# src/modules/payment/domain/PaymentRepository.js (Interface)

# 3. Create application layer
# src/modules/payment/application/ProcessPaymentService.js

# 4. Create infrastructure layer
# src/modules/payment/infrastructure/StripePaymentGateway.js
# src/modules/payment/infrastructure/MySQLPaymentRepository.js

# 5. Create interface layer
# src/modules/payment/interface/http/paymentRoutes.js
# src/modules/payment/interface/dtos/ProcessPaymentDTO.js

# 6. Wire in server.js
const paymentModule = require('@modules/payment');
app.use('/api/payments', paymentModule(dbPool));
```

---

## 🔗 Related Documentation

- [README.md](./README.md) - Project setup & commands
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API endpoints
- [CODE_DOCUMENTATION.md](./CODE_DOCUMENTATION.md) - Code comments & JSDoc

---

**Last Updated**: December 28, 2025  
**DDD Reference**: https://martinfowler.com/bliki/DomainDrivenDesign.html
