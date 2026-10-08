/**
 * Bulk-import village data from a CSV file.
 *
 * Usage:  npm run import -- ./data/villages.csv
 *
 * Expected CSV headers (case-sensitive):
 *   state_code,state_name,district_code,district_name,
 *   subdistrict_code,subdistrict_name,village_code,village_name,pincode
 *
 * Safe to re-run: existing rows are skipped (upsert semantics).
 */
require('dotenv').config();
const fs = require('fs');
const { parse } = require('csv-parse');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const file = process.argv[2];
if (!file || !fs.existsSync(file)) {
  console.error('Usage: npm run import -- <path-to-csv>');
  process.exit(1);
}

const stateCache = new Map(); // code -> id
const districtCache = new Map(); // `${stateId}:${code}` -> id
const subCache = new Map(); // `${districtId}:${code}` -> id

async function getState(code, name) {
  if (stateCache.has(code)) return stateCache.get(code);
  const s = await prisma.state.upsert({
    where: { code },
    update: {},
    create: { code, name },
  });
  stateCache.set(code, s.id);
  return s.id;
}

async function getDistrict(stateId, code, name) {
  const key = `${stateId}:${code}`;
  if (districtCache.has(key)) return districtCache.get(key);
  const d = await prisma.district.upsert({
    where: { stateId_code: { stateId, code } },
    update: {},
    create: { stateId, code, name },
  });
  districtCache.set(key, d.id);
  return d.id;
}

async function getSub(districtId, code, name) {
  const key = `${districtId}:${code}`;
  if (subCache.has(key)) return subCache.get(key);
  const s = await prisma.subDistrict.upsert({
    where: { districtId_code: { districtId, code } },
    update: {},
    create: { districtId, code, name },
  });
  subCache.set(key, s.id);
  return s.id;
}

async function main() {
  const parser = fs
    .createReadStream(file)
    .pipe(parse({ columns: true, skip_empty_lines: true, trim: true, bom: true }));

  let batch = [];
  let count = 0;

  const flush = async () => {
    if (!batch.length) return;
    await prisma.village.createMany({ data: batch, skipDuplicates: true });
    count += batch.length;
    batch = [];
    process.stdout.write(`\rImported ${count} villages...`);
  };

  for await (const row of parser) {
    const stateId = await getState(row.state_code, row.state_name);
    const districtId = await getDistrict(stateId, row.district_code, row.district_name);
    const subDistrictId = await getSub(districtId, row.subdistrict_code, row.subdistrict_name);

    batch.push({
      code: row.village_code,
      name: row.village_name,
      pincode: row.pincode || null,
      subDistrictId,
    });

    if (batch.length >= 1000) await flush();
  }
  await flush();
  console.log(`\nDone. ${count} villages processed.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
