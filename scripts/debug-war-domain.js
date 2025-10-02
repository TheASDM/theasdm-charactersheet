const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./raw-data/Cleric.json', 'utf8'));

const feats = data.subclassFeature.filter(f => f.name === 'War Domain' && f.level === 3);
console.log('Found', feats.length, 'War Domain features\n');

feats.forEach((f, i) => {
  console.log(`${i}: Source=${f.source}, SubclassSource=${f.subclassSource}`);
  console.log(`   Has entries: ${f.entries !== undefined}`);
  console.log(`   Has _copy: ${f._copy !== undefined}`);
  if (f.entries) {
    console.log(`   Entries length: ${f.entries.length}`);
    console.log(`   First entry:`, f.entries[0]);
  }
  console.log();
});

// Look for XPHB War feature
const xphbWar = data.subclassFeature.find(f =>
  f.name === 'War Domain' &&
  f.source === 'XPHB' &&
  f.subclassSource === 'XPHB' &&
  f.level === 3
);

if (xphbWar) {
  console.log('✅ Found XPHB War Domain feature');
  console.log(JSON.stringify(xphbWar, null, 2));
} else {
  console.log('❌ No XPHB War Domain feature found');
}
