#!/usr/bin/env node

/**
 * D&D Class Data Import Script
 *
 * This script imports class and subclass data from JSON files into the PostgreSQL database.
 * It handles the complex nested structure of class features, subclass options, and
 * spellcasting progressions. It can process either a directory of individual class files
 * or a single combined JSON file.
 *
 * Usage:
 *   node scripts/import-classes.js <path-to-class-directory>
 *   node scripts/import-classes.js <path-to-class-json-file>
 * Examples:
 *   node scripts/import-classes.js /path/to/class/directory
 *   node scripts/import-classes.js ../data/classes.json
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Common D&D ability scores
const ABILITY_SCORES = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma',
];

// Common D&D skills
const SKILLS = [
  'acrobatics',
  'animal-handling',
  'arcana',
  'athletics',
  'deception',
  'history',
  'insight',
  'intimidation',
  'investigation',
  'medicine',
  'nature',
  'perception',
  'performance',
  'persuasion',
  'religion',
  'sleight-of-hand',
  'stealth',
  'survival',
];

/**
 * Filter classes data for D&D 2024 content only
 * Explicitly rejects PHB (2014 Player's Handbook) content
 */
function filterXPHBContent(data) {
  return data.filter((item) => {
    return item.source === 'XPHB' || item.source === 'XDMG';
  });
}

/**
 * Parse class features by level
 */
function parseClassFeatures(classTableGroups) {
  if (!classTableGroups || !Array.isArray(classTableGroups)) return null;

  const featuresByLevel = {};

  classTableGroups.forEach((group) => {
    if (group.rows && Array.isArray(group.rows)) {
      group.rows.forEach((row) => {
        if (row.level && row.features) {
          featuresByLevel[row.level] = {
            level: row.level,
            features: Array.isArray(row.features)
              ? row.features
              : [row.features],
            proficiencyBonus: row.prof || null,
            additionalInfo: {
              spellSlots: extractSpellSlots(row),
              cantripsKnown: row.cantripsKnown || null,
              spellsKnown: row.spellsKnown || null,
              invocationsKnown: row.invocationsKnown || null,
              rageUses: row.rages || null,
              rageDamage: row.rageDamage || null,
              unarmoredMovement: row.unarmoredMovement || null,
              kiPoints: row.ki || null,
              martialArts: row.martialArts || null,
              sneakAttack: row.sneakAttack || null,
            },
          };
        }
      });
    }
  });

  return Object.keys(featuresByLevel).length > 0 ? featuresByLevel : null;
}

/**
 * Extract spell slot information from class table row
 */
function extractSpellSlots(row) {
  const slots = {};
  for (let i = 1; i <= 9; i++) {
    const slotKey = `${i}`;
    if (row[slotKey] && row[slotKey] !== '-' && row[slotKey] !== 0) {
      slots[`level${i}`] = parseInt(row[slotKey]) || 0;
    }
  }
  return Object.keys(slots).length > 0 ? slots : null;
}

/**
 * Parse subclass features and organize them properly
 */
function parseSubclassFeatures(subclasses) {
  if (!subclasses || !Array.isArray(subclasses)) return null;

  const subclassData = {};

  subclasses.forEach((subclass) => {
    const subclassName = subclass.name || subclass.shortName;

    subclassData[subclassName] = {
      name: subclassName,
      shortName: subclass.shortName || subclassName,
      source: subclass.source || null,
      page: subclass.page || null,

      // Subclass features organized by level
      features: parseSubclassFeaturesByLevel(subclass.subclassFeatures),

      // Additional spells (if applicable)
      additionalSpells: subclass.additionalSpells || null,
      subclassSpells: subclass.subclassSpells || null,

      // Flavor and description
      fluff: subclass.fluff || null,
      entries: subclass.entries || null,
    };
  });

  return Object.keys(subclassData).length > 0 ? subclassData : null;
}

/**
 * Parse subclass features organized by level
 */
function parseSubclassFeaturesByLevel(features) {
  if (!features || !Array.isArray(features)) return null;

  const featuresByLevel = {};

  features.forEach((feature) => {
    const level = feature.level || 1;

    if (!featuresByLevel[level]) {
      featuresByLevel[level] = [];
    }

    featuresByLevel[level].push({
      name: feature.name,
      entries: feature.entries || [],
      isClassFeatureVariant: feature.isClassFeatureVariant || false,
      source: feature.source || null,
    });
  });

  return featuresByLevel;
}

/**
 * Parse spellcasting information
 */
function parseSpellcasting(spellcastingData) {
  if (!spellcastingData || !Array.isArray(spellcastingData)) return null;

  const spellcasting = spellcastingData[0]; // Usually only one spellcasting entry per class

  return {
    name: spellcasting.name || 'Spellcasting',
    ability: spellcasting.ability || null,
    type: spellcasting.type || 'full', // full, half, third, pact, etc.
    ritual: spellcasting.ritual || false,
    focus: spellcasting.focus || null,
    known: spellcasting.known || null,
    prepared: spellcasting.prepared || null,

    // Spell progression details
    progression: spellcasting.progression || null,

    // Additional spellcasting rules
    additionalSpells: spellcasting.additionalSpells || null,

    // Full spellcasting entry for complex rules
    entries: spellcasting.entries || null,
  };
}

/**
 * Parse proficiency data
 */
function parseProficiencies(startingProficiencies) {
  if (!startingProficiencies) return {};

  return {
    armor: startingProficiencies.armor || null,
    weapons: startingProficiencies.weapons || null,
    tools: startingProficiencies.tools || null,
    skills: startingProficiencies.skills || null,
    savingThrows: startingProficiencies.savingThrows || null,
  };
}

/**
 * Process and import class data
 */
async function importClasses(jsonFilePath) {
  console.log(`📚 Reading class data from: ${jsonFilePath}`);

  if (!fs.existsSync(jsonFilePath)) {
    throw new Error(`File not found: ${jsonFilePath}`);
  }

  const rawData = fs.readFileSync(jsonFilePath, 'utf8');
  const classData = JSON.parse(rawData);

  // Handle different JSON structures
  let classes = [];
  if (classData.class && Array.isArray(classData.class)) {
    classes = classData.class;
  } else if (Array.isArray(classData)) {
    classes = classData;
  } else {
    throw new Error(
      'Invalid class data format. Expected array of classes or { class: [...] }'
    );
  }

  console.log(`🎯 Found ${classes.length} total classes`);

  // Filter for D&D 2024 content
  const xphbClasses = filterXPHBContent(classes);
  console.log(`📖 Processing ${xphbClasses.length} D&D 2024 classes`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < xphbClasses.length; i++) {
    const classItem = xphbClasses[i];
    const progress = `[${i + 1}/${xphbClasses.length}]`;

    try {
      // Parse proficiencies
      const proficiencies = parseProficiencies(classItem.startingProficiencies);

      // Prepare class data for database
      const classToInsert = {
        name: classItem.name,
        source: classItem.source || 'XPHB',
        page: classItem.page || null,

        // Core class mechanics
        hitDie: classItem.hd?.number || classItem.hitDie || 8,
        primaryAbility: Array.isArray(classItem.primaryAbility)
          ? classItem.primaryAbility
          : classItem.primaryAbility
          ? [classItem.primaryAbility]
          : [],
        savingThrowProficiencies: proficiencies.savingThrows || [],

        // Proficiencies
        armorProficiencies: proficiencies.armor,
        weaponProficiencies: proficiencies.weapons,
        toolProficiencies: proficiencies.tools,
        skillProficiencies: proficiencies.skills,

        // Class features and progression
        classFeatures: parseClassFeatures(classItem.classTableGroups),
        subclassFeatures: parseSubclassFeatures(classItem.subclasses),

        // Spellcasting
        spellcasting: parseSpellcasting(classItem.spellcastingAbility),
        spellcastingAbility:
          classItem.casterProgression?.ability ||
          (classItem.spellcastingAbility &&
            classItem.spellcastingAbility[0]?.ability) ||
          null,

        // D&D 2024 flags
        srd52: classItem.srd52 || false,
        basicRules2024: classItem.basicRules || false,

        // Metadata
        sourceBook:
          classItem.source === 'XPHB'
            ? "Player's Handbook 2024"
            : "Player's Handbook",
        contentVersion: '2024',
        isHomebrew: false,
      };

      // Try to insert the class
      const result = await prisma.class.upsert({
        where: { name: classToInsert.name },
        update: classToInsert,
        create: classToInsert,
      });

      console.log(
        `${progress} ✅ ${classItem.name} (${
          classItem.subclasses?.length || 0
        } subclasses)`
      );
      imported++;
    } catch (error) {
      console.error(
        `${progress} ❌ Failed to import "${classItem.name}":`,
        error.message
      );
      errors++;
    }
  }

  console.log('\n📊 Class Import Summary:');
  console.log(`  ✅ Imported: ${imported}`);
  console.log(`  ⚠️  Skipped:  ${skipped}`);
  console.log(`  ❌ Errors:   ${errors}`);
  console.log(`  📚 Total classes processed: ${xphbClasses.length}`);

  if (errors > 0) {
    console.log('\n⚠️  Some classes failed to import. Check the errors above.');
  } else {
    console.log('\n🎉 All D&D classes imported successfully!');
  }
}

/**
 * Initialize reference data for classes
 */
async function initializeReferenceData() {
  console.log('📚 Initializing reference data for classes...');

  try {
    // Reference data should already exist from spells import
    console.log('✅ Reference data ready for class import');
  } catch (error) {
    console.error('❌ Error initializing reference data:', error);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error(
      '❌ Usage: node scripts/import-classes.js <path-to-class-json-file>'
    );
    console.error(
      '   Example: node scripts/import-classes.js ../data/classes.json'
    );
    process.exit(1);
  }

  const jsonFilePath = path.resolve(args[0]);

  try {
    console.log('🚀 Starting D&D Class Import Process...\n');

    // Initialize reference data
    await initializeReferenceData();

    // Import classes
    await importClasses(jsonFilePath);

    console.log('\n🎉 Class import process completed successfully!');
  } catch (error) {
    console.error('\n💥 Class import process failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  main,
  importClasses,
  initializeReferenceData,
  filterXPHBContent,
};
