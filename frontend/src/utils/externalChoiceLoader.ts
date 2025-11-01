import { logger } from './logger';
/**
 * External Choice Data Loader
 *
 * Loads choice options from external data files (Fighting Styles, Eldritch Invocations, etc.)
 * and filters them based on character prerequisites
 */

import { ExternalReference, ClassFeature } from '../types/classFeatures';

/**
 * Eldritch Invocation from EldritchInvocations.json
 */
export interface EldritchInvocation {
  id: string;
  name: string;
  prerequisite: string | null;
  level: number;
  repeatable: boolean;
  description: string;
}

/**
 * Fighting Style from FightingStyles.json
 */
export interface FightingStyle {
  id: string;
  name: string;
  prerequisite: string | null;
  description: string;
  category: string;
}

/**
 * Load external choice options based on the reference
 */
export async function loadExternalChoiceData(
  externalRef: ExternalReference,
  characterLevel: number,
  existingChoices: Record<string, string[]> = {}
): Promise<ClassFeature[]> {
  switch (externalRef.type) {
    case 'invocations':
      return loadInvocations(externalRef, characterLevel, existingChoices);
    case 'feat':
      return loadFightingStyles(externalRef);
    case 'skills':
      return loadSkillOptions(externalRef);
    default:
      logger.warn(`Unknown external reference type: ${externalRef.type}`);
      return [];
  }
}

/**
 * Load Eldritch Invocations and filter by prerequisites
 */
async function loadInvocations(
  externalRef: ExternalReference,
  characterLevel: number,
  existingChoices: Record<string, string[]>
): Promise<ClassFeature[]> {
  try {
    const response = await fetch(`/processed-data/${externalRef.dataFile}`);
    if (!response.ok) {
      throw new Error(`Failed to load ${externalRef.dataFile}: ${response.status}`);
    }

    const data = await response.json();
    const invocations: EldritchInvocation[] = data.invocations || [];

    // Filter by prerequisites if enabled
    const filtered = externalRef.filterByPrerequisites
      ? invocations.filter((inv) => meetsInvocationPrerequisites(inv, characterLevel, existingChoices))
      : invocations;

    // Convert to ClassFeature format for UI
    return filtered.map((inv) => convertInvocationToFeature(inv));
  } catch (error) {
    logger.error('Failed to load invocations:', error);
    return [];
  }
}

/**
 * Load Fighting Style feats from the database API
 */
async function loadFightingStyles(externalRef: ExternalReference): Promise<ClassFeature[]> {
  try {
    // Import the featsService dynamically to avoid circular dependencies
    const { listFeatsByCategory } = await import('../services/featsService');

    // Fetch Fighting Style feats from the API
    const category = externalRef.category || 'Fighting Style';
    const categoryFallbacks = category === 'Fighting Style'
      ? [category, 'FS']
      : [category];

    let styles: any[] = [];
    let lastError: string | undefined;

    for (const categoryOption of categoryFallbacks) {
      const result = await listFeatsByCategory(categoryOption);
      if (!result.ok) {
        lastError = result.error;
        continue;
      }

      styles = result.data || [];
      if (styles.length > 0) {
        break;
      }
    }

    if (styles.length === 0) {
      throw new Error(lastError || 'No fighting styles found');
    }

    // Convert to ClassFeature format for UI
    const options = styles.map((style) => convertFeatToClassFeature(style));

    if (externalRef.allowCustomOption && externalRef.customOption) {
      const customOptionId = externalRef.customOption.id;
      const hasExistingOption = options.some((option) => option.id === customOptionId);

      if (!hasExistingOption) {
        options.push({
          id: customOptionId,
          name: externalRef.customOption.name,
          level: 1,
          source: externalRef.source || 'XPHB',
          page: 0,
          featureType: 'base',
          description: externalRef.customOption.description,
          mechanics: {
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
          },
          isChoice: true,
          requiresSelection: true,
          prerequisites: [],
          scales: false,
          scalingProgression: []
        });
      }
    }

    return options;
  } catch (error) {
    logger.error('Failed to load fighting styles from API:', error);
    return [];
  }
}

/**
 * Load skill options for Expertise
 */
async function loadSkillOptions(externalRef: ExternalReference): Promise<ClassFeature[]> {
  // For now, return a hardcoded list of all D&D 2024 skills
  // In the future, this could filter based on character's proficient skills
  const skills = [
    'Acrobatics',
    'Animal Handling',
    'Arcana',
    'Athletics',
    'Deception',
    'History',
    'Insight',
    'Intimidation',
    'Investigation',
    'Medicine',
    'Nature',
    'Perception',
    'Performance',
    'Persuasion',
    'Religion',
    'Sleight of Hand',
    'Stealth',
    'Survival'
  ];

  // Add Thieves' Tools if source allows tools
  if (externalRef.source === 'proficient-skills') {
    skills.push("Thieves' Tools");
  }

  return skills.map((skill) => ({
    id: `expertise-${skill.toLowerCase().replace(/[^a-z]+/g, '-')}`,
    name: skill,
    level: 1,
    source: 'XPHB',
    page: 139,
    featureType: 'base' as const,
    description: `Gain Expertise in ${skill}. Your Proficiency Bonus is doubled for any ability check using this skill.`,
    mechanics: {
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
    },
    isChoice: true,
    requiresSelection: true,
    prerequisites: [],
    scales: false,
    scalingProgression: []
  }));
}

/**
 * Check if character meets invocation prerequisites
 */
function meetsInvocationPrerequisites(
  invocation: EldritchInvocation,
  characterLevel: number,
  existingChoices: Record<string, string[]>
): boolean {
  // No prerequisite = always available
  if (!invocation.prerequisite) {
    return true;
  }

  const prereq = invocation.prerequisite.toLowerCase();

  // Check level requirement (e.g., "Level 2+ Warlock")
  const levelMatch = prereq.match(/level (\d+)\+/);
  if (levelMatch) {
    const requiredLevel = parseInt(levelMatch[1], 10);
    if (characterLevel < requiredLevel) {
      return false;
    }
  }

  // Check for Pact invocation prerequisite (e.g., "Pact of the Chain Invocation")
  if (prereq.includes('pact of the')) {
    const pactMatch = prereq.match(/pact of the (\w+)/);
    if (pactMatch) {
      const pactType = pactMatch[1]; // "chain", "blade", "tome"
      const pactId = `pact-of-the-${pactType}`;

      // Check if character has selected this pact
      const hasSelectedPact = Object.values(existingChoices).some((choices) =>
        choices.some((choiceId) => choiceId.includes(pactId))
      );

      if (!hasSelectedPact) {
        return false;
      }
    }
  }

  // Check for cantrip requirement (e.g., "a Warlock Cantrip That Deals Damage")
  // For now, we'll assume this is always true if level requirement is met
  // In a full implementation, we'd check character's cantrip list

  // If we get here and there was a prerequisite we didn't understand, be permissive
  return true;
}

/**
 * Convert Eldritch Invocation to ClassFeature format for UI
 */
function convertInvocationToFeature(invocation: EldritchInvocation): ClassFeature {
  return {
    id: invocation.id,
    name: invocation.name,
    level: invocation.level,
    source: 'XPHB',
    page: 153,
    featureType: 'base',
    description: invocation.description,
    mechanics: {
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
    },
    isChoice: true,
    requiresSelection: true,
    prerequisites: invocation.prerequisite ? [invocation.prerequisite] : [],
    scales: false,
    scalingProgression: []
  };
}


/**
 * Convert a Feat from the database to ClassFeature format for UI
 */
function convertFeatToClassFeature(feat: any): ClassFeature {
  // Extract the description - it may be wrapped in quotes from JSON serialization
  let description = feat.description || '';

  // Remove outer quotes if present
  if (description.startsWith('"') && description.endsWith('"')) {
    description = description.slice(1, -1);
  }

  // If we have raw.raw.entries, use that for richer content
  if (feat.raw?.raw?.entries && Array.isArray(feat.raw.raw.entries)) {
    description = feat.raw.raw.entries.join('\n\n');
  }

  return {
    id: feat.slug, // Use slug as ID for consistency
    name: feat.name,
    level: feat.levelRequirement || 1,
    source: feat.source || 'XPHB',
    page: feat.raw?.raw?.page || 0,
    featureType: 'base',
    description,
    mechanics: {
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
    },
    isChoice: true,
    requiresSelection: true,
    prerequisites: feat.prerequisiteSummary ? [feat.prerequisiteSummary] : [],
    scales: false,
    scalingProgression: []
  };
}

/**
 * Get the number of choices allowed at a specific level
 * Handles scaling (e.g., Warlock gets 1 invocation at level 1, 3 at level 2, etc.)
 */
export function getChoiceCountForLevel(
  feature: ClassFeature,
  characterLevel: number
): number {
  // Check if the feature has scaling
  if (!feature.scales || !feature.scalingProgression || feature.scalingProgression.length === 0) {
    // No scaling, use the base count from externalReference
    return feature.externalReference?.count || 1;
  }

  // Find the highest level scaling that applies
  const baseCount = feature.externalReference?.count || feature.mechanics?.invocations || 1;
  let currentCount = baseCount;

  for (const scaling of feature.scalingProgression || []) {
    if (scaling.level <= characterLevel) {
      // This scaling applies
      if (scaling.changes.invocations !== undefined) {
        currentCount = scaling.changes.invocations;
      }
    }
  }

  return currentCount;
}
