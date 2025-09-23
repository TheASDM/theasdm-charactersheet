#!/usr/bin/env node

/**
 * D&D Class Directory Import Script
 *
 * This script imports class and subclass data from a directory of individual class JSON files
 * into the PostgreSQL database. It filters for D&D 2024 content (source: XPHB) and handles
 * the complex nested structure of class features, subclass options, and spellcasting progressions.
 *
 * Usage: node scripts/import-classes-directory.js <path-to-class-directory>
 * Example: node scripts/import-classes-directory.js /Users/dustinamodeo/Documents/dnd/5etools-src/data/class
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Target class files (excluding fluff, sidekick, mystic, artificer)
const TARGET_CLASS_FILES = [
  'class-barbarian.json',
  'class-bard.json',
  'class-cleric.json',
  'class-druid.json',
  'class-fighter.json',
  'class-monk.json',
  'class-paladin.json',
  'class-ranger.json',
  'class-rogue.json',
  'class-sorcerer.json',
  'class-warlock.json',
  'class-wizard.json',
];

/**
 * Parse proficiency arrays into normalized format
 */
function parseProficiencyArray(profArray) {
  if (!profArray || !Array.isArray(profArray)) return [];

  return profArray.map((prof) => {
    if (typeof prof === 'string') return prof;
    if (typeof prof === 'object' && prof.proficiency) return prof.proficiency;
    return prof;
  });
}

/**
 * Parse skill proficiencies from starting proficiencies
 */
function parseSkillProficiencies(startingProfs) {
  if (!startingProfs || !startingProfs.skills) return null;

  const skills = startingProfs.skills;
  if (Array.isArray(skills)) {
    return skills;
  }

  if (typeof skills === 'object' && skills.choose) {
    return {
      choose: skills.choose.count || 2,
      from: skills.choose.from || [],
    };
  }

  return skills;
}

/**
 * Parse class features from class data and separate feature arrays
 */
function parseClassFeatures(classFeatures, className) {
  if (!classFeatures || !Array.isArray(classFeatures)) return null;

  // Group features by level
  const featuresByLevel = {};

  classFeatures
    .filter(
      (feature) =>
        feature.className === className && feature.classSource === 'XPHB'
    )
    .forEach((feature) => {
      const level = feature.level || 1;

      if (!featuresByLevel[level]) {
        featuresByLevel[level] = [];
      }

      featuresByLevel[level].push({
        name: feature.name,
        entries: feature.entries || [],
        source: feature.source,
        page: feature.page,
        header: feature.header || null,
      });
    });

  return Object.keys(featuresByLevel).length > 0 ? featuresByLevel : null;
}

/**
 * Parse subclass features and organize by subclass
 */
function parseSubclassFeatures(subclasses, subclassFeatures, className) {
  if (!subclasses || !Array.isArray(subclasses)) return null;

  const subclassData = {};

  // Process each XPHB subclass
  subclasses
    .filter((sub) => sub.source === 'XPHB' && sub.className === className)
    .forEach((subclass) => {
      const subclassName = subclass.name;
      const shortName = subclass.shortName || subclassName;

      // Find matching subclass features
      const matchingFeatures = subclassFeatures
        ? subclassFeatures.filter(
            (feat) =>
              feat.source === 'XPHB' &&
              feat.className === className &&
              feat.subclassShortName === shortName
          )
        : [];

      // Group features by level
      const featuresByLevel = {};
      matchingFeatures.forEach((feature) => {
        const level = feature.level || 1;
        if (!featuresByLevel[level]) {
          featuresByLevel[level] = [];
        }

        featuresByLevel[level].push({
          name: feature.name,
          entries: feature.entries || [],
          source: feature.source,
          page: feature.page,
          header: feature.header || null,
        });
      });

      subclassData[subclassName] = {
        name: subclassName,
        shortName: shortName,
        source: subclass.source,
        page: subclass.page,
        features: featuresByLevel,
        additionalSpells: subclass.additionalSpells || null,
        subclassSpells: subclass.subclassSpells || null,
      };
    });

  return Object.keys(subclassData).length > 0 ? subclassData : null;
}

/**
 * Parse spellcasting information from class
 */
function parseSpellcasting(classData) {
  // Check for spellcasting ability in different locations
  if (classData.casterProgression) {
    return {
      type: classData.casterProgression || 'full',
      ability: classData.spellcastingAbility || null,
      ritual: classData.ritual || false,
      progression: classData.casterProgression,
    };
  }

  if (
    classData.spellcastingAbility &&
    Array.isArray(classData.spellcastingAbility)
  ) {
    const spellcasting = classData.spellcastingAbility[0];
    return {
      name: spellcasting.name || 'Spellcasting',
      ability: spellcasting.ability || null,
      type: spellcasting.type || 'full',
      ritual: spellcasting.ritual || false,
      entries: spellcasting.entries || null,
    };
  }

  return null;
}

/**
 * Process a single class file and extract XPHB content
 */
function processClassFile(filePath) {
  console.log(`  📖 Processing ${path.basename(filePath)}...`);

  const rawData = fs.readFileSync(filePath, 'utf8');
  const classData = JSON.parse(rawData);

  // Extract XPHB classes
  const xphbClasses = (classData.class || []).filter(
    (cls) => cls.source === 'XPHB'
  );
  const xphbSubclasses = (classData.subclass || []).filter(
    (sub) => sub.source === 'XPHB'
  );
  const xphbFeatures = (classData.classFeature || []).filter(
    (feat) => feat.source === 'XPHB'
  );
  const xphbSubFeatures = (classData.subclassFeature || []).filter(
    (feat) => feat.source === 'XPHB'
  );

  console.log(
    `     Classes: ${xphbClasses.length}, Subclasses: ${
      xphbSubclasses.length
    }, Features: ${xphbFeatures.length + xphbSubFeatures.length}`
  );

  return {
    classes: xphbClasses,
    subclasses: xphbSubclasses,
    classFeatures: xphbFeatures,
    subclassFeatures: xphbSubFeatures,
  };
}

/**
 * Process directory of class files
 */
function processClassDirectory(directoryPath) {
  console.log(`📁 Processing class directory: ${directoryPath}`);

  if (!fs.existsSync(directoryPath)) {
    throw new Error(`Directory not found: ${directoryPath}`);
  }

  const allData = {
    classes: [],
    subclasses: [],
    classFeatures: [],
    subclassFeatures: [],
  };

  let processedFiles = 0;

  for (const fileName of TARGET_CLASS_FILES) {
    const filePath = path.join(directoryPath, fileName);

    if (fs.existsSync(filePath)) {
      const fileData = processClassFile(filePath);

      allData.classes.push(...fileData.classes);
      allData.subclasses.push(...fileData.subclasses);
      allData.classFeatures.push(...fileData.classFeatures);
      allData.subclassFeatures.push(...fileData.subclassFeatures);

      processedFiles++;
    } else {
      console.log(`  ⚠️  ${fileName} not found, skipping`);
    }
  }

  console.log(`📊 Total extracted from ${processedFiles} files:`);
  console.log(`   Classes: ${allData.classes.length}`);
  console.log(`   Subclasses: ${allData.subclasses.length}`);
  console.log(`   Class Features: ${allData.classFeatures.length}`);
  console.log(`   Subclass Features: ${allData.subclassFeatures.length}`);

  return allData;
}

/**
 * Import classes into database
 */
async function importClasses(directoryPath) {
  console.log(`🚀 Starting D&D 2024 Class Import from Directory...\n`);

  // Process all class files in directory
  const allData = processClassDirectory(directoryPath);

  if (allData.classes.length === 0) {
    throw new Error('No XPHB classes found to import');
  }

  let imported = 0;
  let errors = 0;

  console.log(`\n📚 Importing ${allData.classes.length} classes...`);

  for (let i = 0; i < allData.classes.length; i++) {
    const classItem = allData.classes[i];
    const progress = `[${i + 1}/${allData.classes.length}]`;

    try {
      // Parse primary abilities
      let primaryAbilities = [];
      if (classItem.primaryAbility && Array.isArray(classItem.primaryAbility)) {
        classItem.primaryAbility.forEach((ability) => {
          if (typeof ability === 'object') {
            primaryAbilities.push(...Object.keys(ability));
          } else {
            primaryAbilities.push(ability);
          }
        });
      }

      // Prepare class data for database
      const classToInsert = {
        name: classItem.name,
        source: classItem.source || 'XPHB',
        page: classItem.page || null,

        // Core class mechanics
        hitDie: classItem.hd?.faces || 8,
        primaryAbility: primaryAbilities,
        savingThrowProficiencies: parseProficiencyArray(classItem.proficiency),

        // Proficiencies
        armorProficiencies: classItem.startingProficiencies?.armor || null,
        weaponProficiencies: classItem.startingProficiencies?.weapons || null,
        toolProficiencies: classItem.startingProficiencies?.tools || null,
        skillProficiencies: parseSkillProficiencies(
          classItem.startingProficiencies
        ),

        // Class features and progression
        classFeatures: parseClassFeatures(
          allData.classFeatures,
          classItem.name
        ),
        subclassFeatures: parseSubclassFeatures(
          allData.subclasses,
          allData.subclassFeatures,
          classItem.name
        ),

        // Spellcasting
        spellcasting: parseSpellcasting(classItem),
        spellcastingAbility:
          classItem.spellcastingAbility && classItem.spellcastingAbility[0]
            ? classItem.spellcastingAbility[0].ability
            : null,

        // D&D 2024 flags
        srd52: classItem.srd52 || false,
        basicRules2024: classItem.basicRules2024 || false,

        // Metadata
        sourceBook: "Player's Handbook 2024",
        contentVersion: '2024',
        isHomebrew: false,
      };

      // Insert the class
      const result = await prisma.class.upsert({
        where: { name: classToInsert.name },
        update: classToInsert,
        create: classToInsert,
      });

      // Count subclasses for this class
      const subclassCount = allData.subclasses.filter(
        (sub) => sub.className === classItem.name && sub.source === 'XPHB'
      ).length;

      console.log(
        `${progress} ✅ ${classItem.name} (${subclassCount} subclasses)`
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
  console.log(`  ❌ Errors:   ${errors}`);
  console.log(
    `  📚 Total D&D 2024 classes processed: ${allData.classes.length}`
  );

  if (errors > 0) {
    console.log('\n⚠️  Some classes failed to import. Check the errors above.');
  } else {
    console.log('\n🎉 All D&D 2024 classes imported successfully!');
  }
}

/**
 * Initialize reference data
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
      '❌ Usage: node scripts/import-classes-directory.js <path-to-class-directory>'
    );
    console.error(
      '   Example: node scripts/import-classes-directory.js /path/to/5etools/data/class'
    );
    process.exit(1);
  }

  const directoryPath = path.resolve(args[0]);

  try {
    // Initialize reference data
    await initializeReferenceData();

    // Import classes from directory
    await importClasses(directoryPath);

    console.log('\n🎉 Class directory import process completed successfully!');
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

module.exports = { main, importClasses, initializeReferenceData };
