const { PrismaClient, TransactionStatus, TransactionType } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function hash(value) {
  return bcrypt.hash(value, 10);
}

async function main() {
  const phone = "9876543210";

  const existingUser = await prisma.user.findUnique({ where: { phone } });
  if (existingUser) {
    console.log("User already exists, skipping:", existingUser);
    return;
  }

  const pinHash = await hash("1234");

  
  const user = await prisma.user.create({
    data: {
      phone,
      passwordHash: await hash("user123"),
      name: "Test User",
      email: "user@example.com",
    },
  });
  console.log("Created user:", user);


  const account = await prisma.bankAccount.create({
    data: {
      userId: user.id,
      upiId: "user123@upi",
      balance: 10000.0,
      pinHash,
      isActive: true,
      isFrozen: false,
      failedPinAttempts: 0,
    },
  });
  console.log("Created bank account:", account);

 
  const anotherAccount = await prisma.bankAccount.create({
    data: {
      userId: user.id,
      upiId: "user123b@upi",
      balance: 5000.0,
      pinHash,
      isActive: true,
      isFrozen: false,
      failedPinAttempts: 0,
    },
  });
  console.log("Created another account:", anotherAccount);


  const transaction = await prisma.transaction.create({
    data: {
      fromAccountId: account.id,
      toAccountId: anotherAccount.id,
      amount: 500.0,
      utr: `UTR${Date.now()}`,
      description: "Test UPI transfer",
      status: TransactionStatus.SUCCESS,
      type: TransactionType.SEND,
      pinVerified: true,
    },
  });
  console.log("Created transaction:", transaction);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });