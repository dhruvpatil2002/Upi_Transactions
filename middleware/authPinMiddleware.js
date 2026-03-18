const bcrypt = require("bcrypt");

const verifyPin = async (prisma, accountId, pin) => {
  const account = await prisma.bankAccount.findUnique({
    where: { id: accountId },
    select: { pinHash: true },
  });
  if (!account) return false;
  return bcrypt.compare(pin, account.pinHash);
};

const checkPinAttempts = async (req, prisma) => {
  const account = await prisma.bankAccount.findFirst({
    where: {
      userId: req.user.id,
      isActive: true,
    },
  });

  if (!account) {
    const error = new Error("Account not found");
    error.status = 404;
    throw error;
  }

  if (account.isFrozen) {
    const now = new Date();
    if (now < account.frozenUntil) {
      const timeLeft = Math.ceil(
        (account.frozenUntil - now) / (1000 * 60 * 60)
      );
      const error = new Error(`Account frozen. Try again in ${timeLeft} hours`);
      error.status = 423;
      throw error;
    } else {
      
      await prisma.bankAccount.update({
        where: { id: account.id },
        data: {
          isFrozen: false,
          failedPinAttempts: 0,
          frozenUntil: null,
        },
      });
    }
  }

  req.userAccount = account;
  return account;
};

module.exports = { checkPinAttempts, verifyPin }; 