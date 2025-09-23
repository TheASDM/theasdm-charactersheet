#!/usr/bin/env node

/**
 * D&D Species Data Import Script
 *
 * This script imports species data from JSON files into the PostgreSQL database.
 * It focuses on D&D 2024 content (source: XPHB) and handles the complex nested
 * structure of species traits, abilities, and proficiencies.
 *
 * Usage: node scripts/import-species.js <path-to-species-json-file>
 * Example: node scripts/import-species.js ../data/species.json
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Common D&D creature types
const CREATURE_TYPES = [
  'humanoid',
  'fey',
  'fiend',
  'celestial',
  'construct',
  'dragon',
  'elemental',
  'giant',
  'monstrosity',
  'undead',
];

// Common D&D sizes
const SIZES = ['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan'];

// Common ability scores
const ABILITY_SCORES = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma',
];

/**
 * Filter species data for D&D 2024 content only
 */
function filterXPHBContent(data) {
  return data.filter((item) => item.source === 'XPHB');
}

/**
 * Initialize reference data for species
 */
async function initializeReferenceData() {
  console.log('📚 Initializing reference data for species...');

  try {
    // Note: Most reference data should already exist from spells import
    // Just verify creature types are available if needed

    console.log('✅ Reference data ready for species import');
  } catch (error) {
    console.error('❌ Error initializing reference data:', error);
    throw error;
  }
}

/**
 * Parse and normalize ability score increase data
 */
function parseAbilityScoreIncrease(asiData) {
  if (!asiData) return null;

  // Handle different ASI formats from the JSON
  if (Array.isArray(asiData)) {
    return asiData.map((asi) => {
      if (typeof asi === 'object') {
        return asi;
      }
      return asi;
    });
  }

  return asiData;
}

/**
 * Parse species traits into normalized format
 */
function parseSpeciesTraits(entries) {
  if (!entries || !Array.isArray(entries)) return null;

  const traits = [];

  entries.forEach((entry) => {
    if (typeof entry === 'object' && entry.name) {
      traits.push({
        name: entry.name,
        description: entry.entries || entry.entry || [],
        type: entry.type || 'trait',
      });
    } else if (typeof entry === 'object' && entry.type === 'entries') {
      // Handle nested entries structure
      traits.push({
        name: entry.name || 'Unnamed Trait',
        description: entry.entries || [],
        type: 'trait',
      });
    }
  });

  return traits.length > 0 ? traits : null;
}

/**
 * Parse speed data including additional movement types
 */
function parseSpeed(speed) {
  if (!speed) return { base: 30, additional: null };

  if (typeof speed === 'number') {
    return { base: speed, additional: null };
  }

  if (typeof speed === 'object') {
    const baseSpeed = speed.walk || 30;
    const additionalSpeeds = {};

    ['fly', 'swim', 'climb', 'burrow'].forEach((type) => {
      if (speed[type]) {
        additionalSpeeds[type] = speed[type];
      }
    });

    return {
      base: baseSpeed,
      additional:
        Object.keys(additionalSpeeds).length > 0 ? additionalSpeeds : null,
    };
  }

  return { base: 30, additional: null };
}

/**
 * Process and import species data
 */
async function importSpecies(jsonFilePath) {
  console.log(`🧬 Reading species data from: ${jsonFilePath}`);

  if (!fs.existsSync(jsonFilePath)) {
    throw new Error(`File not found: ${jsonFilePath}`);
  }

  const rawData = fs.readFileSync(jsonFilePath, 'utf8');
  const speciesData = JSON.parse(rawData);

  // Handle different JSON structures
  let species = [];
  if (speciesData.race && Array.isArray(speciesData.race)) {
    species = speciesData.race;
  } else if (speciesData.species && Array.isArray(speciesData.species)) {
    species = speciesData.species;
  } else if (Array.isArray(speciesData)) {
    species = speciesData;
  } else {
    throw new Error(
      'Invalid species data format. Expected array of species or { race: [...] } or { species: [...] }'
    );
  }

  console.log(`🎯 Found ${species.length} total species/races`);

  // Filter for D&D 2024 content only
  const xphbSpecies = filterXPHBContent(species);
  console.log(
    `📖 Filtered to ${xphbSpecies.length} D&D 2024 species (XPHB source)`
  );

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < xphbSpecies.length; i++) {
    const speciesItem = xphbSpecies[i];
    const progress = `[${i + 1}/${xphbSpecies.length}]`;

    try {
      // Parse speed data
      const speedData = parseSpeed(speciesItem.speed);

      // Prepare species data for database
      const speciesToInsert = {
        name: speciesItem.name,
        source: speciesItem.source || 'XPHB',
        page: speciesItem.page || null,

        // Physical characteristics
        size: Array.isArray(speciesItem.size)
          ? speciesItem.size[0]
          : speciesItem.size || 'medium',
        speed: speedData.base,
        additionalSpeeds: speedData.additional,

        // D&D 2024 properties
        creatureType: speciesItem.creatureType || 'humanoid',
        lifespan: speciesItem.age || speciesItem.lifespan || null,

        // Abilities and traits
        traits: parseSpeciesTraits(speciesItem.entries),
        abilityScoreIncrease: parseAbilityScoreIncrease(speciesItem.ability),

        // Languages and proficiencies
        languages: speciesItem.languageProficiencies || [],
        languageOptions: speciesItem.languageOptions || null,
        skillProficiencies: speciesItem.skillProficiencies || null,
        toolProficiencies: speciesItem.toolProficiencies || null,
        weaponProficiencies: speciesItem.weaponProficiencies || null,

        // Magical abilities
        innateSpells:
          speciesItem.spellcastingRace || speciesItem.additionalSpells || null,

        // D&D 2024 flags
        srd52: speciesItem.srd52 || false,
        basicRules2024: speciesItem.basicRules || false,

        // Metadata
        sourceBook:
          speciesItem.source === 'XPHB' ? "Player's Handbook 2024" : 'Unknown',
        contentVersion: '2024',
        isHomebrew: false,
      };

      // Try to insert the species
      const result = await prisma.species.upsert({
        where: { name: speciesToInsert.name },
        update: speciesToInsert,
        create: speciesToInsert,
      });

      console.log(`${progress} ✅ ${speciesItem.name}`);
      imported++;
    } catch (error) {
      console.error(
        `${progress} ❌ Failed to import "${speciesItem.name}":`,
        error.message
      );
      errors++;
    }
  }

  console.log('\n📊 Species Import Summary:');
  console.log(`  ✅ Imported: ${imported}`);
  console.log(`  ⚠️  Skipped:  ${skipped}`);
  console.log(`  ❌ Errors:   ${errors}`);
  console.log(`  📖 Total D&D 2024 species processed: ${xphbSpecies.length}`);

  if (errors > 0) {
    console.log('\n⚠️  Some species failed to import. Check the errors above.');
  } else {
    console.log('\n🎉 All D&D 2024 species imported successfully!');
  }
}

/**
 * Main execution function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error(
      '❌ Usage: node scripts/import-species.js <path-to-species-json-file>'
    );
    console.error(
      '   Example: node scripts/import-species.js ../data/species.json'
    );
    process.exit(1);
  }

  const jsonFilePath = path.resolve(args[0]);

  try {
    console.log('🚀 Starting D&D Species Import Process...\n');

    // Initialize reference data
    await initializeReferenceData();

    // Import species
    await importSpecies(jsonFilePath);

    console.log('\n🎉 Species import process completed successfully!');
  } catch (error) {
    console.error('\n💥 Species import process failed:', error.message);
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
  importSpecies,
  initializeReferenceData,
  filterXPHBContent,
};
