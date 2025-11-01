#!/usr/bin/env node

/**
 * Populate Spell-Class Relationships from class-spells-data.js
 *
 * This script reads the hardcoded class spell lists and updates the
 * classes array in the canon.spell table.
 */

const { PrismaClient } = require('@prisma/client');
const classSpellsData = require('./class-spells-data.js');

const prisma = new PrismaClient();

async function populateSpellClasses() {
  console.log('📚 Populating spell-class relationships from hardcoded data...\n');

  // Get all spells from database
  const spells = await prisma.canonSpell.findMany({
    where: { source: 'XPHB' },
    select: { id: true, name: true, classes: true }
  });

  console.log(`Found ${spells.length} XPHB spells in database\n`);

  // Create a map of spell name (lowercase) to spell ID
  const spellNameToId = new Map();
  for (const spell of spells) {
    spellNameToId.set(spell.name.toLowerCase(), spell.id);
  }

  // Process each class and its spell list
  let totalUpdates = 0;
  let totalSpells = 0;
  const classResults = {};

  for (const [className, spellNames] of Object.entries(classSpellsData)) {
    console.log(`\nProcessing ${className}...`);
    const normalizedClassName = className.toLowerCase();

    let updated = 0;
    let notFound = 0;

    for (const spellName of spellNames) {
      totalSpells++;
      const spellId = spellNameToId.get(spellName.toLowerCase());

      if (!spellId) {
        notFound++;
        console.log(`  ⚠️  Spell not found in DB: ${spellName}`);
        continue;
      }

      // Fetch the current spell data fresh from DB to get latest classes array
      const currentSpell = await prisma.canonSpell.findUnique({
        where: { id: spellId },
        select: { classes: true }
      });

      // Get current classes array
      const currentClasses = currentSpell?.classes || [];

      // Add this class if not already present
      if (!currentClasses.includes(normalizedClassName)) {
        const newClasses = [...currentClasses, normalizedClassName];

        await prisma.canonSpell.update({
          where: { id: spellId },
          data: { classes: newClasses }
        });

        updated++;
        totalUpdates++;
      }
    }

    classResults[className] = { updated, notFound, total: spellNames.length };
    console.log(`  ✅ Updated ${updated} spells, ${notFound} not found`);
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary by Class:\n');

  for (const [className, results] of Object.entries(classResults)) {
    console.log(`${className.padEnd(12)} - ${results.updated} updated, ${results.notFound} not found, ${results.total} total`);
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n✅ Total spell-class relationships created: ${totalUpdates}`);
  console.log(`📝 Total spell entries processed: ${totalSpells}`);

  // Verify a few spells
  console.log('\n🔍 Verification - Sample Spells:\n');

  const sampleSpells = ['Fireball', 'Cure Wounds', 'Eldritch Blast', 'Shield'];
  for (const spellName of sampleSpells) {
    const spell = await prisma.canonSpell.findFirst({
      where: { name: spellName, source: 'XPHB' },
      select: { name: true, level: true, classes: true }
    });

    if (spell) {
      console.log(`  ${spell.name} (Level ${spell.level}): ${spell.classes.join(', ') || 'NO CLASSES'}`);
    }
  }
}

populateSpellClasses()
  .then(() => {
    console.log('\n🎉 Spell-class relationships populated successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
