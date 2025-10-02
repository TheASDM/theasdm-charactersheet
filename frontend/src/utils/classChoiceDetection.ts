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
  let availableFeatures = classData.features.filter(
    (f) => f.level <= characterLevel && f.featureType === 'base'
  );

  // Add subclass features if subclass is selected
  if (selectedSubclass && classData.subclasses[selectedSubclass]) {
    const subclassFeatures = classData.subclasses[selectedSubclass].filter(
      (f) => f.level <= characterLevel
    );
    availableFeatures = [...availableFeatures, ...subclassFeatures];
  }

  // Find all features that require selection
  // This includes both:
  // 1. Old-style embedded choices with choiceGroup (Cleric, Druid)
  // 2. New-style external references with choiceType (Warlock, Fighter, etc.)
  const choiceFeatures = availableFeatures.filter(
    (f) => f.isChoice && f.requiresSelection
  );

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
    const existingSelection = existingChoices[feature.id];
    const requiredCount = feature.externalReference?.count || 1;
    if (!existingSelection || existingSelection.length < requiredCount) {
      incompletePrompts.push(prompt);
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
    choiceGroup: feature.id, // Use feature ID as the choice group for external refs
    level: feature.level,
    title: feature.name,
    description: feature.description,
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
  console.warn(`Unknown choice group pattern: ${choiceGroupId}, defaulting to single choice`);
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
  let allFeatures = classData.features.filter(
    (f) => f.level <= characterLevel && f.featureType === 'base'
  );

  // Add subclass features if subclass is selected
  if (selectedSubclass && classData.subclasses[selectedSubclass]) {
    const subclassFeatures = classData.subclasses[selectedSubclass].filter(
      (f) => f.level <= characterLevel
    );
    allFeatures = [...allFeatures, ...subclassFeatures];
  }

  // Separate choice features from non-choice features
  const embeddedChoiceFeatures = allFeatures.filter((f) => f.isChoice && f.requiresSelection && f.choiceGroup);
  const externalChoiceFeatures = allFeatures.filter((f) => f.isChoice && f.requiresSelection && f.choiceType && f.externalReference);

  // Non-choice features are those that don't require selection
  // Exclude both embedded and external choice features
  const nonChoiceFeatures = allFeatures.filter((f) => {
    const isEmbeddedChoice = f.isChoice && f.requiresSelection && f.choiceGroup;
    const isExternalChoice = f.isChoice && f.requiresSelection && f.choiceType && f.externalReference;
    return !isEmbeddedChoice && !isExternalChoice;
  });

  // Add all non-choice features
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
    const selectedIds = selectedChoices[externalFeature.id] || [];

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
      console.error(`Failed to load external choice data for ${externalFeature.name}:`, error);
      // Fallback: create basic features from IDs
      for (const selectedId of selectedIds) {
        const featureName = selectedId
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        displayableFeatures.push({
          id: selectedId,
          name: featureName,
          level: externalFeature.level,
          source: externalFeature.source,
          page: externalFeature.page,
          featureType: 'base',
          description: `Selected: ${featureName}`,
          mechanics: externalFeature.mechanics,
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
