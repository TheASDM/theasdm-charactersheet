/**
 * Audit Database for D&D 2024 Compliance
 *
 * This script checks all content in the database to ensure it's from
 * D&D 2024 sources (XPHB, XDMG) and removes/updates any 2014 content.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Valid D&D 2024 sources
const VALID_2024_SOURCES = ['XPHB', 'XDMG', 'PHB2024', 'DMG2024'];

// Known 2014 terms that should be updated or removed
// Note: Many terms like "Fiend", "Great Old One", "Archfey" are legitimate D&D 2024 terms
const KNOWN_2014_TERMS = {
  'Sorcerous Origin': 'Sorcerous Subclass',
  'Draconic Bloodline': 'Draconic Sorcery'
  // Removed "Wild Magic" check as it's part of legitimate "Wild Magic Sorcery" in 2024
};

async function auditTable(tableName, modelName) {
  console.log(`\n🔍 Auditing ${tableName}...`);

  try {
    // Build select object based on model
    const baseSelect = {
      id: true,
      name: true,
      contentVersion: true
    };

    // Add source field only for models that have it
    if (tableName !== 'backgrounds') {
      baseSelect.source = true;
    }

    // Add model-specific fields
    if (tableName === 'classes') {
      baseSelect.classFeatures = true;
      baseSelect.subclassFeatures = true;
    } else if (tableName === 'spells') {
      baseSelect.entries = true;
    } else if (tableName === 'items') {
      baseSelect.entries = true;
    } else if (tableName === 'feats') {
      baseSelect.entries = true;
      baseSelect.category = true;
    } else if (tableName === 'backgrounds') {
      baseSelect.description = true;
      baseSelect.feature = true;
    }

    const records = await prisma[modelName].findMany({
      select: baseSelect
    });

    console.log(`   📊 Total records: ${records.length}`);

    // Check sources
    const sourceCounts = {};
    const suspiciousRecords = [];
    const nullSources = [];

    for (const record of records) {
      // Only check sources for models that have source field
      if (tableName !== 'backgrounds') {
        // Count sources
        const source = record.source || 'NULL';
        sourceCounts[source] = (sourceCounts[source] || 0) + 1;

        // Flag suspicious sources
        if (!record.source || !VALID_2024_SOURCES.includes(record.source)) {
          if (!record.source) {
            nullSources.push(record);
          } else {
            suspiciousRecords.push(record);
          }
        }
      } else {
        // For backgrounds, we assume they're 2024 since they don't have source field
        sourceCounts['ASSUMED_2024'] = (sourceCounts['ASSUMED_2024'] || 0) + 1;
      }

      // Check for 2014 terminology in names
      for (const [term2014, term2024] of Object.entries(KNOWN_2014_TERMS)) {
        if (record.name && record.name.includes(term2014)) {
          console.log(`   ⚠️  Found 2014 term "${term2014}" in: ${record.name}`);
        }
      }

      // Check content fields for 2014 terminology
      const contentFields = [];
      if (record.entries) contentFields.push(JSON.stringify(record.entries));
      if (record.description) contentFields.push(record.description);
      if (record.feature) contentFields.push(JSON.stringify(record.feature));

      for (const contentStr of contentFields) {
        for (const [term2014, term2024] of Object.entries(KNOWN_2014_TERMS)) {
          if (contentStr.includes(term2014)) {
            console.log(`   ⚠️  Found 2014 term "${term2014}" in content of: ${record.name}`);
          }
        }
      }
    }

    // Report findings
    console.log('   📈 Source breakdown:');
    for (const [source, count] of Object.entries(sourceCounts)) {
      const isValid = VALID_2024_SOURCES.includes(source) || source === 'NULL';
      const status = isValid ? '✅' : '❌';
      console.log(`      ${status} ${source}: ${count}`);
    }

    if (suspiciousRecords.length > 0) {
      console.log(`   ❌ ${suspiciousRecords.length} records with invalid sources:`);
      suspiciousRecords.forEach(record => {
        console.log(`      - ${record.name} (source: ${record.source})`);
      });
    }

    if (nullSources.length > 0) {
      console.log(`   ⚠️  ${nullSources.length} records with NULL source`);
    }

    return {
      total: records.length,
      suspicious: suspiciousRecords,
      nullSources: nullSources,
      sourceCounts: sourceCounts
    };

  } catch (error) {
    console.error(`❌ Error auditing ${tableName}:`, error);
    return { total: 0, suspicious: [], nullSources: [], sourceCounts: {} };
  }
}

async function checkClassData() {
  console.log(`\n🎭 Special audit for class-related data...`);

  try {
    // Check class features for 2014 terminology
    const classes = await prisma.class.findMany({
      select: {
        id: true,
        name: true,
        classFeatures: true,
        subclassFeatures: true,
        source: true
      }
    });

    for (const classData of classes) {
      console.log(`   🔍 Checking class: ${classData.name}`);

      // Check class features
      if (classData.classFeatures) {
        const featuresStr = JSON.stringify(classData.classFeatures);
        for (const [term2014, term2024] of Object.entries(KNOWN_2014_TERMS)) {
          if (featuresStr.includes(term2014)) {
            console.log(`      ⚠️  Found 2014 term "${term2014}" in ${classData.name} class features`);
          }
        }
      }

      // Check subclass features
      if (classData.subclassFeatures) {
        const subclassStr = JSON.stringify(classData.subclassFeatures);
        for (const [term2014, term2024] of Object.entries(KNOWN_2014_TERMS)) {
          if (subclassStr.includes(term2014)) {
            console.log(`      ⚠️  Found 2014 term "${term2014}" in ${classData.name} subclass features`);
          }
        }
      }
    }

    // Check our new class choice tables
    const classChoices = await prisma.classFeatureChoice.findMany({
      include: {
        options: true
      }
    });

    for (const choice of classChoices) {
      if (choice.featureName.includes('Origin')) {
        console.log(`      ⚠️  Found potential 2014 terminology: ${choice.featureName}`);
      }

      for (const option of choice.options) {
        for (const [term2014, term2024] of Object.entries(KNOWN_2014_TERMS)) {
          if (option.name.includes(term2014) || option.description.includes(term2014)) {
            console.log(`      ⚠️  Found 2014 term "${term2014}" in choice option: ${option.name}`);
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Error checking class data:', error);
  }
}

async function main() {
  console.log('🔍 Starting D&D 2024 Content Audit...');
  console.log('Valid 2024 sources:', VALID_2024_SOURCES.join(', '));

  const auditResults = {};

  // Audit all major content tables
  const tables = [
    { name: 'spells', model: 'spell' },
    { name: 'classes', model: 'class' },
    { name: 'species', model: 'species' },
    { name: 'backgrounds', model: 'background' },
    { name: 'feats', model: 'feat' },
    { name: 'items', model: 'item' },
    { name: 'fighting_styles', model: 'fightingStyle' },
    { name: 'divine_orders', model: 'divineOrder' },
    { name: 'eldritch_invocations', model: 'eldritchInvocation' }
  ];

  for (const table of tables) {
    auditResults[table.name] = await auditTable(table.name, table.model);
  }

  // Special class data check
  await checkClassData();

  // Summary report
  console.log('\n📋 AUDIT SUMMARY');
  console.log('================');

  let totalRecords = 0;
  let totalSuspicious = 0;
  let totalNullSources = 0;

  for (const [tableName, results] of Object.entries(auditResults)) {
    totalRecords += results.total;
    totalSuspicious += results.suspicious.length;
    totalNullSources += results.nullSources.length;
  }

  console.log(`📊 Total records audited: ${totalRecords}`);
  console.log(`❌ Records with invalid sources: ${totalSuspicious}`);
  console.log(`⚠️  Records with NULL sources: ${totalNullSources}`);

  if (totalSuspicious > 0 || totalNullSources > 0) {
    console.log('\n🚨 ACTION REQUIRED:');
    console.log('   - Review and update/remove records with invalid sources');
    console.log('   - Add proper XPHB/XDMG source attribution');
    console.log('   - Update 2014 terminology to 2024 equivalents');
  } else {
    console.log('\n✅ All content appears to be D&D 2024 compliant!');
  }

  return auditResults;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });