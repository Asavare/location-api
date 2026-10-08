require("dotenv").config();

const fs = require("fs");
const { Client } = require("pg");
const copyFrom = require("pg-copy-streams").from;

const file = process.argv[2];

if (!file || !fs.existsSync(file)) {
  console.error("Usage: node scripts/fast-import.js <csv-file>");
  process.exit(1);
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function main() {
  await client.connect();

  console.log("Connected to PostgreSQL.");
  console.log("Creating temporary staging table...");

  await client.query(`
    CREATE TEMP TABLE village_import (
      state_code TEXT,
      state_name TEXT,
      district_code TEXT,
      district_name TEXT,
      subdistrict_code TEXT,
      subdistrict_name TEXT,
      village_code TEXT,
      village_name TEXT,
      pincode TEXT
    );
  `);

  console.log("Loading CSV into staging table...");

  const copyStream = client.query(
    copyFrom(`
      COPY village_import
      (
        state_code,
        state_name,
        district_code,
        district_name,
        subdistrict_code,
        subdistrict_name,
        village_code,
        village_name,
        pincode
      )
      FROM STDIN
      WITH (FORMAT csv, HEADER true)
    `)
  );

  const input = fs.createReadStream(file);

  input.pipe(copyStream);

  await new Promise((resolve, reject) => {
    input.on("error", reject);
    copyStream.on("error", reject);
    copyStream.on("finish", resolve);
  });

  console.log("CSV loaded into staging table.");

  console.log("Creating states...");

  await client.query(`
    INSERT INTO "State" ("code", "name")
    SELECT DISTINCT
      state_code,
      state_name
    FROM village_import
    WHERE state_code <> ''
    ON CONFLICT ("code") DO NOTHING;
  `);

  console.log("Creating districts...");

  await client.query(`
    INSERT INTO "District" ("code", "name", "stateId")
    SELECT DISTINCT
      v.district_code,
      v.district_name,
      s.id
    FROM village_import v
    JOIN "State" s
      ON s.code = v.state_code
    WHERE v.district_code <> ''
    ON CONFLICT ("stateId", "code") DO NOTHING;
  `);

  console.log("Creating sub-districts...");

  await client.query(`
    INSERT INTO "SubDistrict" ("code", "name", "districtId")
    SELECT DISTINCT
      v.subdistrict_code,
      v.subdistrict_name,
      d.id
    FROM village_import v
    JOIN "State" s
      ON s.code = v.state_code
    JOIN "District" d
      ON d.code = v.district_code
     AND d."stateId" = s.id
    WHERE v.subdistrict_code <> ''
    ON CONFLICT ("districtId", "code") DO NOTHING;
  `);

  console.log("Creating villages...");

  const result = await client.query(`
    INSERT INTO "Village"
      ("code", "name", "pincode", "subDistrictId")
    SELECT
      v.village_code,
      v.village_name,
      NULLIF(v.pincode, ''),
      sd.id
    FROM village_import v
    JOIN "State" s
      ON s.code = v.state_code
    JOIN "District" d
      ON d.code = v.district_code
     AND d."stateId" = s.id
    JOIN "SubDistrict" sd
      ON sd.code = v.subdistrict_code
     AND sd."districtId" = d.id
    WHERE v.village_code <> ''
    ON CONFLICT ("subDistrictId", "code") DO NOTHING;
  `);

  console.log(`Villages inserted: ${result.rowCount}`);

  await client.end();

  console.log("Fast import completed successfully.");
}

main().catch(async (error) => {
  console.error("IMPORT FAILED");
  console.error(error);

  try {
    await client.end();
  } catch {}

  process.exit(1);
});
