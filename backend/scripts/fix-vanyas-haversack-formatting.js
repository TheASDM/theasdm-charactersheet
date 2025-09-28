const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixVanyasHaversackFormatting() {
  try {
    console.log('🎒 Fixing Vanya\'s Haversack formatting for frontend...\n');

    // Create the description as a single string with proper HTML formatting
    const description = `This haversack appears to be a well-used but sturdy backpack made of canvas and leather. Like a Handy Haversack, it has two side pouches and a large central compartment that are larger on the inside than the outside.<br><br>

However, this particular haversack has a peculiar curse: it is stuffed completely full and will not accept any new items. Even if you remove items from it, the interior magically contracts to maintain its "overstuffed" state, refusing to accommodate anything new unless you replace it with an identical item of the same type.<br><br>

The haversack contains a comprehensive collection of adventuring supplies, making it both a blessing and a curse for any adventurer who acquires it. While you gain access to nearly every basic tool and supply you might need, you cannot customize its contents or add different equipment. This prevents the common "I would have bought that" problem - if you need something specific that isn't in the pack, you must actually acquire it through proper means.<br><br>

<b>Contents:</b><br><br>

<b>Fire & Light:</b> Torch, Flint and steel, Tinderbox, Lantern, Oil Flask, Candles, Matches<br><br>

<b>Tools & Equipment:</b> Rope (50 feet), Grappling Hook, Crowbar, Hammer, Nails, Pitons, Shovel, Whetstone, Small knife<br><br>

<b>Containers & Storage:</b> Backpack, Belt pouch, Hempen Sack, Waterskin, Oil Flask<br><br>

<b>Investigation & Communication:</b> Magnifying Glass, Spyglass, Bell, Mirror (steel), Ink and Quill, Paper/parchment, Charcoal/pencil, Chalk<br><br>

<b>Survival & Comfort:</b> Rations (3 days), Water, Bedroll, Blanket, Soap, Needle and thread, Bandages/cloth strips, Cloth/rags, Salt<br><br>

<b>Tactical & Combat:</b> Caltrops, Net, Chain (10 feet), Manacles, Ball bearings (bag of 1,000)<br><br>

<b>Personal Items:</b> Comb, String/twine, Small mirror, Fishing hook and line<br><br>

<b>Curse:</b> The haversack will not accept any new items. If you remove an item, the interior contracts so that nothing new can be placed inside unless you replace it with an identical item of the same type (for example, you could replace the torch with another torch, but not with a lantern). This forces adventurers to plan ahead and actually purchase specialized equipment rather than assuming they "would have bought it."`;

    // Update the existing item with a single string instead of array
    const updatedItem = await prisma.item.update({
      where: {
        name_source: {
          name: "Vanya's Haversack",
          source: "Homebrew"
        }
      },
      data: { entries: [description] } // Single entry in array
    });

    console.log('✓ Successfully updated Vanya\'s Haversack formatting!');
    console.log(`   ID: ${updatedItem.id}`);
    console.log(`   Now using single string with HTML <br> tags for line breaks`);

    console.log('\n🎉 Vanya\'s Haversack should now display properly in the frontend!');

  } catch (error) {
    console.error('❌ Error fixing Vanya\'s Haversack formatting:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixVanyasHaversackFormatting();