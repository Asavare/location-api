// Sample seed data so you can test the API immediately.
// For the full dataset, use: npm run import -- path/to/villages.csv
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const data = [
  {
    code: '33',
    name: 'Tamil Nadu',
    districts: [
      {
        code: '603',
        name: 'Chennai',
        subDistricts: [
          {
            code: '05905',
            name: 'Egmore',
            villages: [
              { code: '643001', name: 'Egmore', pincode: '600008' },
              { code: '643002', name: 'Nungambakkam', pincode: '600034' },
            ],
          },
        ],
      },
      {
        code: '604',
        name: 'Kancheepuram',
        subDistricts: [
          {
            code: '05910',
            name: 'Sriperumbudur',
            villages: [
              { code: '644001', name: 'Mambakkam', pincode: '602105' },
              { code: '644002', name: 'Oragadam', pincode: '602105' },
            ],
          },
        ],
      },
    ],
  },
  {
    code: '29',
    name: 'Karnataka',
    districts: [
      {
        code: '572',
        name: 'Bengaluru Urban',
        subDistricts: [
          {
            code: '04710',
            name: 'Bengaluru North',
            villages: [{ code: '600101', name: 'Yelahanka', pincode: '560064' }],
          },
        ],
      },
    ],
  },
];

async function main() {
  for (const s of data) {
    const state = await prisma.state.upsert({
      where: { code: s.code },
      update: {},
      create: { code: s.code, name: s.name },
    });

    for (const d of s.districts) {
      const district = await prisma.district.upsert({
        where: { stateId_code: { stateId: state.id, code: d.code } },
        update: {},
        create: { code: d.code, name: d.name, stateId: state.id },
      });

      for (const sd of d.subDistricts) {
        const sub = await prisma.subDistrict.upsert({
          where: { districtId_code: { districtId: district.id, code: sd.code } },
          update: {},
          create: { code: sd.code, name: sd.name, districtId: district.id },
        });

        for (const v of sd.villages) {
          await prisma.village.upsert({
            where: { subDistrictId_code: { subDistrictId: sub.id, code: v.code } },
            update: {},
            create: { ...v, subDistrictId: sub.id },
          });
        }
      }
    }
  }
  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
