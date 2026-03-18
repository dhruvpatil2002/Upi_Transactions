const { z, ZodError } = require("zod");

const indianPhone = z
  .string()
  .min(1, "Phone number required")
  .refine(
    (v) => /^\+91\d{10}$/.test(v) || /^\d{10}$/.test(v),
    "Valid Indian phone (+919876543210 or 9876543210)"
  );

const optionalEmail = z
  .string()
  .email("Valid email required")
  .optional()
  .or(z.literal(""))
  .transform((v) => (v === "" ? undefined : v));

const strongPassword = z
  .string()
  .min(8, "Password minimum 8 characters")
  .refine(
    (v) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(v),
    "Password must contain 1 uppercase, 1 lowercase, 1 number"
  );

const upiId = z
  .string()
  .min(1, "UPI ID required")
  .regex(
    /^[a-zA-Z0-9.-]+@[a-zA-Z0-9.-]+$/,
    "Invalid UPI format (example@ybl)"
  );

const upiPin = z
  .string()
  .min(4, "PIN must be 4-6 digits")
  .max(6, "PIN must be 4-6 digits")
  .regex(/^\d+$/, "PIN must be digits only");


const registerSchema = z.object({
  phone: indianPhone,
  password: strongPassword,
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters"),
  email: optionalEmail,
});

const loginSchema = z.object({
  phone: indianPhone,
  password: z.string().min(1, "Password required"),
});

const sendTransactionSchema = z.object({
  toUpiId: upiId,
  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .min(1, "Amount must be at least ₹1")
    .max(100000, "Amount cannot exceed ₹1,00,000"),
  pin: upiPin,
  description: z.string().max(100, "Description too long").optional(),
});

const paymentRequestSchema = z.object({
  fromUpiId: upiId,
  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .min(1, "Amount must be at least ₹1")
    .max(100000, "Amount cannot exceed ₹1,00,000"),
  description: z.string().max(100, "Description too long").optional(),
});

const transactionStatusSchema = z.object({
  utr: z
    .string()
    .regex(/^UTR\d{13,16}$/, "Invalid UTR format"),
});


const SENSITIVE_FIELDS = ["password", "pin", "pinHash"];


const validateZod = (schema) => {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
          type: "field",
          msg: e.message,
          path: e.path.join("."),
          location: "body",
          ...(!SENSITIVE_FIELDS.includes(e.path[0]) && { value: e.input }),
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


const validateZodParams = (schema) => {
  return (req, res, next) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
          type: "field",
          msg: e.message,
          path: e.path.join("."),
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
};


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