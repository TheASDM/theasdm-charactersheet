const fs = require('fs');
const path = require('path');

/**
 * Fix Warlock.json to only include level 1 invocations (no prerequisites)
 *
 * Based on corrected EldritchInvocations.json, only these 5 are available at level 1:
 * 1. Pact of the Blade
 * 2. Pact of the Chain
 * 3. Pact of the Tome
 * 4. Armor of Shadows
 * 5. Eldritch Mind
 */

const WARLOCK_FILE = path.join(__dirname, '../processed-data/Warlock.json');

// IDs of invocations that should be removed (they require Level 2+)
const INVOCATIONS_TO_REMOVE = [
  'eldritch-invocation-devil-s-sight-1',
  'eldritch-invocation-fiendish-vigor-1',
  'eldritch-invocation-gaze-of-two-minds-1',
  'eldritch-invocation-mask-of-many-faces-1',
  'eldritch-invocation-misty-visions-1'
];

function fixWarlockInvocations() {
  console.log('Reading Warlock.json...');
  const warlockData = JSON.parse(fs.readFileSync(WARLOCK_FILE, 'utf8'));

  console.log(`Original features count: ${warlockData.features.length}`);

  // Filter out the invocations that require Level 2+
  const originalCount = warlockData.features.length;
  warlockData.features = warlockData.features.filter(feature => {
    if (INVOCATIONS_TO_REMOVE.includes(feature.id)) {
      console.log(`Removing: ${feature.name} (${feature.id})`);
      return false;
    }
    return true;
  });

  const removedCount = originalCount - warlockData.features.length;
  console.log(`\nRemoved ${removedCount} invocations that require Level 2+`);
  console.log(`New features count: ${warlockData.features.length}`);

  // Verify only the correct 5 invocations remain
  const remainingInvocations = warlockData.features.filter(f =>
    f.choiceGroup === 'eldritch-invocations-1'
  );

  console.log('\nRemaining level 1 invocations:');
  remainingInvocations.forEach(inv => {
    console.log(`  - ${inv.name}`);
  });

  if (remainingInvocations.length !== 5) {
    console.error(`\n⚠️  WARNING: Expected 5 invocations, found ${remainingInvocations.length}`);
  }

  // Write back to file
  console.log('\nWriting updated Warlock.json...');
  fs.writeFileSync(WARLOCK_FILE, JSON.stringify(warlockData, null, 2));
  console.log('✅ Done! Warlock.json updated.');
}

// Run it
fixWarlockInvocations();
