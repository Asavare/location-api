const crypto = require('crypto');
const prisma = require('../config/prisma');

const hashKey = (key) => crypto.createHash('sha256').update(key).digest('hex');

const generateApiKey = () => `lk_${crypto.randomBytes(24).toString('hex')}`;

/**
 * Requires a valid API key in the `x-api-key` header
 * (or `Authorization: Bearer <key>`).
 */
async function requireApiKey(req, res, next) {
  try {
    const bearer = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null;
    const key = req.headers['x-api-key'] || bearer;

    if (!key) {
      return res.status(401).json({ error: 'API key missing. Send it in the x-api-key header.' });
    }

    const user = await prisma.user.findUnique({ where: { apiKeyHash: hashKey(key) } });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive API key.' });
    }

    req.user = user;

    // Fire-and-forget usage counter
    prisma.user
      .update({ where: { id: user.id }, data: { requests: { increment: 1 } } })
      .catch(() => {});

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireApiKey, hashKey, generateApiKey };
