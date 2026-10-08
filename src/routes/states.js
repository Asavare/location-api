const express = require('express');
const prisma = require('../config/prisma');
const { parsePagination, paginated } = require('../utils/pagination');

const router = express.Router();

// GET /api/states?search=tamil&page=1&limit=25
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

// GET /api/states/:id
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

// GET /api/states/:id/districts
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
