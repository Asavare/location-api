const express = require('express');
const prisma = require('../config/prisma');
const { parsePagination, paginated } = require('../utils/pagination');

const router = express.Router();

// GET /api/districts?stateId=1&search=chennai
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

// GET /api/districts/:id
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

// GET /api/districts/:id/sub-districts
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
