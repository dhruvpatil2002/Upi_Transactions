const { z } = require("zod");

const SENSITIVE_FIELDS = ["password", "pin", "pinHash"];

// Phone validation - Indian format
const indianPhone = z
  .string()
  .min(1, "Phone number required")
  .refine(
    (v) => /^\+91\d{10}$/.test(v) || /^\d{10}$/.test(v),
    "Valid Indian phone (+919876543210 or 9876543210)"
  );

// Password validation - strong requirements
const strongPassword = z
  .string()
  .min(8, "Password minimum 8 characters")
  .refine(
    (v) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(v),
    "Password must contain 1 uppercase, 1 lowercase, 1 number"
  );

// UPI ID validation
const upiId = z
  .string()
  .min(1, "UPI ID required")
  .regex(/^[a-zA-Z0-9.-]+@[a-zA-Z0-9.-]+$/, "Invalid UPI format (example@ybl)");

// UPI PIN validation
const upiPin = z
  .string()
  .min(4, "PIN must be 4-6 digits")
  .max(6, "PIN must be 4-6 digits")
  .regex(/^\d+$/, "PIN must be digits only");

// REGISTER - All fields required
const registerSchema = z.object({
  phone: indianPhone,
  password: strongPassword,
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters"),
  email: z.string().email("Valid email required"),
});

// LOGIN - Minimal fields
const loginSchema = z.object({
  phone: indianPhone,
  password: z.string().min(1, "Password required"),
}).passthrough(); // Allows extra fields

// SEND TRANSACTION
const sendTransactionSchema = z.object({
  toUpiId: upiId,
  amount: z.coerce.number({ invalid_type_error: "Amount must be a number" })
    .min(1, "Amount must be at least ₹1")
    .max(100000, "Amount cannot exceed ₹1,00,000"),
  pin: upiPin,
  description: z.string().max(100, "Description too long").optional(),
});

// PAYMENT REQUEST
const paymentRequestSchema = z.object({
  fromUpiId: upiId,
  amount: z.coerce.number({ invalid_type_error: "Amount must be a number" })
    .min(1, "Amount must be at least ₹1")
    .max(100000, "Amount cannot exceed ₹1,00,000"),
  description: z.string().max(100, "Description too long").optional(),
});

// TRANSACTION STATUS
const transactionStatusSchema = z.object({
  utr: z
    .string()
    .regex(/^UTR\d{13,16}$/, "Invalid UTR format"),
});

// CRASH-PROOF VALIDATION
const validateZod = (schema) => {
  return (req, res, next) => {
    try {
      // Check body exists
      if (!req.body || typeof req.body !== "object") {
        return res.status(400).json({
          error: "Validation failed",
          details: [{ type: "body", msg: "Invalid request body" }],
        });
      }

      const result = schema.safeParse(req.body);

      if (!result.success) {
        const details = (result.error?.errors || []).map((e) => ({
          type: "field",
          msg: e.message || "Validation error",
          path: Array.isArray(e.path) ? e.path.join(".") : "",
          location: "body",
          ...(!SENSITIVE_FIELDS.includes(e.path?.[0]) && { value: e.input }),
        }));

        return res.status(400).json({
          error: "Validation failed",
          details: details.length > 0 ? details : [{ type: "body", msg: "Unknown validation error" }],
        });
      }

      req.body = result.data;
      next();
    } catch (err) {
      console.error("Validation crash:", err);
      return res.status(500).json({ error: "Server error during validation" });
    }
  };
};

// PARAMS VALIDATION
const validateZodParams = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.params);

      if (!result.success) {
        const details = (result.error?.errors || []).map((e) => ({
          type: "field",
          msg: e.message || "Validation error",
          path: Array.isArray(e.path) ? e.path.join(".") : "",
          location: "params",
        }));

        return res.status(400).json({
          error: "Validation failed",
          details: details.length > 0 ? details : [{ type: "params", msg: "Unknown validation error" }],
        });
      }

      req.params = result.data;
      next();
    } catch (err) {
      console.error("Params validation crash:", err);
      return res.status(500).json({ error: "Server error during validation" });
    }
  };
};

// EXPORT ALL MIDDLEWARES
const validateRegister          = validateZod(registerSchema);
const validateLogin             = validateZod(loginSchema);
const validateSendTransaction   = validateZod(sendTransactionSchema);
const validatePaymentRequest    = validateZod(paymentRequestSchema);
const validateTransactionStatus = validateZodParams(transactionStatusSchema);

module.exports = {
  validateRegister,
  validateLogin,
  validateSendTransaction,
  validatePaymentRequest,
  validateTransactionStatus,
};
