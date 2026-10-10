const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { generateApiKey, hashKey } = require('../middleware/auth');

const router = express.Router();

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100).optional(),
});


/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a user and generate an API key
 *     description: Creates a user account and returns a new API key. Store the key securely because it is shown only once.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: developer@example.com
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 example: Developer
 *     responses:
 *       201:
 *         description: User registered and API key generated.
 *       400:
 *         description: Invalid registration details.
 *       409:
 *         description: A user with this email already exists.
 */
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
