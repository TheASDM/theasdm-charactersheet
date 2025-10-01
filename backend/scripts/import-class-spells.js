const { PrismaClient } = require('@prisma/client');
const classSpellsData = require('./class-spells-data');

const prisma = new PrismaClient();

async function importClassSpells() {
  console.log('Starting import of class spell relationships...\n');

  try {
    // Get all classes from database
    const classes = await prisma.class.findMany({
      select: { id: true, name: true }
    });

    if (classes.length === 0) {
      throw new Error('No classes found in database. Please import classes first.');
    }

    console.log(`Found ${classes.length} classes in database:`);
    classes.forEach(c => console.log(`  - ${c.name}`));
    console.log('');

    // Get all spells from database
    const allSpells = await prisma.spell.findMany({
      select: { id: true, name: true }
    });

    console.log(`Found ${allSpells.length} spells in database\n`);

    // Create a map for quick spell lookup (case-insensitive)
    const spellMap = new Map();
    allSpells.forEach(spell => {
      spellMap.set(spell.name.toLowerCase(), spell);
    });

    let totalRelationships = 0;
    const unmatchedSpells = new Set();
    const stats = {};

    // Process each class
    for (const classData of classes) {
      const className = classData.name;
      const spellList = classSpellsData[className];

      if (!spellList) {
        console.log(`⚠️  No spell list found for ${className}, skipping...`);
        continue;
      }

      console.log(`\nProcessing ${className}...`);
      console.log(`  Spell list contains ${spellList.length} spells`);

      let matched = 0;
      let unmatched = 0;
      const classUnmatched = [];

      for (const spellName of spellList) {
        const spell = spellMap.get(spellName.toLowerCase());

        if (spell) {
          // Create the relationship
          try {
            await prisma.classSpell.create({
              data: {
                classId: classData.id,
                spellId: spell.id
              }
            });
            matched++;
            totalRelationships++;
          } catch (error) {
            if (error.code === 'P2002') {
              // Unique constraint violation - relationship already exists
              console.log(`    ⚠️  Relationship already exists for ${spellName}`);
            } else {
              throw error;
            }
          }
        } else {
          unmatched++;
          unmatchedSpells.add(spellName);
          classUnmatched.push(spellName);
        }
      }

      stats[className] = {
        total: spellList.length,
        matched,
        unmatched,
        percentage: ((matched / spellList.length) * 100).toFixed(1)
      };

      console.log(`  ✅ Matched: ${matched}`);
      console.log(`  ❌ Unmatched: ${unmatched}`);
      console.log(`  📊 Success rate: ${stats[className].percentage}%`);

      if (classUnmatched.length > 0 && classUnmatched.length <= 10) {
        console.log(`  Unmatched spells for ${className}:`);
        classUnmatched.forEach(spell => console.log(`    - ${spell}`));
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('IMPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`\nTotal relationships created: ${totalRelationships}`);
    console.log('\nPer-class statistics:');
    Object.entries(stats).forEach(([className, stat]) => {
      console.log(`  ${className.padEnd(12)} ${stat.matched}/${stat.total} (${stat.percentage}%)`);
    });

    if (unmatchedSpells.size > 0) {
      console.log(`\n⚠️  ${unmatchedSpells.size} unique spells could not be matched:`);
      const sortedUnmatched = Array.from(unmatchedSpells).sort();
      sortedUnmatched.forEach(spell => {
        console.log(`  - ${spell}`);
      });
      console.log('\nThese spells may:');
      console.log('  1. Not be imported yet');
      console.log('  2. Have slightly different names in the database');
      console.log('  3. Be from sourcebooks not yet imported');
    }

    console.log('\n✅ Class spell import complete!');

  } catch (error) {
    console.error('❌ Error during import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importClassSpells()
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
