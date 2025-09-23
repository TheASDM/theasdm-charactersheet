#!/usr/bin/env node

/**
 * D&D Background Data Import Script
 *
 * This script imports background data from JSON files into the PostgreSQL database.
 * It focuses on D&D 2024 content (source: XPHB) and handles the new background
 * structure with ability score increases and origin feats.
 *
 * Usage: node scripts/import-backgrounds.js <path-to-backgrounds-json-file>
 * Example: node scripts/import-backgrounds.js ../data/backgrounds.json
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Filter background data for D&D 2024 content only
 */
function filterXPHBContent(data) {
  return data.filter((item) => item.source === 'XPHB');
}

/**
 * Parse skill proficiencies from background data
 */
function parseSkillProficiencies(skillProfs) {
  if (!skillProfs || !Array.isArray(skillProfs)) return null;

  const parsedSkills = {};

  skillProfs.forEach((skillSet) => {
    if (typeof skillSet === 'object') {
      // Handle direct skill assignments like { "insight": true, "religion": true }
      Object.keys(skillSet).forEach((skill) => {
        if (skillSet[skill] === true) {
          parsedSkills[skill] = true;
        } else if (typeof skillSet[skill] === 'object') {
          // Handle complex skill choices
          parsedSkills[skill] = skillSet[skill];
        }
      });
    }
  });

  return Object.keys(parsedSkills).length > 0 ? parsedSkills : null;
}

/**
 * Parse language proficiencies
 */
function parseLanguageProficiencies(langProfs) {
  if (!langProfs || !Array.isArray(langProfs)) return [];

  const languages = [];

  langProfs.forEach((langSet) => {
    if (typeof langSet === 'object') {
      // Handle specific languages
      Object.keys(langSet).forEach((lang) => {
        if (
          langSet[lang] === true &&
          lang !== 'anyStandard' &&
          lang !== 'choose'
        ) {
          languages.push(lang);
        }
      });
    } else if (typeof langSet === 'string') {
      languages.push(langSet);
    }
  });

  return languages;
}

/**
 * Parse starting equipment from background
 */
function parseStartingEquipment(equipment) {
  if (!equipment || !Array.isArray(equipment)) return null;

  const parsedEquipment = [];

  equipment.forEach((equipSet) => {
    if (equipSet._) {
      // Main equipment set
      parsedEquipment.push({
        type: 'standard',
        items: equipSet._,
      });
    } else if (equipSet.a || equipSet.b) {
      // Choice between equipment sets
      parsedEquipment.push({
        type: 'choice',
        optionA: equipSet.a || null,
        optionB: equipSet.b || null,
      });
    } else {
      // Direct equipment
      parsedEquipment.push({
        type: 'direct',
        item: equipSet,
      });
    }
  });

  return parsedEquipment.length > 0 ? parsedEquipment : null;
}

/**
 * Parse background feature
 */
function parseBackgroundFeature(entries) {
  if (!entries || !Array.isArray(entries)) return null;

  const feature = {
    name: null,
    description: [],
  };

  entries.forEach((entry) => {
    if (typeof entry === 'string') {
      feature.description.push(entry);
    } else if (typeof entry === 'object') {
      if (entry.type === 'entries' && entry.name) {
        if (!feature.name) feature.name = entry.name;
        if (entry.entries) {
          feature.description.push(...entry.entries);
        }
      } else if (entry.entries) {
        feature.description.push(...entry.entries);
      }
    }
  });

  return feature.description.length > 0 ? feature : null;
}

/**
 * Parse D&D 2024 ability score increase from background
 */
function parseAbilityScoreIncrease(ability) {
  if (!ability || !Array.isArray(ability)) return null;

  const asiData = {};

  ability.forEach((abilitySet) => {
    if (abilitySet.choose && abilitySet.choose.weighted) {
      // Handle weighted choice system (D&D 2024 style)
      asiData.type = 'weighted_choice';
      asiData.options = abilitySet.choose.weighted.from || [];
      asiData.weights = abilitySet.choose.weighted.weights || null;
    } else if (abilitySet.choose && abilitySet.choose.from) {
      // Handle simple choice system
      asiData.type = 'choice';
      asiData.count = abilitySet.choose.count || 1;
      asiData.from = abilitySet.choose.from;
      asiData.amount = abilitySet.choose.amount || 1;
    } else {
      // Handle fixed increases
      Object.keys(abilitySet).forEach((ability) => {
        if (typeof abilitySet[ability] === 'number') {
          if (!asiData.fixed) asiData.fixed = {};
          asiData.fixed[ability] = abilitySet[ability];
        }
      });
    }
  });

  return Object.keys(asiData).length > 0 ? asiData : null;
}

/**
 * Parse origin feat for D&D 2024 backgrounds
 */
function parseOriginFeat(feats) {
  if (!feats || !Array.isArray(feats)) return null;

  // D&D 2024 backgrounds typically get one origin feat
  const feat = feats.find((f) => f.any || f.origin || typeof f === 'string');

  if (typeof feat === 'string') return feat;
  if (feat && feat.any) return 'any_origin_feat';
  if (feat && feat.origin) return feat.origin;

  return null;
}

/**
 * Process and import background data
 */
async function importBackgrounds(jsonFilePath) {
  console.log(`📜 Reading background data from: ${jsonFilePath}`);

  if (!fs.existsSync(jsonFilePath)) {
    throw new Error(`File not found: ${jsonFilePath}`);
  }

  const rawData = fs.readFileSync(jsonFilePath, 'utf8');
  const backgroundData = JSON.parse(rawData);

  // Handle different JSON structures
  let backgrounds = [];
  if (backgroundData.background && Array.isArray(backgroundData.background)) {
    backgrounds = backgroundData.background;
  } else if (Array.isArray(backgroundData)) {
    backgrounds = backgroundData;
  } else {
    throw new Error(
      'Invalid background data format. Expected array of backgrounds or { background: [...] }'
    );
  }

  console.log(`🎯 Found ${backgrounds.length} total backgrounds`);

  // Filter for D&D 2024 content only
  const xphbBackgrounds = filterXPHBContent(backgrounds);
  console.log(
    `📖 Filtered to ${xphbBackgrounds.length} D&D 2024 backgrounds (XPHB source)`
  );

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < xphbBackgrounds.length; i++) {
    const background = xphbBackgrounds[i];
    const progress = `[${i + 1}/${xphbBackgrounds.length}]`;

    try {
      // Prepare background data for database
      const backgroundToInsert = {
        name: background.name,
        description: Array.isArray(background.entries)
          ? background.entries
              .filter((entry) => typeof entry === 'string')
              .join(' ')
          : null,

        // Proficiencies and languages
        skillProficiencies: parseSkillProficiencies(
          background.skillProficiencies
        ),
        languages: parseLanguageProficiencies(background.languageProficiencies),

        // Equipment and features
        equipment: parseStartingEquipment(background.startingEquipment),
        feature: parseBackgroundFeature(background.entries),

        // D&D 2024 specific fields
        originFeat: parseOriginFeat(background.feats),
        abilityScoreIncrease: parseAbilityScoreIncrease(background.ability),

        // Metadata
        contentVersion: '2024',
      };

      // Try to insert the background
      const result = await prisma.background.upsert({
        where: { name: backgroundToInsert.name },
        update: backgroundToInsert,
        create: backgroundToInsert,
      });

      console.log(`${progress} ✅ ${background.name}`);
      imported++;
    } catch (error) {
      console.error(
        `${progress} ❌ Failed to import "${background.name}":`,
        error.message
      );
      errors++;
    }
  }

  console.log('\n📊 Background Import Summary:');
  console.log(`  ✅ Imported: ${imported}`);
  console.log(`  ⚠️  Skipped:  ${skipped}`);
  console.log(`  ❌ Errors:   ${errors}`);
  console.log(
    `  📜 Total D&D 2024 backgrounds processed: ${xphbBackgrounds.length}`
  );

  if (errors > 0) {
    console.log(
      '\n⚠️  Some backgrounds failed to import. Check the errors above.'
    );
  } else {
    console.log('\n🎉 All D&D 2024 backgrounds imported successfully!');
  }
}

/**
 * Initialize reference data for backgrounds
 */
async function initializeReferenceData() {
  console.log('📚 Initializing reference data for backgrounds...');

  try {
    // Reference data should already exist from previous imports
    console.log('✅ Reference data ready for background import');
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
      '❌ Usage: node scripts/import-backgrounds.js <path-to-backgrounds-json-file>'
    );
    console.error(
      '   Example: node scripts/import-backgrounds.js ../data/backgrounds.json'
    );
    process.exit(1);
  }

  const jsonFilePath = path.resolve(args[0]);

  try {
    console.log('🚀 Starting D&D Background Import Process...\n');

    // Initialize reference data
    await initializeReferenceData();

    // Import backgrounds
    await importBackgrounds(jsonFilePath);

    console.log('\n🎉 Background import process completed successfully!');
  } catch (error) {
    console.error('\n💥 Background import process failed:', error.message);
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
  importBackgrounds,
  initializeReferenceData,
  filterXPHBContent,
};
