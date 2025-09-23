#!/usr/bin/env node

/**
 * D&D Spell Data Import Script
 *
 * This script imports spell data from JSON files into the PostgreSQL database.
 * It handles the complex nested structure of spell data and normalizes it properly.
 *
 * Usage: node scripts/import-spells.js <path-to-spell-json-file>
 * Example: node scripts/import-spells.js ../data/spells.json
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// D&D 2024 spell school mappings
const SPELL_SCHOOLS = {
  A: 'Abjuration',
  C: 'Conjuration',
  D: 'Divination',
  E: 'Enchantment',
  V: 'Evocation',
  I: 'Illusion',
  N: 'Necromancy',
  T: 'Transmutation',
};

// Common D&D damage types
const DAMAGE_TYPES = [
  'acid',
  'bludgeoning',
  'cold',
  'fire',
  'force',
  'lightning',
  'necrotic',
  'piercing',
  'poison',
  'psychic',
  'radiant',
  'slashing',
  'thunder',
];

// Common D&D conditions
const CONDITIONS = [
  'blinded',
  'charmed',
  'deafened',
  'frightened',
  'grappled',
  'incapacitated',
  'invisible',
  'paralyzed',
  'petrified',
  'poisoned',
  'prone',
  'restrained',
  'stunned',
  'unconscious',
];

// Common creature types
const CREATURE_TYPES = [
  'aberration',
  'beast',
  'celestial',
  'construct',
  'dragon',
  'elemental',
  'fey',
  'fiend',
  'giant',
  'humanoid',
  'monstrosity',
  'ooze',
  'plant',
  'undead',
];

/**
 * Initialize reference data in the database
 */
async function initializeReferenceData() {
  console.log('🔧 Initializing reference data...');

  try {
    // Insert spell schools
    for (const [code, name] of Object.entries(SPELL_SCHOOLS)) {
      await prisma.spellSchool.upsert({
        where: { id: code },
        update: { name },
        create: { id: code, name },
      });
    }

    // Insert damage types
    for (const damageType of DAMAGE_TYPES) {
      await prisma.damageType.upsert({
        where: { id: damageType },
        update: {
          name: damageType.charAt(0).toUpperCase() + damageType.slice(1),
        },
        create: {
          id: damageType,
          name: damageType.charAt(0).toUpperCase() + damageType.slice(1),
        },
      });
    }

    // Insert conditions
    for (const condition of CONDITIONS) {
      await prisma.condition.upsert({
        where: { id: condition },
        update: {
          name: condition.charAt(0).toUpperCase() + condition.slice(1),
        },
        create: {
          id: condition,
          name: condition.charAt(0).toUpperCase() + condition.slice(1),
        },
      });
    }

    // Insert creature types
    for (const creatureType of CREATURE_TYPES) {
      await prisma.creatureType.upsert({
        where: { id: creatureType },
        update: {
          name: creatureType.charAt(0).toUpperCase() + creatureType.slice(1),
        },
        create: {
          id: creatureType,
          name: creatureType.charAt(0).toUpperCase() + creatureType.slice(1),
        },
      });
    }

    console.log('✅ Reference data initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing reference data:', error);
    throw error;
  }
}

/**
 * Process and import spell data
 */
async function importSpells(jsonFilePath) {
  console.log(`📖 Reading spell data from: ${jsonFilePath}`);

  if (!fs.existsSync(jsonFilePath)) {
    throw new Error(`File not found: ${jsonFilePath}`);
  }

  const rawData = fs.readFileSync(jsonFilePath, 'utf8');
  const spellData = JSON.parse(rawData);

  if (!spellData.spell || !Array.isArray(spellData.spell)) {
    throw new Error('Invalid spell data format. Expected { spell: [...] }');
  }

  const spells = spellData.spell;
  console.log(`🎯 Found ${spells.length} spells to import`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < spells.length; i++) {
    const spell = spells[i];
    const progress = `[${i + 1}/${spells.length}]`;

    try {
      // Prepare spell data for database
      const spellToInsert = {
        name: spell.name,
        source: spell.source || null,
        page: spell.page || null,
        level: spell.level,
        school: spell.school || null,

        // Store complex structures as JSON
        time: spell.time || null,
        range: spell.range || null,
        components: spell.components || null,
        duration: spell.duration || null,
        entries: spell.entries || null,
        entriesHigherLevel: spell.entriesHigherLevel || null,
        scalingLevelDice: spell.scalingLevelDice || null,

        // Arrays for filtering
        damageInflict: spell.damageInflict || [],
        conditionInflict: spell.conditionInflict || [],
        savingThrow: spell.savingThrow || [],
        affectsCreatureType: spell.affectsCreatureType || [],
        miscTags: spell.miscTags || [],
        areaTags: spell.areaTags || [],

        // Flags - handle both boolean and string values for srd52
        srd52:
          typeof spell.srd52 === 'boolean'
            ? spell.srd52
            : spell.srd52
            ? true
            : null,
        basicRules2024: spell.basicRules2024 || null,
        isRitual: spell.meta?.ritual || null,

        // Metadata
        sourceBook: spell.source || null,
        contentVersion: 'dnd2024',
        isHomebrew: false,
      };

      // Try to insert the spell
      await prisma.spell.create({
        data: spellToInsert,
      });

      imported++;
      console.log(`✅ ${progress} Imported: ${spell.name}`);
    } catch (error) {
      if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
        // Unique constraint violation - spell already exists
        skipped++;
        console.log(`⏭️  ${progress} Skipped (already exists): ${spell.name}`);
      } else {
        errors++;
        console.error(
          `❌ ${progress} Error importing ${spell.name}:`,
          error.message
        );
      }
    }
  }

  console.log(`\n📊 Import Summary:`);
  console.log(`   ✅ Successfully imported: ${imported}`);
  console.log(`   ⏭️  Skipped (duplicates): ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📝 Total processed: ${imported + skipped + errors}`);
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error(
      '❌ Usage: node scripts/import-spells.js <path-to-spell-json-file>'
    );
    console.error(
      '   Example: node scripts/import-spells.js ../data/spells.json'
    );
    process.exit(1);
  }

  const jsonFilePath = path.resolve(args[0]);

  try {
    console.log('🚀 Starting D&D Spell Import Process...\n');

    // Initialize reference data first
    await initializeReferenceData();

    // Import spells
    await importSpells(jsonFilePath);

    console.log('\n🎉 Import process completed successfully!');
  } catch (error) {
    console.error('\n💥 Import process failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, importSpells, initializeReferenceData };
