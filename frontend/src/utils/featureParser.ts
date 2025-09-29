import {
  CharacterFeature,
  FeatureType,
  FeatureSource,
  FeatureAction,
  FeatureResource,
  FeatureEffect,
  ActionType,
  ResourceType
} from '../types/features';
import { parseDnDTemplateTag, parseComplexDnDEntry } from './dndTemplateParser';

/**
 * Utilities for parsing raw D&D data into structured CharacterFeature objects
 */

/**
 * Parse class features from raw class data
 */
export function parseClassFeatures(
  classData: any,
  className: string,
  level: number = 1
): CharacterFeature[] {
  const features: CharacterFeature[] = [];

  if (!classData?.classFeatures) {
    return features;
  }

  try {
    if (Array.isArray(classData.classFeatures)) {
      // Handle array of features
      classData.classFeatures.forEach((feature: any) => {
        const parsed = parseFeatureFromData(feature, 'class', className, level);
        if (parsed) features.push(parsed);
      });
    } else if (typeof classData.classFeatures === 'object') {
      // Handle level-based features object
      for (let lvl = 1; lvl <= Math.min(level, 20); lvl++) {
        const levelFeatures = classData.classFeatures[lvl];
        if (levelFeatures) {
          if (Array.isArray(levelFeatures)) {
            levelFeatures.forEach((feature: any) => {
              const parsed = parseFeatureFromData(feature, 'class', className, lvl);
              if (parsed) features.push(parsed);
            });
          } else if (typeof levelFeatures === 'object') {
            Object.entries(levelFeatures).forEach(([name, description]) => {
              const parsed = createFeatureFromNameDescription(
                name,
                description as string,
                'class',
                className,
                lvl
              );
              features.push(parsed);
            });
          }
        }
      }
    }
  } catch (error) {
    console.warn('Error parsing class features:', error);
  }

  return features;
}

/**
 * Parse species traits from raw species data
 */
export function parseSpeciesTraits(
  speciesData: any,
  speciesName: string
): CharacterFeature[] {
  const traits: CharacterFeature[] = [];

  if (!speciesData?.traits && !speciesData?.speciesTraits) {
    return traits;
  }

  try {
    const traitsData = speciesData.traits || speciesData.speciesTraits || [];

    if (Array.isArray(traitsData)) {
      traitsData.forEach((trait: any) => {
        const parsed = parseFeatureFromData(trait, 'species', speciesName);
        if (parsed) traits.push(parsed);
      });
    }
  } catch (error) {
    console.warn('Error parsing species traits:', error);
  }

  return traits;
}

/**
 * Parse feat features from raw feat data
 */
export function parseFeatFeatures(
  featData: any,
  featName: string
): CharacterFeature[] {
  const features: CharacterFeature[] = [];

  if (!featData) {
    return features;
  }

  try {
    // Handle different feat data structures
    if (Array.isArray(featData)) {
      featData.forEach((feature: any) => {
        const parsed = parseFeatureFromData(feature, 'feat', featName);
        if (parsed) features.push(parsed);
      });
    } else if (featData.entries || featData.features) {
      const entries = featData.entries || featData.features;
      if (Array.isArray(entries)) {
        entries.forEach((entry: any) => {
          const parsed = parseFeatureFromData(entry, 'feat', featName);
          if (parsed) features.push(parsed);
        });
      }
    } else {
      // Single feature object
      const parsed = parseFeatureFromData(featData, 'feat', featName);
      if (parsed) features.push(parsed);
    }
  } catch (error) {
    console.warn('Error parsing feat features:', error);
  }

  return features;
}

/**
 * Parse background features from raw background data
 */
export function parseBackgroundFeatures(
  backgroundData: any,
  backgroundName: string
): CharacterFeature[] {
  const features: CharacterFeature[] = [];

  if (!backgroundData?.features && !backgroundData?.backgroundFeatures) {
    return features;
  }

  try {
    const featuresData = backgroundData.features || backgroundData.backgroundFeatures || [];

    console.log('🎯 BACKGROUND PROCESSING:', {
      backgroundName,
      featuresDataType: typeof featuresData,
      isArray: Array.isArray(featuresData),
      featuresData: featuresData
    });

    if (Array.isArray(featuresData)) {
      featuresData.forEach((feature: any, _index: number) => {
        const parsed = parseFeatureFromData(feature, 'background', backgroundName);
        if (parsed) features.push(parsed);
      });
    }
  } catch (error) {
    console.warn('Error parsing background features:', error);
  }

  return features;
}

/**
 * Parse a single feature from various data formats
 */
function parseFeatureFromData(
  data: any,
  source: FeatureSource,
  sourceDetail: string,
  level?: number
): CharacterFeature | null {
  if (!data) return null;

  try {
    // Handle string format
    if (typeof data === 'string') {
      return createFeatureFromString(data, source, sourceDetail, level);
    }

    // Handle object with name/description
    if (data.name || data.title) {
      const name = data.name || data.title;
      const description = extractDescription(data);
      return createFeatureFromNameDescription(name, description, source, sourceDetail, level);
    }

    // Handle complex object structures
    if (data.entries) {
      const name = data.name || 'Unnamed Feature';
      const description = processEntries(data.entries);
      return createFeatureFromNameDescription(name, description, source, sourceDetail, level);
    }

    return null;
  } catch (error) {
    console.warn('Error parsing feature data:', error);
    return null;
  }
}

/**
 * Create a feature from a simple string
 */
function createFeatureFromString(
  text: string,
  source: FeatureSource,
  sourceDetail: string,
  level?: number
): CharacterFeature {
  // Parse the raw text first
  const parsedText = parseDnDTemplateTag(text);

  // Try to extract name and description from "Name: Description" format
  const colonIndex = parsedText.indexOf(':');
  let name: string;
  let description: string;

  if (colonIndex > 0 && colonIndex < 50) {
    name = parsedText.substring(0, colonIndex).trim();
    description = parsedText.substring(colonIndex + 1).trim();
  } else {
    name = parsedText.length > 30 ? 'Feature' : parsedText;
    description = parsedText;
  }

  return createBasicFeature(name, description, source, sourceDetail, level);
}

/**
 * Create a feature from name and description
 */
function createFeatureFromNameDescription(
  name: string,
  description: string,
  source: FeatureSource,
  sourceDetail: string,
  level?: number
): CharacterFeature {
  // Parse the description using the D&D template parser
  const parsedDescription = parseDnDTemplateTag(description);
  return createBasicFeature(name, parsedDescription, source, sourceDetail, level);
}

/**
 * Create a basic feature with intelligent type detection
 */
function createBasicFeature(
  name: string,
  description: string,
  source: FeatureSource,
  sourceDetail: string,
  level?: number
): CharacterFeature {
  const id = generateFeatureId(name, source, sourceDetail);
  const type = detectFeatureType(name, description);
  const action = detectActionType(description);
  const resource = detectResourceUsage(description);
  const effects = detectEffects(description);

  const feature: CharacterFeature = {
    id,
    name,
    source,
    sourceDetail,
    type,
    description,
    shortDescription: generateShortDescription(description),
    category: categorizeFeature(name, description, source),
    tags: generateTags(name, description)
  };

  // Add optional properties only if they exist
  if (level !== undefined) feature.level = level;
  if (action) {
    feature.action = action;
  }
  if (resource) {
    feature.resource = resource;
  }
  if (effects && effects.length > 0) {
    feature.effects = effects;
  }

  return feature;
}

/**
 * Extract description from complex objects
 */
function extractDescription(data: any): string {
  if (typeof data.description === 'string') {
    return parseDnDTemplateTag(data.description);
  }

  if (Array.isArray(data.description)) {
    return processEntries(data.description);
  }

  if (data.entries) {
    return processEntries(data.entries);
  }

  if (data.text) {
    return parseDnDTemplateTag(data.text);
  }

  // Safeguard: if description is an object, convert to string
  if (typeof data.description === 'object' && data.description !== null) {
    console.warn('Found object description, converting to string:', data.description);
    return JSON.stringify(data.description);
  }

  return 'No description available';
}

/**
 * Process complex entries arrays into readable text
 */
function processEntries(entries: any[]): string {
  if (!Array.isArray(entries)) {
    if (typeof entries === 'string') return parseDnDTemplateTag(entries);
    if (typeof entries === 'object' && entries !== null) {
      console.warn('processEntries received non-array object, converting:', entries);
      return parseComplexDnDEntry(entries);
    }
    return '';
  }

  return entries.map(entry => {
    if (typeof entry === 'string') {
      return parseDnDTemplateTag(entry);
    }

    // Use the existing complex parser for objects
    const result = parseComplexDnDEntry(entry);

    // Ensure we always return a string
    if (typeof result !== 'string') {
      console.warn('parseComplexDnDEntry returned non-string:', result);
      return JSON.stringify(result);
    }

    return result;
  }).filter(Boolean).join(' ');
}

/**
 * Generate unique feature ID
 */
function generateFeatureId(name: string, source: FeatureSource, sourceDetail: string): string {
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `${source}-${sourceDetail.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${cleanName}`;
}

/**
 * Detect feature type from name and description
 */
function detectFeatureType(name: string, description: string): FeatureType {
  const lowerName = name.toLowerCase();
  const lowerDesc = description.toLowerCase();

  // Resource-based features
  if (lowerDesc.includes('once per') || lowerDesc.includes('regain') ||
      lowerDesc.includes('expend') || lowerDesc.includes('charges')) {
    return 'resource';
  }

  // Active abilities
  if (lowerDesc.includes('as an action') || lowerDesc.includes('bonus action') ||
      lowerName.includes('surge') || lowerName.includes('strike')) {
    return 'active';
  }

  // Reactions
  if (lowerDesc.includes('reaction') || lowerDesc.includes('when you')) {
    return 'reaction';
  }

  // Choices/options
  if (lowerDesc.includes('choose') || lowerDesc.includes('select') ||
      lowerName.includes('style') || lowerName.includes('expertise')) {
    return 'choice';
  }

  // Upgrades
  if (lowerName.includes('extra') || lowerName.includes('improved') ||
      lowerName.includes('enhanced')) {
    return 'upgrade';
  }

  // Conditional benefits
  if (lowerDesc.includes('advantage') || lowerDesc.includes('when') ||
      lowerDesc.includes('against') || lowerDesc.includes('if you')) {
    return 'conditional';
  }

  // Default to passive
  return 'passive';
}

/**
 * Detect action type from description
 */
function detectActionType(description: string): FeatureAction | undefined {
  const lowerDesc = description.toLowerCase();

  let actionType: ActionType = 'passive';

  if (lowerDesc.includes('as an action')) actionType = 'action';
  else if (lowerDesc.includes('bonus action')) actionType = 'bonus-action';
  else if (lowerDesc.includes('reaction')) actionType = 'reaction';
  else if (lowerDesc.includes('no action') || lowerDesc.includes('free')) actionType = 'free';

  if (actionType === 'passive') return undefined;

  // Defensive check: ensure actionType is a string
  const safeActionType = typeof actionType === 'string' ? actionType : 'action';

  return { type: safeActionType as ActionType };
}

/**
 * Detect resource usage from description
 */
function detectResourceUsage(description: string): FeatureResource | undefined {
  const lowerDesc = description.toLowerCase();

  if (lowerDesc.includes('once per turn')) {
    return { type: 'per-turn', maxUses: 1 };
  }

  if (lowerDesc.includes('once per short rest') || lowerDesc.includes('recharge on short')) {
    return { type: 'per-short-rest', maxUses: 1 };
  }

  if (lowerDesc.includes('once per long rest') || lowerDesc.includes('recharge on long')) {
    return { type: 'per-long-rest', maxUses: 1 };
  }

  // Look for specific number of uses
  const usesMatch = lowerDesc.match(/(\d+)\s*(?:time|use)s?\s*per\s*(turn|round|short rest|long rest|day)/);
  if (usesMatch) {
    const uses = parseInt(usesMatch[1]);
    const period = usesMatch[2];

    let type: ResourceType = 'per-day';
    if (period.includes('turn')) type = 'per-turn';
    else if (period.includes('round')) type = 'per-round';
    else if (period.includes('short')) type = 'per-short-rest';
    else if (period.includes('long')) type = 'per-long-rest';

    return { type, maxUses: uses };
  }

  return undefined;
}

/**
 * Detect mechanical effects from description
 */
function detectEffects(description: string): FeatureEffect[] {
  const effects: FeatureEffect[] = [];
  const lowerDesc = description.toLowerCase();

  // Advantage/Disadvantage
  if (lowerDesc.includes('advantage on')) {
    const match = lowerDesc.match(/advantage on ([^.]+)/);
    if (match) {
      effects.push({
        type: 'advantage',
        target: match[1].trim()
      });
    }
  }

  // Resistance
  if (lowerDesc.includes('resistance to')) {
    const match = lowerDesc.match(/resistance to ([^.]+)/);
    if (match) {
      effects.push({
        type: 'resistance',
        target: match[1].trim()
      });
    }
  }

  // Proficiency
  if (lowerDesc.includes('proficient') || lowerDesc.includes('proficiency')) {
    effects.push({
      type: 'proficiency',
      target: 'Various skills/tools'
    });
  }

  return effects;
}

/**
 * Categorize feature for organization
 */
function categorizeFeature(name: string, description: string, source: FeatureSource): string {
  const lowerName = name.toLowerCase();
  const lowerDesc = description.toLowerCase();

  if (source === 'species') return 'Species Trait';
  if (source === 'background') return 'Background Feature';
  if (source === 'feat') return 'Feat';

  // Combat features
  if (lowerDesc.includes('attack') || lowerDesc.includes('damage') ||
      lowerDesc.includes('weapon') || lowerName.includes('fighting')) {
    return 'Combat';
  }

  // Magic features
  if (lowerDesc.includes('spell') || lowerDesc.includes('magic') ||
      lowerDesc.includes('cantrip')) {
    return 'Magic';
  }

  // Social features
  if (lowerDesc.includes('persuasion') || lowerDesc.includes('deception') ||
      lowerDesc.includes('insight')) {
    return 'Social';
  }

  // Utility features
  if (lowerDesc.includes('skill') || lowerDesc.includes('tool') ||
      lowerDesc.includes('language')) {
    return 'Utility';
  }

  return 'General';
}

/**
 * Generate tags for filtering
 */
function generateTags(name: string, description: string): string[] {
  const tags: string[] = [];
  const combined = (name + ' ' + description).toLowerCase();

  if (combined.includes('magic') || combined.includes('spell')) tags.push('magical');
  if (combined.includes('combat') || combined.includes('attack')) tags.push('combat');
  if (combined.includes('heal') || combined.includes('restoration')) tags.push('healing');
  if (combined.includes('detect') || combined.includes('sense')) tags.push('detection');
  if (combined.includes('move') || combined.includes('speed')) tags.push('movement');
  if (combined.includes('social') || combined.includes('persuasion')) tags.push('social');

  return tags;
}

/**
 * Generate short description for compact display
 */
function generateShortDescription(description: string): string {
  if (description.length <= 60) return description;

  const sentences = description.split(/[.!?]/);
  const firstSentence = sentences[0]?.trim();

  if (firstSentence && firstSentence.length <= 60) {
    return firstSentence + '.';
  }

  return description.substring(0, 57) + '...';
}