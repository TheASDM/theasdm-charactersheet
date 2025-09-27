const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDoubledTerminology() {
  console.log('🔧 Fixing doubled Sorcery terminology...');

  const sorcerer = await prisma.class.findFirst({
    where: { name: 'Sorcerer' }
  });

  if (sorcerer && sorcerer.subclassFeatures) {
    let featuresStr = JSON.stringify(sorcerer.subclassFeatures);

    // Fix the doubled "Sorcery Sorcery" back to just "Sorcery"
    featuresStr = featuresStr.replace(/Wild Magic Sorcery Sorcery/g, 'Wild Magic Sorcery');
    featuresStr = featuresStr.replace(/Draconic Sorcery Sorcery/g, 'Draconic Sorcery');

    await prisma.class.update({
      where: { id: sorcerer.id },
      data: {
        subclassFeatures: JSON.parse(featuresStr)
      }
    });

    console.log('✅ Fixed doubled terminology');
  }

  await prisma.$disconnect();
}

fixDoubledTerminology();