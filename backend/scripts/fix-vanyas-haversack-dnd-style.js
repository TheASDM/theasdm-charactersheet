const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixVanyasHaversackDnDStyle() {
  try {
    console.log('🎒 Reformatting Vanya\'s Haversack using proper D&D-style entries...\n');

    // Create the description as D&D-style paragraph entries (no HTML)
    const description = [
      // Introduction paragraph
      "This haversack appears to be a well-used but sturdy backpack made of canvas and leather. Like a Handy Haversack, it has two side pouches and a large central compartment that are larger on the inside than the outside.",

      // Curse explanation
      "However, this particular haversack has a peculiar curse: it is stuffed completely full and will not accept any new items. Even if you remove items from it, the interior magically contracts to maintain its \"overstuffed\" state, refusing to accommodate anything new unless you replace it with an identical item of the same type.",

      // Game design explanation
      "The haversack contains a comprehensive collection of adventuring supplies, making it both a blessing and a curse for any adventurer who acquires it. While you gain access to nearly every basic tool and supply you might need, you cannot customize its contents or add different equipment. This prevents the common \"I would have bought that\" problem - if you need something specific that isn't in the pack, you must actually acquire it through proper means.",

      // Contents header and Fire & Light
      "Contents: Fire & Light - Torch, Flint and steel, Tinderbox, Lantern, Oil Flask, Candles, Matches.",

      // Tools & Equipment
      "Tools & Equipment - Rope (50 feet), Grappling Hook, Crowbar, Hammer, Nails, Pitons, Shovel, Whetstone, Small knife.",

      // Containers & Storage
      "Containers & Storage - Backpack, Belt pouch, Hempen Sack, Waterskin, Oil Flask.",

      // Investigation & Communication
      "Investigation & Communication - Magnifying Glass, Spyglass, Bell, Mirror (steel), Ink and Quill, Paper/parchment, Charcoal/pencil, Chalk.",

      // Survival & Comfort
      "Survival & Comfort - Rations (3 days), Water, Bedroll, Blanket, Soap, Needle and thread, Bandages/cloth strips, Cloth/rags, Salt.",

      // Tactical & Combat
      "Tactical & Combat - Caltrops, Net, Chain (10 feet), Manacles, Ball bearings (bag of 1,000).",

      // Personal Items
      "Personal Items - Comb, String/twine, Small mirror, Fishing hook and line.",

      // Curse mechanics detailed explanation
      "Curse: The haversack will not accept any new items. If you remove an item, the interior contracts so that nothing new can be placed inside unless you replace it with an identical item of the same type (for example, you could replace the torch with another torch, but not with a lantern). This forces adventurers to plan ahead and actually purchase specialized equipment rather than assuming they \"would have bought it.\""
    ];

    // Update the existing item with proper D&D-style entries
    const updatedItem = await prisma.item.update({
      where: {
        name_source: {
          name: "Vanya's Haversack",
          source: "Homebrew"
        }
      },
      data: { entries: description }
    });

    console.log('✓ Successfully reformatted Vanya\'s Haversack!');
    console.log(`   ID: ${updatedItem.id}`);
    console.log(`   Now using ${description.length} D&D-style paragraph entries`);
    console.log(`   Each paragraph will be separated naturally in the frontend`);

    console.log('\n🎉 Vanya\'s Haversack should now display properly with paragraph breaks!');

  } catch (error) {
    console.error('❌ Error reformatting Vanya\'s Haversack:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixVanyasHaversackDnDStyle();