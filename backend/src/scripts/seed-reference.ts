import fs from 'node:fs';
import path from 'node:path';

import { prisma } from '../db';

async function maybeSeed(
  label: string,
  countFn: () => Promise<number>,
  seedFn: () => Promise<void>
) {
  try {
    const existing = await countFn();
    if (existing > 0) {
      console.log(`[seed] ${label}: already present (${existing}), skipping`);
      return;
    }
  } catch (error) {
    console.warn(`[seed] ${label}: count failed (${(error as Error).message}), attempting seed anyway`);
  }

  await seedFn();
  console.log(`[seed] ${label}: seeded`);
}

async function seedCollection(
  label: string,
  records: unknown[] | undefined,
  createMany: (params: { data: unknown[] }) => Promise<unknown>,
  countFn: () => Promise<number>
) {
  if (!Array.isArray(records) || records.length === 0) {
    console.log(`[seed] ${label}: no records supplied`);
    return;
  }

  await maybeSeed(label, countFn, async () => {
    await createMany({ data: records as unknown[] });
  });
}

async function main() {
  if (process.env.SEED_REFERENCE === '0') {
    console.log('[seed] Reference seeding disabled via SEED_REFERENCE=0');
    return;
  }

  const seedFile = path.resolve(process.cwd(), 'docker', 'seed', 'reference.json');

  if (!fs.existsSync(seedFile)) {
    console.warn('[seed] reference.json not found, skipping seeding');
    return;
  }

  const raw = await fs.promises.readFile(seedFile, 'utf8');
  const seedData = JSON.parse(raw) as {
    classes?: Record<string, unknown>[];
    species?: Record<string, unknown>[];
    backgrounds?: Record<string, unknown>[];
    feats?: Record<string, unknown>[];
    equipment?: Record<string, unknown>[];
    spells?: Record<string, unknown>[];
    classSpells?: Record<string, unknown>[];
  };

  await seedCollection('classes', seedData.classes, (args) => prisma.class.createMany(args as any), () => prisma.class.count());
  await seedCollection('species', seedData.species, (args) => prisma.species.createMany(args as any), () => prisma.species.count());
  await seedCollection('backgrounds', seedData.backgrounds, (args) => prisma.background.createMany(args as any), () => prisma.background.count());
  await seedCollection('feats', seedData.feats, (args) => prisma.feat.createMany(args as any), () => prisma.feat.count());
  await seedCollection('items', seedData.equipment, (args) => prisma.item.createMany(args as any), () => prisma.item.count());

  if (process.env.SEED_REFERENCE_SKIP_SPELLS === '1') {
    console.log('[seed] spells: skipped via SEED_REFERENCE_SKIP_SPELLS=1');
  } else {
    await seedCollection('spells', seedData.spells, (args) => prisma.spell.createMany(args as any), () => prisma.spell.count());
  }

  // Seed class-spell relationships (must be after classes and spells)
  await seedCollection('class-spells', seedData.classSpells, (args) => prisma.classSpell.createMany(args as any), () => prisma.classSpell.count());
}

main()
  .catch((error) => {
    console.error('[seed] error', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
