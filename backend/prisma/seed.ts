import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // TODO: Update seeding to use new Canon models
  // Old seed used deprecated models (class, species, spell)
  // For now, we use import scripts instead: backend/scripts/import-content.ts

  console.log('✅ Seeding skipped - use import scripts instead');
  console.log('   Run: npm run import:content');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
