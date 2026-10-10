const express = require('express');
const prisma = require('../config/prisma');
const { parsePagination, paginated } = require('../utils/pagination');

const router = express.Router();


/**
 * @swagger
 * /api/states:
 *   get:
 *     tags:
 *       - States
 *     summary: List Indian states
 *     description: Returns a paginated list of states, optionally filtered by name.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Filter states by name (case-insensitive).
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Number of results per page.
 *     responses:
 *       200:
 *         description: Paginated list of states.
 *       400:
 *         description: Invalid pagination parameters.
 *       401:
 *         description: Missing or invalid API key.
 */

router.get('/', async (req, res, next) => {
  try {
    const pg = parsePagination(req.query);
    const where = req.query.search
      ? { name: { contains: String(req.query.search), mode: 'insensitive' } }
      : {};

    const [data, total] = await Promise.all([
      prisma.state.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: pg.skip,
        take: pg.take,
        select: { id: true, code: true, name: true },
      }),
      prisma.state.count({ where }),
    ]);

    res.json(paginated(data, total, pg));
  } catch (err) {
    next(err);
  }
});


/**
 * @swagger
 * /api/states/{id}:
 *   get:
 *     tags:
 *       - States
 *     summary: Get a state by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: State ID.
 *     responses:
 *       200:
 *         description: State details and district count.
 *       400:
 *         description: Invalid state ID.
 *       401:
 *         description: Missing or invalid API key.
 *       404:
 *         description: State not found.
 */

router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const state = await prisma.state.findUnique({
      where: { id },
      include: { _count: { select: { districts: true } } },
    });
    if (!state) return res.status(404).json({ error: 'State not found' });

    res.json({ data: state });
  } catch (err) {
    next(err);
  }
});


/**
 * @swagger
 * /api/states/{id}/districts:
 *   get:
 *     tags:
 *       - States
 *     summary: List districts in a state
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: State ID.
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
 *         description: Invalid state ID or pagination parameters.
 *       401:
 *         description: Missing or invalid API key.
 */

router.get('/:id/districts', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const pg = parsePagination(req.query);
    const where = { stateId: id };

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

module.exports = router;
