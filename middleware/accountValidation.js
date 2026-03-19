const { z } = require('zod');

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

// ✅ CRASH-PROOF VERSION - Line 28 FIXED
const validateZod = (schema) => (req, res, next) => {
  try {
    // SAFETY CHECK: req.body exists
    if (!req.body) {
      return res.status(400).json({
        error: 'Validation failed',
        details: [{ msg: 'Request body required', path: '' }]
      });
    }

    // USE safeParse INSTEAD OF parse
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      // SAFE MAP - won't crash if errors is undefined
      const details = (result.error?.errors || []).map((e) => ({
        msg: e.message || 'Validation error',
        path: Array.isArray(e.path) ? e.path.join('.') : '',
      }));
      
      return res.status(400).json({
        error: 'Validation failed',
        details: details.length > 0 ? details : [{ msg: 'Unknown validation error' }]
      });
    }

    req.body = result.data;
    next();
  } catch (err) {
    console.error('Account validation crash:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

const validateCreateAccount = validateZod(createAccountSchema);

module.exports = { validateCreateAccount };
