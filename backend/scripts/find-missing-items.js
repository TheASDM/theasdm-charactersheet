const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Path to the 2014 5etools data files
const ITEMS_FILE = '/Users/dustinamodeo/Documents/dnd/5etools-src/data/items.json';
const BASE_ITEMS_FILE = '/Users/dustinamodeo/Documents/dnd/5etools-src/data/items-base.json';

async function findMissingItems() {
  try {
    console.log('🔍 Comparing 5etools data files to database...\n');

    // Read JSON files
    console.log('📖 Reading items.json (magic items)...');
    const itemsData = JSON.parse(fs.readFileSync(ITEMS_FILE, 'utf8'));
    const magicItems = itemsData.item || [];

    console.log('📖 Reading items-base.json (base items)...');
    const baseItemsData = JSON.parse(fs.readFileSync(BASE_ITEMS_FILE, 'utf8'));
    const baseItems = baseItemsData.baseitem || [];

    // Get all existing items from database
    console.log('🗄️  Fetching all items from database...');
    const dbItems = await prisma.item.findMany({
      select: {
        name: true,
        source: true
      }
    });

    // Create a set for fast lookup
    const dbItemsSet = new Set();
    dbItems.forEach(item => {
      // Create normalized keys for comparison
      dbItemsSet.add(`${item.name.toLowerCase()}|${item.source}`);
      // Also add without source for broader matching
      dbItemsSet.add(item.name.toLowerCase());
    });

    console.log(`\n📊 Data Summary:`);
    console.log(`- Magic items in JSON: ${magicItems.length}`);
    console.log(`- Base items in JSON: ${baseItems.length}`);
    console.log(`- Items in database: ${dbItems.length}`);

    // Find missing magic items
    console.log('\n🔍 Checking magic items...');
    const missingMagicItems = [];
    magicItems.forEach(item => {
      if (!item.name) return;

      const nameKey = item.name.toLowerCase();
      const sourceKey = `${nameKey}|${item.source}`;

      if (!dbItemsSet.has(sourceKey) && !dbItemsSet.has(nameKey)) {
        missingMagicItems.push({
          name: item.name,
          source: item.source,
          page: item.page,
          rarity: item.rarity,
          type: item.type,
          originalData: item
        });
      }
    });

    // Find missing base items
    console.log('🔍 Checking base items...');
    const missingBaseItems = [];
    baseItems.forEach(item => {
      if (!item.name) return;

      const nameKey = item.name.toLowerCase();
      const sourceKey = `${nameKey}|${item.source}`;

      if (!dbItemsSet.has(sourceKey) && !dbItemsSet.has(nameKey)) {
        missingBaseItems.push({
          name: item.name,
          source: item.source,
          page: item.page,
          rarity: item.rarity,
          type: item.type,
          originalData: item
        });
      }
    });

    // Report findings
    console.log('\n' + '='.repeat(60));
    console.log('📋 MISSING ITEMS REPORT');
    console.log('='.repeat(60));

    console.log(`\n🎩 Missing Magic Items: ${missingMagicItems.length}`);
    if (missingMagicItems.length > 0) {
      console.log('\nBy Source:');
      const magicBySource = {};
      missingMagicItems.forEach(item => {
        if (!magicBySource[item.source]) magicBySource[item.source] = [];
        magicBySource[item.source].push(item);
      });

      Object.keys(magicBySource).sort().forEach(source => {
        console.log(`  ${source}: ${magicBySource[source].length} items`);
        // Show first few examples
        magicBySource[source].slice(0, 3).forEach(item => {
          console.log(`    - ${item.name} (${item.rarity || 'unknown rarity'})`);
        });
        if (magicBySource[source].length > 3) {
          console.log(`    ... and ${magicBySource[source].length - 3} more`);
        }
      });
    }

    console.log(`\n⚔️  Missing Base Items: ${missingBaseItems.length}`);
    if (missingBaseItems.length > 0) {
      console.log('\nBy Source:');
      const baseBySource = {};
      missingBaseItems.forEach(item => {
        if (!baseBySource[item.source]) baseBySource[item.source] = [];
        baseBySource[item.source].push(item);
      });

      Object.keys(baseBySource).sort().forEach(source => {
        console.log(`  ${source}: ${baseBySource[source].length} items`);
        // Show first few examples
        baseBySource[source].slice(0, 3).forEach(item => {
          console.log(`    - ${item.name} (${item.type || 'unknown type'})`);
        });
        if (baseBySource[source].length > 3) {
          console.log(`    ... and ${baseBySource[source].length - 3} more`);
        }
      });
    }

    // Focus on PHB and DMG items (core books)
    const missingCore = [...missingMagicItems, ...missingBaseItems].filter(item =>
      item.source === 'PHB' || item.source === 'DMG'
    );

    console.log(`\n📚 Missing Core Items (PHB/DMG): ${missingCore.length}`);
    if (missingCore.length > 0) {
      console.log('\nCore missing items:');
      missingCore.forEach(item => {
        console.log(`  - ${item.name} (${item.source}, ${item.rarity || item.type || 'unknown'})`);
      });
    }

    // Save detailed results to file
    const results = {
      summary: {
        totalMagicItems: magicItems.length,
        totalBaseItems: baseItems.length,
        totalDbItems: dbItems.length,
        missingMagicCount: missingMagicItems.length,
        missingBaseCount: missingBaseItems.length,
        missingCoreCount: missingCore.length
      },
      missingMagicItems,
      missingBaseItems,
      missingCore
    };

    fs.writeFileSync('missing-items-report.json', JSON.stringify(results, null, 2));
    console.log('\n💾 Detailed report saved to: missing-items-report.json');

    console.log('\n' + '='.repeat(60));
    if (missingCore.length > 0) {
      console.log('🚨 RECOMMENDATION: Import the missing PHB/DMG items above');
    } else {
      console.log('✅ All core PHB/DMG items are present in the database!');
    }

    return results;

  } catch (error) {
    console.error('❌ Error during comparison:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Search interrupted. Cleaning up...');
  await prisma.$disconnect();
  process.exit(0);
});

findMissingItems().catch(console.error);