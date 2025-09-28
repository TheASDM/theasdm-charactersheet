const fs = require('fs');
const path = require('path');
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

  // Handle different entry formats
  if (Array.isArray(entries)) {
    return entries.map(entry => {
      if (typeof entry === 'string') {
        return entry;
      } else if (typeof entry === 'object') {
        // Handle complex entry objects
        return JSON.stringify(entry);
      }
      return String(entry);
    });
  }

  if (typeof entries === 'string') {
    return [entries];
  }

  if (typeof entries === 'object') {
    return [JSON.stringify(entries)];
  }

  return null;
}

async function importItem(item, isBaseItem = false) {
  try {
    stats.total++;

    // Skip items that aren't from PHB or DMG 2014
    if (!item.source || (item.source !== 'PHB' && item.source !== 'DMG')) {
      stats.skipped++;
      return;
    }

    // Check if item already exists (prioritize 2024 editions)
    const existingItem = await prisma.item.findFirst({
      where: {
        name: item.name
      }
    });

    if (existingItem) {
      // If a 2024 version exists, skip the 2014 version
      if (existingItem.contentVersion === '2024' ||
          existingItem.source === 'XPHB' ||
          existingItem.source === 'XDMG') {
        console.log(`Skipping 2014 item (2024 version exists): ${item.name}`);
        stats.skipped++;
        return;
      }

      // If it's the same source, skip
      if (existingItem.source === item.source) {
        console.log(`Skipping existing item: ${item.name} (${item.source})`);
        stats.skipped++;
        return;
      }

      // If we have a 2014 version and this is also 2014, take the PHB over DMG
      if (existingItem.contentVersion === '2014' && item.source === 'DMG' && existingItem.source === 'PHB') {
        console.log(`Skipping DMG item (PHB version exists): ${item.name}`);
        stats.skipped++;
        return;
      }
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

      // Weapon properties
      weaponCategory: item.weaponCategory || null,
      property: item.property || null,
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

      // Additional properties for 2014 items
      wondrous: item.wondrous || false,
      curse: item.curse || false,
      sentient: item.sentient || false,
      poison: item.poison || false,
      ammoType: item.ammoType || null,
      age: item.age || null,
      tier: item.tier || null,
      hasFluff: item.hasFluff || false,
      hasFluffImages: item.hasFluffImages || false,

      // Metadata
      sourceBook: item.source,
      contentVersion: '2014',
      isHomebrew: false
    };

    // Insert into database
    const createdItem = await prisma.item.create({
      data: itemData
    });

    console.log(`✓ Imported: ${item.name} (${item.source})`);
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
    console.log('🚀 Starting D&D 2014 PHB/DMG item import...\n');

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

    console.log(`\nFound ${magicItems.length} magic items and ${baseItems.length} base items from PHB/DMG 2014\n`);

    // Import magic items
    console.log('📦 Importing magic items...');
    for (const item of magicItems) {
      await importItem(item, false);
    }

    // Import base items
    console.log('\n📦 Importing base items...');
    for (const item of baseItems) {
      await importItem(item, true);
    }

    // Print final statistics
    console.log('\n' + '='.repeat(50));
    console.log('📊 IMPORT COMPLETE!');
    console.log('='.repeat(50));
    console.log(`Total items processed: ${stats.total}`);
    console.log(`Successfully imported: ${stats.imported}`);
    console.log(`Skipped (already exist): ${stats.skipped}`);
    console.log(`Errors: ${stats.errors}`);
    console.log(`Success rate: ${((stats.imported / stats.total) * 100).toFixed(1)}%`);

    if (stats.errors > 0) {
      console.log('\n❌ Error details:');
      stats.errorDetails.forEach(error => {
        console.log(`  - ${error.name}: ${error.error}`);
      });
    }

    // Verify total count in database
    const totalItemsInDb = await prisma.item.count();
    console.log(`\n📊 Total items now in database: ${totalItemsInDb}`);

    const phbItems = await prisma.item.count({ where: { source: 'PHB' } });
    const dmgItems = await prisma.item.count({ where: { source: 'DMG' } });
    console.log(`   - PHB 2014: ${phbItems} items`);
    console.log(`   - DMG 2014: ${dmgItems} items`);

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