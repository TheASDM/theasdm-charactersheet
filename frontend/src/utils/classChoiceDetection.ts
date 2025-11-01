import { logger } from './logger';
/**
 * Class Choice Detection System
 *
 * This module detects and validates class feature choices that require user selection.
 * It handles:
 * - Detecting features with isChoice=true and requiresSelection=true
 * - Grouping options by choiceGroup
 * - Checking which choices have been made
 * - Returning structured prompts for the UI
 */

import { ClassData, ClassFeature, ChoicePrompt, ChoiceDetectionResult } from '../types/classFeatures';
import { parseComplexDnDEntry } from './dndTemplateParser';

/**
 * Get all required choices for a character at a specific level
 *
 * @param classData - The complete class data (e.g., from Cleric.json)
 * @param characterLevel - The character's current level
 * @param existingChoices - Already-made choices { "divine-order-1": ["divine-order-protector-1"] }
 * @param selectedSubclass - The character's chosen subclass (optional)
 * @returns Detection result with incomplete choice prompts
 */
export function detectRequiredChoices(
  classData: ClassData,
  characterLevel: number,
  existingChoices: Record<string, string[]> = {},
  selectedSubclass?: string
): ChoiceDetectionResult {
  const prompts: ChoicePrompt[] = [];

  // Collect all features available at this level (base + subclass)
  // Note: Database features don't have featureType set, so treat undefined as 'base'
  let availableFeatures = classData.features.filter(
    (f) => f.level <= characterLevel && (!f.featureType || f.featureType === 'base')
  );

  // Add subclass features if subclass is selected
  if (selectedSubclass && classData.subclasses && !Array.isArray(classData.subclasses) && classData.subclasses[selectedSubclass]) {
    const subclassFeatures = classData.subclasses[selectedSubclass].filter(
      (f: ClassFeature) => f.level <= characterLevel
    );
    availableFeatures = [...availableFeatures, ...subclassFeatures];
  }

  // Find all features that require selection
  // This includes:
  // 1. Old-style embedded choices with choiceGroup (processed JSON files)
  // 2. New-style external references with choiceType (processed JSON files)
  // 3. Database-style choices with type:"options" in entries array
  const choiceFeatures = availableFeatures.filter(
    (f) => f.isChoice && f.requiresSelection
  );

  // Also detect database-style choices (features with "options" entries)
  const databaseChoiceFeatures = availableFeatures.filter((f) => {
    if (!f.entries || !Array.isArray(f.entries)) return false;
    return f.entries.some((entry: any) => entry && typeof entry === 'object' && entry.type === 'options');
  });

  // Separate embedded choices from external references
  const embeddedChoices = choiceFeatures.filter((f) => f.choiceGroup);
  const externalChoices = choiceFeatures.filter((f) => f.choiceType && f.externalReference);

  // Track incomplete prompts separately
  const incompletePrompts: ChoicePrompt[] = [];

  // Handle embedded choices (old system)
  const choiceGroups = groupByChoiceGroup(embeddedChoices);
  for (const [choiceGroupId, options] of Object.entries(choiceGroups)) {
    const existingSelection = existingChoices[choiceGroupId];
    const prompt = createChoicePrompt(choiceGroupId, options);
    prompts.push(prompt);

    // Mark as incomplete if no selection made
    if (!existingSelection || existingSelection.length === 0) {
      incompletePrompts.push(prompt);
    }
  }

  // Handle external references (new system)
  // Always show these prompts even if a selection has been made,
  // so users can change their choice
  for (const feature of externalChoices) {
    const prompt = createExternalChoicePrompt(feature);
    prompts.push(prompt);

    // Mark as incomplete if no selection made or not enough selections
    const featureId = feature.id || feature.name;
    const existingSelection = existingChoices[featureId];
    const requiredCount = feature.externalReference?.count || 1;
    if (!existingSelection || existingSelection.length < requiredCount) {
      incompletePrompts.push(prompt);
    }
  }

  // Handle database-style choices (features with "options" in entries)
  for (const feature of databaseChoiceFeatures) {
    const prompt = createDatabaseChoicePrompt(feature, classData);
    if (prompt) {
      prompts.push(prompt);

      // Mark as incomplete if no selection made
      const featureId = feature.id || feature.name;
      const existingSelection = existingChoices[featureId];
      if (!existingSelection || existingSelection.length === 0) {
        incompletePrompts.push(prompt);
      }
    }
  }

  return {
    hasIncompleteChoices: incompletePrompts.length > 0,
    prompts
  };
}

/**
 * Group choice features by their choiceGroup
 */
function groupByChoiceGroup(features: ClassFeature[]): Record<string, ClassFeature[]> {
  const groups: Record<string, ClassFeature[]> = {};

  for (const feature of features) {
    if (feature.choiceGroup) {
      if (!groups[feature.choiceGroup]) {
        groups[feature.choiceGroup] = [];
      }
      groups[feature.choiceGroup].push(feature);
    }
  }

  return groups;
}

/**
 * Create a structured choice prompt from a group of options
 */
function createChoicePrompt(choiceGroupId: string, options: ClassFeature[]): ChoicePrompt {
  if (options.length === 0) {
    throw new Error(`No options provided for choice group ${choiceGroupId}`);
  }

  // Get the level from the first option
  const level = options[0].level;

  // Determine selection mode and constraints
  const { selectionMode, minSelections, maxSelections, title } = inferChoiceConstraints(
    choiceGroupId,
    options
  );

  // Create description from the choice type
  const description = generateChoiceDescription(choiceGroupId, options);

  const prompt: ChoicePrompt = {
    choiceGroup: choiceGroupId,
    level,
    title,
    description,
    selectionMode,
    options,
    isRequired: true
  };

  // Only include min/max selections if they are defined
  if (minSelections !== undefined) {
    prompt.minSelections = minSelections;
  }
  if (maxSelections !== undefined) {
    prompt.maxSelections = maxSelections;
  }

  return prompt;
}

/**
 * Create a choice prompt for an external reference feature
 * (e.g., Fighting Style feat, Eldritch Invocation, Expertise skills)
 */
function createExternalChoicePrompt(feature: ClassFeature): ChoicePrompt {
  if (!feature.externalReference || !feature.choiceType) {
    throw new Error(`Feature ${feature.id} missing externalReference or choiceType`);
  }

  const ref = feature.externalReference;
  const count = ref.count || 1;

  const prompt: ChoicePrompt = {
    choiceGroup: feature.id || feature.name, // Use feature ID as the choice group for external refs
    level: feature.level,
    title: feature.name,
    description: feature.description || '',
    selectionMode: count > 1 ? 'multiple' : 'single',
    options: [], // Will be populated by UI when loading external data
    isRequired: true,
    // Store external reference info for UI to use
    externalReference: ref,
    choiceType: feature.choiceType
  };

  if (count > 1) {
    prompt.minSelections = count;
    prompt.maxSelections = count;
  } else {
    prompt.minSelections = 1;
    prompt.maxSelections = 1;
  }

  return prompt;
}

/**
 * Infer selection mode and constraints from the choice group
 */
function inferChoiceConstraints(
  choiceGroupId: string,
  options: ClassFeature[]
): {
  selectionMode: 'single' | 'multiple';
  minSelections?: number;
  maxSelections?: number;
  title: string;
} {
  const choiceGroupName = choiceGroupId.toLowerCase();

  // Known single-choice patterns (choose exactly 1)
  const singleChoicePatterns = [
    'divine-order',
    'blessed-strikes',
    'primal-order',
    'elemental-fury',
    'fighting-style',
    'eldritch-invocations' // Warlock chooses 1 invocation at level 1
  ];

  // Known multiple-choice patterns with specific counts
  const multipleChoicePatterns: { [key: string]: { min: number; max: number } } = {
    'cunning-strike': { min: 2, max: 2 }, // Rogue chooses 2 at level 5
    'expertise': { min: 2, max: 2 }, // Rogue chooses 2 at level 1
    'devious-strikes': { min: 2, max: 2 },
    'metamagic': { min: 2, max: 2 }
  };

  // Check for single-choice patterns
  if (singleChoicePatterns.some((pattern) => choiceGroupName.includes(pattern))) {
    return {
      selectionMode: 'single',
      minSelections: 1,
      maxSelections: 1,
      title: extractTitleFromOptions(options)
    };
  }

  // Check for multiple-choice patterns with specific counts
  for (const [pattern, counts] of Object.entries(multipleChoicePatterns)) {
    if (choiceGroupName.includes(pattern)) {
      return {
        selectionMode: 'multiple',
        minSelections: counts.min,
        maxSelections: counts.max,
        title: extractTitleFromOptions(options)
      };
    }
  }

  // Default to single choice if uncertain
  logger.warn(`Unknown choice group pattern: ${choiceGroupId}, defaulting to single choice`);
  return {
    selectionMode: 'single',
    minSelections: 1,
    maxSelections: 1,
    title: extractTitleFromOptions(options)
  };
}

/**
 * Extract a clean title from the feature options
 * Example: "Cunning Strike: Poison (Cost: 1d6)" → "Choose Cunning Strike Options"
 */
function extractTitleFromOptions(options: ClassFeature[]): string {
  if (options.length === 0) return 'Make a Choice';

  const firstName = options[0].name;

  // Pattern 1: "Feature: Option (details)" → "Choose Feature"
  const colonMatch = firstName.match(/^([^:]+):/);
  if (colonMatch) {
    const baseName = colonMatch[1].trim();
    return `Choose ${baseName} Option`;
  }

  // Pattern 2: "Feature - Option" → "Choose Feature"
  const dashMatch = firstName.match(/^([^-]+)-/);
  if (dashMatch) {
    const baseName = dashMatch[1].trim();
    return `Choose ${baseName}`;
  }

  // Default: use first option name
  return `Choose ${firstName}`;
}

/**
 * Generate a description for the choice based on the options
 */
function generateChoiceDescription(choiceGroupId: string, options: ClassFeature[]): string {
  const choiceGroupName = choiceGroupId.toLowerCase();

  // Known descriptions
  if (choiceGroupName.includes('divine-order')) {
    return 'You have dedicated yourself to one of the following sacred roles:';
  }

  if (choiceGroupName.includes('blessed-strikes')) {
    return 'Choose how you channel divine power through your attacks:';
  }

  if (choiceGroupName.includes('cunning-strike')) {
    return 'When you deal Sneak Attack damage, you can choose to forgo some damage dice to apply special effects. Choose which effects you know:';
  }

  if (choiceGroupName.includes('devious-strikes')) {
    return 'You gain access to additional Cunning Strike options:';
  }

  if (choiceGroupName.includes('fighting-style')) {
    return 'You adopt a particular style of fighting as your specialty:';
  }

  if (choiceGroupName.includes('primal-order')) {
    return 'You have devoted yourself to one of the following sacred roles of the Druid:';
  }

  if (choiceGroupName.includes('elemental-fury')) {
    return 'Choose how you channel elemental power:';
  }

  // Default description
  return `Select from the following options (${options.length} available):`;
}

/**
 * Validate a choice selection
 *
 * @param prompt - The choice prompt being answered
 * @param selectedIds - Array of selected feature IDs
 * @returns Validation result with errors if any
 */
export function validateChoiceSelection(
  prompt: ChoicePrompt,
  selectedIds: string[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check minimum selections
  if (prompt.minSelections !== undefined && selectedIds.length < prompt.minSelections) {
    errors.push(`You must select at least ${prompt.minSelections} option(s)`);
  }

  // Check maximum selections
  if (prompt.maxSelections !== undefined && selectedIds.length > prompt.maxSelections) {
    errors.push(`You can select at most ${prompt.maxSelections} option(s)`);
  }

  // Check that all selected IDs are valid options
  const validIds = new Set(prompt.options.map((opt) => opt.id));
  for (const selectedId of selectedIds) {
    if (!validIds.has(selectedId)) {
      errors.push(`Invalid selection: ${selectedId} is not a valid option`);
    }
  }

  // Check for duplicates
  const uniqueIds = new Set(selectedIds);
  if (uniqueIds.size !== selectedIds.length) {
    errors.push('Duplicate selections are not allowed');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get all features that should be displayed for a character
 * This applies choices and filters out non-selected options
 *
 * @param classData - The complete class data
 * @param characterLevel - The character's current level
 * @param selectedChoices - The character's selected choices
 * @param selectedSubclass - The character's chosen subclass
 * @returns Array of features that should be displayed
 */
export async function getDisplayableFeatures(
  classData: ClassData,
  characterLevel: number,
  selectedChoices: Record<string, string[]> = {},
  selectedSubclass?: string
): Promise<ClassFeature[]> {
  const displayableFeatures: ClassFeature[] = [];

  // Get all base features for this level
  // Note: Database features don't have featureType set, so treat undefined as 'base'
  let allFeatures = classData.features.filter(
    (f) => f.level <= characterLevel && (!f.featureType || f.featureType === 'base')
  );

  // Add subclass features if subclass is selected
  if (selectedSubclass && classData.subclasses && !Array.isArray(classData.subclasses) && classData.subclasses[selectedSubclass]) {
    const subclassFeatures = classData.subclasses[selectedSubclass].filter(
      (f: ClassFeature) => f.level <= characterLevel
    );
    allFeatures = [...allFeatures, ...subclassFeatures];
  }

  // Separate choice features from non-choice features
  const embeddedChoiceFeatures = allFeatures.filter((f) => f.isChoice && f.requiresSelection && f.choiceGroup);
  const externalChoiceFeatures = allFeatures.filter((f) => f.isChoice && f.requiresSelection && f.choiceType && f.externalReference);

  // Helper: Check if feature is a database-style parent choice feature (from 5etools raw data)
  // These have entries with type: "options" (e.g., "Primal Order", "Divine Order")
  const isDatabaseChoiceParent = (f: ClassFeature): boolean => {
    if (!f.entries || !Array.isArray(f.entries)) return false;
    return f.entries.some((entry: any) =>
      entry && typeof entry === 'object' && entry.type === 'options'
    );
  };

  // Helper: Check if feature is a database-style choice option (from 5etools raw data)
  // These are referenced by parent features (e.g., "Magician", "Warden", "Protector", "Thaumaturge")
  const isDatabaseChoiceOption = (f: ClassFeature): boolean => {
    // Find any parent features that reference this feature
    return allFeatures.some(parent => {
      if (!parent.entries || !Array.isArray(parent.entries)) return false;
      const optionsEntry = parent.entries.find((entry: any) =>
        entry && typeof entry === 'object' && entry.type === 'options'
      );
      if (!optionsEntry || !optionsEntry.entries) return false;

      // Check if this feature is referenced in the options
      return optionsEntry.entries.some((ref: any) => {
        if (!ref || ref.type !== 'refClassFeature') return false;
        const [refName] = (ref.classFeature || '').split('|');
        return refName === f.name;
      });
    });
  };

  // Non-choice features are those that don't require selection
  // Exclude: embedded choices, external choices, database parents, and unselected database options
  const nonChoiceFeatures = allFeatures.filter((f) => {
    const isEmbeddedChoice = f.isChoice && f.requiresSelection && f.choiceGroup;
    const isExternalChoice = f.isChoice && f.requiresSelection && f.choiceType && f.externalReference;
    const isDatabaseParent = isDatabaseChoiceParent(f);
    const isDatabaseOption = isDatabaseChoiceOption(f);

    // Exclude embedded choices, external choices, and database parent features
    if (isEmbeddedChoice || isExternalChoice || isDatabaseParent) {
      return false;
    }

    // If it's a database option, only include if selected
    if (isDatabaseOption) {
      // Find the parent feature to get the choice group key
      const parentFeature = allFeatures.find(parent => {
        if (!parent.entries || !Array.isArray(parent.entries)) return false;
        const optionsEntry = parent.entries.find((entry: any) =>
          entry && typeof entry === 'object' && entry.type === 'options'
        );
        if (!optionsEntry || !optionsEntry.entries) return false;
        return optionsEntry.entries.some((ref: any) => {
          if (!ref || ref.type !== 'refClassFeature') return false;
          const [refName] = (ref.classFeature || '').split('|');
          return refName === f.name;
        });
      });

      if (parentFeature) {
        // Use parent feature name as the choice group key (e.g., "Primal Order", "Divine Order")
        const choiceGroupKey = parentFeature.name;
        const selectedOptions = selectedChoices[choiceGroupKey];

        if (!selectedOptions || !Array.isArray(selectedOptions)) {
          return false; // No selection made, exclude this option
        }

        // Check if this option was selected (by name or ID)
        return selectedOptions.includes(f.name) || selectedOptions.includes(f.id || '');
      }

      return false; // No parent found, exclude it
    }

    // Not a choice feature at all - include it
    return true;
  });

  // Add all non-choice features (now includes only selected database-style options)
  displayableFeatures.push(...nonChoiceFeatures);

  // For embedded choice features, only add the selected ones
  const choiceGroups = groupByChoiceGroup(embeddedChoiceFeatures);
  for (const [choiceGroupId, options] of Object.entries(choiceGroups)) {
    const selectedIds = selectedChoices[choiceGroupId] || [];

    for (const selectedId of selectedIds) {
      const selectedFeature = options.find((opt) => opt.id === selectedId);
      if (selectedFeature) {
        displayableFeatures.push(selectedFeature);
      }
    }
  }

  // For external choice features, load the actual data from external files
  for (const externalFeature of externalChoiceFeatures) {
    const featureId = externalFeature.id || externalFeature.name;
    const selectedIds = selectedChoices[featureId] || [];

    if (selectedIds.length === 0 || !externalFeature.externalReference) {
      continue; // No selections made
    }

    // Dynamically import the external choice loader
    try {
      const { loadExternalChoiceData } = await import('./externalChoiceLoader');

      // Load all options from external file
      const allOptions = await loadExternalChoiceData(
        externalFeature.externalReference,
        characterLevel,
        selectedChoices
      );

      // Filter to only the selected options
      for (const selectedId of selectedIds) {
        const selectedOption = allOptions.find(opt => opt.id === selectedId);
        if (selectedOption) {
          displayableFeatures.push(selectedOption);
        }
      }
    } catch (error) {
      logger.error(`Failed to load external choice data for ${externalFeature.name}:`, error);
      // Fallback: create basic features from IDs
      for (const selectedId of selectedIds) {
        const featureName = selectedId
          .split('-')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        displayableFeatures.push({
          id: selectedId,
          name: featureName,
          level: externalFeature.level,
          source: externalFeature.source,
          page: externalFeature.page || 0,
          featureType: 'base',
          description: `Selected: ${featureName}`,
          mechanics: externalFeature.mechanics || {} as any,
          isChoice: false,
          prerequisites: [],
          scales: false,
          scalingProgression: []
        });
      }
    }
  }

  return displayableFeatures;
}

/**
 * Create a choice prompt for database-style features (with "options" in entries)
 * For example, Cleric's "Divine Order" with Protector/Thaumaturge options
 */
function createDatabaseChoicePrompt(feature: ClassFeature, classData: ClassData): ChoicePrompt | null {
  if (!feature.entries || !Array.isArray(feature.entries)) return null;

  // Find the options entry
  const optionsEntry = feature.entries.find(
    (entry: any) => entry && typeof entry === 'object' && entry.type === 'options'
  );

  if (!optionsEntry || !optionsEntry.entries || !Array.isArray(optionsEntry.entries)) {
    return null;
  }

  // Extract option references (e.g., "Protector|Cleric|XPHB|1|XPHB")
  const optionRefs = optionsEntry.entries
    .filter((entry: any) => entry && entry.type === 'refClassFeature')
    .map((entry: any) => entry.classFeature);

  // Find the actual option features from classData and add parsed descriptions
  const optionFeatures = optionRefs
    .map((ref: string) => {
      const [optionName] = ref.split('|');
      const foundFeature = classData.features.find(f => f.name === optionName);
      if (!foundFeature) return null;

      // Parse the entries array to create a description
      let description = '';
      if (foundFeature.entries && Array.isArray(foundFeature.entries)) {
        description = parseComplexDnDEntry(foundFeature.entries);
      } else if (foundFeature.description) {
        description = foundFeature.description;
      }

      return {
        ...foundFeature,
        description
      };
    })
    .filter(Boolean) as ClassFeature[];

  if (optionFeatures.length === 0) return null;

  const count = optionsEntry.count || 1;

  return {
    choiceGroup: feature.id || feature.name,
    level: feature.level,
    title: feature.name,
    description: `Choose ${count} option${count > 1 ? 's' : ''}`,
    selectionMode: count > 1 ? 'multiple' : 'single',
    maxSelections: count,
    options: optionFeatures as ClassFeature[],
    isRequired: true
  };
}

/**
 * Check if a character has all required choices made for their level
 *
 * @param classData - The complete class data
 * @param characterLevel - The character's current level
 * @param selectedChoices - The character's selected choices
 * @param selectedSubclass - The character's chosen subclass
 * @returns True if all choices are complete, false otherwise
 */
export function areAllChoicesComplete(
  classData: ClassData,
  characterLevel: number,
  selectedChoices: Record<string, string[]> = {},
  selectedSubclass?: string
): boolean {
  const detectionResult = detectRequiredChoices(
    classData,
    characterLevel,
    selectedChoices,
    selectedSubclass
  );

  return !detectionResult.hasIncompleteChoices;
}