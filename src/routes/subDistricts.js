const express = require('express');
const prisma = require('../config/prisma');
const { parsePagination, paginated } = require('../utils/pagination');

const router = express.Router();


/**
 * @swagger
 * /api/sub-districts:
 *   get:
 *     tags:
 *       - Sub-districts
 *     summary: List sub-districts
 *     description: Returns paginated sub-districts, optionally filtered by district and name.
 *     parameters:
 *       - in: query
 *         name: districtId
 *         schema:
 *           type: integer
 *         description: Filter by district ID.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search sub-district names (case-insensitive).
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Paginated list of sub-districts.
 *       400:
 *         description: Invalid query parameters.
 *       401:
 *         description: Missing or invalid API key.
 */

router.get('/', async (req, res, next) => {
  try {
    const pg = parsePagination(req.query);
    const where = {};
    if (req.query.districtId) where.districtId = Number(req.query.districtId);
    if (req.query.search) where.name = { contains: String(req.query.search), mode: 'insensitive' };

    const [data, total] = await Promise.all([
      prisma.subDistrict.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: pg.skip,
        take: pg.take,
        select: { id: true, code: true, name: true, districtId: true },
      }),
      prisma.subDistrict.count({ where }),
    ]);

    res.json(paginated(data, total, pg));
  } catch (err) {
    next(err);
  }
});


/**
 * @swagger
 * /api/sub-districts/{id}:
 *   get:
 *     tags:
 *       - Sub-districts
 *     summary: Get a sub-district by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Sub-district ID.
 *     responses:
 *       200:
 *         description: Sub-district details, parent district and state, and village count.
 *       400:
 *         description: Invalid sub-district ID.
 *       401:
 *         description: Missing or invalid API key.
 *       404:
 *         description: Sub-district not found.
 */

router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const sub = await prisma.subDistrict.findUnique({
      where: { id },
      include: {
        district: { select: { id: true, name: true, state: { select: { id: true, name: true } } } },
        _count: { select: { villages: true } },
      },
    });
    if (!sub) return res.status(404).json({ error: 'Sub-district not found' });

    res.json({ data: sub });
  } catch (err) {
    next(err);
  }
});


/**
 * @swagger
 * /api/sub-districts/{id}/villages:
 *   get:
 *     tags:
 *       - Sub-districts
 *     summary: List villages in a sub-district
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Sub-district ID.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Paginated list of villages, including their codes and pincodes where available.
 *       400:
 *         description: Invalid sub-district ID or pagination parameters.
 *       401:
 *         description: Missing or invalid API key.
 */

router.get('/:id/villages', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const pg = parsePagination(req.query);
    const where = { subDistrictId: id };

    const [data, total] = await Promise.all([
      prisma.village.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: pg.skip,
        take: pg.take,
        select: { id: true, code: true, name: true, pincode: true, subDistrictId: true },
      }),
      prisma.village.count({ where }),
    ]);

    res.json(paginated(data, total, pg));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
