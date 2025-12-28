# API Documentation

## 📋 Table of Contents

- [Base URL & Authentication](#base-url--authentication)
- [Health Check](#health-check)
- [Order Endpoints](#order-endpoints)
- [Partner Endpoints](#partner-endpoints)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Testing Endpoints](#testing-endpoints)

---

## 🔗 Base URL & Authentication

### Development

```
http://localhost:3000/api
```

### Production

```
https://api.example.com/api
```

### Authentication

Most endpoints require **Bearer Token** in header:

```bash
Authorization: Bearer <jwt_token>
```

**Example Request**:

```bash
curl -X GET http://localhost:3000/api/orders \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

## ✅ Health Check

Check if the server is running and database is connected.

### Endpoint

```http
GET /health
```

### Response

**Success (200)**:

```json
{
  "status": "OK",
  "uptime": 123.456,
  "db": "Connected"
}
```

**Database Error (503)**:

```json
{
  "status": "ERROR",
  "db": "Disconnected",
  "error": "ECONNREFUSED"
}
```

### Example

```bash
curl http://localhost:3000/health
```

---

## 📦 Order Endpoints

### Create Order

Create a new customer order.

#### Endpoint

```http
POST /api/orders
Content-Type: application/json
```

#### Request Body

```json
{
  "customerId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "customer@example.com",
  "items": [
    {
      "productId": "prod-001",
      "quantity": 2,
      "price": 49.99
    },
    {
      "productId": "prod-002",
      "quantity": 1,
      "price": 99.99
    }
  ]
}
```

#### Request Parameters

| Field               | Type   | Required | Description                       |
| ------------------- | ------ | -------- | --------------------------------- |
| `customerId`        | UUID   | ✅       | Customer's unique identifier      |
| `email`             | string | ✅       | Customer email (for confirmation) |
| `items`             | array  | ✅       | Array of order items (min 1)      |
| `items[].productId` | string | ✅       | Product identifier                |
| `items[].quantity`  | number | ✅       | Quantity (positive integer)       |
| `items[].price`     | number | ✅       | Unit price (decimal, positive)    |

#### Response

**Success (201 Created)**:

```json
{
  "success": true,
  "data": {
    "orderId": "order-550e8400-e29b-41d4-a716-446655440000",
    "status": "CREATED",
    "customerId": "550e8400-e29b-41d4-a716-446655440000",
    "total": 199.97,
    "items": 3,
    "createdAt": "2025-12-28T10:30:00Z"
  }
}
```

**Validation Error (400)**:

```json
{
  "success": false,
  "status": "fail",
  "message": "Items cannot be empty",
  "statusCode": 400
}
```

#### Example

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "customer@example.com",
    "items": [
      {
        "productId": "prod-001",
        "quantity": 2,
        "price": 49.99
      }
    ]
  }'
```

#### What Happens Behind the Scenes

1. ✅ Create Order aggregate with validation
2. ✅ Save order to MySQL database
3. ✅ Queue async email job in Redis
4. ✅ Return immediately (email sent in background)
5. 📧 Email sent asynchronously via BullMQ worker

---

### Get Order by ID

Retrieve a specific order by its ID.

#### Endpoint

```http
GET /api/orders/:orderId
Authorization: Bearer <token>
```

#### URL Parameters

| Parameter | Type | Description               |
| --------- | ---- | ------------------------- |
| `orderId` | UUID | Order's unique identifier |

#### Response

**Success (200)**:

```json
{
  "success": true,
  "data": {
    "orderId": "order-550e8400-e29b-41d4-a716-446655440000",
    "customerId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "PAID",
    "total": 199.97,
    "items": [
      {
        "productId": "prod-001",
        "quantity": 2,
        "price": 49.99,
        "subtotal": 99.98
      }
    ],
    "createdAt": "2025-12-28T10:30:00Z",
    "updatedAt": "2025-12-28T10:35:00Z"
  }
}
```

**Not Found (404)**:

```json
{
  "success": false,
  "status": "fail",
  "message": "Order order-invalid not found",
  "statusCode": 404
}
```

#### Example

```bash
curl http://localhost:3000/api/orders/order-550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

### List Orders

Get all orders with pagination and filtering.

#### Endpoint

```http
GET /api/orders?page=1&limit=20&status=PAID
Authorization: Bearer <token>
```

#### Query Parameters

| Parameter    | Type   | Default | Description                                 |
| ------------ | ------ | ------- | ------------------------------------------- |
| `page`       | number | 1       | Page number (starts at 1)                   |
| `limit`      | number | 20      | Items per page (max 100)                    |
| `status`     | string | -       | Filter by status (PENDING, PAID, CANCELLED) |
| `customerId` | UUID   | -       | Filter by customer ID                       |

#### Response

**Success (200)**:

```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "orderId": "order-1",
        "customerId": "cust-1",
        "status": "PAID",
        "total": 199.97,
        "createdAt": "2025-12-28T10:30:00Z"
      },
      {
        "orderId": "order-2",
        "customerId": "cust-1",
        "status": "PENDING",
        "total": 49.99,
        "createdAt": "2025-12-27T15:20:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 2,
      "pages": 1
    }
  }
}
```

#### Example

```bash
# Get page 1, 20 items per page
curl "http://localhost:3000/api/orders?page=1&limit=20" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."

# Filter by status
curl "http://localhost:3000/api/orders?status=PAID" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

### Pay Order

Mark an order as paid.

#### Endpoint

```http
POST /api/orders/:orderId/pay
Authorization: Bearer <token>
Content-Type: application/json
```

#### URL Parameters

| Parameter | Type | Description               |
| --------- | ---- | ------------------------- |
| `orderId` | UUID | Order's unique identifier |

#### Request Body

```json
{
  "amount": 199.97,
  "paymentMethod": "credit_card"
}
```

#### Response

**Success (200)**:

```json
{
  "success": true,
  "data": {
    "orderId": "order-550e8400-e29b-41d4-a716-446655440000",
    "status": "PAID",
    "paidAt": "2025-12-28T10:35:00Z"
  }
}
```

**Validation Error (400)**:

```json
{
  "success": false,
  "status": "fail",
  "message": "Payment amount must match order total",
  "statusCode": 400
}
```

#### Example

```bash
curl -X POST http://localhost:3000/api/orders/order-550e8400-e29b-41d4-a716-446655440000/pay \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 199.97,
    "paymentMethod": "credit_card"
  }'
```

---

## 👥 Partner Endpoints

### Get All Partners

List all partners with pagination.

#### Endpoint

```http
GET /api/partner?page=1&limit=20
Authorization: Bearer <token>
```

#### Query Parameters

| Parameter | Type   | Default | Description                         |
| --------- | ------ | ------- | ----------------------------------- |
| `page`    | number | 1       | Page number                         |
| `limit`   | number | 20      | Items per page                      |
| `status`  | string | -       | Filter by status (ACTIVE, INACTIVE) |

#### Response

**Success (200)**:

```json
{
  "success": true,
  "data": {
    "partners": [
      {
        "partnerId": "partner-001",
        "name": "Acme Corp",
        "email": "contact@acmecorp.com",
        "status": "ACTIVE",
        "registeredAt": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

#### Example

```bash
curl "http://localhost:3000/api/partner?page=1" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

## ❌ Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "success": false,
  "status": "fail", // "fail" (4xx) or "error" (5xx)
  "message": "Error message",
  "statusCode": 400,
  "details": null // Additional validation errors
}
```

### Common HTTP Status Codes

| Code    | Meaning              | Example                |
| ------- | -------------------- | ---------------------- |
| **400** | Bad Request          | Invalid input data     |
| **401** | Unauthorized         | Missing/invalid token  |
| **403** | Forbidden            | No permission          |
| **404** | Not Found            | Resource doesn't exist |
| **422** | Unprocessable Entity | Validation error       |
| **429** | Too Many Requests    | Rate limit exceeded    |
| **500** | Server Error         | Unexpected error       |
| **503** | Service Unavailable  | Database down          |

### Validation Error Example

```json
{
  "success": false,
  "status": "fail",
  "message": "Validation failed",
  "statusCode": 422,
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "items",
      "message": "Items array cannot be empty"
    }
  ]
}
```

### Example Error Scenarios

#### Missing Required Field

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{ "customerId": "123" }'

# Response 400
{
  "success": false,
  "status": "fail",
  "message": "Items cannot be empty",
  "statusCode": 400
}
```

#### Resource Not Found

```bash
curl http://localhost:3000/api/orders/invalid-id \
  -H "Authorization: Bearer token"

# Response 404
{
  "success": false,
  "status": "fail",
  "message": "Order invalid-id not found",
  "statusCode": 404
}
```

#### Database Error

```bash
# Response 503 (when MySQL is down)
{
  "success": false,
  "status": "error",
  "message": "Database connection failed",
  "statusCode": 503
}
```

---

## 🚦 Rate Limiting

API implements rate limiting to prevent abuse.

### Limits

- **100 requests per 15 minutes** per IP address

### Rate Limit Headers

Every response includes rate limit information:

```http
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1735384200
```

### Example: Rate Limit Exceeded

```bash
# After 100 requests in 15 minutes...

curl http://localhost:3000/api/orders

# Response 429
{
  "success": false,
  "message": "Terlalu banyak request, santai dulu.",
  "statusCode": 429
}
```

---

## 🧪 Testing Endpoints

### Test Create Order

```bash
# 1. Define variables
CUSTOMER_ID="550e8400-e29b-41d4-a716-446655440000"
EMAIL="customer@example.com"

# 2. Create order
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d "{
    \"customerId\": \"$CUSTOMER_ID\",
    \"email\": \"$EMAIL\",
    \"items\": [
      {
        \"productId\": \"prod-001\",
        \"quantity\": 2,
        \"price\": 49.99
      }
    ]
  }"
```

### Test Health Check

```bash
# Check if server is healthy
curl http://localhost:3000/health
```

### Test with cURL

Create `test-api.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"

echo "1. Testing Health Check..."
curl -s "$BASE_URL/health" | jq .

echo -e "\n2. Testing Create Order..."
curl -s -X POST "$BASE_URL/api/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "test@example.com",
    "items": [
      {
        "productId": "prod-001",
        "quantity": 2,
        "price": 49.99
      }
    ]
  }' | jq .

echo -e "\n3. Testing Get Partners..."
curl -s "$BASE_URL/api/partner?page=1" | jq .
```

Then run:

```bash
chmod +x test-api.sh
./test-api.sh
```

### Test with Postman

Import this Postman collection:

```json
{
  "info": {
    "name": "DDD API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/health",
          "host": ["{{baseUrl}}"],
          "path": ["health"]
        }
      }
    },
    {
      "name": "Create Order",
      "request": {
        "method": "POST",
        "url": {
          "raw": "{{baseUrl}}/api/orders",
          "host": ["{{baseUrl}}"],
          "path": ["api", "orders"]
        },
        "body": {
          "mode": "raw",
          "raw": "{\"customerId\":\"550e8400-e29b-41d4-a716-446655440000\",\"email\":\"test@example.com\",\"items\":[{\"productId\":\"prod-001\",\"quantity\":2,\"price\":49.99}]}"
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    }
  ]
}
```

---

## 📚 Response Examples

### Successful Create Order Response

```json
{
  "success": true,
  "data": {
    "orderId": "order-550e8400-e29b-41d4-a716-446655440000",
    "status": "CREATED",
    "customerId": "550e8400-e29b-41d4-a716-446655440000",
    "items": [
      {
        "productId": "prod-001",
        "quantity": 2,
        "price": 49.99,
        "subtotal": 99.98
      }
    ],
    "total": 99.98,
    "createdAt": "2025-12-28T10:30:00.000Z"
  }
}
```

### Database Error Response

```json
{
  "success": false,
  "status": "error",
  "message": "Database error occurred",
  "statusCode": 500,
  "details": {
    "code": "ER_CONNECTION_REFUSED",
    "errno": 111,
    "sqlState": "HY000"
  }
}
```

---

## 🔄 Request/Response Flow

### Order Creation Flow

```
Client                  Server                  Database            Queue/Workers
  │                       │                         │                    │
  ├─ POST /api/orders ───→│                         │                    │
  │                       │                         │                    │
  │                       ├─ Validate Input        │                    │
  │                       │                         │                    │
  │                       ├─ Create Order ────────→│                    │
  │                       │ Domain Logic           │ Save Order         │
  │                       │                         │                    │
  │                       ├─ Queue Email Job ─────────────────────────→│
  │                       │ (Async)                 │   Process Email    │
  │                       │                         │   in Background    │
  │                       │                         │                    │
  │ ← 201 Created ────────┤                         │                    │
  │  { orderId, ... }     │                         │                    │
  │                       │                         │                    │
  ✓ Fast Response         │                         │                    │
  (Email sent later)      │                         │                    │
```

---

## 📞 Support

For API issues:

1. Check [Error Handling](#error-handling) section
2. Review request/response examples
3. Verify `.env` configuration
4. Check database connection: `GET /health`
5. Review logs: `logs/` directory

---

**Last Updated**: December 28, 2025  
**API Version**: 1.0.0
