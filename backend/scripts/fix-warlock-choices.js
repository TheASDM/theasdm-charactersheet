/**
 * Fix Warlock Choices for D&D 2024
 *
 * This script corrects the Warlock data:
 * - Level 1: Choose Eldritch Invocation (including Pact Boons)
 * - Removes incorrect 2014 invocations
 * - Adds correct D&D 2024 Level 1 invocations
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// D&D 2024 Level 1 Eldritch Invocations (including Pact Boons)
const LEVEL_1_INVOCATIONS = [
  {
    name: 'Armor of Shadows',
    description: 'You can cast Mage Armor on yourself at will, without expending a spell slot.',
    detailedText: 'You can cast mage armor on yourself at will, without expending a spell slot.',
    prerequisites: {},
    effects: {
      spellsAtWill: ['mage armor'],
      selfOnly: true
    },
    spellsGranted: ['mage armor'],
    atWillSpells: ['mage armor'],
    levelRequirement: 1,
    source: 'XPHB',
    page: 117,
    contentVersion: '2024.1'
  },
  {
    name: 'Eldritch Mind',
    description: 'You have advantage on Constitution saving throws that you make to maintain your concentration on a spell.',
    detailedText: 'You have advantage on Constitution saving throws that you make to maintain your concentration on a spell.',
    prerequisites: {},
    effects: {
      concentrationAdvantage: true
    },
    spellsGranted: [],
    atWillSpells: [],
    levelRequirement: 1,
    source: 'XPHB',
    page: 117,
    contentVersion: '2024.1'
  },
  {
    name: 'Pact of the Blade',
    description: 'You can use your action to create a pact weapon in your empty hand.',
    detailedText: 'You can use your action to create a pact weapon in your empty hand. You can choose the form that this melee weapon takes each time you create it. You are proficient with it while you wield it. This weapon counts as magical for the purpose of overcoming resistance and immunity to nonmagical attacks and damage.',
    prerequisites: {},
    effects: {
      pactWeapon: true,
      weaponProficiency: 'pact_weapon'
    },
    spellsGranted: [],
    atWillSpells: [],
    levelRequirement: 1,
    source: 'XPHB',
    page: 117,
    contentVersion: '2024.1'
  },
  {
    name: 'Pact of the Chain',
    description: 'You learn the Find Familiar spell and can cast it as a ritual.',
    detailedText: 'You learn the find familiar spell and can cast it as a ritual. The spell doesn\'t count against your number of spells known. When you cast the spell, you can choose one of the normal forms for your familiar or one of the following special forms: imp, pseudodragon, quasit, or sprite.',
    prerequisites: {},
    effects: {
      spellsLearned: ['find familiar'],
      ritualCasting: true,
      specialFamiliars: ['imp', 'pseudodragon', 'quasit', 'sprite']
    },
    spellsGranted: ['find familiar'],
    atWillSpells: [],
    levelRequirement: 1,
    source: 'XPHB',
    page: 117,
    contentVersion: '2024.1'
  },
  {
    name: 'Pact of the Tome',
    description: 'Your patron gives you a grimoire called a Book of Shadows.',
    detailedText: 'Your patron gives you a grimoire called a Book of Shadows. When you gain this feature, choose three cantrips from any class\'s spell list. While the book is on your person, you can cast those cantrips at will.',
    prerequisites: {},
    effects: {
      additionalCantrips: 3,
      cantripSource: 'any_class',
      bookOfShadows: true
    },
    spellsGranted: [],
    atWillSpells: [],
    levelRequirement: 1,
    source: 'XPHB',
    page: 117,
    contentVersion: '2024.1'
  }
];


async function main() {
  console.log('🔧 Fixing Warlock Choices for D&D 2024...');

  try {
    // Step 1: Clear all existing invocations (they were wrong)
    console.log('🗑️  Clearing all incorrect invocations...');
    await prisma.eldritchInvocation.deleteMany({});

    // Step 2: Add correct D&D 2024 Level 1 invocations
    console.log('📝 Adding correct D&D 2024 Level 1 invocations...');
    for (const invocation of LEVEL_1_INVOCATIONS) {
      await prisma.eldritchInvocation.create({
        data: invocation
      });
    }

    // Step 3: Update Eldritch Invocations choice to stay at Level 1
    const warlockClass = await prisma.class.findFirst({ where: { name: 'Warlock' } });

    if (warlockClass) {
      await prisma.classFeatureChoice.updateMany({
        where: {
          classId: warlockClass.id,
          featureName: 'Eldritch Invocations'
        },
        data: {
          choiceLevel: 1,
          description: 'In your study of occult lore, you have unearthed Eldritch Invocations, fragments of forbidden knowledge that imbue you with an abiding magical ability.'
        }
      });
    }

    console.log('✅ Added correct D&D 2024 Eldritch Invocations');
    console.log('🎉 Warlock choices fixed for D&D 2024!');

    // Display summary
    const invocationCount = await prisma.eldritchInvocation.count();
    console.log(`\n📊 Summary:`);
    console.log(`   - Level 1 Invocations: ${invocationCount}`);
    console.log(`   - Including Pact Boons: Blade, Chain, Tome`);
    console.log(`   - Other Level 1: Armor of Shadows, Eldritch Mind`);

  } catch (error) {
    console.error('❌ Error fixing warlock choices:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });