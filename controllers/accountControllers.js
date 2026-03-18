const bcrypt = require('bcrypt');

const createAccount = async (prisma, req, res) => {
  const { upiId, pin, initialBalance = 0 } = req.body;

  try {
    // Check UPI ID not already taken
    const existing = await prisma.bankAccount.findUnique({ where: { upiId } });
    if (existing) {
      return res.status(409).json({ error: 'UPI ID already taken' });
    }

    // One account per user
    const userAccount = await prisma.bankAccount.findFirst({
      where: { userId: req.user.id },
    });
    if (userAccount) {
      return res.status(409).json({ error: 'User already has a bank account' });
    }

    const pinHash = await bcrypt.hash(String(pin), 12);

    const account = await prisma.bankAccount.create({
      data: {
        userId: req.user.id,
        upiId,
        pinHash,
        balance: parseFloat(initialBalance),
        isActive: true,
      },
    });

    return res.status(201).json({
      success: true,
      account: {
        id: account.id,
        upiId: account.upiId,
        balance: account.balance,
        isActive: account.isActive,
      },
    });
  } catch (error) {
    console.error('Create account error:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'UPI ID already taken' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getAccount = async (prisma, req, res) => {
  try {
    const account = await prisma.bankAccount.findFirst({
      where: { userId: req.user.id, isActive: true },
      select: {
        id: true,
        upiId: true,
        balance: true,
        isActive: true,
        isFrozen: true,
        createdAt: true,
      },
    });

    if (!account) {
      return res.status(404).json({ error: 'No bank account found' });
    }

    return res.json({ success: true, account });
  } catch (error) {
    console.error('Get account error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { createAccount, getAccount };