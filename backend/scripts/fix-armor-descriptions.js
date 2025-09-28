#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixArmorDescriptions() {
  console.log('🔧 Fixing armor and weapon descriptions...');

  try {
    // Fix armor items that incorrectly say "magic weapon"
    const armorTypes = ['LA|XPHB', 'MA|XPHB', 'HA|XPHB', 'S|XPHB'];

    for (const armorType of armorTypes) {
      const armorItems = await prisma.item.findMany({
        where: {
          type: armorType,
          name: {
            startsWith: '+1'
          }
        }
      });

      console.log(`Found ${armorItems.length} armor items with incorrect descriptions for type ${armorType}`);

      for (const item of armorItems) {
        let entries = Array.isArray(item.entries) ? [...item.entries] : [];

        // Fix the first entry which typically contains the incorrect text
        if (entries[0] && typeof entries[0] === 'string') {
          // Replace "magic weapon" with appropriate armor text
          if (armorType === 'S|XPHB') {
            entries[0] = entries[0].replace(
              /This .+ is a magic weapon\. You have a \+\d+ bonus to attack and damage rolls made with this weapon\./,
              `This shield is a magic item. While you are wielding this shield, you have a ${item.bonusWeapon || '+1'} bonus to Armor Class.`
            );
          } else {
            entries[0] = entries[0].replace(
              /This .+ is a magic weapon\. You have a \+\d+ bonus to attack and damage rolls made with this weapon\./,
              `This armor is a magic item. While you are wearing this armor, you have a ${item.bonusWeapon || '+1'} bonus to Armor Class.`
            );
          }
        }

        // Update the item
        await prisma.item.update({
          where: { id: item.id },
          data: {
            entries: entries,
            bonusAc: item.bonusWeapon ? parseInt(item.bonusWeapon.replace('+', '')) : null,
            bonusWeapon: null // Remove incorrect bonusWeapon from armor
          }
        });

        console.log(`✅ Fixed: ${item.name}`);
      }
    }


    console.log('\n✅ Armor description fixes completed!');

  } catch (error) {
    console.error('❌ Error fixing armor descriptions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixArmorDescriptions();