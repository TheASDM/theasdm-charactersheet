const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function exportAllContent() {
  try {
    console.log('Exporting all D&D content from database...\n');

    const outputDir = path.join(process.env.HOME, 'Desktop', 'character-data-review', 'database-content');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Export spells
    console.log('Exporting spells...');
    const spells = await prisma.spell.findMany();
    fs.writeFileSync(
      path.join(outputDir, 'spells.json'),
      JSON.stringify(spells, null, 2)
    );
    console.log(`✓ Exported ${spells.length} spells`);

    // Export feats
    console.log('Exporting feats...');
    const feats = await prisma.feat.findMany();
    fs.writeFileSync(
      path.join(outputDir, 'feats.json'),
      JSON.stringify(feats, null, 2)
    );
    console.log(`✓ Exported ${feats.length} feats`);

    // Export backgrounds
    console.log('Exporting backgrounds...');
    const backgrounds = await prisma.background.findMany();
    fs.writeFileSync(
      path.join(outputDir, 'backgrounds.json'),
      JSON.stringify(backgrounds, null, 2)
    );
    console.log(`✓ Exported ${backgrounds.length} backgrounds`);

    // Export species
    console.log('Exporting species...');
    const species = await prisma.species.findMany();
    fs.writeFileSync(
      path.join(outputDir, 'species.json'),
      JSON.stringify(species, null, 2)
    );
    console.log(`✓ Exported ${species.length} species`);

    // Export items
    console.log('Exporting items...');
    const items = await prisma.item.findMany();
    fs.writeFileSync(
      path.join(outputDir, 'items.json'),
      JSON.stringify(items, null, 2)
    );
    console.log(`✓ Exported ${items.length} items`);

    // Export classes
    console.log('Exporting classes...');
    const classes = await prisma.class.findMany({
      include: {
        subclasses: true
      }
    });
    fs.writeFileSync(
      path.join(outputDir, 'classes.json'),
      JSON.stringify(classes, null, 2)
    );
    console.log(`✓ Exported ${classes.length} classes`);

    console.log(`\n✅ All content exported to: ${outputDir}`);
  } catch (error) {
    console.error('Error exporting content:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportAllContent();
