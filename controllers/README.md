# Controllers Directory

The `controllers/` directory contains the core business logic of the application. It receives requests from the routes, processes data, interacts with the database (via Prisma), and sends appropriate HTTP responses back to the client.

## Components

### 1. `authControllers.js`
Manages user authentication and onboarding.
- **Logic**: Handles hashing passwords with bcrypt, validating user input, integrating with the database to create or verify `User` records, and generating JWTs for session management.

### 2. `transactionControllers.js`
Manages the application's financial operations.
- **Logic**: Handles tasks like verifying a user's UPI PIN, checking account balances (`BankAccount` model), executing fund transfers securely between accounts, and maintaining records in the `Transaction` model. It involves complex verification and concurrency handling to ensure data integrity during UPI transfers.
