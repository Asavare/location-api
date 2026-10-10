const express = require('express');
const prisma = require('../config/prisma');
const { parsePagination, paginated } = require('../utils/pagination');

const router = express.Router();

const fullInclude = {
  subDistrict: {
    select: {
      id: true,
      name: true,
      district: {
        select: { id: true, name: true, state: { select: { id: true, name: true } } },
      },
    },
  },
};

// Flatten a village row into { village, subDistrict, district, state, pincode }
function format(v) {
  return {
    id: v.id,
    code: v.code,
    name: v.name,
    pincode: v.pincode,
    subDistrict: { id: v.subDistrict.id, name: v.subDistrict.name },
    district: { id: v.subDistrict.district.id, name: v.subDistrict.district.name },
    state: { id: v.subDistrict.district.state.id, name: v.subDistrict.district.state.name },
  };
}


/**
 * @swagger
 * /api/villages:
 *   get:
 *     tags:
 *       - Villages
 *     summary: List and filter villages
 *     description: Returns paginated villages with their sub-district, district, and state.
 *     parameters:
 *       - in: query
 *         name: subDistrictId
 *         schema:
 *           type: integer
 *         description: Filter by sub-district ID.
 *       - in: query
 *         name: districtId
 *         schema:
 *           type: integer
 *         description: Filter by district ID.
 *       - in: query
 *         name: stateId
 *         schema:
 *           type: integer
 *         description: Filter by state ID.
 *       - in: query
 *         name: pincode
 *         schema:
 *           type: string
 *         description: Filter by pincode where available.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search village names (case-insensitive).
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
 *         description: Paginated list of villages.
 *       400:
 *         description: Invalid query parameters.
 *       401:
 *         description: Missing or invalid API key.
 */

router.get('/', async (req, res, next) => {
  try {
    const pg = parsePagination(req.query);
    const { subDistrictId, districtId, stateId, pincode, search } = req.query;

    const where = {};
    if (pincode) where.pincode = String(pincode);
    if (search) where.name = { contains: String(search), mode: 'insensitive' };
    if (subDistrictId) where.subDistrictId = Number(subDistrictId);

    if (!subDistrictId && (districtId || stateId)) {
      where.subDistrict = {};
      if (districtId) where.subDistrict.districtId = Number(districtId);
      if (stateId) where.subDistrict.district = { stateId: Number(stateId) };
    }

    const [rows, total] = await Promise.all([
      prisma.village.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: pg.skip,
        take: pg.take,
        include: fullInclude,
      }),
      prisma.village.count({ where }),
    ]);

    res.json(paginated(rows.map(format), total, pg));
  } catch (err) {
    next(err);
  }
});


/**
 * @swagger
 * /api/villages/{id}:
 *   get:
 *     tags:
 *       - Villages
 *     summary: Get a village by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Village ID.
 *     responses:
 *       200:
 *         description: Village details with its location hierarchy.
 *       400:
 *         description: Invalid village ID.
 *       401:
 *         description: Missing or invalid API key.
 *       404:
 *         description: Village not found.
 */

router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const village = await prisma.village.findUnique({ where: { id }, include: fullInclude });
    if (!village) return res.status(404).json({ error: 'Village not found' });

    res.json({ data: format(village) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
