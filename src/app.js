require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./docs/swagger");

const prisma = require('./config/prisma');
const { requireApiKey } = require('./middleware/auth');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const stateRoutes = require('./routes/states');
const districtRoutes = require('./routes/districts');
const subDistrictRoutes = require('./routes/subDistricts');
const villageRoutes = require('./routes/villages');
const searchRoutes = require('./routes/search');

const app = express();

app.set('trust proxy', 1); // needed behind Render / Railway / Heroku proxies
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('tiny'));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.RATE_LIMIT_PER_MIN) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});
app.use('/api', limiter);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));


/**
 * @swagger
 * /:
 *   get:
 *     tags:
 *       - General
 *     summary: API information
 *     security: []
 *     responses:
 *       200:
 *         description: API name, description, and endpoint list.
 */

/**
 * @swagger
 * /health:
 *   get:
 *     tags:
 *       - General
 *     summary: Check API and database health
 *     description: Checks whether the API can connect to PostgreSQL.
 *     security: []
 *     responses:
 *       200:
 *         description: API and database are healthy.
 *       503:
 *         description: Database connection failed.
 */

// Public

app.get('/', (req, res) =>
  res.json({
    name: 'Location API',
    description: 'Indian village / location data API',
    docs: 'See README.md',
    endpoints: [
      'POST /api/auth/register',
      'GET /api/states',
      'GET /api/states/:id/districts',
      'GET /api/districts/:id/sub-districts',
      'GET /api/sub-districts/:id/villages',
      'GET /api/villages',
      'GET /api/search?q=',
    ],
  })
);

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'up' });
  } catch {
    res.status(503).json({ status: 'error', db: 'down' });
  }
});

app.use('/api/auth', authRoutes);

// Protected (API key required)
app.use('/api/states', requireApiKey, stateRoutes);
app.use('/api/districts', requireApiKey, districtRoutes);
app.use('/api/sub-districts', requireApiKey, subDistrictRoutes);
app.use('/api/villages', requireApiKey, villageRoutes);
app.use('/api/search', requireApiKey, searchRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
