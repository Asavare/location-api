const express = require('express');
const prisma = require('../config/prisma');
const { parsePagination, paginated } = require('../utils/pagination');

const router = express.Router();


/**
 * @swagger
 * /api/districts:
 *   get:
 *     tags:
 *       - Districts
 *     summary: List districts
 *     description: Returns paginated districts, optionally filtered by state and name.
 *     parameters:
 *       - in: query
 *         name: stateId
 *         schema:
 *           type: integer
 *         description: Filter by state ID.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search district names (case-insensitive).
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
 *         description: Paginated list of districts.
 *       400:
 *         description: Invalid query parameters.
 *       401:
 *         description: Missing or invalid API key.
 */

router.get('/', async (req, res, next) => {
  try {
    const pg = parsePagination(req.query);
    const where = {};
    if (req.query.stateId) where.stateId = Number(req.query.stateId);
    if (req.query.search) where.name = { contains: String(req.query.search), mode: 'insensitive' };

    const [data, total] = await Promise.all([
      prisma.district.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: pg.skip,
        take: pg.take,
        select: { id: true, code: true, name: true, stateId: true },
      }),
      prisma.district.count({ where }),
    ]);

    res.json(paginated(data, total, pg));
  } catch (err) {
    next(err);
  }
});


/**
 * @swagger
 * /api/districts/{id}:
 *   get:
 *     tags:
 *       - Districts
 *     summary: Get a district by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: District ID.
 *     responses:
 *       200:
 *         description: District details, parent state, and sub-district count.
 *       400:
 *         description: Invalid district ID.
 *       401:
 *         description: Missing or invalid API key.
 *       404:
 *         description: District not found.
 */

router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const district = await prisma.district.findUnique({
      where: { id },
      include: {
        state: { select: { id: true, name: true } },
        _count: { select: { subDistricts: true } },
      },
    });
    if (!district) return res.status(404).json({ error: 'District not found' });

    res.json({ data: district });
  } catch (err) {
    next(err);
  }
});


/**
 * @swagger
 * /api/districts/{id}/sub-districts:
 *   get:
 *     tags:
 *       - Districts
 *     summary: List sub-districts in a district
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: District ID.
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
 *         description: Invalid district ID or pagination parameters.
 *       401:
 *         description: Missing or invalid API key.
 */

router.get('/:id/sub-districts', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const pg = parsePagination(req.query);
    const where = { districtId: id };

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

module.exports = router;
