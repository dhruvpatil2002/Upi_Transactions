# 💸 UPI Transaction Backend


A production-ready RESTful backend service simulating a **UPI (Unified Payments Interface)** payment system, built with Node.js, Express, and PostgreSQL via Prisma ORM.


## 📑 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Running the Server](#running-the-server)
- [API Reference](#-api-reference)
- [Available Scripts](#-available-scripts)
- [Security](#-security)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔍 Overview

This service provides a secure, scalable backend for a UPI-like digital payment platform. It handles user authentication, account management, and real-time fund transfers with concurrency safety, PIN verification, and rate limiting baked in.

**Key capabilities:**
- JWT-based user authentication with bcrypt password hashing
- UPI PIN verification layer for sensitive transactions
- Atomic fund transfers with balance integrity checks
- Immutable transaction history logging
- Rate limiting to mitigate abuse and brute-force attacks
- Schema-validated request payloads via Zod and express-validator

---

## 🏗 Architecture

```
Client
  │
  ▼
Express Router (Routes/)
  │
  ├── Middleware Pipeline
  │     ├── Rate Limiter
  │     ├── Auth Middleware (JWT)
  │     ├── PIN Middleware
  │     └── Validation (Zod / express-validator)
  │
  ▼
Controllers (Business Logic)
  │
  ├── authControllers.js
  └── transactionControllers.js
        │
        ▼
   Prisma ORM
        │
        ▼
   PostgreSQL (Docker)
```

---

## 📁 Project Structure

```
upi-transaction-backend/
│
├── Routes/                         # API route definitions
│   ├── authRoute.js                # /api/auth — Registration & login
│   └── transactionsRoute.js        # /api/transactions — Fund transfers & history
│
├── controllers/                    # Core business logic
│   ├── authControllers.js          # Auth flows: signup, login, JWT issuance
│   └── transactionControllers.js   # Transfers, balance checks, PIN verification
│
├── middleware/                     # Express middleware
│   ├── authMiddleware.js           # JWT validation & user extraction
│   ├── authPinMiddleware.js        # UPI PIN verification
│   ├── rateLimiter.js              # API rate limiting
│   ├── transactionValidation.js    # Transaction payload validation
│   └── userValidation.js           # User registration payload validation
│
├── prisma/                         # Prisma ORM configuration
│   ├── schema.prisma               # Database schema (User, BankAccount, Transaction)
│   ├── seed.js                     # Database seeder for development
│   └── migrations/                 # Auto-generated SQL migration history
│
├── utils/                          # Shared utilities
│   └── (token helpers, etc.)
│
├── .env                            # Environment variables (not committed)
├── .env.example                    # Example environment config
├── docker-compose.yml              # PostgreSQL container definition
├── package.json
└── README.md
```

> 📂 See subdirectory READMEs for deeper documentation:
> - [`controllers/README.md`](./controllers/README.md)
> - [`middleware/README.md`](./middleware/README.md)
> - [`Routes/README.md`](./Routes/README.md)
> - [`prisma/README.md`](./prisma/README.md)

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Runtime | Node.js 18.x | JavaScript server runtime |
| Framework | Express.js | HTTP routing and middleware |
| Database | PostgreSQL 15 | Relational data storage |
| ORM | Prisma | Type-safe DB access & migrations |
| Auth | JWT + Bcrypt | Secure session & password management |
| Validation | Zod, express-validator | Payload schema enforcement |
| Containerization | Docker / Docker Compose | Local DB environment |

---

## 🚀 Getting Started

### Prerequisites

Ensure the following are installed on your system:

- [Node.js](https://nodejs.org/) `>= 18.x`
- [npm](https://www.npmjs.com/) `>= 9.x`
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for PostgreSQL)

---

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/upi-transaction-backend.git
cd upi-transaction-backend

# Install dependencies
npm install
```

---

### Environment Variables

Create a `.env` file in the project root by copying the example:

```bash
cp .env.example .env
```

Then configure the following values:

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port the server listens on | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5433/upi_transactions?schema=public` |
| `JWT_SECRET` | Secret key for signing JWTs | `your_strong_secret_here` |

> ⚠️ **Never commit your `.env` file.** It is listed in `.gitignore` by default.

---

### Database Setup

**1. Start the PostgreSQL container:**

```bash
docker-compose up -d
```

**2. Generate the Prisma client:**

```bash
npm run db:generate
```

**3. Apply database migrations:**

```bash
npm run db:migrate
```

**4. (Optional) Seed the database with test data:**

```bash
npm run db:seed
```

---

### Running the Server

```bash
# Development mode (with hot-reload via Nodemon)
npm run dev

# Production mode
npm start
```

The server will be available at `http://localhost:3000`.

---

## 📡 API Reference

### Authentication — `/api/auth`

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user | ❌ |
| `POST` | `/api/auth/login` | Login and receive JWT | ❌ |

### Transactions — `/api/transactions`

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/transactions/balance` | Fetch current account balance | ✅ |
| `POST` | `/api/transactions/send` | Transfer funds to another user | ✅ + PIN |
| `GET` | `/api/transactions/history` | Retrieve transaction history | ✅ |

> 📝 Full request/response schemas are documented in [`Routes/README.md`](./Routes/README.md).

---

## 📜 Available Scripts

| Script | Command | Description |
|---|---|---|
| Start (prod) | `npm start` | Run the server in production mode |
| Start (dev) | `npm run dev` | Run with Nodemon for hot-reloading |
| Generate Prisma | `npm run db:generate` | Generate the Prisma client from schema |
| Push Schema | `npm run db:push` | Push schema changes without migrations |
| Migrate | `npm run db:migrate` | Create and apply a new migration |
| Seed DB | `npm run db:seed` | Populate DB with development data |
| Prisma Studio | `npm run db:studio` | Open the visual DB browser |

---

## 🔐 Security

This service implements multiple layers of security:

- **JWT Authentication** — All protected endpoints require a valid Bearer token in the `Authorization` header.
- **UPI PIN Verification** — Sensitive transaction endpoints require an additional PIN check via `authPinMiddleware`.
- **Rate Limiting** — Endpoints are throttled to prevent brute-force and DoS attacks.
- **Password Hashing** — All passwords are hashed with `bcrypt` before storage; plaintext passwords are never persisted.
- **Input Validation** — All incoming request bodies are validated with Zod and express-validator before reaching any controller.
- **Concurrency Safety** — Fund transfer logic handles concurrent requests to prevent double-spend and race conditions.



