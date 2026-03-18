# Prisma

The `prisma/` directory is the single source of truth for the application's database structure. It contains the schema definition, migration history, and optional seed scripts for initializing development data.

---

## Directory Structure

```
prisma/
├── schema.prisma       # Database schema — models, relations, datasource
├── seed.js             # Development data seeder
└── migrations/         # Auto-generated SQL migration history (managed by Prisma)
```

---

## `schema.prisma` — Database Schema

### Datasource & Generator

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

The connection string is read from the `DATABASE_URL` environment variable. See `.env.example` for the expected format.

---

### Data Models

#### `User`

Stores user credentials and profile information.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` | PK, UUID | Unique user identifier |
| `name` | `String` | Required | Display name |
| `email` | `String` | Unique | Login email |
| `passwordHash` | `String` | Required | bcrypt-hashed password |
| `createdAt` | `DateTime` | Auto | Account creation timestamp |
| `updatedAt` | `DateTime` | Auto | Last update timestamp |
| `bankAccount` | `BankAccount?` | Relation | Associated bank account |

---

#### `BankAccount`

Represents a user's UPI-linked bank account.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` | PK, UUID | Unique account identifier |
| `upiId` | `String` | Unique | UPI handle (e.g., `user@upi`) |
| `balance` | `Decimal` | Required | Current account balance |
| `pinHash` | `String` | Required | bcrypt-hashed UPI PIN |
| `status` | `AccountStatus` | Enum | `ACTIVE` / `SUSPENDED` / `CLOSED` |
| `userId` | `String` | FK | References `User.id` |
| `createdAt` | `DateTime` | Auto | Account creation timestamp |

---

#### `Transaction`

Records an immutable history of all fund transfers between accounts.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` | PK, UUID | Unique transaction identifier |
| `amount` | `Decimal` | Required | Transfer amount |
| `note` | `String?` | Optional | Memo / description |
| `senderId` | `String` | FK | References `BankAccount.id` |
| `receiverId` | `String` | FK | References `BankAccount.id` |
| `createdAt` | `DateTime` | Auto | Immutable transaction timestamp |

> ⚠️ **Immutability:** Transaction records are **never updated or deleted** after creation. They serve as an append-only audit log.

---

### Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────────┐
│    User     │ 1 ───── 1│   BankAccount    │
│─────────────│         │──────────────────│
│ id (PK)     │         │ id (PK)          │
│ name        │         │ upiId (UNIQUE)   │
│ email       │         │ balance          │
│ passwordHash│         │ pinHash          │
│ createdAt   │         │ status           │
│ updatedAt   │         │ userId (FK)      │
└─────────────┘         └──────────────────┘
                                │
                   ┌────────────┴────────────┐
                   │                         │
                   ▼ sender                  ▼ receiver
           ┌──────────────────┐
           │   Transaction    │
           │──────────────────│
           │ id (PK)          │
           │ amount           │
           │ note             │
           │ senderId (FK)    │
           │ receiverId (FK)  │
           │ createdAt        │
           └──────────────────┘
```

---

## `seed.js` — Database Seeder

Seeds the database with dummy users and bank accounts for development and testing.

**Run with:**
```bash
npm run db:seed
```

> ⚠️ **Never run the seeder in production.** It overwrites or appends test data and should only be used in local or CI environments.

---

## `migrations/` — Migration History

This directory is **auto-generated and managed by Prisma**. It contains an ordered sequence of SQL migration files, each representing an incremental change to the database schema.

```
migrations/
└── 20241001120000_init/
│   └── migration.sql
└── 20241015093000_add_transaction_note/
    └── migration.sql
```

### Key Rules

- ✅ **Do** commit the `migrations/` directory to version control
- ✅ **Do** apply migrations on CI/CD and production deployments
- ❌ **Never** edit migration files manually after they have been applied
- ❌ **Never** delete migration files — they represent the canonical schema history

---

## Common Prisma Commands

| Task | Command |
|---|---|
| Generate Prisma Client | `npm run db:generate` |
| Create & apply new migration | `npm run db:migrate` |
| Push schema without migrations | `npm run db:push` |
| Seed the database | `npm run db:seed` |
| Open Prisma Studio (GUI) | `npm run db:studio` |
