#!/usr/bin/env node

/**
 * Random Character Generator
 *
 * This script generates a complete D&D 2024 character to showcase the comprehensive dataset.
 *
 * Usage:
 *   node generate-random-character.js                    # Generate truly random character
 *   node generate-random-character.js manual 4,8,212 8 700,701,702 8 1 4 55   # Use specific indices
 *   node generate-random-character.js help              # Show this help
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Generate a random character using provided indices
 */
async function generateRandomCharacter(indices) {
  const {
    spellIndices,
    speciesIndex,
    itemIndices,
    classIndex,
    subclassIndex,
    backgroundIndex,
    featIndex,
  } = indices;

  console.log('🎲 Generating Random D&D 2024 Character...\n');

  try {
    // 1. Get Species (using index 8 = 8th species)
    const species = await prisma.species.findMany({
      orderBy: { name: 'asc' },
      skip: speciesIndex - 1,
      take: 1,
    });

    if (species[0]) {
      console.log('🧬 **SPECIES:**');
      console.log(
        `   **${species[0].name}** (${species[0].size}, ${species[0].speed}ft speed)`
      );
      console.log(`   Source: ${species[0].source}`);
      if (species[0].traits) {
        const traits =
          JSON.stringify(species[0].traits).substring(0, 200) + '...';
        console.log(`   Traits: ${traits}`);
      }
      if (species[0].languages?.length > 0) {
        console.log(`   Languages: ${species[0].languages.join(', ')}`);
      }
      console.log();
    }

    // 2. Get Class (using index 8 = 8th class)
    const classes = await prisma.class.findMany({
      orderBy: { name: 'asc' },
      skip: classIndex - 1,
      take: 1,
    });

    let subclassInfo = null;
    if (classes[0]) {
      console.log('📚 **CLASS:**');
      console.log(`   **${classes[0].name}** (d${classes[0].hitDie} hit die)`);
      console.log(
        `   Primary Abilities: ${
          classes[0].primaryAbility?.join(', ') || 'None'
        }`
      );
      console.log(
        `   Saving Throws: ${
          classes[0].savingThrowProficiencies?.join(', ') || 'None'
        }`
      );

      // Get subclass info if available
      if (classes[0].subclassFeatures && subclassIndex) {
        try {
          const subclasses = classes[0].subclassFeatures;
          if (Array.isArray(subclasses) && subclasses[subclassIndex - 1]) {
            subclassInfo = subclasses[subclassIndex - 1];
            console.log(
              `   **Subclass:** ${
                subclassInfo.name || `Subclass ${subclassIndex}`
              }`
            );
          }
        } catch (e) {
          console.log(
            `   Subclass: Information available but complex structure`
          );
        }
      }
      console.log();
    }

    // 3. Get Background (using index 4 = 4th background)
    const backgrounds = await prisma.background.findMany({
      orderBy: { name: 'asc' },
      skip: backgroundIndex - 1,
      take: 1,
    });

    if (backgrounds[0]) {
      console.log('📜 **BACKGROUND:**');
      console.log(`   **${backgrounds[0].name}**`);
      if (backgrounds[0].description) {
        console.log(`   Description: ${backgrounds[0].description}`);
      }
      if (backgrounds[0].skillProficiencies) {
        try {
          const skills = JSON.stringify(backgrounds[0].skillProficiencies);
          console.log(`   Skill Proficiencies: ${skills.substring(0, 100)}...`);
        } catch (e) {
          console.log(`   Skill Proficiencies: Available`);
        }
      }
      if (backgrounds[0].languages?.length > 0) {
        console.log(`   Languages: ${backgrounds[0].languages.join(', ')}`);
      }
      if (backgrounds[0].originFeat) {
        console.log(`   Origin Feat: ${backgrounds[0].originFeat}`);
      }
      console.log();
    }

    // 4. Get Feat (using index 55 = 55th feat)
    const feats = await prisma.feat.findMany({
      orderBy: { name: 'asc' },
      skip: featIndex - 1,
      take: 1,
    });

    if (feats[0]) {
      console.log('⚔️ **FEAT:**');
      console.log(
        `   **${feats[0].name}** (${feats[0].category || 'General'})`
      );
      if (feats[0].prerequisites) {
        try {
          console.log(
            `   Prerequisites: ${JSON.stringify(
              feats[0].prerequisites
            ).substring(0, 150)}...`
          );
        } catch (e) {
          console.log(`   Prerequisites: Available`);
        }
      }
      if (feats[0].entries) {
        try {
          const description = JSON.stringify(feats[0].entries).substring(
            0,
            200
          );
          console.log(`   Description: ${description}...`);
        } catch (e) {
          console.log(`   Description: Complex feat benefits available`);
        }
      }
      console.log();
    }

    // 5. Get Spells (using indices 4, 8, 212)
    console.log('🪄 **SPELLS:**');
    for (let i = 0; i < spellIndices.length; i++) {
      const spells = await prisma.spell.findMany({
        orderBy: { name: 'asc' },
        skip: spellIndices[i] - 1,
        take: 1,
      });

      if (spells[0]) {
        const spell = spells[0];
        console.log(
          `   **${spell.name}** (Level ${spell.level} ${spell.school || '?'})`
        );
        console.log(`     Range: ${JSON.stringify(spell.range) || 'Unknown'}`);
        console.log(
          `     Duration: ${JSON.stringify(spell.duration) || 'Unknown'}`
        );
        if (spell.components) {
          console.log(`     Components: ${JSON.stringify(spell.components)}`);
        }
        if (spell.damageInflict?.length > 0) {
          console.log(`     Damage: ${spell.damageInflict.join(', ')}`);
        }
        if (spell.savingThrow?.length > 0) {
          console.log(`     Saving Throw: ${spell.savingThrow.join(', ')}`);
        }
        console.log();
      }
    }

    // 6. Get Items (using indices 700, 701, 702)
    console.log('🏹 **EQUIPMENT:**');
    for (let i = 0; i < itemIndices.length; i++) {
      const items = await prisma.item.findMany({
        orderBy: { name: 'asc' },
        skip: itemIndices[i] - 1,
        take: 1,
      });

      if (items[0]) {
        const item = items[0];
        console.log(`   **${item.name}** [${item.source}]`);
        console.log(`     Type: ${item.type}`);
        if (item.rarity && item.rarity !== 'common') {
          console.log(`     Rarity: ${item.rarity}`);
        }
        if (item.weight) {
          console.log(`     Weight: ${item.weight} lbs`);
        }
        if (item.value && item.valueCurrency) {
          const gpValue = Math.floor(item.value / 100);
          console.log(`     Value: ${gpValue} ${item.valueCurrency}`);
        }
        if (item.reqAttune) {
          console.log(`     Attunement: ${item.reqAttune}`);
        }
        if (item.dmg1 && item.dmgType) {
          console.log(`     Damage: ${item.dmg1} ${item.dmgType}`);
          if (item.dmg2) {
            console.log(`     Versatile: ${item.dmg2} ${item.dmgType}`);
          }
        }
        if (item.ac) {
          console.log(`     AC: ${item.ac}`);
        }
        if (item.property?.length > 0) {
          console.log(`     Properties: ${item.property.join(', ')}`);
        }
        if (item.charges) {
          console.log(`     Charges: ${item.charges}`);
        }
        if (item.entries) {
          try {
            const desc = JSON.stringify(item.entries).substring(0, 200);
            console.log(`     Description: ${desc}...`);
          } catch (e) {
            console.log(`     Description: Detailed information available`);
          }
        }
        console.log();
      }
    }

    // 7. Summary
    console.log('📊 **CHARACTER SUMMARY:**');
    console.log(`   🧬 Species: ${species[0]?.name || 'Unknown'}`);
    console.log(
      `   📚 Class: ${classes[0]?.name || 'Unknown'}${
        subclassInfo ? ` (${subclassInfo.name || 'Subclass'})` : ''
      }`
    );
    console.log(`   📜 Background: ${backgrounds[0]?.name || 'Unknown'}`);
    console.log(`   ⚔️ Feat: ${feats[0]?.name || 'Unknown'}`);
    console.log(`   🪄 Spells: ${spellIndices.length} spells known`);
    console.log(`   🏹 Equipment: ${itemIndices.length} items`);
    console.log();
    console.log(
      '✨ **This character showcases the complete D&D 2024 dataset!** ✨'
    );
  } catch (error) {
    console.error('❌ Error generating character:', error.message);
  }
}

/**
 * Generate random indices based on actual database counts
 */
async function generateRandomIndices() {
  console.log('🎰 Generating truly random character indices...\n');

  // Get actual counts from database
  const spellCount = await prisma.spell.count();
  const speciesCount = await prisma.species.count();
  const itemCount = await prisma.item.count();
  const classCount = await prisma.class.count();
  const backgroundCount = await prisma.background.count();
  const featCount = await prisma.feat.count();

  console.log('📊 Database counts:');
  console.log(`   Spells: ${spellCount}`);
  console.log(`   Species: ${speciesCount}`);
  console.log(`   Items: ${itemCount}`);
  console.log(`   Classes: ${classCount}`);
  console.log(`   Backgrounds: ${backgroundCount}`);
  console.log(`   Feats: ${featCount}`);
  console.log();

  // Generate random indices (1-based for easier human reading)
  const indices = {
    spellIndices: [
      Math.floor(Math.random() * spellCount) + 1,
      Math.floor(Math.random() * spellCount) + 1,
      Math.floor(Math.random() * spellCount) + 1,
    ],
    speciesIndex: Math.floor(Math.random() * speciesCount) + 1,
    itemIndices: [
      Math.floor(Math.random() * itemCount) + 1,
      Math.floor(Math.random() * itemCount) + 1,
      Math.floor(Math.random() * itemCount) + 1,
    ],
    classIndex: Math.floor(Math.random() * classCount) + 1,
    subclassIndex: Math.floor(Math.random() * 4) + 1, // Most classes have 4+ subclasses
    backgroundIndex: Math.floor(Math.random() * backgroundCount) + 1,
    featIndex: Math.floor(Math.random() * featCount) + 1,
  };

  console.log('� Generated random indices:');
  console.log(`   Spells: ${indices.spellIndices.join(', ')}`);
  console.log(`   Species: ${indices.speciesIndex}`);
  console.log(`   Items: ${indices.itemIndices.join(', ')}`);
  console.log(
    `   Class: ${indices.classIndex} (subclass ${indices.subclassIndex})`
  );
  console.log(`   Background: ${indices.backgroundIndex}`);
  console.log(`   Feat: ${indices.featIndex}`);
  console.log('━'.repeat(80));

  return indices;
}

/**
 * Parse manual indices from command line arguments
 */
function parseManualIndices(args) {
  if (args.length < 7) {
    console.error('❌ Manual mode requires 7 arguments:');
    console.error(
      '   Usage: node generate-random-character.js manual <spell1,spell2,spell3> <species> <item1,item2,item3> <class> <subclass> <background> <feat>'
    );
    console.error(
      '   Example: node generate-random-character.js manual 4,8,212 8 700,701,702 8 1 4 55'
    );
    process.exit(1);
  }

  return {
    spellIndices: args[1].split(',').map((n) => parseInt(n)),
    speciesIndex: parseInt(args[2]),
    itemIndices: args[3].split(',').map((n) => parseInt(n)),
    classIndex: parseInt(args[4]),
    subclassIndex: parseInt(args[5]),
    backgroundIndex: parseInt(args[6]),
    featIndex: parseInt(args[7]),
  };
}

/**
 * Show help information
 */
function showHelp() {
  console.log('🎲 D&D 2024 Random Character Generator\n');
  console.log('Usage:');
  console.log(
    '  node generate-random-character.js                    # Generate truly random character'
  );
  console.log(
    '  node generate-random-character.js manual <indices>   # Use specific indices'
  );
  console.log(
    '  node generate-random-character.js help              # Show this help\n'
  );
  console.log('Manual mode format:');
  console.log(
    '  node generate-random-character.js manual <spells> <species> <items> <class> <subclass> <background> <feat>'
  );
  console.log(
    '  Example: node generate-random-character.js manual 4,8,212 8 700,701,702 8 1 4 55\n'
  );
  console.log('Parameters:');
  console.log('  spells    - 3 spell indices (comma-separated)');
  console.log('  species   - Species index (1-10)');
  console.log('  items     - 3 item indices (comma-separated)');
  console.log('  class     - Class index (1-12)');
  console.log('  subclass  - Subclass index (1-4)');
  console.log('  background- Background index (1-16)');
  console.log('  feat      - Feat index (1-77)');
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  // Show help
  if (args.length > 0 && args[0] === 'help') {
    showHelp();
    return;
  }

  try {
    await prisma.$connect();

    let indices;

    if (args.length > 0 && args[0] === 'manual') {
      // Manual mode: use provided indices
      console.log('🎯 Manual mode: Using provided indices\n');
      indices = parseManualIndices(args);

      console.log('📋 Using manual indices:');
      console.log(`   Spells: ${indices.spellIndices.join(', ')}`);
      console.log(`   Species: ${indices.speciesIndex}`);
      console.log(`   Items: ${indices.itemIndices.join(', ')}`);
      console.log(
        `   Class: ${indices.classIndex} (subclass ${indices.subclassIndex})`
      );
      console.log(`   Background: ${indices.backgroundIndex}`);
      console.log(`   Feat: ${indices.featIndex}`);
      console.log('━'.repeat(80));
    } else {
      // Random mode: generate random indices
      console.log('🎲 Random mode: Generating random character\n');
      indices = await generateRandomIndices();
    }

    // Generate the character using the indices
    await generateRandomCharacter(indices);
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { generateRandomCharacter, generateRandomIndices, showHelp };
