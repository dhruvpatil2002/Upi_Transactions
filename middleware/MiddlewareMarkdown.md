# Middleware

The `middleware/` directory contains Express middleware functions that sit between the **router** and the **controllers**. Every function in this layer has access to `req`, `res`, and `next`, allowing it to intercept, validate, or enrich the request before it reaches business logic.

---

## Directory Structure

```
middleware/
├── authMiddleware.js           # JWT authentication & user extraction
├── authPinMiddleware.js        # UPI PIN verification for sensitive routes
├── rateLimiter.js              # Request rate limiting
├── transactionValidation.js    # Zod/express-validator schema for transactions
└── userValidation.js           # Zod/express-validator schema for user registration
```

---

## Middleware Reference

### `authMiddleware.js` — JWT Authentication

**Purpose:** Protects routes by validating the JSON Web Token supplied in the `Authorization` header.

**How it works:**
1. Extracts the Bearer token from `Authorization: Bearer <token>`
2. Verifies the token signature using `JWT_SECRET`
3. Attaches the decoded user payload to `req.user`
4. Calls `next()` on success; returns `401 Unauthorized` on failure

**Applied to:** All protected routes under `/api/transactions`

```
Request
  └─► Extract Bearer token
        └─► jwt.verify(token, JWT_SECRET)
              ├─► Valid   → req.user = payload → next()
              └─► Invalid → 401 Unauthorized
```

---

### `authPinMiddleware.js` — UPI PIN Verification

**Purpose:** Adds a second security layer for high-sensitivity operations (e.g., sending money) by requiring the user's UPI PIN.

**How it works:**
1. Extracts the PIN from the request body
2. Retrieves the user's stored PIN hash from the database
3. Compares using bcrypt
4. Calls `next()` on match; returns `401 Unauthorized` on mismatch

**Applied to:** `POST /api/transactions/send`

> 🔒 This middleware runs **after** `authMiddleware`, ensuring the user is authenticated before PIN verification is attempted.

---

### `rateLimiter.js` — Request Rate Limiting

**Purpose:** Throttles incoming requests to protect the API from abuse, brute-force attempts, and denial-of-service attacks.

**Configuration:**

| Setting | Value |
|---|---|
| Window | 15 minutes |
| Max Requests | 100 per window (configurable) |
| Response on Limit | `429 Too Many Requests` |

**Applied to:** PIN-sensitive endpoints and auth routes as a priority; optionally global.

---

### `transactionValidation.js` — Transaction Payload Validation

**Purpose:** Validates the body of incoming transaction requests before they reach the controller.

**Validated fields:**

| Field | Type | Rules |
|---|---|---|
| `receiverUpiId` | `string` | Required, non-empty |
| `amount` | `number` | Required, greater than 0 |
| `pin` | `string` | Required, numeric |
| `note` | `string` | Optional, max 100 chars |

**Applied to:** `POST /api/transactions/send`

**On failure:** Returns `400 Bad Request` with a structured error array detailing which fields failed and why.

---

### `userValidation.js` — User Registration Validation

**Purpose:** Validates user registration and profile update payloads to enforce data integrity at the boundary.

**Validated fields:**

| Field | Type | Rules |
|---|---|---|
| `name` | `string` | Required, min 2 chars |
| `email` | `string` | Required, valid email format |
| `password` | `string` | Required, min 8 chars |
| `upiPin` | `string` | Required, exactly 4–6 digits |

**Applied to:** `POST /api/auth/register`

**On failure:** Returns `400 Bad Request` with field-level validation errors.

---

## Middleware Execution Order

For a protected transaction route, the middleware chain executes in this order:

```
Incoming Request
      │
      ▼
  rateLimiter          ← Reject if too many requests
      │
      ▼
  authMiddleware       ← Reject if JWT is missing or invalid
      │
      ▼
  authPinMiddleware    ← Reject if UPI PIN is wrong (send only)
      │
      ▼
  transactionValidation ← Reject if payload schema is invalid
      │
      ▼
  Controller           ← Execute business logic
```

