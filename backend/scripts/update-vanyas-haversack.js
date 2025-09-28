const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateVanyasHaversack() {
  try {
    console.log('🎒 Updating Vanya\'s Haversack description...\n');

    // Create the updated description with proper HTML formatting and clarified curse
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

    // Update the existing item using the compound unique key
    const updatedItem = await prisma.item.update({
      where: {
        name_source: {
          name: "Vanya's Haversack",
          source: "Homebrew"
        }
      },
      data: { entries: description }
    });

    console.log('✓ Successfully updated Vanya\'s Haversack!');
    console.log(`   ID: ${updatedItem.id}`);
    console.log(`   Description now has proper HTML formatting`);
    console.log(`   Curse mechanics clarified (identical items, not exact same item)`);
    console.log(`   Added explanation about preventing "I would have bought that" scenarios`);

    console.log('\n🎉 Vanya\'s Haversack has been updated with the corrected description!');

  } catch (error) {
    console.error('❌ Error updating Vanya\'s Haversack:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateVanyasHaversack();