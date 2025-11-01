import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding reference data...');

  // TODO: Update to use new Canon models
  // Old script used deprecated models
  // Reference data should be imported via import-content.ts

  console.log('✅ Reference seeding skipped - use import scripts instead');
  console.log('   Run: DATABASE_URL="..." npx tsx scripts/import-content.ts');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
