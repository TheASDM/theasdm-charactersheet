const fs = require('fs');
const path = require('path');

const PROCESSED_DATA_DIR = path.join(__dirname, '..', 'processed-data');
const OUTPUT_FILE = path.join(PROCESSED_DATA_DIR, 'all-classes-merged.json');

// List of class files to merge
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

console.log('Starting class merge process...\n');

// Read and merge all class files
const mergedClasses = [];

for (const classFile of classFiles) {
  const filePath = path.join(PROCESSED_DATA_DIR, classFile);

  try {
    console.log(`Reading ${classFile}...`);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const classData = JSON.parse(fileContent);

    // Transform the structure to match API format
    const transformedClass = {
      name: classData.className,
      source: classData.source,
      spellcasting: classData.spellcasting,
      classFeatures: classData.features,
      subclasses: classData.subclasses
    };

    mergedClasses.push(transformedClass);
    console.log(`  ✓ Added ${classData.className}`);
  } catch (error) {
    console.error(`  ✗ Error reading ${classFile}:`, error.message);
  }
}

// Create the final merged structure
const mergedData = {
  class: mergedClasses
};

// Write to output file
console.log(`\nWriting merged data to ${path.basename(OUTPUT_FILE)}...`);
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(mergedData, null, 2), 'utf8');

console.log(`\n✓ Successfully merged ${mergedClasses.length} classes!`);
console.log(`Output file: ${OUTPUT_FILE}`);

// Print summary
console.log('\nClasses included:');
mergedClasses.forEach(cls => {
  const featureCount = cls.classFeatures.length;
  const subclassCount = Object.keys(cls.subclasses).length;
  console.log(`  - ${cls.name}: ${featureCount} features, ${subclassCount} subclasses`);
});
