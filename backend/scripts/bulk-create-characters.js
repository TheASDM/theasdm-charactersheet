#!/usr/bin/env node

/**
 * Bulk Character Creator
 *
 * Creates multiple random characters for testing
 * Usage: node bulk-create-characters.js <userId> <type>
 *   type: "classes" or "species"
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CLASSES = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'];
const SPECIES = ['Dragonborn', 'Dwarf', 'Elf', 'Gnome', 'Half-Orc', 'Halfling', 'Human', 'Tiefling', 'Goliath', 'Aasimar'];

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAbilityScores() {
  // Standard array: 15, 14, 13, 12, 10, 8
  const scores = [15, 14, 13, 12, 10, 8];
  // Shuffle
  for (let i = scores.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [scores[i], scores[j]] = [scores[j], scores[i]];
  }
  return {
    strength: scores[0],
    dexterity: scores[1],
    constitution: scores[2],
    intelligence: scores[3],
    wisdom: scores[4],
    charisma: scores[5]
  };
}

async function createCharacter(userId, className, speciesName) {
  const abilities = randomAbilityScores();

  // Get background
  const backgrounds = await prisma.background.findMany();
  const background = randomElement(backgrounds);

  const characterName = `${randomElement(['Aric', 'Bran', 'Cara', 'Dain', 'Elara', 'Finn', 'Gwen', 'Hal', 'Isla', 'Jon'])} ${randomElement(['Stormborn', 'Ironforge', 'Swiftwind', 'Brightblade', 'Shadowstep', 'Fireforge', 'Moonwhisper', 'Stoneheart', 'Starseeker', 'Wildrunner'])}`;

  const characterData = {
    name: characterName,
    class: className,
    species: speciesName,
    background: background.name,
    level: 1,
    alignment: randomElement(['Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'True Neutral', 'Chaotic Neutral']),
    experiencePoints: 0,
    abilityScores: abilities,
    proficiencyBonus: 2,
    hitPoints: {
      max: 10,
      current: 10,
      temporary: 0
    },
    armorClass: 10,
    initiative: Math.floor((abilities.dexterity - 10) / 2),
    speed: 30,
    hitDice: { max: 1, current: 1 },
    deathSaves: { successes: 0, failures: 0 },
    skills: {},
    savingThrows: {},
    proficiencies: {
      armor: [],
      weapons: [],
      tools: [],
      languages: []
    }
  };

  const character = await prisma.character.create({
    data: {
      userId: userId,
      name: characterName,
      level: 1,
      characterData: characterData
    }
  });

  console.log(`✅ Created: ${characterName} (${className} ${speciesName})`);
  return character;
}

async function bulkCreateByClass(userId) {
  console.log('🎲 Creating one character for each class...\n');

  const speciesList = await prisma.species.findMany();

  for (const className of CLASSES) {
    const species = randomElement(speciesList);
    await createCharacter(userId, className, species.name);
  }

  console.log(`\n✨ Created ${CLASSES.length} characters!`);
}

async function bulkCreateBySpecies(userId) {
  console.log('🎲 Creating one character for each species...\n');

  const speciesList = await prisma.species.findMany();

  for (const speciesData of speciesList) {
    const className = randomElement(CLASSES);
    await createCharacter(userId, className, speciesData.name);
  }

  console.log(`\n✨ Created ${speciesList.length} characters!`);
}

async function main() {
  const args = process.argv.slice(2);
  const userId = parseInt(args[0]);
  const type = args[1];

  if (!userId || !type) {
    console.log('Usage: node bulk-create-characters.js <userId> <type>');
    console.log('  type: "classes" or "species"');
    process.exit(1);
  }

  if (type === 'classes') {
    await bulkCreateByClass(userId);
  } else if (type === 'species') {
    await bulkCreateBySpecies(userId);
  } else {
    console.log('Invalid type. Use "classes" or "species"');
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
