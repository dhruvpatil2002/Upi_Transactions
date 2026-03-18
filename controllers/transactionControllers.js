const bcrypt = require('bcrypt');
const { checkPinAttempts, verifyPin } = require('../middleware/authPinMiddleware.js');

const generateUTRef = () => `UTR${Date.now()}${Math.floor(Math.random() * 1000)}`;

const createSendTransaction = (prisma) => async (req, res) => {
  const { toUpiId, amount, description, pin } = req.body;

  try {
    await checkPinAttempts(req, prisma);
    const fromAccount = req.userAccount;

    const transactionAmount = parseFloat(amount);
    if (fromAccount.balance < transactionAmount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    const toAccount = await prisma.bankAccount.findFirst({
      where: { upiId: toUpiId, isActive: true, isFrozen: false },
    });

    if (!toAccount) {
      return res.status(400).json({ error: "Invalid recipient UPI ID or account frozen" });
    }

    if (fromAccount.id === toAccount.id) {
      return res.status(400).json({ error: "Cannot send money to yourself" });
    }

    const pinValid = await verifyPin(prisma, fromAccount.id, pin);
    if (!pinValid) {
      const updatedAccount = await prisma.bankAccount.update({
        where: { id: fromAccount.id },
        data: {
          failedPinAttempts: { increment: 1 },
          lastPinAttempt: new Date(),
        },
      });

      const failedAttempts = updatedAccount.failedPinAttempts;
      if (failedAttempts >= 3) {
        await prisma.bankAccount.update({
          where: { id: fromAccount.id },
          data: {
            isFrozen: true,
            frozenUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });
        return res.status(423).json({
          error: "Account frozen for 24 hours due to multiple failed PIN attempts",
        });
      }

      return res.status(401).json({
        error: "Invalid PIN",
        attemptsLeft: 3 - failedAttempts,
      });
    }

    await prisma.bankAccount.update({
      where: { id: fromAccount.id },
      data: { failedPinAttempts: 0 },
    });

    const transaction = await prisma.$transaction(async (tx) => {
      const utr = generateUTRef();
      const txn = await tx.transaction.create({
        data: {
          fromAccountId: fromAccount.id,
          toAccountId: toAccount.id,
          amount: transactionAmount,
          utr,
          description,
          status: "PENDING",
          pinVerified: true,
        },
      });

      await tx.bankAccount.update({
        where: { id: fromAccount.id },
        data: { balance: { decrement: transactionAmount } },
      });

      await tx.bankAccount.update({
        where: { id: toAccount.id },
        data: { balance: { increment: transactionAmount } },
      });

      await tx.transaction.update({
        where: { id: txn.id },
        data: { status: "SUCCESS" },
      });

      return txn;
    });

    return res.json({
      success: true,
      utr: transaction.utr,
      amount: transactionAmount,
      status: "SUCCESS",
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Transaction error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Account not found" });
    }
    return res.status(error.status || 500).json({ error: error.message || "Internal server error" });
  }
};

const checkTransactionStatus = (prisma) => async (req, res) => {
  const { utr } = req.params;

  try {
    const transaction = await prisma.transaction.findUnique({
      where: { utr },
      include: {
        fromAccount: { select: { upiId: true } },
        toAccount: { select: { upiId: true } },
      },
    });

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json({
      success: true,
      status: transaction.status,
      amount: transaction.amount,
      fromUpi: transaction.fromAccount.upiId,
      toUpi: transaction.toAccount.upiId,
      date: transaction.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: "Status check failed" });
  }
};

const getTransactionHistory = (prisma) => async (req, res) => {
  const { startDate, endDate, status, limit = 50, offset = 0 } = req.query;

  try {
    const userAccounts = await prisma.bankAccount.findMany({
      where: { userId: req.user.id },
      select: { id: true },
    });
    const accountIds = userAccounts.map((a) => a.id);

    const whereClause = {
      OR: [
        { fromAccountId: { in: accountIds } },
        { toAccountId: { in: accountIds } },
      ],
    };

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }
    if (status) whereClause.status = status;

    const [transactions, total] = await prisma.$transaction([
      prisma.transaction.findMany({
        where: whereClause,
        include: {
          fromAccount: { select: { upiId: true } },
          toAccount: { select: { upiId: true } },
        },
        orderBy: { createdAt: "desc" },
        take: parseInt(limit),
        skip: parseInt(offset),
      }),
      prisma.transaction.count({ where: whereClause }),
    ]);

    res.json({
      success: true,
      transactions,
      pagination: {
        count: total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + transactions.length < total,
      },
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: "Failed to fetch history" });
  }
};

const getBalance = (prisma) => async (req, res) => {
  try {
    const accounts = await prisma.bankAccount.findMany({
      where: { userId: req.user.id, isActive: true },
      select: {
        id: true,
        upiId: true,
        balance: true,
        isFrozen: true,
        frozenUntil: true,
      },
    });
    res.json({ success: true, accounts });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch balance" });
  }
};

const createPaymentRequest = (prisma) => async (req, res) => {
  const { fromUpiId, amount, description } = req.body;

  try {
    const toAccount = await prisma.bankAccount.findFirst({
      where: { userId: req.user.id, isActive: true, isFrozen: false },
    });
    if (!toAccount) {
      return res.status(404).json({ error: "Your account not found or frozen" });
    }

    const fromAccount = await prisma.bankAccount.findFirst({
      where: { upiId: fromUpiId, isActive: true, isFrozen: false },
    });
    if (!fromAccount) {
      return res.status(404).json({ error: "Payer UPI ID not found or frozen" });
    }

    if (fromAccount.id === toAccount.id) {
      return res.status(400).json({ error: "Cannot request money from yourself" });
    }

    const utr = generateUTRef();
    const request = await prisma.transaction.create({
      data: {
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        amount: parseFloat(amount),
        utr,
        description,
        status: "PENDING",
        pinVerified: false,
      },
    });

    res.status(201).json({
      success: true,
      message: "Payment request sent",
      utr: request.utr,
      amount: parseFloat(amount),
      requestedFrom: fromUpiId,
      status: "PENDING",
    });
  } catch (error) {
    console.error("Payment request error:", error);
    res.status(500).json({ error: "Failed to create payment request" });
  }
};

module.exports = {
  createSendTransaction,
  checkTransactionStatus,
  getTransactionHistory,
  getBalance,
  createPaymentRequest,
};