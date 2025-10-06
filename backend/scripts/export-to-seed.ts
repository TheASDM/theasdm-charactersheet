#!/usr/bin/env node

/**
 * Export Database to Seed File
 *
 * This script exports all D&D content from the database to docker/seed/reference.json
 * so it can be packaged into the Docker image and deployed to other environments.
 */

import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function exportToSeed() {
  console.log('📦 Exporting database content to seed file...\n');

  try {
    // Fetch all content from database
    console.log('📚 Fetching classes...');
    const classes = await prisma.class.findMany();
    console.log(`   Found ${classes.length} classes`);

    console.log('📚 Fetching species...');
    const species = await prisma.species.findMany();
    console.log(`   Found ${species.length} species`);

    console.log('📚 Fetching backgrounds...');
    const backgrounds = await prisma.background.findMany();
    console.log(`   Found ${backgrounds.length} backgrounds`);

    console.log('📚 Fetching feats...');
    const feats = await prisma.feat.findMany();
    console.log(`   Found ${feats.length} feats`);

    console.log('📚 Fetching items...');
    const equipment = await prisma.item.findMany();
    console.log(`   Found ${equipment.length} items`);

    console.log('📚 Fetching spells...');
    const spells = await prisma.spell.findMany();
    console.log(`   Found ${spells.length} spells`);

    console.log('📚 Fetching class-spell relationships...');
    const classSpells = await prisma.classSpell.findMany();
    console.log(`   Found ${classSpells.length} class-spell relationships`);

    // Create seed data object
    const seedData = {
      classes,
      species,
      backgrounds,
      feats,
      equipment,
      spells,
      classSpells,
    };

    // Write to seed file
    const seedDir = path.resolve(process.cwd(), '..', 'docker', 'seed');
    const seedFile = path.join(seedDir, 'reference.json');

    // Ensure directory exists
    if (!fs.existsSync(seedDir)) {
      fs.mkdirSync(seedDir, { recursive: true });
    }

    console.log(`\n💾 Writing seed data to: ${seedFile}`);
    fs.writeFileSync(seedFile, JSON.stringify(seedData, null, 2), 'utf8');

    // Calculate file size
    const stats = fs.statSync(seedFile);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log('\n✅ Export completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Classes:          ${classes.length}`);
    console.log(`   Species:          ${species.length}`);
    console.log(`   Backgrounds:      ${backgrounds.length}`);
    console.log(`   Feats:            ${feats.length}`);
    console.log(`   Items:            ${equipment.length}`);
    console.log(`   Spells:           ${spells.length}`);
    console.log(`   Class-Spells:     ${classSpells.length}`);
    console.log(`   File size:        ${fileSizeMB} MB`);
    console.log(`\n✅ Seed file ready at: ${seedFile}`);
    console.log('\n🚀 You can now rebuild your Docker image and it will include this data!');
  } catch (error) {
    console.error('❌ Error exporting data:', error);
    throw error;
  }
}

async function main() {
  try {
    await exportToSeed();
  } catch (error) {
    console.error('\n💥 Export failed:', (error as Error).message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  main();
}

export { exportToSeed };
