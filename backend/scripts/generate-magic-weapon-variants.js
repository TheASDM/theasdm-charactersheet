const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Track import statistics
let stats = {
  total: 0,
  imported: 0,
  skipped: 0,
  errors: 0,
  errorDetails: []
};

// Common weapons that should have +1, +2, +3 variants
const WEAPONS_TO_ENHANCE = [
  'Battleaxe',
  'Blowgun',
  'Club',
  'Dagger',
  'Dart',
  'Greataxe',
  'Greatclub',
  'Greatsword',
  'Halberd',
  'Handaxe',
  'Javelin',
  'Lance',
  'Light Hammer',
  'Longsword',
  'Mace',
  'Maul',
  'Morningstar',
  'Pike',
  'Quarterstaff',
  'Rapier',
  'Scimitar',
  'Shortsword',
  'Sickle',
  'Spear',
  'Trident',
  'War Pick',
  'Warhammer',
  'Whip',
  // Ranged weapons
  'Hand Crossbow',
  'Heavy Crossbow',
  'Light Crossbow',
  'Longbow',
  'Shortbow',
  'Sling'
];

// Common armor that should have +1, +2, +3 variants
const ARMOR_TO_ENHANCE = [
  'Leather Armor',
  'Studded Leather Armor',
  'Hide Armor',
  'Chain Shirt',
  'Scale Mail',
  'Breastplate',
  'Half Plate Armor',
  'Ring Mail',
  'Chain Mail',
  'Splint Armor',
  'Plate Armor',
  'Shield'
];

// Enhancement levels with their rarity
const ENHANCEMENT_LEVELS = [
  { bonus: '+1', rarity: 'uncommon' },
  { bonus: '+2', rarity: 'rare' },
  { bonus: '+3', rarity: 'very rare' }
];

async function findBaseItem(itemName) {
  // Try to find the base item in our database
  const baseItem = await prisma.item.findFirst({
    where: {
      name: itemName,
      OR: [
        { source: 'XPHB' },
        { source: 'PHB' }
      ]
    }
  });

  return baseItem;
}

async function createMagicWeaponVariant(baseItem, enhancement) {
  try {
    stats.total++;

    const magicName = `${enhancement.bonus} ${baseItem.name}`;

    // Check if this variant already exists
    const existingItem = await prisma.item.findFirst({
      where: { name: magicName }
    });

    if (existingItem) {
      console.log(`Skipping existing item: ${magicName}`);
      stats.skipped++;
      return;
    }

    // Create the magical variant
    const magicItemData = {
      name: magicName,
      source: 'DMG', // Generic magic items are from DMG
      page: 213, // Magic weapon section in DMG
      type: baseItem.type,
      typeAlt: baseItem.typeAlt,
      rarity: enhancement.rarity,
      weight: baseItem.weight,
      value: null, // Magic items don't have standard market value
      valueCurrency: null,
      entries: [`This ${baseItem.name.toLowerCase()} is a magic weapon. You have a ${enhancement.bonus} bonus to attack and damage rolls made with this weapon.`],
      additionalEntries: null,

      // Copy weapon properties from base item
      weaponCategory: baseItem.weaponCategory,
      property: baseItem.property || [],
      range: baseItem.range,
      dmg1: baseItem.dmg1,
      dmg2: baseItem.dmg2,
      dmgType: baseItem.dmgType,

      // Copy armor properties from base item
      ac: baseItem.ac,
      strength: baseItem.strength,
      stealth: baseItem.stealth,
      armorType: baseItem.armorType,

      // Magic weapon properties
      reqAttune: null, // Basic +1/+2/+3 items don't require attunement
      charges: null,
      recharge: null,
      bonusWeapon: enhancement.bonus,
      bonusAc: baseItem.armorType ? enhancement.bonus : null, // AC bonus for armor
      bonusSpellAttack: null,
      bonusSpellSaveDc: null,
      spells: null,

      // Metadata
      sourceBook: 'DMG',
      contentVersion: '2014',
      isHomebrew: false
    };

    // Insert into database
    await prisma.item.create({
      data: magicItemData
    });

    console.log(`✓ Created: ${magicName} (${enhancement.rarity})`);
    stats.imported++;

  } catch (error) {
    console.error(`✗ Error creating ${enhancement.bonus} ${baseItem.name}:`, error.message);
    stats.errors++;
    stats.errorDetails.push({
      name: `${enhancement.bonus} ${baseItem.name}`,
      error: error.message
    });
  }
}

async function main() {
  try {
    console.log('🚀 Generating standard magical weapon and armor variants...\\n');

    // Generate magic weapon variants
    console.log('⚔️  Creating magical weapon variants...');
    for (const weaponName of WEAPONS_TO_ENHANCE) {
      const baseItem = await findBaseItem(weaponName);

      if (!baseItem) {
        console.log(`⚠️  Base weapon not found: ${weaponName}`);
        continue;
      }

      // Create +1, +2, +3 variants
      for (const enhancement of ENHANCEMENT_LEVELS) {
        await createMagicWeaponVariant(baseItem, enhancement);
      }
    }

    // Generate magic armor variants
    console.log('\\n🛡️  Creating magical armor variants...');
    for (const armorName of ARMOR_TO_ENHANCE) {
      const baseItem = await findBaseItem(armorName);

      if (!baseItem) {
        console.log(`⚠️  Base armor not found: ${armorName}`);
        continue;
      }

      // Create +1, +2, +3 variants
      for (const enhancement of ENHANCEMENT_LEVELS) {
        await createMagicWeaponVariant(baseItem, enhancement);
      }
    }

    // Print final statistics
    console.log('\\n' + '='.repeat(60));
    console.log('📊 MAGIC ITEM GENERATION COMPLETE!');
    console.log('='.repeat(60));
    console.log(`Total items processed: ${stats.total}`);
    console.log(`Successfully created: ${stats.imported}`);
    console.log(`Skipped (already exist): ${stats.skipped}`);
    console.log(`Errors: ${stats.errors}`);

    if (stats.errors > 0) {
      console.log('\\n❌ Error details:');
      stats.errorDetails.slice(0, 10).forEach(error => {
        console.log(`  - ${error.name}: ${error.error}`);
      });
      if (stats.errorDetails.length > 10) {
        console.log(`  ... and ${stats.errorDetails.length - 10} more errors`);
      }
    }

    // Verify total count in database
    const totalItemsInDb = await prisma.item.count();
    console.log(`\\n📊 Total items now in database: ${totalItemsInDb}`);

    // Count magic variants
    const magicVariants = await prisma.item.count({
      where: {
        name: {
          startsWith: '+'
        }
      }
    });
    console.log(`   - Magic weapon/armor variants: ${magicVariants} items`);

    console.log('\\n🎉 Standard D&D magic weapons (+1, +2, +3) are now available!');

  } catch (error) {
    console.error('❌ Generation failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\\n🛑 Generation interrupted. Cleaning up...');
  await prisma.$disconnect();
  process.exit(0);
});

main();