const { z, ZodError } = require('zod');

const createAccountSchema = z.object({
  upiId: z
    .string()
    .min(1, 'UPI ID required')
    .regex(/^[a-zA-Z0-9.-]+@[a-zA-Z0-9.-]+$/, 'Invalid UPI format (example@ybl)'),
  pin: z
    .string()
    .min(4, 'PIN must be 4-6 digits')
    .max(6, 'PIN must be 4-6 digits')
    .regex(/^\d+$/, 'PIN must be digits only'),
  initialBalance: z
    .number()
    .min(0, 'Balance cannot be negative')
    .max(1000000, 'Initial balance too high')
    .optional(),
});

const validateZod = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: err.errors.map((e) => ({
          msg: e.message,
          path: e.path.join('.'),
        })),
      });
    }
    next(err);
  }
};

const validateCreateAccount = validateZod(createAccountSchema);

module.exports = { validateCreateAccount };