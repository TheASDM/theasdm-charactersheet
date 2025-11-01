#!/usr/bin/env node

/**
 * Simple Script to Populate Spell-Class Relationships
 *
 * This uses the 5etools spells.json file which contains class information
 * in a different format than expected by the import script.
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Path to 5etools spells data
const SPELLS_FILE = path.join(__dirname, '../../5etools/spells.json');

async function populateSpellClasses() {
  console.log('📚 Populating spell-class relationships...\n');

  // Check if spells file exists
  if (!fs.existsSync(SPELLS_FILE)) {
    throw new Error(`Spells file not found: ${SPELLS_FILE}`);
  }

  // Read spells from 5etools
  const spellsData = JSON.parse(fs.readFileSync(SPELLS_FILE, 'utf8'));
  const spells = spellsData.spell || [];

  console.log(`Found ${spells.length} spells in 5etools data\n`);

  // Process each spell
  let updated = 0;
  let notFound = 0;
  let errors = 0;

  for (const spell of spells) {
    try {
      // Only process XPHB spells
      if (spell.source !== 'XPHB') {
        continue;
      }

      // Extract class names from the spell
      const classNames = [];

      if (spell.classes && spell.classes.fromClassList) {
        // Classes are in fromClassList array
        for (const classRef of spell.classes.fromClassList) {
          if (classRef.name) {
            classNames.push(classRef.name.toLowerCase());
          }
        }
      }

      if (spell.classes && spell.classes.fromClassListVariant) {
        // Some spells have variant class lists
        for (const classRef of spell.classes.fromClassListVariant) {
          if (classRef.name && !classNames.includes(classRef.name.toLowerCase())) {
            classNames.push(classRef.name.toLowerCase());
          }
        }
      }

      // Update the spell in the database
      if (classNames.length > 0) {
        const result = await prisma.canonSpell.updateMany({
          where: {
            name: spell.name,
            source: 'XPHB'
          },
          data: {
            classes: classNames
          }
        });

        if (result.count > 0) {
          updated++;
          if (updated % 50 === 0) {
            console.log(`  Updated ${updated} spells...`);
          }
        } else {
          notFound++;
        }
      }
    } catch (error) {
      console.error(`❌ Error processing spell ${spell.name}:`, error.message);
      errors++;
    }
  }

  console.log(`\n✅ Done!`);
  console.log(`  Updated: ${updated} spells`);
  console.log(`  Not found in DB: ${notFound} spells`);
  console.log(`  Errors: ${errors}`);
}

populateSpellClasses()
  .then(() => {
    console.log('\n🎉 Spell-class relationships populated successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed to populate spell-class relationships:', error);
    process.exit(1);
  });
