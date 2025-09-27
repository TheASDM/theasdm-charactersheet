/**
 * Import D&D 2024 Class Choice Data
 *
 * This script populates the normalized class choice tables with D&D 2024 data:
 * - Fighting Styles
 * - Divine Orders
 * - Eldritch Invocations
 * - Subclasses
 * - Class Feature Choices
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Fighting Styles Data (Available to Fighter, Paladin, Ranger)
const FIGHTING_STYLES = [
  {
    name: 'Archery',
    description: '+2 bonus to attack rolls with ranged weapons.',
    detailedText: 'You gain a +2 bonus to attack rolls you make with ranged weapons.',
    effects: {
      attackBonus: { ranged: 2 }
    },
    availableToClasses: ['Fighter', 'Ranger'],
    source: 'XPHB',
    page: 78,
    contentVersion: '2024.1'
  },
  {
    name: 'Defense',
    description: '+1 bonus to AC while wearing armor.',
    detailedText: 'While you are wearing armor, you gain a +1 bonus to AC.',
    effects: {
      acBonus: 1,
      requiresArmor: true
    },
    availableToClasses: ['Fighter', 'Paladin', 'Ranger'],
    source: 'XPHB',
    page: 78,
    contentVersion: '2024.1'
  },
  {
    name: 'Dueling',
    description: '+2 damage bonus when wielding a one-handed melee weapon with no other weapon.',
    detailedText: 'When you are wielding a melee weapon in one hand and no other weapons, you gain a +2 bonus to damage rolls with that weapon.',
    effects: {
      damageBonus: 2,
      requirements: ['one_handed_melee', 'no_other_weapons']
    },
    availableToClasses: ['Fighter', 'Paladin', 'Ranger'],
    source: 'XPHB',
    page: 78,
    contentVersion: '2024.1'
  },
  {
    name: 'Great Weapon Fighting',
    description: 'Reroll 1s and 2s on damage dice with two-handed melee weapons.',
    detailedText: 'When you roll a 1 or 2 on a damage die for an attack you make with a melee weapon that you are wielding with two hands, you can reroll the die and must use the new roll. The weapon must have the two-handed or versatile property for you to gain this benefit.',
    effects: {
      rerollDamage: [1, 2],
      weaponProperties: ['two-handed', 'versatile']
    },
    availableToClasses: ['Fighter', 'Paladin'],
    source: 'XPHB',
    page: 78,
    contentVersion: '2024.1'
  },
  {
    name: 'Protection',
    description: 'Use your reaction to impose disadvantage on an attack against a nearby ally (requires shield).',
    detailedText: 'When a creature you can see attacks a target other than you that is within 5 feet of you, you can use your reaction to impose disadvantage on the attack roll. You must be wielding a shield.',
    effects: {
      reaction: 'impose_disadvantage',
      range: 5,
      requiresShield: true
    },
    availableToClasses: ['Fighter', 'Paladin'],
    source: 'XPHB',
    page: 78,
    contentVersion: '2024.1'
  },
  {
    name: 'Two-Weapon Fighting',
    description: 'Add your ability modifier to damage of your second attack when fighting with two weapons.',
    detailedText: 'When you engage in two-weapon fighting, you can add your ability modifier to the damage of the second attack.',
    effects: {
      addModifierToOffhand: true
    },
    availableToClasses: ['Fighter', 'Ranger'],
    source: 'XPHB',
    page: 78,
    contentVersion: '2024.1'
  }
];

// Divine Orders for Cleric
const DIVINE_ORDERS = [
  {
    name: 'Protector',
    description: 'Trained for battle, you gain proficiency with martial weapons and Heavy Armor.',
    detailedText: 'You have dedicated yourself to protecting others. You gain proficiency with Martial weapons and Heavy Armor.',
    proficienciesGranted: {
      weapons: ['martial'],
      armor: ['heavy']
    },
    featuresGranted: {},
    spellsGranted: [],
    source: 'XPHB',
    page: 54,
    contentVersion: '2024.1'
  },
  {
    name: 'Thaumaturge',
    description: 'Keeper of divine magic, you know one additional cantrip from the Cleric spell list and gain the Blessed Strikes feature at 5th level instead of 8th.',
    detailedText: 'You have dedicated yourself to the mysteries of divine magic. You know one additional cantrip of your choice from the Cleric spell list. In addition, your mystical connection to the divine allows you to gain the Blessed Strikes feature when you reach 5th level in this class, rather than 8th level.',
    proficienciesGranted: {},
    featuresGranted: {
      additionalCantrip: 1,
      blessedStrikesEarly: true
    },
    spellsGranted: [],
    source: 'XPHB',
    page: 54,
    contentVersion: '2024.1'
  }
];

// Level 1 Eldritch Invocations for Warlock
const ELDRITCH_INVOCATIONS = [
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
    page: 113,
    contentVersion: '2024.1'
  },
  {
    name: 'Beast Speech',
    description: 'You can cast Speak with Animals at will, without expending a spell slot.',
    detailedText: 'You can cast speak with animals at will, without expending a spell slot.',
    prerequisites: {},
    effects: {
      spellsAtWill: ['speak with animals']
    },
    spellsGranted: ['speak with animals'],
    atWillSpells: ['speak with animals'],
    levelRequirement: 1,
    source: 'XPHB',
    page: 113,
    contentVersion: '2024.1'
  },
  {
    name: 'Devil\'s Sight',
    description: 'You can see normally in darkness, both magical and nonmagical, to a distance of 120 feet.',
    detailedText: 'You can see normally in darkness, both magical and nonmagical, to a distance of 120 feet.',
    prerequisites: {},
    effects: {
      darkvision: 120,
      seesMagicalDarkness: true
    },
    spellsGranted: [],
    atWillSpells: [],
    levelRequirement: 1,
    source: 'XPHB',
    page: 113,
    contentVersion: '2024.1'
  },
  {
    name: 'Eldritch Sight',
    description: 'You can cast Detect Magic at will, without expending a spell slot.',
    detailedText: 'You can cast detect magic at will, without expending a spell slot.',
    prerequisites: {},
    effects: {
      spellsAtWill: ['detect magic']
    },
    spellsGranted: ['detect magic'],
    atWillSpells: ['detect magic'],
    levelRequirement: 1,
    source: 'XPHB',
    page: 113,
    contentVersion: '2024.1'
  },
  {
    name: 'Fiendish Vigor',
    description: 'You can cast False Life on yourself at will as a 1st-level spell, without expending a spell slot.',
    detailedText: 'You can cast false life on yourself at will as a 1st-level spell, without expending a spell slot.',
    prerequisites: {},
    effects: {
      spellsAtWill: ['false life'],
      selfOnly: true,
      spellLevel: 1
    },
    spellsGranted: ['false life'],
    atWillSpells: ['false life'],
    levelRequirement: 1,
    source: 'XPHB',
    page: 113,
    contentVersion: '2024.1'
  },
  {
    name: 'Mask of Many Faces',
    description: 'You can cast Disguise Self at will, without expending a spell slot.',
    detailedText: 'You can cast disguise self at will, without expending a spell slot.',
    prerequisites: {},
    effects: {
      spellsAtWill: ['disguise self']
    },
    spellsGranted: ['disguise self'],
    atWillSpells: ['disguise self'],
    levelRequirement: 1,
    source: 'XPHB',
    page: 113,
    contentVersion: '2024.1'
  }
];

async function main() {
  console.log('🏗️  Importing D&D 2024 Class Choice Data...');

  try {
    // Import Fighting Styles
    console.log('📚 Importing Fighting Styles...');
    for (const style of FIGHTING_STYLES) {
      await prisma.fightingStyle.upsert({
        where: { name: style.name },
        update: style,
        create: style
      });
    }
    console.log(`✅ Imported ${FIGHTING_STYLES.length} Fighting Styles`);

    // Import Divine Orders
    console.log('⚔️  Importing Divine Orders...');
    for (const order of DIVINE_ORDERS) {
      await prisma.divineOrder.upsert({
        where: { name: order.name },
        update: order,
        create: order
      });
    }
    console.log(`✅ Imported ${DIVINE_ORDERS.length} Divine Orders`);

    // Import Eldritch Invocations
    console.log('🔮 Importing Eldritch Invocations...');
    for (const invocation of ELDRITCH_INVOCATIONS) {
      await prisma.eldritchInvocation.upsert({
        where: { name: invocation.name },
        update: invocation,
        create: invocation
      });
    }
    console.log(`✅ Imported ${ELDRITCH_INVOCATIONS.length} Eldritch Invocations`);

    // Create Class Feature Choices
    console.log('🎯 Creating Class Feature Choices...');

    // Fighter Fighting Style Choice
    const fighterClass = await prisma.class.findFirst({ where: { name: 'Fighter' } });
    if (fighterClass) {
      await prisma.classFeatureChoice.upsert({
        where: {
          classId_featureName: {
            classId: fighterClass.id,
            featureName: 'Fighting Style'
          }
        },
        update: {},
        create: {
          classId: fighterClass.id,
          featureName: 'Fighting Style',
          choiceLevel: 1,
          choiceType: 'single',
          maxSelections: 1,
          description: 'Choose a fighting style to specialize in.',
          prerequisites: {},
          source: 'XPHB',
          contentVersion: '2024.1'
        }
      });
    }

    // Cleric Divine Order Choice
    const clericClass = await prisma.class.findFirst({ where: { name: 'Cleric' } });
    if (clericClass) {
      await prisma.classFeatureChoice.upsert({
        where: {
          classId_featureName: {
            classId: clericClass.id,
            featureName: 'Divine Order'
          }
        },
        update: {},
        create: {
          classId: clericClass.id,
          featureName: 'Divine Order',
          choiceLevel: 1,
          choiceType: 'single',
          maxSelections: 1,
          description: 'Choose your sacred role of service.',
          prerequisites: {},
          source: 'XPHB',
          contentVersion: '2024.1'
        }
      });
    }

    // Warlock Eldritch Invocations Choice
    const warlockClass = await prisma.class.findFirst({ where: { name: 'Warlock' } });
    if (warlockClass) {
      await prisma.classFeatureChoice.upsert({
        where: {
          classId_featureName: {
            classId: warlockClass.id,
            featureName: 'Eldritch Invocations'
          }
        },
        update: {},
        create: {
          classId: warlockClass.id,
          featureName: 'Eldritch Invocations',
          choiceLevel: 1,
          choiceType: 'multiple',
          maxSelections: 1,
          description: 'Choose eldritch invocations that imbue you with abiding magical abilities.',
          prerequisites: {},
          source: 'XPHB',
          contentVersion: '2024.1'
        }
      });
    }

    console.log('✅ Created Class Feature Choices');

    console.log('🎉 D&D 2024 Class Choice Data import completed successfully!');

  } catch (error) {
    console.error('❌ Error importing class choice data:', error);
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