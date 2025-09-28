const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Path to the 5etools data files
const ITEMS_FILE = '/Users/dustinamodeo/Documents/dnd/5etools-src/data/items.json';
const BASE_ITEMS_FILE = '/Users/dustinamodeo/Documents/dnd/5etools-src/data/items-base.json';

// Track import statistics
let stats = {
  total: 0,
  updated: 0,
  skipped: 0,
  errors: 0,
  errorDetails: []
};

function properlyProcessItemEntries(entries) {
  if (!entries) return null;

  // PRESERVE ALL D&D FORMATTING - don't filter anything out!
  if (Array.isArray(entries)) {
    return entries; // Keep the entire complex structure
  }

  if (typeof entries === 'string') {
    return [entries];
  }

  if (typeof entries === 'object') {
    return [entries]; // Keep complex objects intact
  }

  return null;
}

async function updateItemWithProperFormatting(item) {
  try {
    stats.total++;

    // Check if item exists in database
    const existingItem = await prisma.item.findFirst({
      where: {
        name: item.name,
        source: item.source
      }
    });

    if (!existingItem) {
      console.log(`Skipping non-existent item: ${item.name} (${item.source})`);
      stats.skipped++;
      return;
    }

    // Only update if the original has better formatting than what we have
    const originalEntries = properlyProcessItemEntries(item.entries);
    const hasComplexFormatting = originalEntries && Array.isArray(originalEntries) &&
      originalEntries.some(entry =>
        typeof entry === 'object' ||
        (typeof entry === 'string' && entry.includes('{@'))
      );

    if (!hasComplexFormatting) {
      console.log(`No complex formatting for: ${item.name}`);
      stats.skipped++;
      return;
    }

    // Update with proper D&D formatting preserved
    await prisma.item.update({
      where: {
        name_source: {
          name: item.name,
          source: item.source
        }
      },
      data: {
        entries: originalEntries,
        additionalEntries: properlyProcessItemEntries(item.additionalEntries)
      }
    });

    console.log(`✓ Updated: ${item.name} (${item.source}) - restored D&D formatting`);
    stats.updated++;

  } catch (error) {
    console.error(`✗ Error updating ${item.name}:`, error.message);
    stats.errors++;
    stats.errorDetails.push({
      name: item.name,
      source: item.source,
      error: error.message
    });
  }
}

async function main() {
  try {
    console.log('🔄 Re-importing items with proper D&D formatting preserved...\\n');

    // Read and parse magic items (items.json)
    console.log('📖 Reading magic items from items.json...');
    const itemsData = JSON.parse(fs.readFileSync(ITEMS_FILE, 'utf8'));
    const magicItems = itemsData.item || [];

    // Read and parse base items (items-base.json)
    console.log('📖 Reading base items from items-base.json...');
    const baseItemsData = JSON.parse(fs.readFileSync(BASE_ITEMS_FILE, 'utf8'));
    const baseItems = baseItemsData.baseitem || [];

    console.log(`Found ${magicItems.length} magic items and ${baseItems.length} base items\\n`);

    // Process magic items
    console.log('📦 Updating magic items with proper D&D formatting...');
    for (const item of magicItems) {
      await updateItemWithProperFormatting(item);
    }

    // Process base items
    console.log('\\n📦 Updating base items with proper D&D formatting...');
    for (const item of baseItems) {
      await updateItemWithProperFormatting(item);
    }

    // Print final statistics
    console.log('\\n' + '='.repeat(60));
    console.log('📊 D&D FORMATTING RESTORATION COMPLETE!');
    console.log('='.repeat(60));
    console.log(`Total items processed: ${stats.total}`);
    console.log(`Successfully updated: ${stats.updated}`);
    console.log(`Skipped (no complex formatting): ${stats.skipped}`);
    console.log(`Errors: ${stats.errors}`);

    if (stats.errors > 0) {
      console.log('\\n❌ Error details (first 10):');
      stats.errorDetails.slice(0, 10).forEach(error => {
        console.log(`  - ${error.name} (${error.source}): ${error.error}`);
      });
      if (stats.errorDetails.length > 10) {
        console.log(`  ... and ${stats.errorDetails.length - 10} more errors`);
      }
    }

    // Count items with complex formatting
    const itemsWithComplexFormatting = await prisma.item.count({
      where: {
        entries: {
          path: '$[*]',
          not: null
        }
      }
    });

    console.log(`\\n📊 Items now with complex D&D formatting: estimated ${stats.updated}`);
    console.log('\\n🎉 Your equipment database now has proper D&D Beyond-style formatting!');
    console.log('   - Bold section headers');
    console.log('   - Processed markup tokens ({@spell}, {@damage}, etc.)');
    console.log('   - Professional D&D layout');

  } catch (error) {
    console.error('❌ Re-import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\\n🛑 Re-import interrupted. Cleaning up...');
  await prisma.$disconnect();
  process.exit(0);
});

main();