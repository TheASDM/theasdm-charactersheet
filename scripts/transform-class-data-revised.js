const fs = require('fs');
const path = require('path');

/**
 * D&D 2024 Class Data Transformation Script - PRODUCTION VERSION
 * Transforms 5etools class JSON into simplified format for character generator
 * Handles all 12 XPHB classes generically
 */

// ============================================================================
// STEP 1: Load and Filter Source Data
// ============================================================================

function loadClassData(filePath) {
  const rawData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const classEntry = rawData.class.find((c) => c.source === 'XPHB');

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
    rawData: rawData,
  };
}

// ============================================================================
// STEP 2: Build Feature Reference Map
// ============================================================================

function buildFeatureMap(rawData) {
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
          const key2 = `${feature.name}|${feature.className}|${source}|${subclassShort}||${feature.level}`;
          const key3 = `${feature.name}|${feature.className}||${subclassShort}||${feature.level}`;
          const key4 = `${feature.name}|${feature.className}|${source}|${subclassShort}|${feature.level}`;
          const key5 = `${feature.name}|${feature.className}|${source}|${feature.level}`;
          featureMap[key1] = feature;
          featureMap[key2] = feature;
          featureMap[key3] = feature;
          featureMap[key4] = feature;
          featureMap[key5] = feature;
        } else {
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
// HELPER FUNCTIONS
// ============================================================================

function generateId(...parts) {
  return parts
    .map((p) => String(p).toLowerCase())
    .join('-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ============================================================================
// STEP 8: Clean D&D Template Tags
// ============================================================================

function cleanDnDTags(text) {
  if (typeof text !== 'string') return '';

  let cleanText = text;

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
    /{@class ([^|}]+)(?:\|[^}]*)?}/g,
    /{@b ([^}]+)}/g,
    /{@i ([^}]+)}/g,
  ];

  for (const pattern of patterns) {
    cleanText = cleanText.replace(pattern, '$1');
  }

  cleanText = cleanText.replace(/\(@[a-z]+ ([^|)]+)(?:\|[^)]*)?\)/g, '$1');
  cleanText = cleanText.replace(/\s+/g, ' ').trim();

  return cleanText;
}

// ============================================================================
// TABLE AND LIST PROCESSING
// ============================================================================

function processTable(tableEntry) {
  const caption = tableEntry.caption || 'Table';
  let result = caption + ': ';

  if (tableEntry.rows) {
    const rows = tableEntry.rows.map((row) =>
      row.map((cell) => cleanDnDTags(String(cell))).join(' - ')
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

      if (text) items.push(text);
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

  if (!Array.isArray(entries)) return '';

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
      tables.push(entry);
      textParts.push(processTable(entry));
    } else if (entry.type === 'list') {
      textParts.push(processList(entry));
    } else if (
      entry.type === 'options' ||
      entry.type === 'refClassFeature' ||
      entry.type === 'refSubclassFeature'
    ) {
      continue;
    }
  }

  return textParts.join(' ').replace(/\s+/g, ' ').trim();
}

// ============================================================================
// IMPROVED: Extract Scaling From Tables
// ============================================================================

function extractScalingFromTable(table, featureName) {
  if (!table || !table.rows || !table.colLabels) {
    return [];
  }

  const scaling = [];

  // Find which column has the feature values
  let valueColumnIndex = -1;
  const lowerFeatureName = featureName.toLowerCase();

  for (let i = 0; i < table.colLabels.length; i++) {
    const label = String(table.colLabels[i]).toLowerCase();
    if (label.includes(lowerFeatureName) ||
        label.includes('uses') ||
        label.includes('damage') ||
        label.includes('attacks') ||
        label.includes('die') ||
        /^\d+$/.test(label)) { // Pure number column
      valueColumnIndex = i;
      break;
    }
  }

  if (valueColumnIndex === -1 && table.colLabels.length >= 2) {
    valueColumnIndex = 1; // Default to second column
  }

  if (valueColumnIndex === -1) return []; // No valid column found

  // Parse rows
  for (const row of table.rows) {
    if (row.length < 2) continue;

    const levelInfo = String(row[0]);
    const value = String(row[valueColumnIndex]);

    // Parse level ranges: "1-5", "6-17", "18+", "5th", "11th"
    let minLevel, maxLevel;

    if (levelInfo.includes('-')) {
      const [min, max] = levelInfo
        .split('-')
        .map((s) => parseInt(s.replace(/\D/g, '')));
      minLevel = min;
      maxLevel = max;
    } else if (levelInfo.includes('+')) {
      minLevel = parseInt(levelInfo.replace(/\D/g, ''));
      maxLevel = 20;
    } else {
      minLevel = maxLevel = parseInt(levelInfo.replace(/\D/g, ''));
    }

    if (isNaN(minLevel)) continue;

    // Parse the value
    const cleanValue = cleanDnDTags(value);
    const changes = {};

    // Detect what kind of value this is
    if (/\d+d\d+/.test(cleanValue)) {
      changes.damage = cleanValue.match(/(\d+d\d+)/)[1];
    } else if (/\d+/.test(cleanValue)) {
      const num = parseInt(cleanValue.match(/\d+/)[1]);

      // Determine what this number represents based on feature name and table caption
      const caption = (table.caption || '').toLowerCase();
      const name = featureName.toLowerCase();

      if (name.includes('attack') || caption.includes('attack')) {
        changes.attacks = num;
      } else if (name.includes('rage') && caption.includes('damage')) {
        changes.damage = `+${num}`;
      } else {
        changes.uses = num;
      }
    }

    if (Object.keys(changes).length > 0) {
      // Add entry for min level, and for max if it's a range
      if (minLevel === maxLevel || minLevel === 1) {
        // Single level or starting level
        if (minLevel > 1) {
          // Don't add scaling for level 1
          scaling.push({ level: minLevel, changes });
        }
      } else {
        // Range - add for min level only
        scaling.push({ level: minLevel, changes });
      }
    }
  }

  return scaling;
}

// ============================================================================
// IMPROVED: Extract Uses Scaling From Tables
// ============================================================================

function extractUsesFromTable(table) {
  if (!table || !table.rows) return [];

  const scaling = [];
  let usesColumnIndex = -1;

  // Find the column with uses/numbers
  for (let i = 0; i < table.colLabels.length; i++) {
    const label = String(table.colLabels[i]).toLowerCase();
    if (label.includes('use') || label.includes('channel') || /^\d+$/.test(label)) {
      usesColumnIndex = i;
      break;
    }
  }

  if (usesColumnIndex === -1) {
    usesColumnIndex = 1; // Default to second column
  }

  for (const row of table.rows) {
    if (row.length < 2) continue;

    const levelText = String(row[0]);
    const valueText = String(row[usesColumnIndex]);

    // Parse level range
    let minLevel;
    if (levelText.includes('-')) {
      [minLevel] = levelText.split('-').map(s => parseInt(s.replace(/\D/g, '')));
    } else {
      minLevel = parseInt(levelText.replace(/\D/g, ''));
    }

    if (isNaN(minLevel) || minLevel <= 1) continue;

    // Parse uses
    const uses = parseInt(valueText.replace(/\D/g, ''));
    if (!isNaN(uses)) {
      scaling.push({ level: minLevel, changes: { uses } });
    }
  }

  return scaling;
}

// ============================================================================
// STEP 9: Extract Mechanics (IMPROVED)
// ============================================================================

function extractMechanics(entries, tables = [], featureName = '') {
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
    scales: false,
  };

  // Extract dice rolls
  const dicePattern = /(\d+d\d+(?:\s*[+\-]\s*\d+)?)/g;
  const diceMatches = fullText.match(dicePattern);
  if (diceMatches) {
    mechanics.diceRolls = [...new Set(diceMatches)];
  }

  // Extract damage types
  const damageTypes = [
    'fire',
    'cold',
    'lightning',
    'thunder',
    'poison',
    'acid',
    'necrotic',
    'radiant',
    'force',
    'psychic',
    'slashing',
    'bludgeoning',
    'piercing',
  ];
  for (const type of damageTypes) {
    if (fullText.toLowerCase().includes(type)) {
      mechanics.damageTypes.push(type);
    }
  }
  mechanics.damageTypes = [...new Set(mechanics.damageTypes)];

  // Extract abilities
  const abilities = [
    'strength',
    'dexterity',
    'constitution',
    'intelligence',
    'wisdom',
    'charisma',
  ];
  for (const ability of abilities) {
    if (new RegExp(ability, 'i').test(fullText)) {
      mechanics.abilities.push(ability);
    }
  }
  mechanics.abilities = [...new Set(mechanics.abilities)];

  // Extract action type
  if (/as (?:a )?(?:Magic )?action/i.test(fullText)) {
    mechanics.actionType = 'action';
  } else if (/bonus action/i.test(fullText)) {
    mechanics.actionType = 'bonus-action';
  } else if (/reaction/i.test(fullText)) {
    mechanics.actionType = 'reaction';
  } else if (/no action required/i.test(fullText)) {
    mechanics.actionType = 'free';
  }

  // Extract range
  const rangeMatch = fullText.match(/within (\d+) feet/);
  if (rangeMatch) {
    mechanics.range = rangeMatch[1] + ' feet';
  } else if (/\btouch\b/i.test(fullText)) {
    mechanics.range = 'touch';
  } else if (/\bself\b/i.test(fullText)) {
    mechanics.range = 'self';
  }

  // Extract duration
  const durationMatch = fullText.match(
    /(?:for |lasts? )(\d+ (?:minute|hour|day|round|turn)s?)/i
  );
  if (durationMatch) {
    mechanics.duration = durationMatch[1];
  } else if (/instantaneous/i.test(fullText)) {
    mechanics.duration = 'instantaneous';
  } else if (/until you finish/i.test(fullText)) {
    mechanics.duration = 'until rest';
  }

  // Extract proficiencies
  const profPattern = /(?:proficiency|proficient) (?:with|in) ([^.]+)/gi;
  const profMatches = [...fullText.matchAll(profPattern)];
  for (const match of profMatches) {
    mechanics.proficiencies.push(cleanDnDTags(match[1]).toLowerCase());
  }

  // Extract spell grants
  if (/you (?:learn|know)/i.test(fullText)) {
    const spellPattern = /{@spell ([^|}]+)/g;
    const originalText = JSON.stringify(entries);
    const spellMatches = [...originalText.matchAll(spellPattern)];
    for (const match of spellMatches) {
      mechanics.spellsGranted.push(match[1]);
    }
  }

  // IMPROVED: Detect scaling
  const scalingKeywords = [
    'increases to',
    'at level',
    'when you reach',
    'at higher levels',
    'improved',
    'additional',
    'beginning at',
    'by level',
    'starting at',
  ];

  for (const keyword of scalingKeywords) {
    if (fullText.toLowerCase().includes(keyword)) {
      mechanics.scales = true;
      break;
    }
  }

  // Extract scaling progression
  const scalingProgression = [];

  if (mechanics.scales) {
    // First try: parenthetical format "7 (2d8), 13 (3d8)"
    const parentheticalPattern = /\b(\d+)(?:st|nd|rd|th)?\s*\(([^)]+)\)/g;
    const parentheticalMatches = [...fullText.matchAll(parentheticalPattern)];

    if (parentheticalMatches.length > 0) {
      for (const match of parentheticalMatches) {
        const level = parseInt(match[1]);
        const value = match[2].trim();
        const changes = {};

        if (/\d+d\d+/.test(value)) {
          changes.damage = value.match(/(\d+d\d+)/)[1];
        } else if (/\d+\s*attacks?/i.test(value)) {
          changes.attacks = parseInt(value.match(/(\d+)/)[1]);
        } else if (/\d+/.test(value)) {
          const num = parseInt(value.match(/(\d+)/)[1]);
          // Context-based interpretation
          if (featureName.toLowerCase().includes('attack')) {
            changes.attacks = num;
          } else {
            changes.uses = num;
          }
        }

        if (Object.keys(changes).length > 0) {
          scalingProgression.push({ level, changes });
        }
      }
    }

    // Second try: table-based scaling
    if (scalingProgression.length === 0 && tables.length > 0) {
      const tableScaling = extractScalingFromTable(tables[0], featureName);
      scalingProgression.push(...tableScaling);
    }

    // Third try: general pattern
    if (scalingProgression.length === 0) {
      const levelPattern =
        /(?:at|when you reach|starting at|beginning at|by)\s+(?:level\s+)?(\d+)(?:st|nd|rd|th)?/gi;
      const levelMatches = [...fullText.matchAll(levelPattern)];

      for (const match of levelMatches) {
        const level = parseInt(match[1]);
        if (level <= 1) continue; // Skip level 1

        // Look both backward AND forward from the level mention to find associated values
        const contextStart = Math.max(0, match.index - 50);
        const contextEnd = Math.min(match.index + 150, fullText.length);
        const context = fullText.substring(contextStart, contextEnd);

        const changes = {};

        const damageMatch = context.match(/(\d+d\d+)/);
        if (damageMatch) {
          changes.damage = damageMatch[1];
        }

        const attackMatch = context.match(/(\d+)\s*(?:attacks?|times?)/i);
        if (attackMatch && featureName.toLowerCase().includes('attack')) {
          changes.attacks = parseInt(attackMatch[1]);
        }

        // Match both numeric and word forms: "twice", "three times", "2 uses"
        // Try word forms first (more specific), then numeric forms
        let usesValue = null;
        const wordMatch = context.match(/\b(once|twice|thrice|three times?|four times?)\b/i);
        if (wordMatch) {
          const wordToNumber = {
            'once': 1,
            'twice': 2,
            'thrice': 3,
            'three times': 3,
            'three time': 3,
            'four times': 4,
            'four time': 4
          };
          usesValue = wordToNumber[wordMatch[1].toLowerCase().trim()];
        }

        // If no word match, try numeric form: "2 uses", "3 times"
        if (!usesValue) {
          const numMatch = context.match(/(\d+)\s*(?:times?|uses?)\b/i);
          if (numMatch) {
            usesValue = parseInt(numMatch[1]);
          }
        }

        // Only set uses if we have a value and it's not an attack count
        if (usesValue && !changes.attacks) {
          changes.uses = usesValue;
        }

        if (Object.keys(changes).length > 0) {
          scalingProgression.push({ level, changes });
        }
      }
    }

    if (scalingProgression.length === 0) {
      console.warn(
        `  ⚠️  Scaling keywords found but no progression detected for: ${featureName}`
      );
    }
  }

  return { mechanics, scalingProgression };
}

// ============================================================================
// IMPROVED: Choice Detection
// ============================================================================

function detectFeatureStructure(feature) {
  if (!feature.entries) {
    return { type: 'single', options: [] };
  }

  const firstText = feature.entries.find((e) => typeof e === 'string') || '';
  const allText = JSON.stringify(feature.entries);

  let choiceOptions = [];
  let hasOptions = false;

  // Find options or ref entries
  for (const entry of feature.entries) {
    if (entry && entry.type === 'options') {
      hasOptions = true;
      choiceOptions = entry.entries || [];
      break;
    }
    if (entry && entry.type === 'entries' && entry.entries) {
      const allRefs = entry.entries.every(
        (e) =>
          e && (e.type === 'refClassFeature' || e.type === 'refSubclassFeature')
      );
      if (allRefs && entry.entries.length > 1) {
        hasOptions = true;
        choiceOptions = entry.entries;
        break;
      }
    }
  }

  if (!hasOptions) {
    return { type: 'single', options: [] };
  }

  // IMPROVED: Flexible detection

  // Granted options patterns (you get ALL of them, choose which to use each time)
  const grantedPatterns = [
    /you (?:start with|gain).+(?:effects?|options?)/i,
    /each time you use/i,
    /choose which.+(?:effect|option).+to (?:create|use)/i,
    /you can use.+(?:in the following ways|as follows)/i,
  ];

  const isGranted = grantedPatterns.some(
    (pattern) => pattern.test(firstText) || pattern.test(allText)
  );

  // Permanent choice patterns (you pick ONE forever)
  const choicePatterns = [
    /(?:you (?:gain|choose|select|learn)).+(?:of your )?choice/i,
    /choose (?:one|two|three|\d+) (?:of the following|from)/i,
    /gain (?:one|a).+of the following/i,
    /select.+from.+list/i,
    /pick.+following/i,
  ];

  const isChoice = choicePatterns.some(
    (pattern) => pattern.test(firstText) || pattern.test(allText)
  );

  // Disambiguate when both patterns match
  if (isGranted && isChoice) {
    // If it explicitly says "each time" or "choose which", it's granted
    if (/each time/i.test(firstText) || /choose which/i.test(firstText)) {
      return { type: 'granted', options: choiceOptions };
    }
    // Otherwise it's a choice
    return { type: 'choice', options: choiceOptions };
  }

  if (isGranted) {
    return { type: 'granted', options: choiceOptions };
  }

  if (isChoice) {
    return { type: 'choice', options: choiceOptions };
  }

  // Default to choice if we found options but can't classify
  return { type: 'choice', options: choiceOptions };
}

// ============================================================================
// PROCESS SINGLE FEATURE
// ============================================================================

function processSingleFeature(
  name,
  entries,
  level,
  source,
  page,
  featureType = 'base',
  featureMap = {}
) {
  const isDomainSpells =
    name.includes('Domain Spells') || name.includes('Spells');
  let structuredSpells = null;

  if (isDomainSpells && Array.isArray(entries)) {
    const spellTable = entries.find(
      (e) => e.type === 'table' && e.caption && e.caption.includes('Spells')
    );
    if (spellTable && spellTable.rows) {
      structuredSpells = {};
      for (const row of spellTable.rows) {
        if (row.length >= 2) {
          const levelMatch = row[0].match(/(\d+)/);
          if (levelMatch) {
            const lvl = levelMatch[1];
            const spellPattern = /{@spell ([^|}]+)(?:\|[^}]*)?}/g;
            const spells = [];
            let match;
            while ((match = spellPattern.exec(row[1])) !== null) {
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

  const refSubclassFeatures = [];
  if (Array.isArray(entries)) {
    for (const entry of entries) {
      if (entry && entry.type === 'refSubclassFeature') {
        refSubclassFeatures.push(entry.subclassFeature);
      }
    }
  }

  if (refSubclassFeatures.length > 0 && featureType === 'subclass') {
    const expandedFeatures = [];
    for (const refKey of refSubclassFeatures) {
      const resolved = featureMap[refKey];
      if (resolved) {
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
      }
    }
    if (expandedFeatures.length > 0) {
      return expandedFeatures;
    }
  }

  const tables = [];
  const description = processEntries(entries, tables);
  const { mechanics, scalingProgression } = extractMechanics(
    entries,
    tables,
    name
  );

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
    scalingProgression: scalingProgression,
  };

  return [feature];
}

// ============================================================================
// PROCESS GRANTED OPTIONS
// ============================================================================

function processGrantedOptionsFeature(
  parentFeature,
  grantedOptions,
  level,
  featureMap,
  featureType = 'base'
) {
  const features = [];

  const tables = [];
  const description = processEntries(parentFeature.entries || [], tables);
  const { mechanics, scalingProgression } = extractMechanics(
    parentFeature.entries || [],
    tables,
    parentFeature.name
  );

  // Extract uses
  const usesMatch = description.match(
    /you can use.+?(twice|once|thrice|four times|\d+\s*times?)/i
  );
  if (usesMatch) {
    const wordToNumber = { once: 1, twice: 2, thrice: 3, 'four times': 4 };
    const usesValue = usesMatch[1]
      .toLowerCase()
      .replace(/\s*times?/i, '')
      .trim();
    mechanics.uses = wordToNumber[usesValue] || parseInt(usesValue) || 1;
  }

  if (/short rest/i.test(description) && /long rest/i.test(description)) {
    mechanics.rechargeOn = ['short-rest', 'long-rest'];
  } else if (/long rest/i.test(description)) {
    mechanics.rechargeOn = ['long-rest'];
  }

  // IMPROVED: Generic table-based scaling
  let finalScalingProgression = scalingProgression;
  if (
    tables.length > 0 &&
    /as shown in the .+ (?:column|table)/i.test(description)
  ) {
    const tableScaling = extractScalingFromTable(tables[0], parentFeature.name);
    if (tableScaling.length > 0) {
      finalScalingProgression = tableScaling;
      mechanics.scales = true;
    } else {
      // Fallback: Check for known patterns in table
      const usesScaling = extractUsesFromTable(tables[0]);
      if (usesScaling.length > 0) {
        finalScalingProgression = usesScaling;
        mechanics.scales = true;
      }
    }
  }

  // Fallback: Known table references that can't be parsed from text
  if (finalScalingProgression.length === 0 && /as shown in the .+ column/i.test(description)) {
    const KNOWN_TABLE_SCALING = {
      'Channel Divinity': [
        { level: 6, changes: { uses: 3 } },
        { level: 18, changes: { uses: 4 } }
      ],
      'Second Wind': [
        { level: 10, changes: { uses: 3 } },
        { level: 17, changes: { uses: 4 } }
      ],
      'Weapon Mastery': [
        { level: 4, changes: { weapons: 4 } },
        { level: 10, changes: { weapons: 5 } }
      ]
    };

    if (KNOWN_TABLE_SCALING[parentFeature.name]) {
      finalScalingProgression = KNOWN_TABLE_SCALING[parentFeature.name];
      mechanics.scales = true;
    }
  }

  const grantedOptionIds = [];

  for (const option of grantedOptions) {
    let actualFeature = option;

    if (
      option.type === 'refClassFeature' ||
      option.type === 'refSubclassFeature'
    ) {
      const refKey = option.classFeature || option.subclassFeature;
      const resolved = featureMap[refKey];
      if (resolved) {
        actualFeature = resolved;
      } else {
        console.warn(
          `  ⚠️  Could not resolve granted option reference: ${refKey}`
        );
        continue;
      }
    }

    if (!actualFeature.name || !actualFeature.entries) continue;

    const optionTables = [];
    const optionDescription = processEntries(
      actualFeature.entries,
      optionTables
    );
    const {
      mechanics: optionMechanics,
      scalingProgression: optionScalingProgression,
    } = extractMechanics(
      actualFeature.entries,
      optionTables,
      actualFeature.name
    );

    const optionId = generateId(actualFeature.name, level);
    grantedOptionIds.push(optionId);

    features.push({
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
      scalingProgression: optionScalingProgression,
    });
  }

  const parent = {
    id: generateId(parentFeature.name, level),
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
    scalingProgression: finalScalingProgression,
  };

  return [parent, ...features];
}

// ============================================================================
// PROCESS CHOICE FEATURE
// ============================================================================

function processChoiceFeature(
  parentName,
  choiceOptions,
  level,
  featureMap,
  featureType = 'base'
) {
  const features = [];
  const choiceGroup = generateId(parentName, level);

  for (const option of choiceOptions) {
    let actualFeature = option;

    if (
      option.type === 'refClassFeature' ||
      option.type === 'refSubclassFeature'
    ) {
      const refKey = option.classFeature || option.subclassFeature;
      const resolved = featureMap[refKey];
      if (resolved) {
        actualFeature = resolved;
      } else {
        console.warn(`  ⚠️  Could not resolve reference: ${refKey}`);
        continue;
      }
    }

    if (!actualFeature.name || !actualFeature.entries) continue;

    const tables = [];
    const description = processEntries(actualFeature.entries, tables);
    const { mechanics, scalingProgression } = extractMechanics(
      actualFeature.entries,
      tables,
      actualFeature.name
    );

    features.push({
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
      scalingProgression: scalingProgression,
    });
  }

  return features;
}

// ============================================================================
// PROCESS FEATURE (MAIN ROUTING)
// ============================================================================

function processFeature(featureRef, level, featureMap, featureType = 'base') {
  let feature = null;

  if (typeof featureRef === 'string') {
    feature = featureMap[featureRef];
    if (!feature) {
      console.warn(`  ⚠️  Feature not found: ${featureRef}`);
      return [];
    }
  } else if (featureRef.classFeature) {
    feature = featureMap[featureRef.classFeature];
    if (!feature) {
      console.warn(`  ⚠️  Feature not found: ${featureRef.classFeature}`);
      return [];
    }
  } else {
    feature = featureRef;
  }

  if (!feature || !feature.name) return [];

  // IMPROVED: Use new detection function
  const structure = detectFeatureStructure(feature);

  if (structure.type === 'choice') {
    return processChoiceFeature(
      feature.name,
      structure.options,
      level,
      featureMap,
      featureType
    );
  } else if (structure.type === 'granted') {
    return processGrantedOptionsFeature(
      feature,
      structure.options,
      level,
      featureMap,
      featureType
    );
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
// IMPROVED: Consolidate Repeated Features (Extra Attack, etc.)
// ============================================================================

function consolidateRepeatedFeatures(features) {
  // Features that repeat at multiple levels and should NOT be consolidated
  const REPEATING_FEATURES = [
    'Ability Score Improvement',
    'Epic Boon',
    'Proficiency Versatility',
    'Subclass Feature'
  ];

  const featuresByName = {};
  const consolidated = [];

  for (const feature of features) {
    // Normalize feature name by removing parentheses and number prefixes
    let baseName = feature.name.replace(/\s*\(.*?\)\s*/g, '').trim();
    baseName = baseName.replace(/^(Two|Three|Four|Five)\s+/i, '').trim();
    // Normalize plural to singular for better consolidation
    baseName = baseName.replace(/s$/i, '');

    // Skip consolidation for features that are meant to repeat
    if (REPEATING_FEATURES.includes(baseName)) {
      consolidated.push(feature);
      continue; // Don't add to featuresByName
    }

    if (!featuresByName[baseName]) {
      featuresByName[baseName] = [];
    }
    featuresByName[baseName].push(feature);
  }

  for (const [baseName, instances] of Object.entries(featuresByName)) {
    if (instances.length === 1) {
      consolidated.push(instances[0]);
    } else {
      // Multiple instances - check if they should be consolidated
      const levels = instances.map((f) => f.level).sort((a, b) => a - b);
      const firstInstance = instances.find((f) => f.level === levels[0]);

      // Check if these are upgrades (same base name, different levels)
      const areUpgrades = instances.every((f) => {
        let otherName = f.name.replace(/\s*\(.*?\)\s*/g, '').trim();
        otherName = otherName.replace(/^(Two|Three|Four|Five)\s+/i, '').trim();
        otherName = otherName.replace(/s$/i, '');
        return otherName === baseName;
      });

      if (areUpgrades && levels.length > 1) {
        // Consolidate into one feature with scaling
        const scalingProgression = [];

        for (let i = 1; i < instances.length; i++) {
          const instance = instances[i];
          const changes = {};

          // Try to extract what changes
          if (instance.mechanics.diceRolls.length > 0) {
            changes.damage = instance.mechanics.diceRolls[0];
          }

          // Check description for attack count
          const attackMatch = instance.description.match(
            /(\d+)\s*times?|(\d+)\s*attacks?/i
          );
          if (attackMatch) {
            changes.attacks = parseInt(attackMatch[1] || attackMatch[2]);
          }

          if (Object.keys(changes).length > 0) {
            scalingProgression.push({
              level: instance.level,
              changes: changes,
            });
          }
        }

        // Merge scaling progressions
        const existingScaling = firstInstance.mechanics?.scalingProgression || [];
        const allScaling = [
          ...existingScaling,
          ...scalingProgression,
        ];

        consolidated.push({
          ...firstInstance,
          mechanics: {
            ...firstInstance.mechanics,
            scales: allScaling.length > 0,
            scalingProgression: allScaling,
          }
        });
      } else {
        // Not upgrades, keep separate
        consolidated.push(...instances);
      }
    }
  }

  return consolidated;
}

// ============================================================================
// PROCESS CLASS FEATURES
// ============================================================================

function processClassFeatures(classFeatures, featureMap) {
  const transformedFeatures = [];

  for (const featureRef of classFeatures) {
    if (typeof featureRef === 'string') {
      const parts = featureRef.split('|');
      const level = parseInt(parts[3]) || 1;
      const processed = processFeature(featureRef, level, featureMap, 'base');
      transformedFeatures.push(...processed);
    } else if (featureRef.classFeature) {
      const parts = featureRef.classFeature.split('|');
      const level = parseInt(parts[3]) || 1;
      const processed = processFeature(featureRef, level, featureMap, 'base');
      transformedFeatures.push(...processed);
    }
  }

  // IMPROVED: Consolidate repeated features
  return consolidateRepeatedFeatures(transformedFeatures);
}

// ============================================================================
// PROCESS SUBCLASS FEATURES
// ============================================================================

function processSubclassFeatures(rawData, featureMap) {
  const subclassFeatures = {};

  if (!rawData.subclass) return subclassFeatures;

  for (const subclass of rawData.subclass) {
    if (subclass.classSource !== 'XPHB') continue;

    const subclassName = subclass.name;
    const subclassFeatureList = [];

    if (subclass.subclassFeatures) {
      for (const featureRef of subclass.subclassFeatures) {
        if (typeof featureRef === 'string') {
          const parts = featureRef.split('|');
          const level = parseInt(parts[parts.length - 1]) || 3;

          const key1 = featureRef;
          const key2 = parts.slice(0, 4).join('|');
          const key3 = parts.slice(0, -1).join('|');

          let feature =
            featureMap[key1] || featureMap[key2] || featureMap[key3];

          if (!feature) {
            console.warn(`  ⚠️  Subclass feature not found: ${featureRef}`);
            continue;
          }

          const processed = processFeature(
            feature,
            level,
            featureMap,
            'subclass'
          );
          for (const f of processed) {
            f.subclass = subclassName;
            subclassFeatureList.push(f);
          }
        }
      }
    }

    if (subclassFeatureList.length > 0) {
      subclassFeatures[subclassName] =
        consolidateRepeatedFeatures(subclassFeatureList);
    }
  }

  return subclassFeatures;
}

// ============================================================================
// MAIN TRANSFORMATION
// ============================================================================

function transformClassData(inputPath, outputPath) {
  console.log(`\n📖 Processing: ${path.basename(inputPath)}`);

  const classData = loadClassData(inputPath);
  console.log(`  ✓ Loaded ${classData.name}`);

  const featureMap = buildFeatureMap(classData.rawData);
  console.log(
    `  ✓ Built feature map (${Object.keys(featureMap).length} features)`
  );

  const features = processClassFeatures(classData.classFeatures, featureMap);
  console.log(`  ✓ Processed ${features.length} base class features`);

  const subclasses = processSubclassFeatures(classData.rawData, featureMap);
  const subclassCount = Object.keys(subclasses).length;
  console.log(`  ✓ Processed ${subclassCount} subclasses`);

  const choiceFeatures = features.filter((f) => f.isChoice).length;
  const scalingFeatures = features.filter((f) => f.scales).length;

  console.log(`  ✓ Choice features: ${choiceFeatures}`);
  console.log(`  ✓ Scaling features: ${scalingFeatures}`);

  const output = {
    className: classData.name,
    source: classData.source,
    spellcasting: classData.spellcastingAbility
      ? {
          ability: classData.spellcastingAbility,
          progression: classData.casterProgression,
        }
      : null,
    features: features,
    subclasses: subclasses,
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`  ✅ Wrote output to ${path.basename(outputPath)}\n`);

  return {
    className: classData.name,
    featureCount: features.length,
    subclassCount: subclassCount,
    choiceFeatures: choiceFeatures,
    scalingFeatures: scalingFeatures,
  };
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

function main() {
  console.log(
    '🎲 D&D 2024 Class Data Transformation Script - PRODUCTION VERSION\n'
  );
  console.log('='.repeat(60));

  const inputDir = './raw-data';
  const outputDir = './processed-data';

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // All 12 classes
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
    'Wizard.json',
  ];

  const results = [];

  for (const classFile of classFiles) {
    const inputPath = path.join(inputDir, classFile);
    const outputPath = path.join(outputDir, classFile);

    if (!fs.existsSync(inputPath)) {
      console.log(`⚠️  File not found: ${classFile}`);
      continue;
    }

    try {
      const result = transformClassData(inputPath, outputPath);
      results.push(result);
    } catch (error) {
      console.error(`❌ Error processing ${classFile}:`, error.message);
    }
  }

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

if (require.main === module) {
  main();
}

module.exports = {
  transformClassData,
  cleanDnDTags,
  processEntries,
  extractMechanics,
};
