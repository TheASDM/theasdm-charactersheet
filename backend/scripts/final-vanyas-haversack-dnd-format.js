const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function finalVanyasHaversackFormat() {
  try {
    console.log('🎒 Applying final D&D-style formatting to Vanya\'s Haversack with bold headers...\n');

    // Create the description using proper D&D-style entries with named sections
    const description = [
      // Introduction paragraph
      "This haversack appears to be a well-used but sturdy backpack made of canvas and leather. Like a Handy Haversack, it has two side pouches and a large central compartment that are larger on the inside than the outside.",

      // Curse explanation
      "However, this particular haversack has a peculiar curse: it is stuffed completely full and will not accept any new items. Even if you remove items from it, the interior magically contracts to maintain its \"overstuffed\" state, refusing to accommodate anything new unless you replace it with an identical item of the same type.",

      // Game design explanation
      "The haversack contains a comprehensive collection of adventuring supplies, making it both a blessing and a curse for any adventurer who acquires it. While you gain access to nearly every basic tool and supply you might need, you cannot customize its contents or add different equipment. This prevents the common \"I would have bought that\" problem - if you need something specific that isn't in the pack, you must actually acquire it through proper means.",

      // Contents header
      "The haversack contains the following items, organized in separate compartments:",

      // Fire & Light section
      {
        "name": "Fire & Light",
        "type": "entries",
        "entries": [
          "Torch, Flint and steel, Tinderbox, Lantern, Oil Flask, Candles, Matches."
        ]
      },

      // Tools & Equipment section
      {
        "name": "Tools & Equipment",
        "type": "entries",
        "entries": [
          "Rope (50 feet), Grappling Hook, Crowbar, Hammer, Nails, Pitons, Shovel, Whetstone, Small knife."
        ]
      },

      // Containers & Storage section
      {
        "name": "Containers & Storage",
        "type": "entries",
        "entries": [
          "Backpack, Belt pouch, Hempen Sack, Waterskin, Oil Flask."
        ]
      },

      // Investigation & Communication section
      {
        "name": "Investigation & Communication",
        "type": "entries",
        "entries": [
          "Magnifying Glass, Spyglass, Bell, Mirror (steel), Ink and Quill, Paper/parchment, Charcoal/pencil, Chalk."
        ]
      },

      // Survival & Comfort section
      {
        "name": "Survival & Comfort",
        "type": "entries",
        "entries": [
          "Rations (3 days), Water, Bedroll, Blanket, Soap, Needle and thread, Bandages/cloth strips, Cloth/rags, Salt."
        ]
      },

      // Tactical & Combat section
      {
        "name": "Tactical & Combat",
        "type": "entries",
        "entries": [
          "Caltrops, Net, Chain (10 feet), Manacles, Ball bearings (bag of 1,000)."
        ]
      },

      // Personal Items section
      {
        "name": "Personal Items",
        "type": "entries",
        "entries": [
          "Comb, String/twine, Small mirror, Fishing hook and line."
        ]
      },

      // Curse section with bold header
      {
        "name": "Curse",
        "type": "entries",
        "entries": [
          "The haversack will not accept any new items. If you remove an item, the interior contracts so that nothing new can be placed inside unless you replace it with an identical item of the same type (for example, you could replace the torch with another torch, but not with a lantern). This forces adventurers to plan ahead and actually purchase specialized equipment rather than assuming they \"would have bought it.\""
        ]
      }
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

    console.log('✓ Successfully applied final D&D formatting to Vanya\'s Haversack!');
    console.log(`   ID: ${updatedItem.id}`);
    console.log(`   Now using proper D&D-style named sections for bold headers`);
    console.log(`   Contains 4 text paragraphs + 7 named sections with bold headers`);

    console.log('\n🎉 Vanya\'s Haversack now has proper D&D formatting with bold section headers!');

  } catch (error) {
    console.error('❌ Error applying final formatting to Vanya\'s Haversack:', error);
  } finally {
    await prisma.$disconnect();
  }
}

finalVanyasHaversackFormat();