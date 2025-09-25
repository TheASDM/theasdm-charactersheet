#!/usr/bin/env node

/**
 * Update Species Sizes Script
 *
 * This script updates the size field for specific species in the database
 * to match the requested size mappings.
 *
 * Usage: node scripts/update-species-sizes.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Species size mappings as requested
const SPECIES_SIZE_UPDATES = {
  Aasimar: 'Medium',
  Dragonborn: 'Medium',
  Dwarf: 'Small',
  Elf: 'Medium',
  Gnome: 'Small',
  Goliath: 'Medium',
  Halfling: 'Small',
  Human: 'Medium',
  Orc: 'Medium',
  Tiefling: 'Medium',
};

/**
 * Update species sizes in the database
 */
async function updateSpeciesSizes() {
  console.log('🔄 Starting species size updates...\n');

  let updated = 0;
  let notFound = 0;
  let errors = 0;

  for (const [speciesName, newSize] of Object.entries(SPECIES_SIZE_UPDATES)) {
    try {
      console.log(`Processing ${speciesName}...`);

      // Check if the species exists first
      const existingSpecies = await prisma.species.findFirst({
        where: { name: speciesName },
        select: { id: true, name: true, size: true },
      });

      if (!existingSpecies) {
        console.log(`  ⚠️  Species "${speciesName}" not found in database`);
        notFound++;
        continue;
      }

      // Show current size vs new size
      const currentSize = Array.isArray(existingSpecies.size)
        ? existingSpecies.size.join(', ')
        : existingSpecies.size;
      console.log(`  Current size: ${currentSize}`);
      console.log(`  New size: ${newSize}`);

      // Update the species size
      const result = await prisma.species.update({
        where: { id: existingSpecies.id },
        data: {
          size: newSize, // Store as string to match the schema
          updatedAt: new Date(),
        },
        select: { name: true, size: true },
      });

      console.log(`  ✅ Updated ${result.name} to size: ${result.size}\n`);
      updated++;
    } catch (error) {
      console.error(`  ❌ Error updating ${speciesName}:`, error.message);
      errors++;
    }
  }

  console.log('\n📊 Species Size Update Summary:');
  console.log(`  ✅ Updated: ${updated}`);
  console.log(`  ⚠️  Not Found: ${notFound}`);
  console.log(`  ❌ Errors: ${errors}`);
  console.log(
    `  📝 Total Species Processed: ${Object.keys(SPECIES_SIZE_UPDATES).length}`
  );

  if (errors > 0) {
    console.log('\n⚠️  Some species failed to update. Check the errors above.');
  } else if (updated > 0) {
    console.log('\n🎉 Species size updates completed successfully!');
  } else {
    console.log(
      '\n⚠️  No species were updated. Check if the species exist in the database.'
    );
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🚀 Starting Species Size Update Process...\n');

    // Update species sizes
    await updateSpeciesSizes();
  } catch (error) {
    console.error('\n💥 Species size update process failed:', error.message);
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
  updateSpeciesSizes,
  SPECIES_SIZE_UPDATES,
};
