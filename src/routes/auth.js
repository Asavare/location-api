const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { generateApiKey, hashKey } = require('../middleware/auth');

const router = express.Router();

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100).optional(),
});

// POST /api/auth/register  -> returns an API key (shown only once)
router.post('/register', async (req, res, next) => {
  try {
    const { email, name } = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'A user with this email already exists.' });
    }

    const apiKey = generateApiKey();
    const user = await prisma.user.create({
      data: {
        email,
        name,
        apiKeyHash: hashKey(apiKey),
        keyPrefix: apiKey.slice(0, 8),
      },
    });

    res.status(201).json({
      message: 'Registered. Store this API key safely - it will not be shown again.',
      apiKey,
      user: { id: user.id, email: user.email, plan: user.plan },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
