const fs = require('fs');
const path = require('path');

// List of spells not in 2024 PHB that should be removed
const nonPHB2024Spells = [
  "Abi-Dalzim's Horrid Wilting", "Absorb Elements", "Aganazzar's Scorcher", "Air Bubble",
  "Ashardalon's Stride", "Beast Bond", "Bones of the Earth", "Booming Blade",
  "Borrowed Knowledge", "Catapult", "Catnap", "Cause Fear", "Ceremony", "Chaos Bolt",
  "Control Flames", "Control Winds", "Create Bonfire", "Create Homunculus",
  "Create Magen", "Create Spelljamming Helm", "Crown of Stars", "Danse Macabre",
  "Dawn", "Distort Value", "Draconic Transformation", "Druid Grove", "Dust Devil",
  "Earth Tremor", "Earthbind", "Elemental Bane", "Enemies Abound", "Enervation",
  "Erupting Earth", "Far Step", "Fast Friends", "Find Greater Steed",
  "Fizban's Platinum Shield", "Flame Arrows", "Frost Fingers", "Frostbite",
  "Gate Seal", "Gift of Gab", "Green-Flame Blade", "Guardian of Nature", "Gust",
  "Healing Spirit", "Holy Weapon", "Illusory Dragon", "Immolation", "Incite Greed",
  "Infernal Calling", "Infestation", "Investiture of Flame", "Investiture of Ice",
  "Investiture of Stone", "Investiture of Wind", "Invulnerability", "Jim's Glowing Coin",
  "Jim's Magic Missile", "Kinetic Jaunt", "Life Transference", "Lightning Lure",
  "Maddening Darkness", "Maelstrom", "Magic Stone", "Mass Polymorph",
  "Maximilian's Earthen Grasp", "Melf's Minute Meteors", "Mental Prison", "Mighty Fortress",
  "Mold Earth", "Motivational Speech", "Nathair's Mischief", "Negative Energy Flood",
  "Power Word Pain", "Primal Savagery", "Primordial Ward", "Psychic Scream",
  "Pyrotechnics", "Raulothim's Psychic Lance", "Rime's Binding Ice", "Scatter",
  "Shadow Blade", "Shadow of Moil", "Shape Water", "Sickening Radiance",
  "Silvery Barbs", "Skill Empowerment", "Skywrite", "Snare", "Snilloc's Snowball Swarm",
  "Soul Cage", "Storm Sphere", "Summon Greater Demon", "Summon Lesser Demons",
  "Sword Burst", "Tenser's Transformation", "Thunder Step", "Tidal Wave",
  "Tiny Servant", "Transmute Rock", "Vortex Warp", "Wall of Light", "Wall of Sand",
  "Wall of Water", "Warding Wind", "Warp Sense", "Watery Sphere", "Whirlwind",
  "Wither and Bloom", "Wrath of Nature", "Zephyr Strike"
];

// Convert to Set for faster lookup
const nonPHB2024Set = new Set(nonPHB2024Spells);

// Read the current class spells data
const classSpellsData = require('./class-spells-data');

// Clean each class's spell list
const cleanedData = {};
let totalRemoved = 0;

Object.keys(classSpellsData).forEach(className => {
  const originalSpells = classSpellsData[className];
  const cleanedSpells = originalSpells.filter(spell => !nonPHB2024Set.has(spell));
  const removed = originalSpells.length - cleanedSpells.length;

  cleanedData[className] = cleanedSpells;

  console.log(`${className}:`);
  console.log(`  Original: ${originalSpells.length} spells`);
  console.log(`  Cleaned: ${cleanedSpells.length} spells`);
  console.log(`  Removed: ${removed} non-PHB2024 spells`);

  totalRemoved += removed;
});

console.log(`\nTotal non-PHB2024 spells removed: ${totalRemoved}`);

// Generate the new module content
const moduleContent = `// Class spell list data - D&D 2024 PHB only
// Non-PHB2024 spells have been filtered out

module.exports = ${JSON.stringify(cleanedData, null, 2)};
`;

// Write the cleaned data back
const outputPath = path.join(__dirname, 'class-spells-data.js');
fs.writeFileSync(outputPath, moduleContent);

console.log(`\n✅ Cleaned spell data written to ${outputPath}`);
