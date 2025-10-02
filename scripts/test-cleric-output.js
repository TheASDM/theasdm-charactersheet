const fs = require('fs');
const path = require('path');

/**
 * Test script to validate Cleric transformation output
 * Validates:
 * 1. Divine Order has 2 options (Protector and Thaumaturge)
 * 2. No {@...} tags remain in descriptions
 * 3. Subclasses exist (Life, Light, Trickery, War)
 * 4. Scaling features detected
 */

function testClericOutput() {
  console.log('🧪 Testing Cleric.json output...\n');
  console.log('='.repeat(60));

  const outputPath = path.join(__dirname, '../processed-data/Cleric.json');
  const output = JSON.parse(fs.readFileSync(outputPath, 'utf8'));

  let passed = 0;
  let failed = 0;

  // Test 1: Divine Order has 2 options
  console.log('\n📋 Test 1: Divine Order choice options');
  const divineOrderFeatures = output.features.filter(f =>
    f.name.startsWith('Divine Order:')
  );

  if (divineOrderFeatures.length === 2) {
    console.log('  ✅ PASS: Found 2 Divine Order options');
    passed++;
  } else {
    console.log(`  ❌ FAIL: Expected 2 Divine Order options, found ${divineOrderFeatures.length}`);
    failed++;
  }

  const hasProtector = divineOrderFeatures.some(f => f.name.includes('Protector'));
  const hasThaumaturge = divineOrderFeatures.some(f => f.name.includes('Thaumaturge'));

  if (hasProtector && hasThaumaturge) {
    console.log('  ✅ PASS: Found both Protector and Thaumaturge');
    passed++;
  } else {
    console.log('  ❌ FAIL: Missing Protector or Thaumaturge');
    if (!hasProtector) console.log('    - Missing: Protector');
    if (!hasThaumaturge) console.log('    - Missing: Thaumaturge');
    failed++;
  }

  // Check they share the same choiceGroup
  const choiceGroups = [...new Set(divineOrderFeatures.map(f => f.choiceGroup))];
  if (choiceGroups.length === 1) {
    console.log(`  ✅ PASS: Divine Order options share choiceGroup: ${choiceGroups[0]}`);
    passed++;
  } else {
    console.log('  ❌ FAIL: Divine Order options do not share the same choiceGroup');
    failed++;
  }

  // Test 2: No {@...} tags remain
  console.log('\n📋 Test 2: Template tags cleaned');
  let foundTags = false;
  const tagPattern = /{@[a-z]+\s+/;

  for (const feature of output.features) {
    if (tagPattern.test(feature.description)) {
      if (!foundTags) {
        console.log('  ❌ FAIL: Found uncleaned template tags in feature descriptions:');
        foundTags = true;
      }
      const match = feature.description.match(/{@[a-z]+\s+[^}]+}/);
      console.log(`    - ${feature.name}: ${match ? match[0] : 'tag found'}`);
    }
  }

  if (!foundTags) {
    console.log('  ✅ PASS: No template tags found in feature descriptions');
    passed++;
  } else {
    failed++;
  }

  // Test 3: Subclasses exist
  console.log('\n📋 Test 3: Subclasses processed');
  const expectedSubclasses = ['Life Domain', 'Light Domain', 'Trickery Domain', 'War Domain'];
  const actualSubclasses = Object.keys(output.subclasses);

  if (actualSubclasses.length >= 4) {
    console.log(`  ✅ PASS: Found ${actualSubclasses.length} subclasses`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: Expected at least 4 subclasses, found ${actualSubclasses.length}`);
    failed++;
  }

  for (const subclass of expectedSubclasses) {
    if (actualSubclasses.includes(subclass)) {
      const featureCount = output.subclasses[subclass].length;
      console.log(`  ✅ ${subclass}: ${featureCount} features`);
      passed++;
    } else {
      console.log(`  ❌ Missing subclass: ${subclass}`);
      failed++;
    }
  }

  // Test 4: Scaling features detected
  console.log('\n📋 Test 4: Scaling features');
  const scalingFeatures = output.features.filter(f => f.scales === true);

  if (scalingFeatures.length > 0) {
    console.log(`  ✅ PASS: Found ${scalingFeatures.length} scaling features`);
    passed++;
  } else {
    console.log('  ❌ FAIL: No scaling features detected');
    failed++;
  }

  for (const feature of scalingFeatures) {
    console.log(`    - ${feature.name} (level ${feature.level})`);
    if (feature.scalingProgression && feature.scalingProgression.length > 0) {
      console.log(`      Progression points: ${feature.scalingProgression.length}`);
    } else {
      console.log('      ⚠️  No progression points detected (but has scaling keywords)');
    }
  }

  // Test 5: Required fields present
  console.log('\n📋 Test 5: Feature schema validation');
  let schemaValid = true;

  for (const feature of output.features) {
    const requiredFields = ['id', 'name', 'level', 'description', 'mechanics', 'featureType'];
    const missingFields = requiredFields.filter(field => !(field in feature));

    if (missingFields.length > 0) {
      if (schemaValid) {
        console.log('  ❌ FAIL: Features missing required fields:');
        schemaValid = false;
      }
      console.log(`    - ${feature.name || 'Unknown'}: missing ${missingFields.join(', ')}`);
    }
  }

  if (schemaValid) {
    console.log('  ✅ PASS: All features have required fields');
    passed++;
  } else {
    failed++;
  }

  // Test 6: Spellcasting feature exists
  console.log('\n📋 Test 6: Spellcasting feature');
  const spellcastingFeature = output.features.find(f => f.name === 'Spellcasting');

  if (spellcastingFeature) {
    console.log('  ✅ PASS: Spellcasting feature found');
    console.log(`    - Name: ${spellcastingFeature.name}`);
    console.log(`    - Level: ${spellcastingFeature.level}`);
    console.log(`    - Top-level spellcasting data: ${output.spellcasting ? 'Yes' : 'No'}`);
    if (output.spellcasting) {
      console.log(`    - Ability: ${output.spellcasting.ability}`);
      console.log(`    - Progression: ${output.spellcasting.progression}`);
    }
    passed++;
  } else {
    console.log('  ❌ FAIL: No spellcasting feature found');
    failed++;
  }

  // Test 7: featureType field present
  console.log('\n📋 Test 7: featureType field');
  const featuresWithType = output.features.filter(f => f.featureType);
  const baseFeatures = output.features.filter(f => f.featureType === 'base');

  console.log(`  ℹ️  Features with featureType: ${featuresWithType.length}/${output.features.length}`);
  console.log(`  ℹ️  Base features: ${baseFeatures.length}`);

  if (featuresWithType.length === output.features.length) {
    console.log('  ✅ PASS: All features have featureType field');
    passed++;
  } else {
    console.log('  ❌ FAIL: Some features missing featureType field');
    failed++;
  }

  // Check subclass features
  let subclassFeatureTypeCount = 0;
  for (const subclassName in output.subclasses) {
    const subclassFeats = output.subclasses[subclassName];
    const withType = subclassFeats.filter(f => f.featureType === 'subclass');
    subclassFeatureTypeCount += withType.length;
  }

  console.log(`  ℹ️  Subclass features with featureType='subclass': ${subclassFeatureTypeCount}`);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary:\n');
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%\n`);

  if (failed === 0) {
    console.log('🎉 All tests passed!\n');
    return true;
  } else {
    console.log('⚠️  Some tests failed. Review output above.\n');
    return false;
  }
}

// Run tests
if (require.main === module) {
  const success = testClericOutput();
  process.exit(success ? 0 : 1);
}

module.exports = { testClericOutput };
