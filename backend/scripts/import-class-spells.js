#!/usr/bin/env node

/**
 * Import Class-Spell Relationships from 5etools
 *
 * This script populates the class_spells junction table using ONLY D&D 2024 (XPHB) data.
 * It reads from the gendata-spell-source-lookup.json file which contains spell-to-class mappings.
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const LOOKUP_FILE = '/Users/dustinamodeo/Documents/dnd/5etools-src/data/generated/gendata-spell-source-lookup.json';

async function importClassSpells() {
  console.log('📚 Starting XPHB class-spell relationship import...\n');

  // Read the lookup file
  if (!fs.existsSync(LOOKUP_FILE)) {
    throw new Error(`Lookup file not found: ${LOOKUP_FILE}`);
  }

  const lookupData = JSON.parse(fs.readFileSync(LOOKUP_FILE, 'utf8'));

  // Get all classes and spells from database
  const [classes, spells] = await Promise.all([
    prisma.class.findMany(),
    prisma.spell.findMany({ where: { source: 'XPHB' } })
  ]);

  console.log(`Found ${classes.length} classes in database`);
  console.log(`Found ${spells.length} XPHB spells in database\n`);

  // Create lookup maps (case-insensitive for spells)
  const classNameToId = new Map(classes.map(c => [c.name, c.id]));
  const spellNameToId = new Map(spells.map(s => [s.name.toLowerCase(), s.id]));

  let relationships = [];
  let spellsProcessed = 0;
  let spellsWithXPHBClasses = 0;

  // Process each source
  for (const [source, sourceSpells] of Object.entries(lookupData)) {
    for (const [spellName, spellData] of Object.entries(sourceSpells)) {
      spellsProcessed++;

      // Check if spell has XPHB class data
      if (!spellData.class || !spellData.class.XPHB) {
        continue;
      }

      spellsWithXPHBClasses++;

      const xphbClasses = spellData.class.XPHB;
      const spellId = spellNameToId.get(spellName.toLowerCase());

      if (!spellId) {
        // Spell not in our database (probably not from XPHB source)
        continue;
      }

      // Add relationship for each class
      for (const className of Object.keys(xphbClasses)) {
        const classId = classNameToId.get(className);

        if (!classId) {
          console.log(`⚠️  Warning: Class "${className}" not found for spell "${spellName}"`);
          continue;
        }

        relationships.push({
          classId,
          spellId,
        });
      }
    }
  }

  console.log(`📊 Processing statistics:`);
  console.log(`   Total spells in lookup: ${spellsProcessed}`);
  console.log(`   Spells with XPHB classes: ${spellsWithXPHBClasses}`);
  console.log(`   Class-spell relationships to create: ${relationships.length}\n`);

  // Remove duplicates
  const uniqueRelationships = relationships.filter((rel, index, self) =>
    index === self.findIndex(r => r.classId === rel.classId && r.spellId === rel.spellId)
  );

  console.log(`   After removing duplicates: ${uniqueRelationships.length}\n`);

  // Insert in batches
  const BATCH_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < uniqueRelationships.length; i += BATCH_SIZE) {
    const batch = uniqueRelationships.slice(i, i + BATCH_SIZE);

    try {
      await prisma.classSpell.createMany({
        data: batch,
        skipDuplicates: true,
      });
      inserted += batch.length;
      console.log(`✅ Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} relationships`);
    } catch (error) {
      console.error(`❌ Error inserting batch: ${error.message}`);
    }
  }

  console.log(`\n🎉 Import complete!`);
  console.log(`   Total class-spell relationships created: ${inserted}`);

  // Verify some sample data
  const sampleCounts = await Promise.all([
    prisma.classSpell.count({
      where: {
        class: { name: 'Wizard' }
      }
    }),
    prisma.classSpell.count({
      where: {
        class: { name: 'Cleric' }
      }
    }),
    prisma.classSpell.count({
      where: {
        class: { name: 'Fighter' }
      }
    }),
  ]);

  console.log(`\n📊 Sample counts by class:`);
  console.log(`   Wizard: ${sampleCounts[0]} spells`);
  console.log(`   Cleric: ${sampleCounts[1]} spells`);
  console.log(`   Fighter: ${sampleCounts[2]} spells`);
}

async function main() {
  try {
    await importClassSpells();
  } catch (error) {
    console.error('\n💥 Import failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { importClassSpells };
