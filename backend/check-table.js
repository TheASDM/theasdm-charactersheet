const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function examineTableData() {
  try {
    // Get cleric class
    const cleric = await prisma.class.findFirst({
      where: { name: 'Cleric' },
      select: { classFeatures: true },
    });

    if (cleric?.classFeatures) {
      console.log('Found Cleric class features');
      // Look for level 1 features
      const level1 = cleric.classFeatures['1'];
      if (level1?.features) {
        console.log(`Found ${level1.features.length} level 1 features`);
        level1.features.forEach((feature, idx) => {
          console.log(`\n=== FEATURE ${idx}: ${feature.name} ===`);
          if (feature.entries) {
            console.log(`Feature has ${feature.entries.length} entries`);
            feature.entries.forEach((entry, entryIdx) => {
              console.log(`\nEntry ${entryIdx}:`);
              if (entry.type === 'table') {
                console.log('TABLE FOUND!');
                console.log('Table data:', JSON.stringify(entry, null, 2));
              } else if (typeof entry === 'string') {
                console.log(`Text: ${entry.substring(0, 100)}...`);
              } else if (typeof entry === 'object') {
                console.log(`Object type: ${entry.type || 'unknown'}`);
                if (entry.type === 'entries') {
                  console.log('Nested entries found');
                } else {
                  console.log(JSON.stringify(entry, null, 2));
                }
              }
            });
          }
        });
      }
    } else {
      console.log('No cleric class features found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

examineTableData();
