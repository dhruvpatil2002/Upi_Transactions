# Routes

The `Routes/` directory defines all API endpoints exposed by the application. Each route file maps a URI path to its middleware chain and controller handler, acting as the entry point for every HTTP request.

---

## Directory Structure

```
Routes/
├── authRoute.js            # Authentication endpoints  — /api/auth
└── transactionsRoute.js    # Transaction endpoints     — /api/transactions
```

---

## `authRoute.js` — Authentication Routes

**Base Path:** `/api/auth`

| Method | Path | Middleware | Controller | Description |
|---|---|---|---|---|
| `POST` | `/register` | `userValidation` | `registerUser` | Register a new user account |
| `POST` | `/login` | — | `loginUser` | Authenticate and receive a JWT |

### Request & Response Schemas

#### `POST /api/auth/register`

**Request Body:**
```json
{
  "name": "Arjun Sharma",
  "email": "arjun@example.com",
  "password": "SecurePass@123",
  "upiPin": "1234"
}
```

**Success Response — `201 Created`:**
```json
{
  "message": "User registered successfully.",
  "token": "<jwt_token>"
}
```

**Error Response — `400 Bad Request`:**
```json
{
  "errors": [
    { "field": "email", "message": "Must be a valid email address." }
  ]
}
```

---

#### `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "arjun@example.com",
  "password": "SecurePass@123"
}
```

**Success Response — `200 OK`:**
```json
{
  "message": "Login successful.",
  "token": "<jwt_token>"
}
```

**Error Response — `401 Unauthorized`:**
```json
{
  "message": "Invalid email or password."
}
```

---

## `transactionsRoute.js` — Transaction Routes

**Base Path:** `/api/transactions`

All routes in this file require a valid JWT passed as a Bearer token:

```
Authorization: Bearer <your_jwt_token>
```

| Method | Path | Middleware | Controller | Description |
|---|---|---|---|---|
| `GET` | `/balance` | `authMiddleware` | `getBalance` | Get authenticated user's current balance |
| `POST` | `/send` | `authMiddleware`, `authPinMiddleware`, `transactionValidation`, `rateLimiter` | `sendFunds` | Transfer funds to another UPI account |
| `GET` | `/history` | `authMiddleware` | `getTransactionHistory` | Retrieve past transactions |

### Request & Response Schemas

#### `GET /api/transactions/balance`

**Success Response — `200 OK`:**
```json
{
  "balance": 12500.00,
  "currency": "INR",
  "accountStatus": "ACTIVE"
}
```

---

#### `POST /api/transactions/send`

**Request Body:**
```json
{
  "receiverUpiId": "priya@upi",
  "amount": 500.00,
  "pin": "1234",
  "note": "Lunch split"
}
```

**Success Response — `200 OK`:**
```json
{
  "message": "Transfer successful.",
  "transactionId": "txn_abc123xyz",
  "amountDebited": 500.00,
  "newBalance": 12000.00
}
```

**Error Responses:**

| Status | Scenario |
|---|---|
| `400` | Missing or invalid fields in the request body |
| `401` | Invalid or expired JWT / Incorrect UPI PIN |
| `402` | Insufficient account balance |
| `404` | Receiver UPI ID not found |
| `429` | Too many requests — rate limit exceeded |
| `500` | Internal server error |

---

#### `GET /api/transactions/history`

**Query Parameters (optional):**

| Param | Type | Description |
|---|---|---|
| `page` | `number` | Page number for pagination (default: `1`) |
| `limit` | `number` | Records per page (default: `10`) |

**Success Response — `200 OK`:**
```json
{
  "transactions": [
    {
      "id": "txn_abc123xyz",
      "type": "DEBIT",
      "amount": 500.00,
      "counterparty": "priya@upi",
      "note": "Lunch split",
      "createdAt": "2024-10-01T14:32:00.000Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 10
}
