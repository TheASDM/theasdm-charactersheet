const fs = require('fs');

const data = JSON.parse(fs.readFileSync('/Users/dustinamodeo/Documents/dnd/5etools-src/data/class/class-wizard.json'));
const wizClass = data.class.find(c => c.source === 'XPHB');

console.log('Wizard class from XPHB:', wizClass ? 'FOUND' : 'NOT FOUND');
if (wizClass) {
  console.log('Has classSpells?', !!wizClass.classSpells);
  const spellKeys = Object.keys(wizClass).filter(k => k.toLowerCase().includes('spell'));
  console.log('Spell-related keys:', spellKeys.join(', '));

  if (wizClass.classSpells) {
    console.log('\nClass spells sample:', JSON.stringify(wizClass.classSpells, null, 2).substring(0, 500));
  }
}
