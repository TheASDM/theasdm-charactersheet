const fs = require('fs');
const path = require('path');

/**
 * D&D 2024 Class Data Transformation Script
 * Transforms 5etools class JSON into simplified format for character generator
 */

// ============================================================================
// STEP 1: Load and Filter Source Data
// ============================================================================

function loadClassData(filePath) {
  const rawData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Find the XPHB class entry
  const classEntry = rawData.class.find(c => c.source === 'XPHB');

  if (!classEntry) {
    throw new Error('No XPHB class entry found in ' + filePath);
  }

  return {
    name: classEntry.name,
    source: classEntry.source,
    page: classEntry.page,
    spellcastingAbility: classEntry.spellcastingAbility,
    casterProgression: classEntry.casterProgression,
    classFeatures: classEntry.classFeatures || [],
    rawData: rawData // Keep for reference map building
  };
}

// ============================================================================
// STEP 2: Build Feature Reference Map
// ============================================================================

function buildFeatureMap(rawData) {
  const featureMap = {};

  // Look in classFeature array
  if (rawData.classFeature) {
    for (const feature of rawData.classFeature) {
      if (feature.source === 'XPHB') {
        // Store with multiple key formats for flexibility
        const key1 = `${feature.name}|${feature.className}|${feature.source}|${feature.level}`;
        const key2 = `${feature.name}|${feature.className}|${feature.source}|${feature.level}|${feature.source}`;
        featureMap[key1] = feature;
        featureMap[key2] = feature;
      }
    }
  }

  // Look in subclassFeature array
  if (rawData.subclassFeature) {
    for (const feature of rawData.subclassFeature) {
      if (feature.source === 'XPHB' || !feature.source) {
        const source = feature.source || 'XPHB';
        const subclassShort = feature.subclassShortName || '';
        const subclassSource = feature.subclassSource || source;

        // Build multiple key formats for subclass features
        // Format: Name|Class|Source|Subclass|SubclassSource|Level
        // Note: SubclassSource can be empty, creating patterns like |War||3
        if (subclassShort) {
          const key1 = `${feature.name}|${feature.className}|${source}|${subclassShort}|${subclassSource}|${feature.level}`;
          const key2 = `${feature.name}|${feature.className}|${source}|${subclassShort}||${feature.level}`; // Empty subclass source
          const key3 = `${feature.name}|${feature.className}||${subclassShort}||${feature.level}`; // Empty class source AND subclass source
          const key4 = `${feature.name}|${feature.className}|${source}|${subclassShort}|${feature.level}`;
          const key5 = `${feature.name}|${feature.className}|${source}|${feature.level}`;
          featureMap[key1] = feature;
          featureMap[key2] = feature;
          featureMap[key3] = feature;
          featureMap[key4] = feature;
          featureMap[key5] = feature;
        } else {
          // Regular class feature in subclassFeature array
          const key1 = `${feature.name}|${feature.className}|${source}|${feature.level}`;
          const key2 = `${feature.name}|${feature.className}|${source}|${feature.level}|${source}`;
          featureMap[key1] = feature;
          featureMap[key2] = feature;
        }
      }
    }
  }

  return featureMap;
}

// ============================================================================
// STEP 10: Helper Functions (defined early for use in other steps)
// ============================================================================

function generateId(...parts) {
  return parts
    .map(p => String(p).toLowerCase())
    .join('-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ============================================================================
// STEP 8: Clean D&D Template Tags
// ============================================================================

function cleanDnDTags(text) {
  if (typeof text !== 'string') {
    return '';
  }

  let cleanText = text;

  // Remove all {@tag ...} patterns
  const patterns = [
    /{@spell ([^|}]+)(?:\|[^}]*)?}/g,
    /{@item ([^|}]+)(?:\|[^}]*)?}/g,
    /{@condition ([^|}]+)(?:\|[^}]*)?}/g,
    /{@skill ([^|}]+)(?:\|[^}]*)?}/g,
    /{@action ([^|}]+)(?:\|[^}]*)?}/g,
    /{@feat ([^|}]+)(?:\|[^}]*)?}/g,
    /{@status ([^|}]+)(?:\|[^}]*)?}/g,
    /{@5etools ([^|}]+)(?:\|[^}]*)?}/g,
    /{@dice ([^}]+)}/g,
    /{@damage ([^}]+)}/g,
    /{@dc ([^}]+)}/g,
    /{@filter ([^|}]+)(?:\|[^}]*)?}/g,
    /{@book ([^|}]+)(?:\|[^}]*)?}/g,
    /{@variantrule ([^|}]+)(?:\|[^}]*)?}/g,
    /{@sense ([^|}]+)(?:\|[^}]*)?}/g,
    /{@b ([^}]+)}/g,
    /{@i ([^}]+)}/g,
  ];

  for (const pattern of patterns) {
    cleanText = cleanText.replace(pattern, '$1');
  }

  // Handle parenthetical tags
  cleanText = cleanText.replace(/\(@[a-z]+ ([^|)]+)(?:\|[^)]*)?\)/g, '$1');

  // Clean up whitespace
  cleanText = cleanText.replace(/\s+/g, ' ').trim();

  return cleanText;
}

// ============================================================================
// STEP 10.2 & 10.3: Process Tables and Lists
// ============================================================================

function processTable(tableEntry) {
  const caption = tableEntry.caption || 'Table';
  let result = caption + ': ';

  if (tableEntry.rows) {
    const rows = tableEntry.rows.map(row =>
      row.map(cell => cleanDnDTags(String(cell))).join(' - ')
    );
    result += rows.join('; ');
  }

  return result;
}

function processList(listEntry) {
  const items = [];

  if (listEntry.items) {
    for (const item of listEntry.items) {
      let text = '';

      if (typeof item === 'string') {
        text = cleanDnDTags(item);
      } else if (item.name) {
        text = cleanDnDTags(item.name);
        if (item.entries) {
          text += ': ' + processEntries(item.entries);
        } else if (item.entry) {
          text += ': ' + cleanDnDTags(item.entry);
        }
      } else if (item.entries) {
        text = processEntries(item.entries);
      }

      if (text) {
        items.push(text);
      }
    }
  }

  return items.join('; ');
}

// ============================================================================
// STEP 7: Process Entries Array
// ============================================================================

function processEntries(entries, tables = []) {
  if (typeof entries === 'string') {
    return cleanDnDTags(entries);
  }

  if (!Array.isArray(entries)) {
    return '';
  }

  const textParts = [];

  for (const entry of entries) {
    if (typeof entry === 'string') {
      textParts.push(cleanDnDTags(entry));
    } else if (entry.type === 'entries') {
      let text = '';
      if (entry.name) {
        text = cleanDnDTags(entry.name) + ': ';
      }
      text += processEntries(entry.entries, tables);
      textParts.push(text);
    } else if (entry.type === 'table') {
      tables.push(entry); // Collect for scaling detection
      textParts.push(processTable(entry));
    } else if (entry.type === 'list') {
      textParts.push(processList(entry));
    } else if (entry.type === 'options') {
      // Skip - handled as choices in step 5
      continue;
    } else if (entry.type === 'refClassFeature') {
      // Skip - already resolved
      continue;
    }
  }

  return textParts.join(' ').replace(/\s+/g, ' ').trim();
}

// ============================================================================
// STEP 9: Extract Mechanics
// ============================================================================

function extractMechanics(entries, tables = []) {
  const fullText = processEntries(entries, tables);

  const mechanics = {
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
  };

  // 9.3: Extract dice rolls
  const dicePattern = /(\d+d\d+(?:\s*[+\-]\s*\d+)?)/g;
  const diceMatches = fullText.match(dicePattern);
  if (diceMatches) {
    mechanics.diceRolls = [...new Set(diceMatches)];
  }

  // 9.4: Extract damage types
  const damageTypes = [
    'fire', 'cold', 'lightning', 'thunder', 'poison', 'acid',
    'necrotic', 'radiant', 'force', 'psychic', 'slashing',
    'bludgeoning', 'piercing'
  ];
  for (const type of damageTypes) {
    if (fullText.toLowerCase().includes(type)) {
      mechanics.damageTypes.push(type);
    }
  }
  mechanics.damageTypes = [...new Set(mechanics.damageTypes)];

  // 9.5: Extract abilities
  const abilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
  for (const ability of abilities) {
    const pattern = new RegExp(ability, 'i');
    if (pattern.test(fullText)) {
      mechanics.abilities.push(ability);
    }
  }
  mechanics.abilities = [...new Set(mechanics.abilities)];

  // 9.6: Extract action type
  if (/as (?:a )?(?:Magic )?action/i.test(fullText)) {
    mechanics.actionType = 'action';
  } else if (/bonus action/i.test(fullText)) {
    mechanics.actionType = 'bonus-action';
  } else if (/reaction/i.test(fullText)) {
    mechanics.actionType = 'reaction';
  } else if (/no action required/i.test(fullText)) {
    mechanics.actionType = 'free';
  }

  // 9.7: Extract range
  const rangeMatch = fullText.match(/within (\d+) feet/);
  if (rangeMatch) {
    mechanics.range = rangeMatch[1] + ' feet';
  } else if (/\btouch\b/i.test(fullText)) {
    mechanics.range = 'touch';
  } else if (/\bself\b/i.test(fullText)) {
    mechanics.range = 'self';
  }

  // 9.8: Extract duration
  const durationMatch = fullText.match(/(?:for |lasts? )(\d+ (?:minute|hour|day|round|turn)s?)/i);
  if (durationMatch) {
    mechanics.duration = durationMatch[1];
  } else if (/instantaneous/i.test(fullText)) {
    mechanics.duration = 'instantaneous';
  } else if (/until you finish/i.test(fullText)) {
    mechanics.duration = 'until rest';
  }

  // 9.9: Extract proficiencies
  const profPattern = /(?:proficiency|proficient) (?:with|in) ([^.]+)/gi;
  const profMatches = [...fullText.matchAll(profPattern)];
  for (const match of profMatches) {
    mechanics.proficiencies.push(cleanDnDTags(match[1]).toLowerCase());
  }

  // 9.10: Extract spell grants
  if (/you (?:learn|know)/i.test(fullText)) {
    const spellPattern = /{@spell ([^|}]+)/g;
    const originalText = JSON.stringify(entries);
    const spellMatches = [...originalText.matchAll(spellPattern)];
    for (const match of spellMatches) {
      mechanics.spellsGranted.push(match[1]);
    }
  }

  // 9.12: Extract scaling information
  const scalingKeywords = [
    'increases to', 'at level', 'when you reach',
    'at higher levels', 'improved', 'additional'
  ];

  for (const keyword of scalingKeywords) {
    if (fullText.toLowerCase().includes(keyword)) {
      mechanics.scales = true;
      break;
    }
  }

  // Create a separate scalingProgression array to return alongside mechanics
  const scalingProgression = [];

  if (mechanics.scales) {
    // First, try parenthetical format: "7 (2d8), 13 (3d8), and 18 (4d8)"
    const parentheticalPattern = /\b(\d+)\s*\(([^)]+)\)/g;
    const parentheticalMatches = [...fullText.matchAll(parentheticalPattern)];

    if (parentheticalMatches.length > 0) {
      for (const match of parentheticalMatches) {
        const level = parseInt(match[1]);
        const value = match[2].trim();
        const changes = {};

        // Check if it's a dice roll
        if (/\d+d\d+/.test(value)) {
          changes.damage = value.match(/(\d+d\d+)/)[1];
        } else if (/\d+/.test(value)) {
          // Numeric value
          changes.value = value;
        }

        if (Object.keys(changes).length > 0) {
          scalingProgression.push({
            level: level,
            changes: changes
          });
        }
      }
    } else {
      // Fallback to general pattern
      const levelPattern = /(?:at|when you reach|starting at|at higher)\s+(?:level\s+)?(\d+)/gi;
      const levelMatches = [...fullText.matchAll(levelPattern)];

      for (const match of levelMatches) {
        const level = parseInt(match[1]);
        const contextStart = match.index;
        const contextEnd = Math.min(contextStart + 200, fullText.length);
        const context = fullText.substring(contextStart, contextEnd);

        const changes = {};

        // Look for damage increases
        const damageMatch = context.match(/(\d+d\d+)/);
        if (damageMatch) {
          changes.damage = damageMatch[1];
        }

        // Look for use increases
        const usesMatch = context.match(/(\d+)\s*(?:time|use)s?/);
        if (usesMatch) {
          changes.uses = parseInt(usesMatch[1]);
        }

        // Look for bonus increases
        const bonusMatch = context.match(/\+(\d+)/);
        if (bonusMatch) {
          changes.bonus = parseInt(bonusMatch[1]);
        }

        changes.description = context.substring(0, 100).trim();

        if (Object.keys(changes).length > 1) { // More than just description
          scalingProgression.push({
            level: level,
            changes: changes
          });
        }
      }
    }

    // Fallback: if no levels detected but scaling keywords found
    if (scalingProgression.length === 0) {
      console.warn(`  ⚠️  Scaling keywords found but no progression detected for feature`);
    }
  }

  return { mechanics, scalingProgression };
}

// ============================================================================
// STEP 6: Process Single Feature
// ============================================================================

function processSingleFeature(name, entries, level, source, page, featureType = 'base', featureMap = {}) {
  // Check if this is a Domain Spells feature with structured spell data
  const isDomainSpells = name.includes('Domain Spells');
  let structuredSpells = null;

  if (isDomainSpells && Array.isArray(entries)) {
    // Find the table with spell data
    const spellTable = entries.find(e => e.type === 'table' && e.caption && e.caption.includes('Domain Spells'));
    if (spellTable && spellTable.rows) {
      structuredSpells = {};
      for (const row of spellTable.rows) {
        if (row.length >= 2) {
          // Parse level like "3rd" -> 3
          const levelMatch = row[0].match(/(\d+)/);
          if (levelMatch) {
            const lvl = levelMatch[1];
            // Extract spell names from {@spell Name|Source} tags
            const spellText = row[1];
            const spellPattern = /{@spell ([^|}]+)(?:\|[^}]*)?}/g;
            const spells = [];
            let match;
            while ((match = spellPattern.exec(spellText)) !== null) {
              spells.push(match[1]);
            }
            if (spells.length > 0) {
              structuredSpells[lvl] = spells;
            }
          }
        }
      }
    }
  }

  // Check if this feature contains refSubclassFeature entries that should be expanded
  const refSubclassFeatures = [];
  if (Array.isArray(entries)) {
    for (const entry of entries) {
      if (entry && entry.type === 'refSubclassFeature') {
        refSubclassFeatures.push(entry.subclassFeature);
      }
    }
  }

  // If we have refSubclassFeature entries, expand them as separate features
  if (refSubclassFeatures.length > 0 && featureType === 'subclass') {
    const expandedFeatures = [];

    for (const refKey of refSubclassFeatures) {
      const resolved = featureMap[refKey];
      if (resolved) {
        // Process the resolved feature
        const processedFeatures = processSingleFeature(
          resolved.name,
          resolved.entries || [],
          level,
          resolved.source || source,
          resolved.page || page,
          featureType,
          featureMap
        );
        expandedFeatures.push(...processedFeatures);
      } else {
        console.warn(`  ⚠️  Could not resolve subclass ref: ${refKey}`);
      }
    }

    // If we successfully expanded features, return them instead of the parent
    if (expandedFeatures.length > 0) {
      return expandedFeatures;
    }
  }

  const tables = [];
  const description = processEntries(entries, tables);
  const { mechanics, scalingProgression } = extractMechanics(entries, tables);

  // Add structured spells to mechanics if available
  if (structuredSpells) {
    mechanics.spellsByLevel = structuredSpells;
  }

  const feature = {
    id: generateId(name, level),
    name: name,
    level: level,
    source: source,
    page: page,
    featureType: featureType,
    description: description,
    mechanics: mechanics,
    isChoice: false,
    prerequisites: [],
    scales: mechanics.scales,
    scalingProgression: scalingProgression
  };

  return [feature];
}

// ============================================================================
// STEP 4.5: Process Granted Options Features (like Channel Divinity)
// ============================================================================

function processGrantedOptionsFeature(parentFeature, grantedOptions, level, featureMap, featureType = 'base') {
  const features = [];

  // Create the parent feature with granted options
  const tables = [];
  const description = processEntries(parentFeature.entries || [], tables);
  const { mechanics, scalingProgression } = extractMechanics(parentFeature.entries || [], tables);

  // Extract uses and recharge info from description
  const usesMatch = description.match(/you can use.+?(twice|once|thrice|\d+\s*times?)/i);
  if (usesMatch) {
    const wordToNumber = { 'once': 1, 'twice': 2, 'thrice': 3 };
    const usesValue = usesMatch[1].toLowerCase().replace(/\s*times?/i, '').trim();
    mechanics.uses = wordToNumber[usesValue] || parseInt(usesValue);
  }

  if (/short rest/i.test(description) && /long rest/i.test(description)) {
    mechanics.rechargeOn = ['short-rest', 'long-rest'];
  } else if (/long rest/i.test(description)) {
    mechanics.rechargeOn = ['long-rest'];
  }

  // For Channel Divinity specifically, extract the scaling progression from the table reference
  let finalScalingProgression = scalingProgression;
  if (parentFeature.name === 'Channel Divinity' && /Channel Divinity column/i.test(description)) {
    // Channel Divinity uses scale at level 6 (3 uses) and level 18 (4 uses)
    finalScalingProgression = [
      { level: 6, changes: { uses: 3 } },
      { level: 18, changes: { uses: 4 } }
    ];
    mechanics.scales = true;
  }

  const grantedOptionIds = [];

  // Process each granted option as a separate feature
  for (const option of grantedOptions) {
    let actualFeature = option;

    // Resolve reference if needed
    if (option.type === 'refClassFeature' || option.type === 'refSubclassFeature') {
      const refKey = option.classFeature || option.subclassFeature;
      const resolved = featureMap[refKey];
      if (resolved) {
        actualFeature = resolved;
      } else {
        console.warn(`  ⚠️  Could not resolve granted option reference: ${refKey}`);
        continue;
      }
    }

    if (!actualFeature.name || !actualFeature.entries) {
      continue;
    }

    const optionTables = [];
    const optionDescription = processEntries(actualFeature.entries, optionTables);
    const { mechanics: optionMechanics, scalingProgression: optionScalingProgression } = extractMechanics(actualFeature.entries, optionTables);

    const optionId = generateId(actualFeature.name, level);
    grantedOptionIds.push(optionId);

    const optionFeature = {
      id: optionId,
      name: actualFeature.name,
      level: level,
      source: actualFeature.source || 'XPHB',
      page: actualFeature.page,
      featureType: featureType,
      description: optionDescription,
      mechanics: optionMechanics,
      parentFeature: generateId(parentFeature.name, level),
      usageType: 'granted-option',
      isChoice: false,
      prerequisites: [],
      scales: optionMechanics.scales,
      scalingProgression: optionScalingProgression
    };

    features.push(optionFeature);
  }

  // Create the parent feature
  const parentId = generateId(parentFeature.name, level);
  const parent = {
    id: parentId,
    name: parentFeature.name,
    level: level,
    source: parentFeature.source || 'XPHB',
    page: parentFeature.page,
    featureType: featureType,
    description: description,
    mechanics: mechanics,
    grantedOptions: grantedOptionIds,
    isChoice: false,
    prerequisites: [],
    scales: mechanics.scales,
    scalingProgression: finalScalingProgression
  };

  // Return parent first, then options
  return [parent, ...features];
}

// ============================================================================
// STEP 5: Process Choice-Based Features
// ============================================================================

function processChoiceFeature(parentName, choiceOptions, level, featureMap, featureType = 'base') {
  const features = [];
  const choiceGroup = generateId(parentName, level);

  for (const option of choiceOptions) {
    let actualFeature = option;

    // Resolve reference if needed
    if (option.type === 'refClassFeature' || option.type === 'refSubclassFeature') {
      const refKey = option.classFeature || option.subclassFeature;
      const resolved = featureMap[refKey];
      if (resolved) {
        actualFeature = resolved;
      } else {
        console.warn(`  ⚠️  Could not resolve reference: ${refKey}`);
        continue;
      }
    }

    if (!actualFeature.name || !actualFeature.entries) {
      continue;
    }

    const tables = [];
    const description = processEntries(actualFeature.entries, tables);
    const { mechanics, scalingProgression } = extractMechanics(actualFeature.entries, tables);

    const feature = {
      id: generateId(parentName, actualFeature.name, level),
      name: `${parentName}: ${actualFeature.name}`,
      choiceGroup: choiceGroup,
      level: level,
      source: actualFeature.source || 'XPHB',
      page: actualFeature.page,
      featureType: featureType,
      description: description,
      mechanics: mechanics,
      isChoice: true,
      requiresSelection: true,
      prerequisites: [],
      scales: mechanics.scales,
      scalingProgression: scalingProgression
    };

    features.push(feature);
  }

  return features;
}

// ============================================================================
// STEP 4: Process Individual Feature
// ============================================================================

function processFeature(featureRef, level, featureMap, featureType = 'base') {
  let feature = null;

  // Handle string references
  if (typeof featureRef === 'string') {
    feature = featureMap[featureRef];
    if (!feature) {
      console.warn(`  ⚠️  Feature not found: ${featureRef}`);
      return [];
    }
  } else if (featureRef.classFeature) {
    // Handle object with classFeature property
    feature = featureMap[featureRef.classFeature];
    if (!feature) {
      console.warn(`  ⚠️  Feature not found: ${featureRef.classFeature}`);
      return [];
    }
  } else {
    feature = featureRef;
  }

  if (!feature || !feature.name) {
    return [];
  }

  // Check if feature contains choices or granted options
  let hasChoices = false;
  let hasGrantedOptions = false;
  let choiceOptions = [];
  let grantedOptions = [];

  if (feature.entries) {
    // Get first text entry to check for keywords
    const firstText = feature.entries.find(e => typeof e === 'string') || '';

    for (const entry of feature.entries) {
      // Standard options type
      if (entry && entry.type === 'options') {
        hasChoices = true;
        choiceOptions = entry.entries || [];
        break;
      }
      // Nested entries containing only refClassFeature/refSubclassFeature
      if (entry && entry.type === 'entries' && entry.entries) {
        const allRefs = entry.entries.every(e =>
          e && (e.type === 'refClassFeature' || e.type === 'refSubclassFeature')
        );
        if (allRefs && entry.entries.length > 1) {
          // Determine if this is a choice or granted options based on keywords
          // Granted options: "you start with X effects", "each time you use, choose which"
          // Permanent choice: "you gain one of the following of your choice"
          const isGranted = (/you (?:start with).+(?:effects?)/i.test(firstText) &&
                            /each time you use/i.test(firstText)) ||
                           /choose which.+(?:effect|option).+to (?:create|use)/i.test(firstText);

          const isChoice = /(?:you gain|choose).+(?:one of|following).+(?:of your )?choice/i.test(firstText) ||
                          /gain one of the following options of your choice/i.test(firstText);

          if (isGranted && !isChoice) {
            hasGrantedOptions = true;
            grantedOptions = entry.entries;
          } else {
            hasChoices = true;
            choiceOptions = entry.entries;
          }
          break;
        }
      }
    }
  }

  if (hasChoices) {
    return processChoiceFeature(feature.name, choiceOptions, level, featureMap, featureType);
  } else if (hasGrantedOptions) {
    return processGrantedOptionsFeature(feature, grantedOptions, level, featureMap, featureType);
  } else {
    return processSingleFeature(
      feature.name,
      feature.entries || [],
      level,
      feature.source || 'XPHB',
      feature.page,
      featureType,
      featureMap
    );
  }
}

// ============================================================================
// STEP 3: Process Each Level's Features
// ============================================================================

function processClassFeatures(classFeatures, featureMap) {
  const transformedFeatures = [];

  for (const featureRef of classFeatures) {
    if (typeof featureRef === 'string') {
      // Parse level from reference: "Spellcasting|Cleric|XPHB|1"
      const parts = featureRef.split('|');
      const level = parseInt(parts[3]) || 1;

      const processed = processFeature(featureRef, level, featureMap, 'base');
      transformedFeatures.push(...processed);
    } else if (featureRef.classFeature) {
      // Parse level from object reference
      const parts = featureRef.classFeature.split('|');
      const level = parseInt(parts[3]) || 1;

      const processed = processFeature(featureRef, level, featureMap, 'base');
      transformedFeatures.push(...processed);
    }
  }

  return transformedFeatures;
}

// ============================================================================
// STEP 3.5: Process Subclass Features
// ============================================================================

function processSubclassFeatures(rawData, featureMap) {
  const subclassFeatures = {};

  if (!rawData.subclass) {
    return subclassFeatures;
  }

  for (const subclass of rawData.subclass) {
    // Only process XPHB subclasses
    if (subclass.classSource !== 'XPHB') {
      continue;
    }

    const subclassName = subclass.name;
    const subclassFeatureList = [];

    if (subclass.subclassFeatures) {
      for (const featureRef of subclass.subclassFeatures) {
        if (typeof featureRef === 'string') {
          // Parse level from reference (format: Name|Class|Source|Subclass|Source|Level)
          const parts = featureRef.split('|');
          const level = parseInt(parts[parts.length - 1]) || 3;

          // Build alternative key formats to try
          const key1 = featureRef; // Full format
          const key2 = parts.slice(0, 4).join('|'); // Without last source
          const key3 = parts.slice(0, -1).join('|'); // Without level

          // Try to find the feature
          let feature = featureMap[key1] || featureMap[key2] || featureMap[key3];

          if (!feature) {
            console.warn(`  ⚠️  Subclass feature not found: ${featureRef}`);
            continue;
          }

          const processed = processFeature(feature, level, featureMap, 'subclass');
          for (const f of processed) {
            f.subclass = subclassName;
            subclassFeatureList.push(f);
          }
        }
      }
    }

    if (subclassFeatureList.length > 0) {
      subclassFeatures[subclassName] = subclassFeatureList;
    }
  }

  return subclassFeatures;
}

// ============================================================================
// STEP 2.5: Process Spellcasting as Special Feature
// ============================================================================

function createSpellcastingFeature(className, spellcastingAbility, casterProgression) {
  if (!spellcastingAbility) {
    return null;
  }

  const abilityMap = {
    'wis': 'Wisdom',
    'int': 'Intelligence',
    'cha': 'Charisma'
  };

  const abilityName = abilityMap[spellcastingAbility] || spellcastingAbility;

  return {
    id: className.toLowerCase() + '-spellcasting',
    name: 'Spellcasting',
    level: 1,
    source: 'XPHB',
    featureType: 'base',
    isSpellcasting: true,
    description: `You can cast spells using ${abilityName} as your spellcasting ability.`,
    mechanics: {
      ability: spellcastingAbility,
      progression: casterProgression,
      diceRolls: [],
      damageTypes: [],
      abilities: [spellcastingAbility],
      actionType: null,
      range: null,
      duration: null,
      savingThrow: null,
      proficiencies: [],
      spellsGranted: [],
      scales: false
    },
    isChoice: false,
    prerequisites: [],
    scales: false,
    scalingProgression: []
  };
}

// ============================================================================
// MAIN TRANSFORMATION FUNCTION
// ============================================================================

function transformClassData(inputPath, outputPath) {
  console.log(`\n📖 Processing: ${path.basename(inputPath)}`);

  // Step 1: Load and filter
  const classData = loadClassData(inputPath);
  console.log(`  ✓ Loaded ${classData.name}`);

  // Step 2: Build reference map
  const featureMap = buildFeatureMap(classData.rawData);
  console.log(`  ✓ Built feature map (${Object.keys(featureMap).length} features)`);

  // Step 3: Process class features
  const features = processClassFeatures(classData.classFeatures, featureMap);

  console.log(`  ✓ Processed ${features.length} base class features`);

  // Step 3.5: Process subclass features
  const subclasses = processSubclassFeatures(classData.rawData, featureMap);
  const subclassCount = Object.keys(subclasses).length;
  console.log(`  ✓ Processed ${subclassCount} subclasses`);

  // Count various feature types
  const choiceFeatures = features.filter(f => f.isChoice).length;
  const scalingFeatures = features.filter(f => f.scales).length;

  console.log(`  ✓ Choice features: ${choiceFeatures}`);
  console.log(`  ✓ Scaling features: ${scalingFeatures}`);

  // Step 11: Output format
  const output = {
    className: classData.name,
    source: classData.source,
    spellcasting: classData.spellcastingAbility ? {
      ability: classData.spellcastingAbility,
      progression: classData.casterProgression
    } : null,
    features: features,
    subclasses: subclasses
  };

  // Write output
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`  ✅ Wrote output to ${path.basename(outputPath)}\n`);

  return {
    className: classData.name,
    featureCount: features.length,
    subclassCount: subclassCount,
    choiceFeatures: choiceFeatures,
    scalingFeatures: scalingFeatures
  };
}

// ============================================================================
// STEP 12: Script Execution
// ============================================================================

function main() {
  console.log('🎲 D&D 2024 Class Data Transformation Script\n');
  console.log('='.repeat(60));

  const inputDir = './raw-data';
  const outputDir = './processed-data';

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Process Cleric only for Phase 1
  const classFiles = ['Cleric.json'];

  const results = [];

  for (const classFile of classFiles) {
    const inputPath = path.join(inputDir, classFile);
    const outputPath = path.join(outputDir, classFile);

    if (!fs.existsSync(inputPath)) {
      console.log(`❌ File not found: ${classFile}`);
      continue;
    }

    try {
      const result = transformClassData(inputPath, outputPath);
      results.push(result);
    } catch (error) {
      console.error(`❌ Error processing ${classFile}:`, error.message);
      console.error(error.stack);
    }
  }

  // Summary
  console.log('='.repeat(60));
  console.log('\n📊 Summary:\n');
  for (const result of results) {
    console.log(`${result.className}:`);
    console.log(`  - Features: ${result.featureCount}`);
    console.log(`  - Subclasses: ${result.subclassCount}`);
    console.log(`  - Choice features: ${result.choiceFeatures}`);
    console.log(`  - Scaling features: ${result.scalingFeatures}`);
  }

  console.log('\n✅ All classes processed successfully!\n');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  transformClassData,
  cleanDnDTags,
  processEntries,
  extractMechanics
};
