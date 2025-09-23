#!/usr/bin/env node

/**
 * D&D Item Data Import Script
 *
 * This script imports item data from JSON files into the PostgreSQL database.
 * It focuses on D&D 2024 content (sources: XPHB, XDMG) and handles the complex
 * structure of weapons, armor, adventuring gear, and magic items.
 *
 * Usage: node scripts/import-items.js <path-to-items-json-file>
 * Example: node scripts/import-items.js ../data/items.json
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Filter item data for D&D 2024 content only
 */
function filterXPHBContent(data) {
  return data.filter(
    (item) => item.source === 'XPHB' || item.source === 'XDMG'
  );
}

/**
 * Parse item cost from various formats
 * Examples: "50 gp", "2 sp", "5,000 gp", {"gp": 50, "sp": 2}
 */
function parseItemCost(cost) {
  if (!cost) return { value: null, currency: null };

  if (typeof cost === 'object') {
    // Handle object format: {"gp": 50, "sp": 2}
    const currencies = ['gp', 'sp', 'cp', 'pp', 'ep'];
    let totalCopper = 0;
    let mainCurrency = 'gp';

    for (const [curr, amount] of Object.entries(cost)) {
      if (currencies.includes(curr) && typeof amount === 'number') {
        // Convert to copper pieces for storage
        switch (curr) {
          case 'cp':
            totalCopper += amount;
            break;
          case 'sp':
            totalCopper += amount * 10;
            break;
          case 'ep':
            totalCopper += amount * 50;
            break;
          case 'gp':
            totalCopper += amount * 100;
            break;
          case 'pp':
            totalCopper += amount * 1000;
            break;
        }
        if (amount > 0) mainCurrency = curr;
      }
    }

    return { value: totalCopper || null, currency: mainCurrency };
  }

  if (typeof cost === 'string') {
    // Handle string format: "50 gp", "2 sp", "5,000 gp"
    const match = cost.match(/(\d+(?:,\d+)*)\s*(gp|sp|cp|pp|ep)/i);
    if (match) {
      const amount = parseInt(match[1].replace(/,/g, ''));
      const currency = match[2].toLowerCase();

      // Convert to copper pieces
      let copper = amount;
      switch (currency) {
        case 'sp':
          copper *= 10;
          break;
        case 'ep':
          copper *= 50;
          break;
        case 'gp':
          copper *= 100;
          break;
        case 'pp':
          copper *= 1000;
          break;
      }

      return { value: copper, currency: currency };
    }
  }

  return { value: null, currency: null };
}

/**
 * Parse weapon damage from 5etools format
 */
function parseWeaponDamage(item) {
  const damage = {
    dmg1: null,
    dmg2: null,
    dmgType: null,
  };

  if (item.dmg1) {
    damage.dmg1 = item.dmg1;
  }

  if (item.dmg2) {
    damage.dmg2 = item.dmg2;
  }

  if (item.dmgType) {
    damage.dmgType = item.dmgType;
  }

  return damage;
}

/**
 * Parse armor properties
 */
function parseArmorProperties(item) {
  const armor = {
    ac: null,
    strength: null,
    stealth: null,
    armorType: null,
  };

  if (item.ac !== undefined) {
    armor.ac = typeof item.ac === 'number' ? item.ac : null;
  }

  if (item.strength !== undefined) {
    armor.strength = typeof item.strength === 'number' ? item.strength : null;
  }

  if (item.stealth !== undefined) {
    armor.stealth = item.stealth === true;
  }

  // Determine armor type from item type or properties
  if (item.type) {
    const type = item.type.toLowerCase();
    if (type.includes('light')) armor.armorType = 'light';
    else if (type.includes('medium')) armor.armorType = 'medium';
    else if (type.includes('heavy')) armor.armorType = 'heavy';
    else if (type.includes('shield')) armor.armorType = 'shield';
  }

  return armor;
}

/**
 * Parse item properties array
 */
function parseItemProperties(item) {
  const properties = [];

  if (item.property && Array.isArray(item.property)) {
    properties.push(...item.property);
  }

  // Add special properties based on other fields
  if (item.weapon) {
    if (item.range) properties.push(item.range);
    if (item.weaponCategory) properties.push(item.weaponCategory);
  }

  return properties;
}

/**
 * Determine item type from 5etools data
 */
function determineItemType(item) {
  if (item.type) {
    return item.type;
  }

  // Fallback logic based on properties
  if (item.weapon) return 'weapon';
  if (item.armor) return 'armor';
  if (item.shield) return 'shield';

  return 'adventuring gear';
}

/**
 * Parse magic item properties
 */
function parseMagicProperties(item) {
  const magic = {
    reqAttune: null,
    charges: null,
    recharge: null,
    bonusWeapon: null,
    bonusAc: null,
    bonusSpellAttack: null,
    bonusSpellSaveDc: null,
  };

  if (item.reqAttune) {
    magic.reqAttune =
      typeof item.reqAttune === 'string' ? item.reqAttune : 'true';
  }

  if (item.charges !== undefined) {
    magic.charges = typeof item.charges === 'number' ? item.charges : null;
  }

  if (item.recharge) {
    magic.recharge = item.recharge;
  }

  // Parse bonuses - convert string values like "+2" to integers
  if (item.bonusWeapon) {
    magic.bonusWeapon =
      typeof item.bonusWeapon === 'string'
        ? item.bonusWeapon
        : String(item.bonusWeapon);
  }
  if (item.bonusAc) {
    magic.bonusAc =
      typeof item.bonusAc === 'string'
        ? parseInt(item.bonusAc.replace('+', ''), 10) || null
        : typeof item.bonusAc === 'number'
        ? item.bonusAc
        : null;
  }
  if (item.bonusSpellAttack) {
    magic.bonusSpellAttack =
      typeof item.bonusSpellAttack === 'string'
        ? parseInt(item.bonusSpellAttack.replace('+', ''), 10) || null
        : typeof item.bonusSpellAttack === 'number'
        ? item.bonusSpellAttack
        : null;
  }
  if (item.bonusSpellSaveDc) {
    magic.bonusSpellSaveDc =
      typeof item.bonusSpellSaveDc === 'string'
        ? parseInt(item.bonusSpellSaveDc.replace('+', ''), 10) || null
        : typeof item.bonusSpellSaveDc === 'number'
        ? item.bonusSpellSaveDc
        : null;
  }

  return magic;
}

/**
 * Transform a 5etools item into our database format
 */
function transformItem(item) {
  const cost = parseItemCost(item.value);
  const damage = parseWeaponDamage(item);
  const armor = parseArmorProperties(item);
  const properties = parseItemProperties(item);
  const magic = parseMagicProperties(item);

  return {
    name: item.name,
    source: item.source,
    page: item.page || null,

    // Classification
    type: determineItemType(item),
    typeAlt: item.typeAlt || null,
    rarity: item.rarity || 'common',

    // Basic properties
    weight: typeof item.weight === 'number' ? item.weight : null,
    value: cost.value,
    valueCurrency: cost.currency,

    // Content
    entries: item.entries || null,
    additionalEntries: item.additionalEntries || null,

    // Weapon properties
    weaponCategory: item.weaponCategory || null,
    property: properties,
    range: item.range || null,
    dmg1: damage.dmg1,
    dmg2: damage.dmg2,
    dmgType: damage.dmgType,

    // Armor properties
    ac: armor.ac,
    strength: armor.strength,
    stealth: armor.stealth,
    armorType: armor.armorType,

    // Magic properties
    reqAttune: magic.reqAttune,
    charges: magic.charges,
    recharge: magic.recharge,
    bonusWeapon: magic.bonusWeapon,
    bonusAc: magic.bonusAc,
    bonusSpellAttack: magic.bonusSpellAttack,
    bonusSpellSaveDc: magic.bonusSpellSaveDc,

    // Additional data
    modifySpeed: item.modifySpeed || null,
    spells: item.spells || null,
    baseItem: item.baseItem || null,
    variants: item.variants || null,

    // Flags
    srd52: item.srd52 || null,
    basicRules2024: item.basicRules2024 || null,

    // Metadata
    sourceBook: item.source || null,
    contentVersion: 'dnd2024',
    isHomebrew: false,
  };
}

/**
 * Import items into the database
 */
async function importItems(items) {
  console.log(`\n🏹 Processing ${items.length} D&D 2024 items...`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const progress = `[${i + 1}/${items.length}]`;

    try {
      const itemToInsert = transformItem(item);

      // Use upsert to handle duplicates gracefully
      await prisma.item.upsert({
        where: {
          name_source: {
            name: item.name,
            source: item.source,
          },
        },
        create: itemToInsert,
        update: itemToInsert,
      });

      imported++;
      console.log(
        `✅ ${progress} Imported: ${item.name} [${item.source}] (${
          item.type || 'unknown type'
        })`
      );
    } catch (error) {
      if (error.code === 'P2002') {
        // Unique constraint violation - item already exists
        skipped++;
        console.log(`⏭️  ${progress} Skipped (already exists): ${item.name}`);
      } else {
        errors++;
        console.error(
          `❌ ${progress} Error importing ${item.name}:`,
          error.message
        );
        // Log additional details for debugging
        if (process.env.DEBUG) {
          console.error('Item data:', JSON.stringify(item, null, 2));
          console.error(
            'Transformed data:',
            JSON.stringify(transformItem(item), null, 2)
          );
        }
      }
    }
  }

  console.log(`\n📊 Import Summary:`);
  console.log(`   ✅ Successfully imported: ${imported}`);
  console.log(`   ⏭️  Skipped (duplicates): ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📝 Total processed: ${imported + skipped + errors}`);
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('❌ Error: Please provide the path to the items JSON file.');
    console.error('');
    console.error(
      'Usage: node scripts/import-items.js <path-to-items-json-file>'
    );
    console.error(
      '   Example: node scripts/import-items.js ../data/items.json'
    );
    process.exit(1);
  }

  const jsonFilePath = args[0];

  // Verify file exists
  if (!fs.existsSync(jsonFilePath)) {
    console.error(`❌ Error: File not found: ${jsonFilePath}`);
    process.exit(1);
  }

  try {
    console.log(`🏹 Reading item data from: ${jsonFilePath}`);

    // Read and parse the JSON file
    const rawData = fs.readFileSync(jsonFilePath, 'utf8');
    const data = JSON.parse(rawData);

    // Handle different JSON structures
    let items;
    if (data.item && Array.isArray(data.item)) {
      items = data.item;
    } else if (Array.isArray(data)) {
      items = data;
    } else {
      console.error(
        '❌ Error: Invalid JSON structure. Expected "item" array or root array.'
      );
      process.exit(1);
    }

    console.log(`📦 Found ${items.length} items in the file`);

    // Filter for D&D 2024 content only
    const xphbItems = filterXPHBContent(items);
    console.log(
      `🎯 Found ${xphbItems.length} D&D 2024 (XPHB/XDMG) items to import`
    );

    if (xphbItems.length === 0) {
      console.log(
        '⚠️  No XPHB/XDMG items found. Make sure the JSON file contains D&D 2024 content.'
      );
      process.exit(0);
    }

    // Connect to database and import
    await prisma.$connect();
    console.log('✅ Connected to database');

    await importItems(xphbItems);

    console.log('\n🎉 Import completed successfully!');
  } catch (error) {
    console.error('❌ Fatal error during import:', error.message);
    if (process.env.DEBUG) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle cleanup on exit
process.on('SIGINT', async () => {
  console.log('\n⚠️  Process interrupted. Cleaning up...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Process terminated. Cleaning up...');
  await prisma.$disconnect();
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { filterXPHBContent, parseItemCost, transformItem };
