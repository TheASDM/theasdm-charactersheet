#!/usr/bin/env node

/**
 * D&D Feat Data Import Script
 *
 * This script imports feat data from JSON files into the PostgreSQL database.
 * It focuses on D&D 2024 content (source: XPHB) and handles the complex
 * structure of feat prerequisites, ability score improvements, and spell grants.
 *
 * Usage: node scripts/import-feats.js <path-to-feats-json-file>
 * Example: node scripts/import-feats.js ../data/feats.json
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// D&D 2024 feat categories
const FEAT_CATEGORIES = {
  G: 'General',
  O: 'Origin',
  FS: 'Fighting Style',
  EB: 'Epic Boon',
};

/**
 * Filter feat data for D&D 2024 content only
 */
function filterXPHBContent(data) {
  return data.filter((item) => item.source === 'XPHB');
}

/**
 * Parse feat prerequisites from complex prerequisite structure
 */
function parsePrerequisites(prerequisites) {
  if (!prerequisites || !Array.isArray(prerequisites)) return null;

  const parsedPrereqs = {
    level: null,
    abilities: [],
    features: [],
    other: [],
  };

  prerequisites.forEach((prereq) => {
    // Level requirement
    if (prereq.level) {
      parsedPrereqs.level = prereq.level;
    }

    // Ability score requirements
    if (prereq.ability && Array.isArray(prereq.ability)) {
      prereq.ability.forEach((abilityReq) => {
        Object.keys(abilityReq).forEach((ability) => {
          parsedPrereqs.abilities.push({
            ability: ability,
            minimum: abilityReq[ability],
          });
        });
      });
    }

    // Feature requirements (like "Fighting Style")
    if (prereq.feature && Array.isArray(prereq.feature)) {
      parsedPrereqs.features.push(...prereq.feature);
    }

    // Other requirements
    if (prereq.other) {
      parsedPrereqs.other.push(prereq.other);
    }

    // Race/species requirements
    if (prereq.race && Array.isArray(prereq.race)) {
      parsedPrereqs.other.push(
        `Race: ${prereq.race.map((r) => r.name || r).join(' or ')}`
      );
    }

    // Class requirements
    if (prereq.spellcasting) {
      parsedPrereqs.other.push('Spellcasting ability');
    }
  });

  // Clean up empty arrays
  Object.keys(parsedPrereqs).forEach((key) => {
    if (Array.isArray(parsedPrereqs[key]) && parsedPrereqs[key].length === 0) {
      delete parsedPrereqs[key];
    }
  });

  return Object.keys(parsedPrereqs).length > 0 ? parsedPrereqs : null;
}

/**
 * Parse ability score increase options from feat
 */
function parseAbilityScoreIncrease(ability) {
  if (!ability || !Array.isArray(ability)) return null;

  const asiData = {
    options: [],
  };

  ability.forEach((abilityOption) => {
    if (abilityOption.choose) {
      // Handle choice-based ASI (most common)
      asiData.options.push({
        type: 'choose',
        from: abilityOption.choose.from || [],
        amount: abilityOption.choose.amount || 1,
        count: abilityOption.choose.count || abilityOption.choose.amount || 1,
      });
    } else {
      // Handle fixed ASI increases
      const fixedIncreases = {};
      Object.keys(abilityOption).forEach((ability) => {
        if (typeof abilityOption[ability] === 'number') {
          fixedIncreases[ability] = abilityOption[ability];
        }
      });

      if (Object.keys(fixedIncreases).length > 0) {
        asiData.options.push({
          type: 'fixed',
          increases: fixedIncreases,
        });
      }
    }
  });

  return asiData.options.length > 0 ? asiData : null;
}

/**
 * Parse additional spells granted by feat
 */
function parseAdditionalSpells(spells) {
  if (!spells || !Array.isArray(spells)) return null;

  const spellData = {
    ability: null,
    innate: {},
    known: [],
    prepared: [],
  };

  spells.forEach((spellGrant) => {
    // Spellcasting ability
    if (spellGrant.ability) {
      spellData.ability = spellGrant.ability;
    }

    // Innate spells (cast X times per rest)
    if (spellGrant.innate) {
      Object.keys(spellGrant.innate).forEach((key) => {
        if (spellGrant.innate[key].rest) {
          spellData.innate[key] = spellGrant.innate[key];
        }
      });
    }

    // Known spells
    if (spellGrant.known) {
      if (Array.isArray(spellGrant.known._)) {
        spellData.known.push(...spellGrant.known._);
      }
    }

    // Prepared spells
    if (spellGrant.prepared) {
      if (Array.isArray(spellGrant.prepared._)) {
        spellData.prepared.push(...spellGrant.prepared._);
      }
    }
  });

  // Clean up empty sections
  Object.keys(spellData).forEach((key) => {
    if (typeof spellData[key] === 'object' && spellData[key] !== null) {
      if (Array.isArray(spellData[key]) && spellData[key].length === 0) {
        delete spellData[key];
      } else if (
        !Array.isArray(spellData[key]) &&
        Object.keys(spellData[key]).length === 0
      ) {
        delete spellData[key];
      }
    }
  });

  return Object.keys(spellData).length > 0 ? spellData : null;
}

/**
 * Parse feat entries into structured format
 */
function parseFeatEntries(entries) {
  if (!entries || !Array.isArray(entries)) return null;

  const parsedEntries = {
    description: [],
    benefits: [],
  };

  entries.forEach((entry) => {
    if (typeof entry === 'string') {
      parsedEntries.description.push(entry);
    } else if (typeof entry === 'object') {
      if (entry.type === 'list' && entry.items) {
        // Benefits list
        parsedEntries.benefits.push(...entry.items);
      } else if (entry.type === 'entries' && entry.entries) {
        // Nested entries
        if (entry.name) {
          parsedEntries.benefits.push(
            `${entry.name}: ${entry.entries.join(' ')}`
          );
        } else {
          parsedEntries.description.push(...entry.entries);
        }
      } else if (entry.entries && Array.isArray(entry.entries)) {
        parsedEntries.description.push(...entry.entries);
      }
    }
  });

  return parsedEntries;
}

/**
 * Process and import feat data
 */
async function importFeats(jsonFilePath) {
  console.log(`⚔️ Reading feat data from: ${jsonFilePath}`);

  if (!fs.existsSync(jsonFilePath)) {
    throw new Error(`File not found: ${jsonFilePath}`);
  }

  const rawData = fs.readFileSync(jsonFilePath, 'utf8');
  const featData = JSON.parse(rawData);

  // Handle different JSON structures
  let feats = [];
  if (featData.feat && Array.isArray(featData.feat)) {
    feats = featData.feat;
  } else if (Array.isArray(featData)) {
    feats = featData;
  } else {
    throw new Error(
      'Invalid feat data format. Expected array of feats or { feat: [...] }'
    );
  }

  console.log(`🎯 Found ${feats.length} total feats`);

  // Filter for D&D 2024 content only
  const xphbFeats = filterXPHBContent(feats);
  console.log(
    `📖 Filtered to ${xphbFeats.length} D&D 2024 feats (XPHB source)`
  );

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < xphbFeats.length; i++) {
    const feat = xphbFeats[i];
    const progress = `[${i + 1}/${xphbFeats.length}]`;

    try {
      // Prepare feat data for database
      const featToInsert = {
        name: feat.name,
        source: feat.source || 'XPHB',
        page: feat.page || null,

        // D&D 2024 category
        category: feat.category || null,

        // Prerequisites and mechanics
        prerequisites: parsePrerequisites(feat.prerequisite),
        abilityScoreIncrease: parseAbilityScoreIncrease(feat.ability),
        repeatable: feat.repeatable || false,

        // Content
        entries: parseFeatEntries(feat.entries),
        additionalSpells: parseAdditionalSpells(feat.additionalSpells),

        // D&D 2024 flags
        srd52: feat.srd52 || false,
        basicRules2024: feat.basicRules2024 || false,

        // Metadata
        sourceBook:
          feat.source === 'XPHB' ? "Player's Handbook 2024" : 'Unknown',
        contentVersion: '2024',
        isHomebrew: false,
      };

      // Try to insert the feat
      const result = await prisma.feat.upsert({
        where: { name: featToInsert.name },
        update: featToInsert,
        create: featToInsert,
      });

      const categoryName = feat.category
        ? `(${FEAT_CATEGORIES[feat.category] || feat.category})`
        : '';
      console.log(`${progress} ✅ ${feat.name} ${categoryName}`);
      imported++;
    } catch (error) {
      console.error(
        `${progress} ❌ Failed to import "${feat.name}":`,
        error.message
      );
      errors++;
    }
  }

  console.log('\n📊 Feat Import Summary:');
  console.log(`  ✅ Imported: ${imported}`);
  console.log(`  ⚠️  Skipped:  ${skipped}`);
  console.log(`  ❌ Errors:   ${errors}`);
  console.log(`  ⚔️ Total D&D 2024 feats processed: ${xphbFeats.length}`);

  if (errors > 0) {
    console.log('\n⚠️  Some feats failed to import. Check the errors above.');
  } else {
    console.log('\n🎉 All D&D 2024 feats imported successfully!');
  }
}

/**
 * Initialize reference data for feats
 */
async function initializeReferenceData() {
  console.log('📚 Initializing reference data for feats...');

  try {
    // Reference data should already exist from previous imports
    console.log('✅ Reference data ready for feat import');
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
      '❌ Usage: node scripts/import-feats.js <path-to-feats-json-file>'
    );
    console.error(
      '   Example: node scripts/import-feats.js ../data/feats.json'
    );
    process.exit(1);
  }

  const jsonFilePath = path.resolve(args[0]);

  try {
    console.log('🚀 Starting D&D Feat Import Process...\n');

    // Initialize reference data
    await initializeReferenceData();

    // Import feats
    await importFeats(jsonFilePath);

    console.log('\n🎉 Feat import process completed successfully!');
  } catch (error) {
    console.error('\n💥 Feat import process failed:', error.message);
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
  importFeats,
  initializeReferenceData,
  filterXPHBContent,
};
