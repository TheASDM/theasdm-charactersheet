const fs = require('fs');
const path = require('path');

/**
 * Fix the architectural issue: Remove manually-added choice features and replace
 * with proper external reference system for:
 * - Fighting Styles (Fighter, Paladin, Ranger) -> external feat system
 * - Eldritch Invocations (Warlock) -> external invocations file
 * - Expertise (Rogue) -> skill selection system
 */

const PROCESSED_DIR = path.join(__dirname, '../processed-data');

// Classes that need fixing
const CLASSES_TO_FIX = {
  Fighter: {
    removeChoiceGroups: ['fighting-style-1'],
    addExternalChoice: {
      id: 'fighting-style-1',
      name: 'Fighting Style',
      level: 1,
      source: 'XPHB',
      page: 123,
      featureType: 'base',
      description: 'You gain a Fighting Style feat of your choice (see chapter 5). Instead of choosing one of those feats, you can choose the option below.\n\nBlind Fighting: You have Blindsight with a range of 10 feet.',
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
      choiceType: 'external-feat',
      externalReference: {
        type: 'feat',
        category: 'Fighting Style',
        count: 1,
        allowCustomOption: true,
        customOption: {
          id: 'blind-fighting',
          name: 'Blind Fighting',
          description: 'You have Blindsight with a range of 10 feet.'
        }
      },
      prerequisites: [],
      scales: false,
      scalingProgression: []
    }
  },
  Paladin: {
    removeChoiceGroups: ['fighting-style-2'],
    addExternalChoice: {
      id: 'fighting-style-2',
      name: 'Fighting Style',
      level: 2,
      source: 'XPHB',
      page: 130,
      featureType: 'base',
      description: 'You gain a Fighting Style feat of your choice (see chapter 5).',
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
      choiceType: 'external-feat',
      externalReference: {
        type: 'feat',
        category: 'Fighting Style',
        count: 1
      },
      prerequisites: [],
      scales: false,
      scalingProgression: []
    }
  },
  Ranger: {
    removeChoiceGroups: ['fighting-style-2'],
    addExternalChoice: {
      id: 'fighting-style-2',
      name: 'Fighting Style',
      level: 2,
      source: 'XPHB',
      page: 135,
      featureType: 'base',
      description: 'You gain a Fighting Style feat of your choice (see chapter 5). Instead of choosing one of those feats, you can choose the option below.\n\nDruidic Warrior: You learn two Druid cantrips of your choice. Wisdom is your spellcasting ability for these spells.',
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
      choiceType: 'external-feat',
      externalReference: {
        type: 'feat',
        category: 'Fighting Style',
        count: 1,
        allowCustomOption: true,
        customOption: {
          id: 'druidic-warrior',
          name: 'Druidic Warrior',
          description: 'You learn two Druid cantrips of your choice. Wisdom is your spellcasting ability for these spells.'
        }
      },
      prerequisites: [],
      scales: false,
      scalingProgression: []
    }
  },
  Warlock: {
    removeChoiceGroups: ['eldritch-invocations-1'],
    addExternalChoice: {
      id: 'eldritch-invocations-1',
      name: 'Eldritch Invocations',
      level: 1,
      source: 'XPHB',
      page: 153,
      featureType: 'base',
      description: 'You have unearthed Eldritch Invocations, pieces of forbidden knowledge that imbue you with an abiding magical ability or other lessons. You gain one invocation of your choice, such as Pact of the Tome. Invocations are described in the "Eldritch Invocation Options" section later in this class\'s description. Prerequisites: If an invocation has a prerequisite, you must meet it to learn that invocation. For example, if an invocation requires you to be a level 5+ Warlock, you can select the invocation once you reach Warlock level 5. Replacing and Gaining Invocations: Whenever you gain a Warlock level, you can replace one of your invocations with another one for which you qualify. You can\'t replace an invocation if it\'s a prerequisite for another invocation that you have. When you gain certain Warlock levels, you gain more invocations of your choice, as shown in the Invocations column of the Warlock Features table. You can\'t pick the same invocation more than once unless its description says otherwise.',
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
        scales: true,
        invocations: 1
      },
      isChoice: true,
      requiresSelection: true,
      choiceType: 'external-invocations',
      externalReference: {
        type: 'invocations',
        dataFile: 'EldritchInvocations.json',
        count: 1,
        filterByPrerequisites: true
      },
      prerequisites: [],
      scales: true,
      scalingProgression: [
        { level: 2, changes: { invocations: 3 } },
        { level: 5, changes: { invocations: 5 } },
        { level: 7, changes: { invocations: 6 } },
        { level: 9, changes: { invocations: 7 } },
        { level: 12, changes: { invocations: 8 } },
        { level: 15, changes: { invocations: 9 } },
        { level: 18, changes: { invocations: 10 } }
      ]
    }
  },
  Rogue: {
    removeChoiceGroups: ['expertise-1'],
    addExternalChoice: {
      id: 'expertise-1',
      name: 'Expertise',
      level: 1,
      source: 'XPHB',
      page: 139,
      featureType: 'base',
      description: 'You gain Expertise in two of your skill proficiencies of your choice. Sleight of Hand and Stealth are recommended if you have proficiency in them.\n\nExpertise means your Proficiency Bonus is doubled for any ability check using a skill in which you have Expertise.',
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
      choiceType: 'external-skills',
      externalReference: {
        type: 'skills',
        count: 2,
        source: 'proficient-skills',
        applyExpertise: true
      },
      prerequisites: [],
      scales: false,
      scalingProgression: []
    }
  }
};

function fixClass(className, config) {
  const filePath = path.join(PROCESSED_DIR, `${className}.json`);

  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  ${className}.json not found, skipping...`);
    return;
  }

  console.log(`\nProcessing ${className}...`);
  const classData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Remove all manually-added choice features
  const originalCount = classData.features.length;
  classData.features = classData.features.filter(feature => {
    if (config.removeChoiceGroups.includes(feature.choiceGroup)) {
      console.log(`  ✗ Removing: ${feature.name} (${feature.id})`);
      return false;
    }
    return true;
  });

  const removedCount = originalCount - classData.features.length;
  console.log(`  Removed ${removedCount} manually-added features`);

  // Add the external reference feature
  console.log(`  ✓ Adding external reference: ${config.addExternalChoice.name}`);
  classData.features.push(config.addExternalChoice);

  // Sort features by level, then by name
  classData.features.sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    return a.name.localeCompare(b.name);
  });

  // Write back
  fs.writeFileSync(filePath, JSON.stringify(classData, null, 2));
  console.log(`  ✅ ${className}.json updated`);
}

function main() {
  console.log('🔧 Fixing external reference architecture...\n');
  console.log('This will:');
  console.log('  1. Remove manually-added choice features (Fighting Styles, Invocations, etc.)');
  console.log('  2. Replace with proper external reference system');
  console.log('  3. Update choiceType to indicate external data sources\n');

  for (const [className, config] of Object.entries(CLASSES_TO_FIX)) {
    fixClass(className, config);
  }

  console.log('\n✅ All classes updated with external reference system!');
  console.log('\nNext steps:');
  console.log('  1. Update choice detection to handle external references');
  console.log('  2. Update UI to load external data files');
  console.log('  3. Sync to frontend/public/processed-data/');
}

main();
