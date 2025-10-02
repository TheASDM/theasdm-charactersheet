const fs = require('fs');
const path = require('path');

/**
 * Update Warlock with ALL Level 1 Invocations
 */

function generateId(...parts) {
  return parts
    .map((p) => String(p).toLowerCase())
    .join('-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ALL Level 1 Eldritch Invocations (no prerequisites or only require other invocations)
const LEVEL_1_INVOCATIONS = [
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
  },
  {
    name: 'Armor of Shadows',
    description: 'You can cast {@spell Mage Armor|XPHB} on yourself without expending a spell slot.'
  },
  {
    name: "Devil's Sight",
    description: 'You can see normally in Dim Light and Darkness—both magical and nonmagical—within 120 feet of yourself.'
  },
  {
    name: 'Eldritch Mind',
    description: 'You have Advantage on Constitution saving throws that you make to maintain Concentration.'
  },
  {
    name: 'Fiendish Vigor',
    description: 'You can cast {@spell False Life|XPHB} on yourself without expending a spell slot. When you cast the spell with this feature, you don\'t roll the die for the Temporary Hit Points; you automatically get the highest number on the die.'
  },
  {
    name: 'Gaze of Two Minds',
    description: 'You can use a Bonus Action to touch a willing creature and perceive through its senses until the end of your next turn. As long as the creature is on the same plane of existence as you, you can use a Bonus Action on subsequent turns to maintain this connection, extending the duration until the end of your next turn. The connection ends if you don\'t maintain it in this way. While perceiving through the other creature\'s senses, you benefit from any special senses possessed by that creature, and you can cast spells as if you were in your space or the other creature\'s space if the two of you are within 60 feet of each other.'
  },
  {
    name: 'Mask of Many Faces',
    description: 'You can cast {@spell Disguise Self|XPHB} without expending a spell slot.'
  },
  {
    name: 'Misty Visions',
    description: 'You can cast {@spell Silent Image|XPHB} without expending a spell slot.'
  }
];

const filePath = path.join(__dirname, '../processed-data/Warlock.json');
const classData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log('🔧 Updating Warlock Eldritch Invocations...\n');

const choiceGroup = generateId('eldritch-invocations', 1);

// Remove old invocation options
classData.features = classData.features.filter(
  f => f.choiceGroup !== choiceGroup
);

console.log('  ✓ Removed old invocation options');

// Add all level 1 invocations
const addedOptions = [];
for (const invocation of LEVEL_1_INVOCATIONS) {
  const optionId = generateId('eldritch-invocation', invocation.name, 1);

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
console.log(`  ✅ Added ${addedOptions.length} Eldritch Invocation options:`);
addedOptions.forEach(name => console.log(`     - ${name}`));
console.log('\n✨ Done!');
