const { z, ZodError } = require("zod");

const sendTransactionSchema = z.object({
  toUpiId: z
    .string()
    .min(1, "Recipient UPI ID required")
    .regex(
      /^[a-zA-Z0-9.-]+\@[a-zA-Z0-9.-]+$/,
      "Invalid UPI format (example@ybl)"
    ),
  amount: z.coerce.number().min(1).max(100000), // ← coerce converts "500" to 500
  pin: z.string().min(4).max(6).regex(/^\d+$/, "PIN must be 4-6 digits"),
  description: z.string().max(100).optional(),
});

const transactionStatusSchema = z.object({
  utr: z
    .string()
    .regex(/^UTR\d{13,16}$/, "Invalid UTR format"),
});


const validateZod = (schema) => {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      // Safety check — use err.errors only if it exists
      if (err instanceof ZodError && Array.isArray(err.errors)) {
        const details = err.errors.map((e) => ({
          type: "field",
          msg: e.message,
          path: e.path.join("."),
          location: "body",
        }));
        return res.status(400).json({
          error: "Validation failed",
          details,
        });
      }
      next(err);
    }
  };
};


const validateSendTransaction = validateZod(sendTransactionSchema);

const validateTransactionStatus = (req, res, next) => {
  try {
    const parsed = transactionStatusSchema.parse({ utr: req.params.utr });
    req.params = { ...req.params, utr: parsed.utr };
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const details = err.errors.map((e) => ({  // ← err.errors was undefined
        type: "field",
        msg: e.message,
        path: "utr",
        location: "params",
      }));
      return res.status(400).json({
        error: "Validation failed",
        details,
      });
    }
    next(err); 
  }
};
const paymentRequestSchema = z.object({
  fromUpiId: z
    .string()
    .min(1, "Payer UPI ID required")
    .regex(/^[a-zA-Z0-9.-]+\@[a-zA-Z0-9.-]+$/, "Invalid UPI format"),
  amount: z.coerce.number().min(1).max(100000), // ← coerce here too
  description: z.string().max(100).optional(),
});

const validatePaymentRequest = validateZod(paymentRequestSchema);
module.exports = {
  
  
  validateSendTransaction,
  validateTransactionStatus,
  validatePaymentRequest,
};
