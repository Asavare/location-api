const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');

const router = express.Router();

const searchSchema = z.object({
  q: z.string().min(2, 'Query must be at least 2 characters'),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

// GET /api/search?q=anna&limit=10
// Autocomplete-style search across villages, returning the full hierarchy.

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Search Indian villages
 *     description: Search village names and return their administrative hierarchy.
 *     tags: [Search]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Village name to search for.
 *         example: anna
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *     responses:
 *       200:
 *         description: Matching villages and their locations.
 *       400:
 *         description: Invalid search query.
 *       401:
 *         description: Missing or invalid API key.
 */

router.get('/', async (req, res, next) => {
  try {
    const { q, limit } = searchSchema.parse(req.query);

    const rows = await prisma.village.findMany({
      where: { name: { contains: q, mode: 'insensitive' } },
      orderBy: { name: 'asc' },
      take: limit,
      include: {
        subDistrict: {
          select: {
            name: true,
            district: { select: { name: true, state: { select: { name: true } } } },
          },
        },
      },
    });

    const data = rows.map((v) => ({
      id: v.id,
      village: v.name,
      pincode: v.pincode,
      subDistrict: v.subDistrict.name,
      district: v.subDistrict.district.name,
      state: v.subDistrict.district.state.name,
      label: `${v.name}, ${v.subDistrict.name}, ${v.subDistrict.district.name}, ${v.subDistrict.district.state.name}`,
    }));

    res.json({ data, meta: { count: data.length, query: q } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
