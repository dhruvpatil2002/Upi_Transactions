require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const { PrismaClient } = require("@prisma/client");
const { createAuthRoutes } = require("./Routes/authRoute");
const { createTransactionRoutes } = require("./Routes/transactionsRoute");
const { createAccountRoutes } = require('./Routes/accountRoute.js');
const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json());


app.use("/api/auth", createAuthRoutes(prisma));
app.use('/api/accounts', createAccountRoutes(prisma));
app.use("/api/transactions", createTransactionRoutes(prisma));

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});