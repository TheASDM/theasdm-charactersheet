import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create initial content version
  const contentVersion = await prisma.contentVersion.upsert({
    where: { version: '1.0.0' },
    update: {},
    create: {
      version: '1.0.0',
      releaseDate: new Date(),
      description: 'Initial D&D 2024 content with basic rules',
      breakingChanges: false,
    },
  });

  console.log('✅ Created content version:', contentVersion.version);

  // Create sample classes
  const classes = [
    {
      name: 'Fighter',
      hitDie: 10,
      primaryAbility: ['Strength', 'Dexterity'],
      proficiencies: {
        armor: ['light', 'medium', 'heavy', 'shields'],
        weapons: ['simple', 'martial'],
        savingThrows: ['Strength', 'Constitution'],
      },
      classFeatures: {
        1: { 'Second Wind': 'Regain 1d10 + fighter level hit points' },
        2: { 'Action Surge': 'Take an additional action on your turn' },
      },
      contentVersion: '1.0.0',
    },
    {
      name: 'Wizard',
      hitDie: 6,
      primaryAbility: ['Intelligence'],
      proficiencies: {
        weapons: [
          'daggers',
          'darts',
          'slings',
          'quarterstaffs',
          'light crossbows',
        ],
        savingThrows: ['Intelligence', 'Wisdom'],
      },
      classFeatures: {
        1: { 'Arcane Recovery': 'Recover spell slots on short rest' },
        2: { 'Ritual Casting': 'Cast spells as rituals' },
      },
      spellCasting: {
        type: 'full',
        ability: 'Intelligence',
        ritualCasting: true,
      },
      contentVersion: '1.0.0',
    },
  ];

  for (const classData of classes) {
    const createdClass = await prisma.class.upsert({
      where: { name: classData.name },
      update: {},
      create: classData,
    });
    console.log(`✅ Created class: ${createdClass.name}`);
  }

  // Create sample races
  const races = [
    {
      name: 'Human',
      size: 'Medium',
      speed: 30,
      traits: {
        'Extra Language': 'Learn one additional language',
        'Extra Skill': 'Gain proficiency in one skill',
      },
      abilityScoreIncrease: {
        choice: '+2 to one ability, +1 to another',
      },
      languages: ['Common', 'choice'],
      contentVersion: '1.0.0',
    },
    {
      name: 'Elf',
      size: 'Medium',
      speed: 30,
      traits: {
        Darkvision: '60 feet',
        'Fey Ancestry': 'Advantage on saves against charm',
        Trance: '4 hours of rest instead of 8',
      },
      abilityScoreIncrease: {
        Dexterity: 2,
      },
      languages: ['Common', 'Elvish'],
      proficiencies: {
        Perception: true,
      },
      contentVersion: '1.0.0',
    },
  ];

  for (const raceData of races) {
    const createdRace = await prisma.species.upsert({
      where: { name: raceData.name },
      update: {},
      create: raceData,
    });
    console.log(`✅ Created race: ${createdRace.name}`);
  }

  // Create sample spells
  const spells = [
    {
      name: 'Magic Missile',
      level: 1,
      school: 'Evocation',
      castingTime: '1 action',
      rangeText: '120 feet',
      duration: 'Instantaneous',
      components: { V: true, S: true },
      description:
        'You create three glowing darts of magical force. Each dart hits a creature of your choice that you can see within range.',
      classes: ['Wizard', 'Sorcerer'],
      sourceBook: "Player's Handbook 2024",
      contentVersion: '1.0.0',
    },
    {
      name: 'Cure Wounds',
      level: 1,
      school: 'Evocation',
      castingTime: '1 action',
      rangeText: 'Touch',
      duration: 'Instantaneous',
      components: { V: true, S: true },
      description:
        'A creature you touch regains a number of hit points equal to 1d8 + your spellcasting ability modifier.',
      classes: ['Cleric', 'Druid', 'Paladin', 'Ranger'],
      sourceBook: "Player's Handbook 2024",
      contentVersion: '1.0.0',
    },
  ];

  for (const spellData of spells) {
    const createdSpell = await prisma.spell.upsert({
      where: { name: spellData.name },
      update: {},
      create: spellData,
    });
    console.log(`✅ Created spell: ${createdSpell.name}`);
  }

  console.log('🌱 Database seeding completed!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
