const fs = require('fs');
const path = require('path');

/**
 * Fix Class Choice Detection
 *
 * This script fixes choice features that weren't properly detected.
 * It marks parent features as choices and ensures child options have the right structure.
 */

const CHOICE_FEATURES = {
  // Class name -> Feature name at level X
  'Fighter': {
    'Fighting Style': 1
  },
  'Warlock': {
    'Eldritch Invocations': 1
  },
  'Paladin': {
    'Fighting Style': 2
  },
  'Ranger': {
    'Fighting Style': 2,
    'Favored Enemy': 1
  },
  'Druid': {
    'Primal Order': 1
  },
  'Cleric': {
    'Divine Order': 1,
    'Blessed Strikes': 7
  },
  'Rogue': {
    'Expertise': 1,
    'Cunning Strike': 5
  },
  'Bard': {
    'Bardic Inspiration': 1
  }
};

function generateId(...parts) {
  return parts
    .map((p) => String(p).toLowerCase())
    .join('-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function fixClassChoices(classFileName) {
  const filePath = path.join(__dirname, '../frontend/public/processed-data', classFileName);

  if (!fs.existsSync(filePath)) {
    console.log(`  ❌ File not found: ${classFileName}`);
    return;
  }

  const classData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const className = classData.className;

  console.log(`\n📝 Processing ${className}...`);

  const choicesToFix = CHOICE_FEATURES[className] || {};
  let changesMade = 0;

  for (const [featureName, level] of Object.entries(choicesToFix)) {
    console.log(`  🔍 Looking for "${featureName}" at level ${level}...`);

    // Find the parent feature
    const parentFeature = classData.features.find(
      f => f.name === featureName && f.level === level && f.featureType === 'base'
    );

    if (!parentFeature) {
      console.log(`    ❌ Parent feature not found: ${featureName}`);
      continue;
    }

    // Find child option features (they have the parent name in their name)
    const choiceOptions = classData.features.filter(
      f => f.name.startsWith(`${featureName}:`) && f.level === level
    );

    if (choiceOptions.length === 0) {
      console.log(`    ❌ No choice options found for ${featureName}`);
      continue;
    }

    console.log(`    ✓ Found ${choiceOptions.length} choice options`);

    const choiceGroup = generateId(featureName, level);

    // Mark each option as a choice with the choiceGroup
    for (const option of choiceOptions) {
      option.isChoice = true;
      option.requiresSelection = true;
      option.choiceGroup = choiceGroup;
      changesMade++;
    }

    // Remove the parent feature (it's redundant - the description is in the options)
    // OR mark it as requiring a choice
    const parentIndex = classData.features.indexOf(parentFeature);
    if (parentIndex > -1) {
      // Option 1: Remove parent entirely
      // classData.features.splice(parentIndex, 1);

      // Option 2: Mark parent as a choice container
      parentFeature.isChoice = false;
      parentFeature.requiresSelection = false;
      // Add reference to the choice group
      parentFeature.choiceGroup = choiceGroup;
      parentFeature.description += `\n\n**Choose one of the following options:**`;
    }

    console.log(`    ✓ Fixed ${choiceOptions.length} options for ${featureName}`);
  }

  if (changesMade > 0) {
    fs.writeFileSync(filePath, JSON.stringify(classData, null, 2));
    console.log(`  ✅ Saved ${changesMade} changes to ${classFileName}`);
  } else {
    console.log(`  ℹ️  No changes needed for ${classFileName}`);
  }
}

// Process all class files
const classFiles = [
  'Barbarian.json',
  'Bard.json',
  'Cleric.json',
  'Druid.json',
  'Fighter.json',
  'Monk.json',
  'Paladin.json',
  'Ranger.json',
  'Rogue.json',
  'Sorcerer.json',
  'Warlock.json',
  'Wizard.json'
];

console.log('🔧 Fixing Class Choice Detection...\n');

for (const classFile of classFiles) {
  fixClassChoices(classFile);
}

console.log('\n✨ Done!');
