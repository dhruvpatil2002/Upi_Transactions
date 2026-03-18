# Controllers

The `controllers/` directory contains the **core business logic** of the application. Controllers receive parsed, validated requests from the route layer, execute all domain operations, interact with the database via Prisma, and return structured HTTP responses.

---

## Directory Structure

```
controllers/
├── authControllers.js          # User authentication and onboarding
└── transactionControllers.js   # Financial operations and fund transfers
```

---

## `authControllers.js`

Manages all user authentication lifecycle operations.

### Responsibilities

| Function | Description |
|---|---|
| `registerUser` | Validates input, hashes the password with bcrypt, creates a `User` record, and issues a signed JWT. |
| `loginUser` | Verifies credentials against the stored bcrypt hash and returns a JWT on success. |

### Flow

```
POST /api/auth/register
  └─► Validate payload (userValidation middleware)
        └─► Hash password (bcrypt)
              └─► Create User in DB (Prisma)
                    └─► Sign & return JWT
```

```
POST /api/auth/login
  └─► Validate payload
        └─► Lookup User by email/username
              └─► Compare password hash (bcrypt.compare)
                    └─► Sign & return JWT
```

### Dependencies

- `bcrypt` — Password hashing and comparison
- `jsonwebtoken` — JWT signing
- `@prisma/client` — Database access (`User` model)

---

## `transactionControllers.js`

Manages all financial operations within the platform.

### Responsibilities

| Function | Description |
|---|---|
| `getBalance` | Retrieves the authenticated user's current `BankAccount` balance. |
| `sendFunds` | Validates receiver, checks sender balance, executes an atomic debit/credit, and logs the `Transaction`. |
| `getTransactionHistory` | Fetches a paginated list of past transactions for the authenticated user. |

### Fund Transfer Flow

```
POST /api/transactions/send
  └─► JWT Auth (authMiddleware)
        └─► PIN Verification (authPinMiddleware)
              └─► Validate payload (transactionValidation)
                    └─► Lookup receiver BankAccount
                          └─► Check sender balance >= amount
                                └─► Atomic DB transaction:
                                      ├─► Debit sender BankAccount
                                      ├─► Credit receiver BankAccount
                                      └─► Create Transaction record
                                            └─► Return success response
```

> ⚠️ **Concurrency Safety:** Fund transfer operations use Prisma's `$transaction` API to ensure atomicity. If any step fails, the entire operation is rolled back to prevent partial transfers or data inconsistency.

### Error Handling

| Scenario | HTTP Status | Description |
|---|---|---|
| Receiver not found | `404` | No account matches the provided UPI ID |
| Insufficient balance | `402` | Sender balance is less than the transfer amount |
| Invalid PIN | `401` | PIN verification failed |
| Internal error | `500` | Unexpected failure during DB transaction |

### Dependencies

- `@prisma/client` — Database access (`User`, `BankAccount`, `Transaction` models)
