import { logger } from './logger';
/**
 * Feature template renderer for resolving dynamic values in features
 */

import {
  CharacterFeature,
  FeatureAction,
  FeatureResource,
  FeatureVariable
} from '../types/features';
import {
  CharacterContext,
  getDraconicAncestryData,
  calculateProficiencyBonus,
  calculateAbilityModifier
} from '../data/lookupTables';
import { inferSpeciesChoicesFromCharacter } from '../services/featureVariantsService';
import { parseDnDTemplateTag, parseComplexDnDEntry } from './dndTemplateParser';

export interface RenderedFeature extends CharacterFeature {
  resolvedName: string;
  resolvedDescription: string;
  resolvedShortDescription: string | undefined;
  resolvedAction: FeatureAction | undefined;
  resolvedResource: FeatureResource | undefined;
  resolvedCurrentDamage: string | undefined;
  resolvedCurrentSaveDC: number | undefined;
  resolvedCurrentUses: number | undefined;
}

/**
 * Main function to render a feature with character context
 */
export function renderFeature(
  feature: CharacterFeature,
  characterContext: CharacterContext
): RenderedFeature {
  const resolvedVariables = feature.variables
    ? resolveVariables(feature.variables, characterContext)
    : {};

  // Helper to convert description (string or complex object) to string
  const resolveDescription = (desc: any): string => {
    if (typeof desc === 'string') {
      return resolveTemplate(desc, resolvedVariables, characterContext);
    }
    // For complex objects (arrays, nested structures), use parseComplexDnDEntry
    return parseComplexDnDEntry(desc);
  };

  return {
    ...feature,
    resolvedName: resolveTemplate(feature.name, resolvedVariables, characterContext),
    resolvedDescription: resolveDescription(feature.description),
    resolvedShortDescription: feature.shortDescription
      ? resolveTemplate(feature.shortDescription, resolvedVariables, characterContext)
      : feature.shortDescription,
    resolvedAction: resolveAction(feature.action, resolvedVariables, characterContext),
    resolvedResource: resolveResource(feature.resource, resolvedVariables, characterContext),
    resolvedCurrentDamage: getCurrentDamage(feature.variables || {}, characterContext),
    resolvedCurrentSaveDC: getCurrentSaveDC(feature.variables || {}, characterContext),
    resolvedCurrentUses: getCurrentUses(feature.resource, characterContext)
  };
}

/**
 * Resolve variables based on character context
 */
function resolveVariables(
  variables: FeatureVariable,
  characterContext: CharacterContext
): { [key: string]: any } {
  const resolved: { [key: string]: any } = {};

  // Handle draconic ancestry variables
  if (characterContext.draconicAncestry) {
    const draconicData = getDraconicAncestryData(characterContext.draconicAncestry);
    if (draconicData) {
      resolved.damageType = draconicData.damageType;
      resolved.areaType = draconicData.areaType;
      resolved.saveType = draconicData.saveType;
      resolved.draconicAncestryName = draconicData.name;

      // Also add dot notation access
      resolved['draconicAncestry.damageType'] = draconicData.damageType;
      resolved['draconicAncestry.areaType'] = draconicData.areaType;
      resolved['draconicAncestry.saveType'] = draconicData.saveType;
      resolved['draconicAncestry.name'] = draconicData.name;
    }
  }

  // Handle character stats
  resolved.level = characterContext.level;
  resolved.proficiencyBonus = characterContext.proficiencyBonus;
  resolved.strengthModifier = characterContext.strengthModifier;
  resolved.dexterityModifier = characterContext.dexterityModifier;
  resolved.constitutionModifier = characterContext.constitutionModifier;
  resolved.intelligenceModifier = characterContext.intelligenceModifier;
  resolved.wisdomModifier = characterContext.wisdomModifier;
  resolved.charismaModifier = characterContext.charismaModifier;

  // Copy over any direct variables
  Object.keys(variables).forEach(key => {
    if (resolved[key] === undefined) {
      resolved[key] = variables[key];
    }
  });

  // Add special computed variables
  if (variables.damageByLevel) {
    resolved.currentDamage = getCurrentDamage({ damageByLevel: variables.damageByLevel }, characterContext);
  }

  if (variables.saveDC) {
    resolved.saveDC = getCurrentSaveDC({ saveDC: variables.saveDC }, characterContext);
  }

  return resolved;
}

/**
 * Resolve template strings with variable substitution
 */
function resolveTemplate(
  template: string,
  resolvedVariables: { [key: string]: any },
  characterContext: CharacterContext
): string {
  if (!template) return '';

  let result = template;

  logger.debug('🔍 Template Resolution Debug:', {
    template,
    draconicAncestry: characterContext.draconicAncestry,
    availableVariables: Object.keys(resolvedVariables)
  });

  // Replace ${variable} patterns
  result = result.replace(/\$\{([^}]+)\}/g, (match, variableName) => {
    if (resolvedVariables[variableName] !== undefined) {
      logger.debug(`✅ Resolved ${variableName} = ${resolvedVariables[variableName]}`);
      return String(resolvedVariables[variableName]);
    }

    // Handle dot notation like ${draconicAncestry.damageType}
    if (variableName.includes('.')) {
      const [parent, child] = variableName.split('.');
      if (parent === 'draconicAncestry' && characterContext.draconicAncestry) {
        const draconicData = getDraconicAncestryData(characterContext.draconicAncestry);
        logger.debug(`🐉 Draconic Data Lookup for ${characterContext.draconicAncestry}:`, draconicData);
        if (draconicData && (draconicData as any)[child]) {
          const resolvedValue = String((draconicData as any)[child]);
          logger.debug(`✅ Resolved ${variableName} = ${resolvedValue}`);
          return resolvedValue;
        }
      }
    }

    // Handle special template variables
    if (variableName === 'currentDamage') {
      const damage = getCurrentDamage({ damageByLevel: resolvedVariables.damageByLevel }, characterContext);
      if (damage) {
        logger.debug(`✅ Resolved currentDamage = ${damage}`);
        return damage;
      }
    }

    if (variableName === 'saveDC') {
      const dc = getCurrentSaveDC({ saveDC: resolvedVariables.saveDC }, characterContext);
      if (dc) {
        logger.debug(`✅ Resolved saveDC = ${dc}`);
        return String(dc);
      }
    }

    logger.warn(`❌ Unresolved template variable: ${variableName}`, {
      availableVariables: Object.keys(resolvedVariables),
      characterContext: characterContext.draconicAncestry
    });
    return match;
  });

  logger.debug('🎯 Final template result:', result);

  // Parse D&D template tags like {@condition Incapacitated|XPHB}
  result = parseDnDTemplateTag(result);

  return result;
}

/**
 * Resolve action templates
 */
function resolveAction(
  action: FeatureAction | undefined,
  resolvedVariables: { [key: string]: any },
  characterContext: CharacterContext
): FeatureAction | undefined {
  if (!action) return undefined;

  const resolvedAction: FeatureAction = { ...action };

  // Resolve range template
  if (action.range && typeof action.range === 'string') {
    resolvedAction.range = resolveTemplate(action.range, resolvedVariables, characterContext);
  }

  // Resolve duration template
  if (action.duration && typeof action.duration === 'string') {
    resolvedAction.duration = resolveTemplate(action.duration, resolvedVariables, characterContext);
  }

  // Resolve saving throw
  if (action.savingThrow) {
    resolvedAction.savingThrow = { ...action.savingThrow };

    if (typeof action.savingThrow.dc === 'string') {
      if (action.savingThrow.dc === 'ability-based') {
        // Calculate 8 + proficiency + constitution modifier
        resolvedAction.savingThrow.dc = 8 + characterContext.proficiencyBonus + characterContext.constitutionModifier;
      } else {
        // Resolve template string
        const dcTemplate = action.savingThrow.dc;
        const dcValue = evaluateExpression(dcTemplate, characterContext);
        resolvedAction.savingThrow.dc = dcValue;
      }
    }
  }

  // Resolve damage
  if (action.damage) {
    resolvedAction.damage = { ...action.damage };

    if (action.damage.dice && typeof action.damage.dice === 'string') {
      resolvedAction.damage.dice = resolveTemplate(action.damage.dice, resolvedVariables, characterContext);
    }

    if (action.damage.type && typeof action.damage.type === 'string') {
      resolvedAction.damage.type = resolveTemplate(action.damage.type, resolvedVariables, characterContext);
    }
  }

  return resolvedAction;
}

/**
 * Resolve resource templates
 */
function resolveResource(
  resource: FeatureResource | undefined,
  _resolvedVariables: { [key: string]: any },
  characterContext: CharacterContext
): FeatureResource | undefined {
  if (!resource) return undefined;

  const resolvedResource: FeatureResource = { ...resource };

  // Resolve maxUses
  if (resource.maxUses === 'proficiency') {
    resolvedResource.maxUses = characterContext.proficiencyBonus;
  } else if (resource.maxUses === 'level') {
    resolvedResource.maxUses = characterContext.level;
  } else if (typeof resource.maxUses === 'string' && resource.maxUses.includes('modifier')) {
    // Handle ability-modifier types
    const abilityName = resource.maxUses.replace('-modifier', '');
    const modifierValue = (characterContext as any)[`${abilityName}Modifier`];
    if (modifierValue !== undefined) {
      resolvedResource.maxUses = Math.max(1, modifierValue); // Minimum 1 use
    }
  }

  return resolvedResource;
}

/**
 * Get current damage dice based on character level
 */
function getCurrentDamage(
  variables: FeatureVariable | undefined,
  characterContext: CharacterContext
): string | undefined {
  if (!variables?.damageByLevel) return undefined;

  const levelKeys = Object.keys(variables.damageByLevel)
    .map(Number)
    .sort((a, b) => b - a); // Sort descending

  for (const levelKey of levelKeys) {
    if (characterContext.level >= levelKey) {
      return variables.damageByLevel[levelKey.toString()];
    }
  }

  return Object.values(variables.damageByLevel)[0];
}

/**
 * Get current save DC
 */
function getCurrentSaveDC(
  variables: FeatureVariable | undefined,
  characterContext: CharacterContext
): number | undefined {
  if (!variables?.saveDC) return undefined;

  if (typeof variables.saveDC === 'number') {
    return variables.saveDC;
  }

  if (typeof variables.saveDC === 'string') {
    return evaluateExpression(variables.saveDC, characterContext);
  }

  return undefined;
}

/**
 * Get current uses for a resource
 */
function getCurrentUses(
  resource: FeatureResource | undefined,
  characterContext: CharacterContext
): number | undefined {
  if (!resource) return undefined;

  if (typeof resource.maxUses === 'number') {
    return resource.maxUses;
  }

  if (resource.maxUses === 'proficiency') {
    return characterContext.proficiencyBonus;
  }

  if (resource.maxUses === 'level') {
    return characterContext.level;
  }

  return undefined;
}

/**
 * Evaluate mathematical expressions in templates
 */
function evaluateExpression(expression: string, characterContext: CharacterContext): number {
  try {
    // Replace variable names with their values
    let evaluableExpression = expression
      .replace(/proficiencyBonus/g, characterContext.proficiencyBonus.toString())
      .replace(/constitutionModifier/g, characterContext.constitutionModifier.toString())
      .replace(/strengthModifier/g, characterContext.strengthModifier.toString())
      .replace(/dexterityModifier/g, characterContext.dexterityModifier.toString())
      .replace(/intelligenceModifier/g, characterContext.intelligenceModifier.toString())
      .replace(/wisdomModifier/g, characterContext.wisdomModifier.toString())
      .replace(/charismaModifier/g, characterContext.charismaModifier.toString())
      .replace(/level/g, characterContext.level.toString());

    // Simple math evaluation (only allow numbers, +, -, *, /, parentheses)
    if (/^[0-9+\-*/() ]+$/.test(evaluableExpression)) {
      return eval(evaluableExpression);
    } else {
      logger.warn(`Invalid expression: ${expression}`);
      return 0;
    }
  } catch (error) {
    logger.warn(`Error evaluating expression: ${expression}`, error);
    return 0;
  }
}

// Mapping from partial dragon names (from generator) to full dragon names (for lookup)
const DRAGON_NAME_MAPPING: { [key: string]: string } = {
  'Black': 'Black Dragon',
  'Blue': 'Blue Dragon',
  'Brass': 'Brass Dragon',
  'Bronze': 'Bronze Dragon',
  'Copper': 'Copper Dragon',
  'Gold': 'Gold Dragon',
  'Green': 'Green Dragon',
  'Red': 'Red Dragon',
  'Silver': 'Silver Dragon',
  'White': 'White Dragon'
};

/**
 * Create a character context from character sheet data
 */
export function createCharacterContext(characterData: any): CharacterContext {
  const level = characterData.level || 1;
  const proficiencyBonus = calculateProficiencyBonus(level);

  // Get ability scores with defaults
  const strength = characterData.abilityScores?.strength || 10;
  const dexterity = characterData.abilityScores?.dexterity || 10;
  const constitution = characterData.abilityScores?.constitution || 10;
  const intelligence = characterData.abilityScores?.intelligence || 10;
  const wisdom = characterData.abilityScores?.wisdom || 10;
  const charisma = characterData.abilityScores?.charisma || 10;

  // Try to infer draconic ancestry if not directly available
  let draconicAncestry = characterData.speciesChoices?.draconicAncestry || characterData.draconicAncestry;

  // Map partial dragon names to full names if needed
  if (draconicAncestry && DRAGON_NAME_MAPPING[draconicAncestry]) {
    logger.debug(`🐉 Mapping partial dragon name "${draconicAncestry}" to full name "${DRAGON_NAME_MAPPING[draconicAncestry]}"`);
    draconicAncestry = DRAGON_NAME_MAPPING[draconicAncestry];
  }

  // If still no draconic ancestry and this is a dragonborn, try to infer from features
  if (!draconicAncestry && characterData.species?.toLowerCase().includes('dragonborn')) {
    const inferredChoices = inferSpeciesChoicesFromCharacter(characterData);
    draconicAncestry = inferredChoices.draconicAncestry;
  }

  const context = {
    level,
    proficiencyBonus,
    strengthModifier: calculateAbilityModifier(strength),
    dexterityModifier: calculateAbilityModifier(dexterity),
    constitutionModifier: calculateAbilityModifier(constitution),
    intelligenceModifier: calculateAbilityModifier(intelligence),
    wisdomModifier: calculateAbilityModifier(wisdom),
    charismaModifier: calculateAbilityModifier(charisma),

    // Species choices
    draconicAncestry,
    elfLineage: characterData.speciesChoices?.elfLineage || characterData.elfLineage,
    gnomeLineage: characterData.speciesChoices?.gnomeLineage || characterData.gnomeLineage,
    giantAncestry: characterData.speciesChoices?.giantAncestry || characterData.giantAncestry,
    fiendishLegacy: characterData.speciesChoices?.fiendishLegacy || characterData.fiendishLegacy,
    humanSkill: characterData.speciesChoices?.humanSkill || characterData.humanSkill,

    // Class and background
    selectedClass: characterData.selectedClass || characterData.class,
    selectedSubclass: characterData.selectedSubclass || characterData.subclass,
    selectedBackground: characterData.selectedBackground || characterData.background
  };

  // Debug logging for template resolution
  logger.debug('🐉 Character Context Debug:', {
    species: characterData.species,
    draconicAncestry: context.draconicAncestry,
    speciesChoices: characterData.speciesChoices,
    level: context.level,
    fullCharacterData: characterData
  });

  return context;
}