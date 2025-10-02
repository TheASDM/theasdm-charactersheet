const fs = require('fs');
const path = require('path');

/**
 * Add Manual Choice Options
 *
 * Adds choice options for features that reference feats (Fighting Styles, Eldritch Invocations)
 * These aren't in the class feature data, so we add them manually
 */

function generateId(...parts) {
  return parts
    .map((p) => String(p).toLowerCase())
    .join('-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Fighting Style options (for Fighter, Paladin, Ranger)
const FIGHTING_STYLES = [
  {
    name: 'Archery',
    description: 'You gain a +2 bonus to attack rolls you make with Ranged weapons.'
  },
  {
    name: 'Blind Fighting',
    description: 'You have Blindsight with a range of 10 feet.'
  },
  {
    name: 'Defense',
    description: 'While you are wearing armor, you gain a +1 bonus to Armor Class.'
  },
  {
    name: 'Dueling',
    description: 'When you are wielding a melee weapon in one hand and no other weapons, you gain a +2 bonus to damage rolls with that weapon.'
  },
  {
    name: 'Great Weapon Fighting',
    description: 'When you roll a 1 or 2 on a damage die for an attack you make with a melee weapon that you are wielding with two hands, you can reroll the die and must use the new roll. The weapon must have the Two-Handed or Versatile property for you to gain this benefit.'
  },
  {
    name: 'Interception',
    description: 'When a creature you can see hits a target, other than you, within 5 feet of you with an attack, you can use your reaction to reduce the damage the target takes by 1d10 + your proficiency bonus (to a minimum of 0 damage). You must be wielding a shield or a simple or martial weapon to use this reaction.'
  },
  {
    name: 'Protection',
    description: 'When a creature you can see attacks a target other than you that is within 5 feet of you, you can use your reaction to impose disadvantage on the attack roll. You must be wielding a shield.'
  },
  {
    name: 'Thrown Weapon Fighting',
    description: 'When you hit with a ranged attack using a thrown weapon, you gain a +2 bonus to the damage roll.'
  },
  {
    name: 'Two-Weapon Fighting',
    description: 'When you make the extra attack of the Light property, you can add your ability modifier to the damage of the extra attack.'
  },
  {
    name: 'Unarmed Fighting',
    description: 'Your unarmed strikes can deal bludgeoning damage equal to 1d6 + your Strength modifier on a hit. If you aren\'t wielding any weapons or a shield when you make the attack roll, the d6 becomes a d8. At the start of each of your turns, you can deal 1d4 bludgeoning damage to one creature grappled by you.'
  }
];

// Eldritch Invocations for Warlock (level 1 only)
const ELDRITCH_INVOCATIONS_L1 = [
  {
    name: 'Pact of the Blade',
    description: 'As a Bonus Action, you can conjure a pact weapon in your hand—a Simple or Martial Melee weapon of your choice with which you bond. Until the bond ends, you have proficiency with the weapon, and you can use it as a Spellcasting Focus. Whenever you attack with the bonded weapon, you can use your Charisma modifier for the attack and damage rolls instead of using Strength or Dexterity; and you can cause the weapon to deal Necrotic, Psychic, or Radiant damage or its normal damage type. Your bond with the weapon ends if you use this feature\'s Bonus Action again, if the weapon is more than 5 feet away from you for 1 minute or more, or if you die. A conjured weapon disappears when the bond ends.'
  },
  {
    name: 'Pact of the Chain',
    description: 'You learn the {@spell Find Familiar|XPHB} spell and can cast it as a Ritual without using a spell slot. When you cast the spell, you choose one of the normal forms for your familiar or one of the following special forms: {@creature Imp|XPHB}, {@creature Pseudodragon|XPHB}, {@creature Quasit|XPHB}, or {@creature Sprite|XPHB}. Additionally, when you take the Attack action, you can forgo one of your own attacks to allow your familiar to make one attack of its own with its reaction.'
  },
  {
    name: 'Pact of the Tome',
    description: 'Stitching together strands of shadow, you conjure forth a book in your hand at the end of a Short Rest or Long Rest. This Book of Shadows contains eldritch magic of your choice. Choose three cantrips from any class\'s spell list, and the cantrips are in the book and count as Warlock spells for you. While the book is on your person, you can cast those cantrips at will. If you lose the book, you can perform a 1-hour ceremony to receive a replacement from your patron, and this ceremony can be performed during a Short Rest or Long Rest. The book turns to ash when you die.'
  }
];

// Rogue Expertise options
const EXPERTISE_OPTIONS = [
  { name: 'Acrobatics', description: 'Double your proficiency bonus for Acrobatics checks.' },
  { name: 'Athletics', description: 'Double your proficiency bonus for Athletics checks.' },
  { name: 'Deception', description: 'Double your proficiency bonus for Deception checks.' },
  { name: 'Insight', description: 'Double your proficiency bonus for Insight checks.' },
  { name: 'Intimidation', description: 'Double your proficiency bonus for Intimidation checks.' },
  { name: 'Investigation', description: 'Double your proficiency bonus for Investigation checks.' },
  { name: 'Perception', description: 'Double your proficiency bonus for Perception checks.' },
  { name: 'Persuasion', description: 'Double your proficiency bonus for Persuasion checks.' },
  { name: 'Sleight of Hand', description: 'Double your proficiency bonus for Sleight of Hand checks.' },
  { name: 'Stealth', description: 'Double your proficiency bonus for Stealth checks.' },
  { name: "Thieves' Tools", description: "Double your proficiency bonus for checks using Thieves' Tools." }
];

function addFightingStyleChoices(classFileName, level = 1) {
  const filePath = path.join(__dirname, '../processed-data', classFileName);
  const classData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const className = classData.className;

  console.log(`\n📝 Adding Fighting Style choices to ${className} (level ${level})...`);

  // Find the Fighting Style parent feature
  const parentFeature = classData.features.find(
    f => f.name === 'Fighting Style' && f.level === level
  );

  if (!parentFeature) {
    console.log(`  ❌ Fighting Style feature not found at level ${level}`);
    return;
  }

  const choiceGroup = generateId('fighting-style', level);

  // Add choice options
  const addedOptions = [];
  for (const style of FIGHTING_STYLES) {
    const optionId = generateId('fighting-style', style.name, level);

    // Check if already exists
    if (classData.features.find(f => f.id === optionId)) {
      continue;
    }

    classData.features.push({
      id: optionId,
      name: `Fighting Style: ${style.name}`,
      choiceGroup: choiceGroup,
      level: level,
      source: 'XPHB',
      page: parentFeature.page,
      featureType: 'base',
      description: style.description,
      mechanics: {
        diceRolls: [],
        damageTypes: [],
        abilities: [],
        actionType: null,
        range: null,
        duration: null,
        savingThrow: null,
        proficiencies: [],
        spellsGranted: [],
        scales: false
      },
      isChoice: true,
      requiresSelection: true,
      prerequisites: [],
      scales: false,
      scalingProgression: []
    });
    addedOptions.push(style.name);
  }

  fs.writeFileSync(filePath, JSON.stringify(classData, null, 2));
  console.log(`  ✅ Added ${addedOptions.length} Fighting Style options`);
}

function addEldritchInvocations() {
  const filePath = path.join(__dirname, '../processed-data/Warlock.json');
  const classData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  console.log(`\n📝 Adding Eldritch Invocations to Warlock...`);

  const parentFeature = classData.features.find(
    f => f.name === 'Eldritch Invocations' && f.level === 1
  );

  if (!parentFeature) {
    console.log(`  ❌ Eldritch Invocations feature not found`);
    return;
  }

  const choiceGroup = generateId('eldritch-invocations', 1);

  const addedOptions = [];
  for (const invocation of ELDRITCH_INVOCATIONS_L1) {
    const optionId = generateId('eldritch-invocation', invocation.name, 1);

    if (classData.features.find(f => f.id === optionId)) {
      continue;
    }

    classData.features.push({
      id: optionId,
      name: invocation.name,
      choiceGroup: choiceGroup,
      level: 1,
      source: 'XPHB',
      page: 153,
      featureType: 'base',
      description: invocation.description,
      mechanics: {
        diceRolls: [],
        damageTypes: [],
        abilities: [],
        actionType: null,
        range: null,
        duration: null,
        savingThrow: null,
        proficiencies: [],
        spellsGranted: [],
        scales: false
      },
      isChoice: true,
      requiresSelection: true,
      prerequisites: [],
      scales: false,
      scalingProgression: []
    });
    addedOptions.push(invocation.name);
  }

  fs.writeFileSync(filePath, JSON.stringify(classData, null, 2));
  console.log(`  ✅ Added ${addedOptions.length} Eldritch Invocation options`);
}

function addRogueExpertise() {
  const filePath = path.join(__dirname, '../processed-data/Rogue.json');
  const classData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  console.log(`\n📝 Adding Expertise choices to Rogue...`);

  const parentFeature = classData.features.find(
    f => f.name === 'Expertise' && f.level === 1
  );

  if (!parentFeature) {
    console.log(`  ❌ Expertise feature not found`);
    return;
  }

  const choiceGroup = generateId('expertise', 1);

  const addedOptions = [];
  for (const option of EXPERTISE_OPTIONS) {
    const optionId = generateId('expertise', option.name, 1);

    if (classData.features.find(f => f.id === optionId)) {
      continue;
    }

    classData.features.push({
      id: optionId,
      name: `Expertise: ${option.name}`,
      choiceGroup: choiceGroup,
      level: 1,
      source: 'XPHB',
      page: 114,
      featureType: 'base',
      description: option.description,
      mechanics: {
        diceRolls: [],
        damageTypes: [],
        abilities: [],
        actionType: null,
        range: null,
        duration: null,
        savingThrow: null,
        proficiencies: [],
        spellsGranted: [],
        scales: false
      },
      isChoice: true,
      requiresSelection: true,
      prerequisites: [],
      scales: false,
      scalingProgression: []
    });
    addedOptions.push(option.name);
  }

  fs.writeFileSync(filePath, JSON.stringify(classData, null, 2));
  console.log(`  ✅ Added ${addedOptions.length} Expertise options`);
}

// Run all additions
console.log('🔧 Adding Manual Choice Options...');

addFightingStyleChoices('Fighter.json', 1);
addFightingStyleChoices('Paladin.json', 2);
addFightingStyleChoices('Ranger.json', 2);
addEldritchInvocations();
addRogueExpertise();

console.log('\n✨ Done!');
