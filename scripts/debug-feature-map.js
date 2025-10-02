const fs = require('fs');

// Load raw data
const rawData = JSON.parse(fs.readFileSync('./raw-data/Cleric.json', 'utf8'));

console.log('🔍 Debugging Feature Map\n');
console.log('='.repeat(60));

// Build feature map
const featureMap = {};

if (rawData.classFeature) {
  for (const feature of rawData.classFeature) {
    if (feature.source === 'XPHB') {
      const key1 = `${feature.name}|${feature.className}|${feature.source}|${feature.level}`;
      const key2 = `${feature.name}|${feature.className}|${feature.source}|${feature.level}|${feature.source}`;
      featureMap[key1] = feature;
      featureMap[key2] = feature;
    }
  }
}

if (rawData.subclassFeature) {
  for (const feature of rawData.subclassFeature) {
    if (feature.source === 'XPHB' || !feature.source) {
      const source = feature.source || 'XPHB';
      const subclassShort = feature.subclassShortName || '';
      const subclassSource = feature.subclassSource || source;

      if (subclassShort) {
        const key1 = `${feature.name}|${feature.className}|${source}|${subclassShort}|${subclassSource}|${feature.level}`;
        const key2 = `${feature.name}|${feature.className}|${source}|${subclassShort}|${feature.level}`;
        const key3 = `${feature.name}|${feature.className}|${source}|${feature.level}`;
        featureMap[key1] = feature;
        featureMap[key2] = feature;
        featureMap[key3] = feature;
      } else {
        const key1 = `${feature.name}|${feature.className}|${source}|${feature.level}`;
        const key2 = `${feature.name}|${feature.className}|${source}|${feature.level}|${source}`;
        featureMap[key1] = feature;
        featureMap[key2] = feature;
      }
    }
  }
}

console.log(`\n✓ Built feature map: ${Object.keys(featureMap).length} entries\n`);

// Look for specific features
console.log('📋 Looking for problem references:\n');

const lookFor = [
  'Divine Strike|Cleric|XPHB|7',
  'Divine Strike|Cleric|XPHB|7|XPHB',
  'Potent Spellcasting|Cleric|XPHB|7',
  'Potent Spellcasting|Cleric|XPHB|7|XPHB',
  'Divine Spark|Cleric|XPHB|2',
  'Divine Spark|Cleric|XPHB|2|XPHB',
  'Turn Undead|Cleric|XPHB|2',
  'Turn Undead|Cleric|XPHB|2|XPHB',
  'War Priest|Cleric|XPHB|War|XPHB|3',
  'Guided Strike|Cleric|XPHB|War|XPHB|3',
  'Preserve Life|Cleric|XPHB|Life|XPHB|3',
  'Disciple of Life|Cleric|XPHB|Life|XPHB|3'
];

for (const key of lookFor) {
  if (featureMap[key]) {
    console.log(`✅ FOUND: ${key}`);
  } else {
    console.log(`❌ MISSING: ${key}`);
  }
}

// Check what's actually in the map for level 7 features
console.log('\n📋 Level 7 features in map:\n');
const level7Keys = Object.keys(featureMap).filter(k => k.includes('|7'));
level7Keys.forEach(key => {
  const feature = featureMap[key];
  console.log(`  - ${key}`);
  console.log(`    Name: ${feature.name}`);
});

// Check Blessed Strikes feature entries
console.log('\n📋 Blessed Strikes feature structure:\n');
const blessedStrikes = rawData.classFeature.find(f => f.name === 'Blessed Strikes' && f.source === 'XPHB');
if (blessedStrikes) {
  console.log('Feature found:', blessedStrikes.name);
  console.log('Entries:', JSON.stringify(blessedStrikes.entries, null, 2));
}

// Check War Domain subclass feature
console.log('\n📋 War Domain subclass structure:\n');
const warDomain = rawData.subclass.find(s => s.name === 'War Domain' && s.classSource === 'XPHB');
if (warDomain) {
  console.log('Subclass:', warDomain.name);
  console.log('Features:', warDomain.subclassFeatures);
}

// Look at actual War Domain feature definition
console.log('\n📋 War Domain level 3 feature definition:\n');
const warDomainFeature = rawData.subclassFeature?.find(f =>
  f.name === 'War Domain' &&
  f.subclassShortName === 'War' &&
  f.level === 3
);
if (warDomainFeature) {
  console.log('Feature found:', warDomainFeature.name);
  console.log('Entries:', JSON.stringify(warDomainFeature.entries?.slice(0, 5), null, 2));
}
