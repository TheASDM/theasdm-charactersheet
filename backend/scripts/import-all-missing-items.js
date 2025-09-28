const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Path to the 5etools data files
const ITEMS_FILE = '/Users/dustinamodeo/Documents/dnd/5etools-src/data/items.json';
const BASE_ITEMS_FILE = '/Users/dustinamodeo/Documents/dnd/5etools-src/data/items-base.json';

// Track import statistics
let stats = {
  total: 0,
  imported: 0,
  skipped: 0,
  errors: 0,
  errorDetails: []
};

function processItemEntries(entries) {
  if (!entries) return null;

  // Handle different entry formats - keep it simple
  if (Array.isArray(entries)) {
    return entries.filter(entry => typeof entry === 'string').slice(0, 10); // Limit to 10 entries
  }

  if (typeof entries === 'string') {
    return [entries];
  }

  return null;
}

async function importItem(item, isBaseItem = false) {
  try {
    stats.total++;

    // Check if item already exists
    const existingItem = await prisma.item.findFirst({
      where: {
        name: item.name
      }
    });

    if (existingItem) {
      console.log(`Skipping existing item: ${item.name}`);
      stats.skipped++;
      return;
    }

    // Prepare item data for database
    const itemData = {
      name: item.name,
      source: item.source || 'Unknown',
      page: item.page || 0,
      type: item.type || 'G',
      typeAlt: item.typeAlt || null,
      rarity: item.rarity || 'none',
      weight: item.weight || null,
      value: item.value || null,
      valueCurrency: item.valueCurrency || item.currencyConversion || null,
      entries: processItemEntries(item.entries),
      additionalEntries: processItemEntries(item.additionalEntries),

      // Weapon properties - property is required array field
      weaponCategory: item.weaponCategory || null,
      property: Array.isArray(item.property) ? item.property : [],
      range: item.range || null,
      dmg1: item.dmg1 || null,
      dmg2: item.dmg2 || null,
      dmgType: item.dmgType || null,

      // Armor properties
      ac: item.ac || null,
      strength: item.strength || null,
      stealth: item.stealth || null,
      armorType: item.armorType || null,

      // Magic item properties
      reqAttune: typeof item.reqAttune === 'boolean' ? item.reqAttune :
                 typeof item.reqAttune === 'string' ? item.reqAttune : null,
      charges: item.charges || null,
      recharge: item.recharge || null,
      bonusWeapon: item.bonusWeapon || null,
      bonusAc: item.bonusAc || null,
      bonusSpellAttack: item.bonusSpellAttack || null,
      bonusSpellSaveDc: item.bonusSpellSaveDc || null,
      spells: item.spells ? JSON.stringify(item.spells) : null,

      // Metadata
      sourceBook: item.source,
      contentVersion: '2014', // Most of these are from various 2014 era supplements
      isHomebrew: false
    };

    // Insert into database
    const createdItem = await prisma.item.create({
      data: itemData
    });

    console.log(`✓ Imported: ${item.name} (${item.source || 'Unknown'}, ${item.rarity || 'none'})`);
    stats.imported++;

  } catch (error) {
    console.error(`✗ Error importing ${item.name}:`, error.message);
    stats.errors++;
    stats.errorDetails.push({
      name: item.name,
      source: item.source || 'Unknown',
      error: error.message
    });
  }
}

async function main() {
  try {
    console.log('🚀 Starting import of ALL missing items...\\n');

    // First, get the current list of items in database for comparison
    console.log('🗄️  Fetching current database items...');
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

    console.log(`Current database has ${dbItems.length} items\\n`);

    // Read and parse magic items (items.json)
    console.log('📖 Reading magic items from items.json...');
    const itemsData = JSON.parse(fs.readFileSync(ITEMS_FILE, 'utf8'));
    const magicItems = itemsData.item || [];

    // Read and parse base items (items-base.json)
    console.log('📖 Reading base items from items-base.json...');
    const baseItemsData = JSON.parse(fs.readFileSync(BASE_ITEMS_FILE, 'utf8'));
    const baseItems = baseItemsData.baseitem || [];

    console.log(`Found ${magicItems.length} magic items and ${baseItems.length} base items in JSON files\\n`);

    // Find missing magic items
    console.log('🔍 Finding missing magic items...');
    const missingMagicItems = [];
    magicItems.forEach(item => {
      if (!item.name) return;

      const nameKey = item.name.toLowerCase();
      const sourceKey = `${nameKey}|${item.source}`;

      if (!dbItemsSet.has(sourceKey) && !dbItemsSet.has(nameKey)) {
        missingMagicItems.push(item);
      }
    });

    // Find missing base items
    console.log('🔍 Finding missing base items...');
    const missingBaseItems = [];
    baseItems.forEach(item => {
      if (!item.name) return;

      const nameKey = item.name.toLowerCase();
      const sourceKey = `${nameKey}|${item.source}`;

      if (!dbItemsSet.has(sourceKey) && !dbItemsSet.has(nameKey)) {
        missingBaseItems.push(item);
      }
    });

    console.log(`\\nFound ${missingMagicItems.length} missing magic items and ${missingBaseItems.length} missing base items\\n`);

    // Import missing magic items
    console.log('📦 Importing missing magic items...');
    for (const item of missingMagicItems) {
      await importItem(item, false);
    }

    // Import missing base items
    console.log('\\n📦 Importing missing base items...');
    for (const item of missingBaseItems) {
      await importItem(item, true);
    }

    // Print final statistics
    console.log('\\n' + '='.repeat(60));
    console.log('📊 COMPREHENSIVE IMPORT COMPLETE!');
    console.log('='.repeat(60));
    console.log(`Total items processed: ${stats.total}`);
    console.log(`Successfully imported: ${stats.imported}`);
    console.log(`Skipped (already exist): ${stats.skipped}`);
    console.log(`Errors: ${stats.errors}`);
    console.log(`Success rate: ${((stats.imported / (stats.total - stats.skipped)) * 100).toFixed(1)}%`);

    if (stats.errors > 0) {
      console.log('\\n❌ Error details (first 20):');
      stats.errorDetails.slice(0, 20).forEach(error => {
        console.log(`  - ${error.name} (${error.source}): ${error.error}`);
      });
      if (stats.errorDetails.length > 20) {
        console.log(`  ... and ${stats.errorDetails.length - 20} more errors`);
      }
    }

    // Verify total count in database
    const totalItemsInDb = await prisma.item.count();
    console.log(`\\n📊 Total items now in database: ${totalItemsInDb}`);

    // Count by major sources
    const sourceCounts = await Promise.all([
      prisma.item.count({ where: { source: 'PHB' } }),
      prisma.item.count({ where: { source: 'DMG' } }),
      prisma.item.count({ where: { source: 'XPHB' } }),
      prisma.item.count({ where: { source: 'XDMG' } }),
      prisma.item.count({ where: { source: 'TCE' } }),
      prisma.item.count({ where: { source: 'XGE' } }),
      prisma.item.count({ where: { source: 'SCAG' } })
    ]);

    console.log(`\\n📚 Items by major source:`);
    console.log(`   - PHB 2014: ${sourceCounts[0]} items`);
    console.log(`   - DMG 2014: ${sourceCounts[1]} items`);
    console.log(`   - XPHB 2024: ${sourceCounts[2]} items`);
    console.log(`   - XDMG 2024: ${sourceCounts[3]} items`);
    console.log(`   - Tasha's Cauldron: ${sourceCounts[4]} items`);
    console.log(`   - Xanathar's Guide: ${sourceCounts[5]} items`);
    console.log(`   - Sword Coast Guide: ${sourceCounts[6]} items`);

    console.log('\\n🎉 Import complete! Database now contains comprehensive D&D 5e item collection.');

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\\n🛑 Import interrupted. Cleaning up...');
  await prisma.$disconnect();
  process.exit(0);
});

main();