const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Path to the 2014 5etools data files
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

  // Handle different entry formats - keep it simple for core items
  if (Array.isArray(entries)) {
    return entries.filter(entry => typeof entry === 'string').slice(0, 5); // Limit to 5 entries
  }

  if (typeof entries === 'string') {
    return [entries];
  }

  return null;
}

async function importCoreItem(item, isBaseItem = false) {
  try {
    stats.total++;

    // Only import PHB and DMG items
    if (!item.source || (item.source !== 'PHB' && item.source !== 'DMG')) {
      stats.skipped++;
      return;
    }

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
      source: item.source,
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
      contentVersion: '2014',
      isHomebrew: false
    };

    // Insert into database
    const createdItem = await prisma.item.create({
      data: itemData
    });

    console.log(`✓ Imported: ${item.name} (${item.source}, ${item.rarity || item.type || 'mundane'})`);
    stats.imported++;

  } catch (error) {
    console.error(`✗ Error importing ${item.name}:`, error.message);
    stats.errors++;
    stats.errorDetails.push({
      name: item.name,
      error: error.message
    });
  }
}

async function main() {
  try {
    console.log('🚀 Starting import of missing PHB/DMG items...\n');

    // Read and parse magic items (items.json)
    console.log('📖 Reading magic items from items.json...');
    const itemsData = JSON.parse(fs.readFileSync(ITEMS_FILE, 'utf8'));
    const magicItems = itemsData.item.filter(item =>
      item.source === 'PHB' || item.source === 'DMG'
    );

    // Read and parse base items (items-base.json)
    console.log('📖 Reading base items from items-base.json...');
    const baseItemsData = JSON.parse(fs.readFileSync(BASE_ITEMS_FILE, 'utf8'));
    const baseItems = baseItemsData.baseitem.filter(item =>
      item.source === 'PHB' || item.source === 'DMG'
    );

    console.log(`\nFound ${magicItems.length} magic items and ${baseItems.length} base items from PHB/DMG\n`);

    // Import magic items
    console.log('📦 Importing PHB/DMG magic items...');
    for (const item of magicItems) {
      await importCoreItem(item, false);
    }

    // Import base items
    console.log('\n📦 Importing PHB/DMG base items...');
    for (const item of baseItems) {
      await importCoreItem(item, true);
    }

    // Print final statistics
    console.log('\n' + '='.repeat(50));
    console.log('📊 CORE ITEMS IMPORT COMPLETE!');
    console.log('='.repeat(50));
    console.log(`Total items processed: ${stats.total}`);
    console.log(`Successfully imported: ${stats.imported}`);
    console.log(`Skipped (already exist): ${stats.skipped}`);
    console.log(`Errors: ${stats.errors}`);
    console.log(`Success rate: ${((stats.imported / (stats.total - stats.skipped)) * 100).toFixed(1)}%`);

    if (stats.errors > 0) {
      console.log('\n❌ Error details:');
      stats.errorDetails.slice(0, 10).forEach(error => {
        console.log(`  - ${error.name}: ${error.error}`);
      });
      if (stats.errorDetails.length > 10) {
        console.log(`  ... and ${stats.errorDetails.length - 10} more errors`);
      }
    }

    // Verify total count in database
    const totalItemsInDb = await prisma.item.count();
    console.log(`\n📊 Total items now in database: ${totalItemsInDb}`);

    const phbItems = await prisma.item.count({ where: { source: 'PHB' } });
    const dmgItems = await prisma.item.count({ where: { source: 'DMG' } });
    console.log(`   - PHB: ${phbItems} items`);
    console.log(`   - DMG: ${dmgItems} items`);
    console.log(`   - Core 2014 items: ${phbItems + dmgItems}`);

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Import interrupted. Cleaning up...');
  await prisma.$disconnect();
  process.exit(0);
});

main();