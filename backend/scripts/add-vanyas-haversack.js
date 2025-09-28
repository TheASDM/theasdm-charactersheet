const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addVanyasHaversack() {
  try {
    console.log('🎒 Adding Vanya\'s Haversack to database...\n');

    // Check if it already exists
    const existingItem = await prisma.item.findFirst({
      where: { name: "Vanya's Haversack" }
    });

    if (existingItem) {
      console.log('⚠️  Vanya\'s Haversack already exists in database');
      return;
    }

    // Create the detailed description
    const description = [
      "This haversack appears to be a well-used but sturdy backpack made of canvas and leather. Like a Handy Haversack, it has two side pouches and a large central compartment that are larger on the inside than the outside.",
      "",
      "However, this particular haversack has a peculiar curse: it is stuffed completely full and will not accept any new items. Even if you remove items from it, the interior magically contracts to maintain its \"overstuffed\" state, refusing to accommodate anything new unless you replace it with an identical item of the same type.",
      "",
      "The haversack contains a comprehensive collection of adventuring supplies, making it both a blessing and a curse for any adventurer who acquires it. While you gain access to nearly every basic tool and supply you might need, you cannot customize its contents or add different equipment. This prevents the common \"I would have bought that\" problem - if you need something specific that isn't in the pack, you must actually acquire it through proper means.",
      "",
      "<b>Contents:</b>",
      "",
      "<b>Fire & Light:</b> Torch, Flint and steel, Tinderbox, Lantern, Oil Flask, Candles, Matches",
      "",
      "<b>Tools & Equipment:</b> Rope (50 feet), Grappling Hook, Crowbar, Hammer, Nails, Pitons, Shovel, Whetstone, Small knife",
      "",
      "<b>Containers & Storage:</b> Backpack, Belt pouch, Hempen Sack, Waterskin, Oil Flask",
      "",
      "<b>Investigation & Communication:</b> Magnifying Glass, Spyglass, Bell, Mirror (steel), Ink and Quill, Paper/parchment, Charcoal/pencil, Chalk",
      "",
      "<b>Survival & Comfort:</b> Rations (3 days), Water, Bedroll, Blanket, Soap, Needle and thread, Bandages/cloth strips, Cloth/rags, Salt",
      "",
      "<b>Tactical & Combat:</b> Caltrops, Net, Chain (10 feet), Manacles, Ball bearings (bag of 1,000)",
      "",
      "<b>Personal Items:</b> Comb, String/twine, Small mirror, Fishing hook and line",
      "",
      "<b>Curse:</b> The haversack will not accept any new items. If you remove an item, the interior contracts so that nothing new can be placed inside unless you replace it with an identical item of the same type (for example, you could replace the torch with another torch, but not with a lantern). This forces adventurers to plan ahead and actually purchase specialized equipment rather than assuming they \"would have bought it.\""
    ];

    // Create the item data
    const itemData = {
      name: "Vanya's Haversack",
      source: 'Homebrew',
      page: 0,
      type: 'G', // Adventuring Gear
      typeAlt: null,
      rarity: 'rare',
      weight: 5, // Same as normal backpack
      value: null, // Priceless due to magical nature
      valueCurrency: null,
      entries: description,
      additionalEntries: null,

      // Not a weapon
      weaponCategory: null,
      property: [],
      range: null,
      dmg1: null,
      dmg2: null,
      dmgType: null,

      // Not armor
      ac: null,
      strength: null,
      stealth: null,
      armorType: null,

      // Magic item properties
      reqAttune: null, // Does not require attunement
      charges: null,
      recharge: null,
      bonusWeapon: null,
      bonusAc: null,
      bonusSpellAttack: null,
      bonusSpellSaveDc: null,
      spells: null,

      // Metadata
      sourceBook: 'Homebrew',
      contentVersion: '2024',
      isHomebrew: true
    };

    // Insert into database
    const createdItem = await prisma.item.create({
      data: itemData
    });

    console.log('✓ Successfully created Vanya\'s Haversack!');
    console.log(`   ID: ${createdItem.id}`);
    console.log(`   Rarity: ${createdItem.rarity}`);
    console.log(`   Type: ${createdItem.type}`);
    console.log(`   Source: ${createdItem.source}`);

    // Verify total count
    const totalItems = await prisma.item.count();
    console.log(`\n📊 Total items now in database: ${totalItems}`);

    console.log('\n🎉 Vanya\'s Haversack has been added to your equipment database!');
    console.log('Players can now find this unique cursed item that contains every basic adventuring supply but refuses new additions.');

  } catch (error) {
    console.error('❌ Error adding Vanya\'s Haversack:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addVanyasHaversack();