const express = require('express');
const prisma = require('../config/prisma');
const { parsePagination, paginated } = require('../utils/pagination');

const router = express.Router();

// GET /api/sub-districts?districtId=1&search=
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

// GET /api/sub-districts/:id
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

// GET /api/sub-districts/:id/villages
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
