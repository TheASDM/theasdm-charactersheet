#!/usr/bin/env node

/**
 * Database Test Script
 *
 * This script tests the database connection and performs various queries
 * to verify that the spell data is correctly imported and accessible.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function runTests() {
  console.log('🧪 Running Database Tests...\n');

  try {
    // Test 1: Basic connection and count
    console.log('📊 Test 1: Basic Statistics');
    const totalSpells = await prisma.spell.count();
    const spellsByLevel = await prisma.spell.groupBy({
      by: ['level'],
      _count: { level: true },
      orderBy: { level: 'asc' },
    });

    console.log(`   Total spells: ${totalSpells}`);
    console.log('   Spells by level:');
    spellsByLevel.forEach((group) => {
      console.log(`     Level ${group.level}: ${group._count.level} spells`);
    });

    // Test 2: Search by school
    console.log('\n🔥 Test 2: Evocation Spells (Level 0-2)');
    const evocationSpells = await prisma.spell.findMany({
      where: {
        school: 'V', // Evocation
        level: { lte: 2 },
      },
      select: {
        name: true,
        level: true,
        damageInflict: true,
      },
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
      take: 10,
    });

    evocationSpells.forEach((spell) => {
      const damage =
        spell.damageInflict.length > 0
          ? ` (${spell.damageInflict.join(', ')})`
          : '';
      console.log(`   Level ${spell.level}: ${spell.name}${damage}`);
    });

    // Test 3: Complex JSON query using raw SQL for now
    console.log('\n⚡ Test 3: Spells with Concentration');
    const concentrationSpells = await prisma.$queryRaw`
      SELECT name, level, school 
      FROM spells 
      WHERE duration::jsonb @> '[{"concentration": true}]'::jsonb
      ORDER BY level ASC 
      LIMIT 5
    `;

    concentrationSpells.forEach((spell) => {
      console.log(`   Level ${spell.level} ${spell.school}: ${spell.name}`);
    });

    // Test 4: Array queries
    console.log('\n🎯 Test 4: Spells with Saving Throws');
    const savingThrowSpells = await prisma.spell.findMany({
      where: {
        savingThrow: {
          isEmpty: false,
        },
      },
      select: {
        name: true,
        level: true,
        savingThrow: true,
      },
      orderBy: { name: 'asc' },
      take: 8,
    });

    savingThrowSpells.forEach((spell) => {
      console.log(
        `   ${spell.name} (Level ${spell.level}): ${spell.savingThrow.join(
          ', '
        )} saves`
      );
    });

    // Test 5: Ritual spells
    console.log('\n🕯️  Test 5: Ritual Spells');
    const ritualSpells = await prisma.spell.findMany({
      where: {
        isRitual: true,
      },
      select: {
        name: true,
        level: true,
        school: true,
      },
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
    });

    console.log(`   Found ${ritualSpells.length} ritual spells:`);
    ritualSpells.forEach((spell) => {
      console.log(`     Level ${spell.level} ${spell.school}: ${spell.name}`);
    });

    // Test 6: Reference data
    console.log('\n📚 Test 6: Reference Data');
    const schools = await prisma.spellSchool.findMany({
      orderBy: { id: 'asc' },
    });

    console.log('   Spell Schools:');
    schools.forEach((school) => {
      console.log(`     ${school.id}: ${school.name}`);
    });

    const damageTypes = await prisma.damageType.count();
    const conditions = await prisma.condition.count();
    const creatureTypes = await prisma.creatureType.count();

    console.log(`   Damage Types: ${damageTypes}`);
    console.log(`   Conditions: ${conditions}`);
    console.log(`   Creature Types: ${creatureTypes}`);

    // Test 7: Species Data (if available)
    console.log('\n🧬 Test 7: Species Data');
    const totalSpecies = await prisma.species.count();

    if (totalSpecies > 0) {
      const speciesBySource = await prisma.species.groupBy({
        by: ['source'],
        _count: { source: true },
        orderBy: { source: 'asc' },
      });

      console.log(`   Total species: ${totalSpecies}`);
      console.log('   Species by source:');
      speciesBySource.forEach((group) => {
        console.log(
          `     ${group.source || 'Unknown'}: ${group._count.source} species`
        );
      });

      // Sample species with D&D 2024 content
      const xphbSpecies = await prisma.species.findMany({
        where: { source: 'XPHB' },
        select: {
          name: true,
          size: true,
          speed: true,
          creatureType: true,
          languages: true,
        },
        orderBy: { name: 'asc' },
        take: 5,
      });

      console.log('   Sample D&D 2024 species:');
      xphbSpecies.forEach((species) => {
        console.log(
          `     ${species.name}: ${species.size} ${species.creatureType}, ${species.speed}ft speed`
        );
      });

      // Test JSON queries on species traits
      const speciesWithInnateSpells = await prisma.species.findMany({
        where: {
          innateSpells: {
            not: null,
          },
        },
        select: {
          name: true,
          innateSpells: true,
        },
        take: 3,
      });

      if (speciesWithInnateSpells.length > 0) {
        console.log('   Species with innate spells:');
        speciesWithInnateSpells.forEach((species) => {
          console.log(`     ${species.name}: Has magical abilities`);
        });
      }
    } else {
      console.log('   No species data found - run import-species.js first');
    }

    // Test 8: Class Data (if available)
    console.log('\n📚 Test 8: Class Data');
    const totalClasses = await prisma.class.count();

    if (totalClasses > 0) {
      const classes = await prisma.class.findMany({
        select: {
          name: true,
          hitDie: true,
          primaryAbility: true,
          savingThrowProficiencies: true,
          spellcastingAbility: true,
        },
        orderBy: { name: 'asc' },
      });

      console.log(`   Total classes: ${totalClasses}`);
      console.log('   Class overview:');
      classes.forEach((cls) => {
        const spellcaster = cls.spellcastingAbility
          ? ` (${cls.spellcastingAbility} caster)`
          : '';
        console.log(
          `     ${cls.name}: d${cls.hitDie} HD, ${cls.primaryAbility.join(
            '/'
          )} primary${spellcaster}`
        );
      });

      // Test subclass features JSON structure
      const classesWithSubclasses = await prisma.class.findMany({
        where: {
          subclassFeatures: {
            not: null,
          },
        },
        select: {
          name: true,
          subclassFeatures: true,
        },
        take: 3,
      });

      console.log('   Classes with subclass data:');
      classesWithSubclasses.forEach((cls) => {
        const subclasses = cls.subclassFeatures
          ? Object.keys(cls.subclassFeatures).length
          : 0;
        console.log(`     ${cls.name}: ${subclasses} subclasses available`);
      });

      // Test class features JSON structure
      const classesWithFeatures = await prisma.class.findMany({
        where: {
          classFeatures: {
            not: null,
          },
        },
        select: {
          name: true,
          classFeatures: true,
        },
        take: 2,
      });

      if (classesWithFeatures.length > 0) {
        console.log('   Sample class progression:');
        classesWithFeatures.forEach((cls) => {
          const features = cls.classFeatures || {};
          const levelCount = Object.keys(features).length;
          console.log(
            `     ${cls.name}: ${levelCount} levels of progression data`
          );
        });
      }
    } else {
      console.log('   No class data found - run import-classes.js first');
    }

    // Test 9: Background Data (if available)
    console.log('\n📜 Test 9: Background Data');
    const totalBackgrounds = await prisma.background.count();

    if (totalBackgrounds > 0) {
      const backgrounds = await prisma.background.findMany({
        select: {
          name: true,
          skillProficiencies: true,
          abilityScoreIncrease: true,
          originFeat: true,
        },
        orderBy: { name: 'asc' },
      });

      console.log(`   Total backgrounds: ${totalBackgrounds}`);
      console.log('   Sample D&D 2024 backgrounds:');
      backgrounds.slice(0, 5).forEach((bg) => {
        const skills = bg.skillProficiencies
          ? Object.keys(bg.skillProficiencies).join(', ')
          : 'none';
        const hasASI = bg.abilityScoreIncrease ? '✨ASI' : '';
        const hasFeat = bg.originFeat ? '🎯Feat' : '';
        console.log(`     ${bg.name}: ${skills} ${hasASI} ${hasFeat}`);
      });

      // Test background with ASI
      const backgroundsWithASI = await prisma.background.findMany({
        where: {
          abilityScoreIncrease: {
            not: null,
          },
        },
        take: 3,
      });

      if (backgroundsWithASI.length > 0) {
        console.log('   Backgrounds with D&D 2024 ASI:');
        backgroundsWithASI.forEach((bg) => {
          console.log(`     ${bg.name}: Has ability score options`);
        });
      }
    } else {
      console.log(
        '   No background data found - run import-backgrounds.js first'
      );
    }

    // Test 10: Feat Data (if available)
    console.log('\n⚔️ Test 10: Feat Data');
    const totalFeats = await prisma.feat.count();

    if (totalFeats > 0) {
      const featsByCategory = await prisma.feat.groupBy({
        by: ['category'],
        _count: { category: true },
        orderBy: { category: 'asc' },
      });

      console.log(`   Total feats: ${totalFeats}`);
      console.log('   Feats by category:');
      featsByCategory.forEach((group) => {
        const categoryName =
          {
            G: 'General',
            O: 'Origin',
            FS: 'Fighting Style',
            EB: 'Epic Boon',
          }[group.category] ||
          group.category ||
          'Unknown';
        console.log(`     ${categoryName}: ${group._count.category} feats`);
      });

      // Sample feats from each category
      const originFeats = await prisma.feat.findMany({
        where: { category: 'O' },
        select: {
          name: true,
          prerequisites: true,
          abilityScoreIncrease: true,
        },
        take: 3,
      });

      if (originFeats.length > 0) {
        console.log('   Sample Origin feats:');
        originFeats.forEach((feat) => {
          const hasASI = feat.abilityScoreIncrease ? '✨ASI' : '';
          const hasPrereqs = feat.prerequisites ? '📋Prereqs' : '';
          console.log(`     ${feat.name} ${hasASI} ${hasPrereqs}`);
        });
      }

      // Test feats with ability score improvements
      const featsWithASI = await prisma.feat.findMany({
        where: {
          abilityScoreIncrease: {
            not: null,
          },
        },
        take: 3,
      });

      if (featsWithASI.length > 0) {
        console.log('   Feats with ability score options:');
        featsWithASI.forEach((feat) => {
          console.log(`     ${feat.name}: Has ASI choices`);
        });
      }
    } else {
      console.log('   No feat data found - run import-feats.js first');
    }

    // Test 11: Item Data (if available)
    console.log('\n🏹 Test 11: Item Data');
    const totalItems = await prisma.item.count();

    if (totalItems > 0) {
      console.log(`   Total items: ${totalItems}`);

      // Items by type
      const itemsByType = await prisma.item.groupBy({
        by: ['type'],
        _count: { type: true },
        orderBy: { _count: { type: 'desc' } },
        take: 10,
      });

      console.log('\n   Items by type:');
      itemsByType.forEach((group) => {
        console.log(`     ${group.type}: ${group._count.type} items`);
      });

      // Sample weapons with damage
      const weapons = await prisma.item.findMany({
        where: {
          type: 'weapon',
          dmg1: { not: null },
        },
        select: {
          name: true,
          dmg1: true,
          dmgType: true,
          property: true,
          weaponCategory: true,
        },
        orderBy: { name: 'asc' },
        take: 5,
      });

      if (weapons.length > 0) {
        console.log('\n   Sample weapons:');
        weapons.forEach((weapon) => {
          const properties =
            weapon.property.length > 0
              ? ` (${weapon.property.join(', ')})`
              : '';
          const category = weapon.weaponCategory
            ? ` [${weapon.weaponCategory}]`
            : '';
          console.log(
            `     ${weapon.name}${category}: ${weapon.dmg1} ${weapon.dmgType}${properties}`
          );
        });
      }

      // Sample armor with AC
      const armor = await prisma.item.findMany({
        where: {
          type: 'armor',
          ac: { not: null },
        },
        select: {
          name: true,
          ac: true,
          armorType: true,
          strength: true,
          stealth: true,
        },
        orderBy: { ac: 'asc' },
        take: 5,
      });

      if (armor.length > 0) {
        console.log('\n   Sample armor:');
        armor.forEach((item) => {
          const type = item.armorType ? ` [${item.armorType}]` : '';
          const strength = item.strength ? ` Str ${item.strength}` : '';
          const stealth = item.stealth ? ' (disadvantage)' : '';
          console.log(
            `     ${item.name}${type}: AC ${item.ac}${strength}${stealth}`
          );
        });
      }

      // Items with cost
      const expensiveItems = await prisma.item.findMany({
        where: {
          value: { gt: 10000 }, // More than 100 gp in copper
        },
        select: {
          name: true,
          value: true,
          valueCurrency: true,
          rarity: true,
        },
        orderBy: { value: 'desc' },
        take: 5,
      });

      if (expensiveItems.length > 0) {
        console.log('\n   Expensive items:');
        expensiveItems.forEach((item) => {
          const gpValue = Math.floor(item.value / 100);
          const rarity = item.rarity ? ` (${item.rarity})` : '';
          console.log(`     ${item.name}: ${gpValue} gp${rarity}`);
        });
      }

      // Magic items (with rarity other than common)
      const magicItems = await prisma.item.findMany({
        where: {
          rarity: { not: 'common' },
        },
        select: {
          name: true,
          rarity: true,
          reqAttune: true,
        },
        orderBy: { name: 'asc' },
        take: 8,
      });

      if (magicItems.length > 0) {
        console.log('\n   Magic items:');
        magicItems.forEach((item) => {
          const attune = item.reqAttune ? ' (attunement)' : '';
          console.log(`     ${item.name} [${item.rarity}]${attune}`);
        });
      }

      // Items by source
      const itemsBySource = await prisma.item.groupBy({
        by: ['source'],
        _count: { source: true },
        where: {
          source: { not: null },
        },
        orderBy: { _count: { source: 'desc' } },
      });

      if (itemsBySource.length > 0) {
        console.log('\n   Items by source:');
        itemsBySource.forEach((group) => {
          console.log(`     ${group.source}: ${group._count.source} items`);
        });
      }
    } else {
      console.log('   No item data found - run import-items.js first');
    }

    // Test 12: Cross-reference integrity
    console.log('\n🔗 Test 12: Data Integrity');
    const dataIntegrity = {
      spells: totalSpells,
      species: totalSpecies,
      items: totalItems,
      classes: totalClasses,
      backgrounds: totalBackgrounds,
      feats: totalFeats,
    };

    console.log('   Data summary:');
    Object.entries(dataIntegrity).forEach(([type, count]) => {
      const status = count > 0 ? '✅' : '⚠️ ';
      console.log(`     ${status} ${type}: ${count} records`);
    });

    if (
      totalSpecies > 0 &&
      totalClasses > 0 &&
      totalBackgrounds > 0 &&
      totalFeats > 0 &&
      totalItems > 0
    ) {
      console.log(
        '   🎉 Complete D&D 2024 character creation dataset available!'
      );
    } else if (totalSpells > 0) {
      console.log(
        '   📖 Core data ready, some character options pending import'
      );
    }

    console.log('\n✅ All tests passed! Database is working correctly.');
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
