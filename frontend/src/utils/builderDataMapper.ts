/**
 * Mapping configuration for CharacterBuilderData fields to Zustand store slices
 * This eliminates the need for manual field-by-field mapping in updateBuilderData
 */

import type { CharacterBuilderData } from '../components/CharacterGeneratorWizard';
import type { CharacterBuilderStore } from '../store/characterBuilder/types';

type StoreUpdateFunctions = Pick<
  CharacterBuilderStore,
  | 'updateBasicInfo'
  | 'updateAbilityScores'
  | 'updateClassSelection'
  | 'updateBackground'
  | 'updateSpecies'
  | 'updateFeats'
  | 'updateEquipment'
  | 'updateSpellbook'
  | 'updateResources'
>;

type FieldMapping = {
  [K in keyof Partial<CharacterBuilderData>]: {
    storeFn: keyof StoreUpdateFunctions;
    storeKey: string;
  };
};

/**
 * Maps each CharacterBuilderData field to its corresponding store update function and key
 */
export const FIELD_TO_STORE_MAPPING: FieldMapping = {
  // Basic Info
  characterName: { storeFn: 'updateBasicInfo', storeKey: 'characterName' },
  playerName: { storeFn: 'updateBasicInfo', storeKey: 'playerName' },

  // Ability Scores
  abilityScoreMethod: { storeFn: 'updateAbilityScores', storeKey: 'method' },
  abilityScores: { storeFn: 'updateAbilityScores', storeKey: 'scores' },

  // Class Selection
  selectedClass: { storeFn: 'updateClassSelection', storeKey: 'selectedClass' },
  selectedClassSkills: { storeFn: 'updateClassSelection', storeKey: 'selectedClassSkills' },
  selectedClassChoices: { storeFn: 'updateClassSelection', storeKey: 'selectedClassChoices' },
  classStep: { storeFn: 'updateClassSelection', storeKey: 'classStep' },
  classFeatureData: { storeFn: 'updateClassSelection', storeKey: 'classFeatureData' },
  classProficiencies: { storeFn: 'updateClassSelection', storeKey: 'classProficiencies' },
  classStartingEquipment: { storeFn: 'updateClassSelection', storeKey: 'classStartingEquipment' },
  classFeatures: { storeFn: 'updateClassSelection', storeKey: 'classFeatures' },
  hitDice: { storeFn: 'updateClassSelection', storeKey: 'hitDice' },
  primaryAbility: { storeFn: 'updateClassSelection', storeKey: 'primaryAbility' },
  spellcaster: { storeFn: 'updateClassSelection', storeKey: 'spellcaster' },
  spellcastingAbility: { storeFn: 'updateClassSelection', storeKey: 'spellcastingAbility' },

  // Background
  selectedBackground: { storeFn: 'updateBackground', storeKey: 'selectedBackground' },
  backgroundAbilityScoreAllocations: { storeFn: 'updateBackground', storeKey: 'abilityScoreAllocations' },
  selectedLanguages: { storeFn: 'updateBackground', storeKey: 'selectedLanguages' },
  backgroundSkillProficiencies: { storeFn: 'updateBackground', storeKey: 'skillProficiencies' },
  backgroundToolProficiencies: { storeFn: 'updateBackground', storeKey: 'toolProficiencies' },
  backgroundStartingEquipment: { storeFn: 'updateBackground', storeKey: 'startingEquipment' },
  backgroundFeatures: { storeFn: 'updateBackground', storeKey: 'features' },

  // Species
  selectedSpecies: { storeFn: 'updateSpecies', storeKey: 'selectedSpecies' },
  isHuman: { storeFn: 'updateSpecies', storeKey: 'isHuman' },
  speciesTraits: { storeFn: 'updateSpecies', storeKey: 'traits' },
  speciesSpells: { storeFn: 'updateSpecies', storeKey: 'spells' },
  speciesSize: { storeFn: 'updateSpecies', storeKey: 'size' },
  speciesSpeed: { storeFn: 'updateSpecies', storeKey: 'speed' },
  speciesDarkvision: { storeFn: 'updateSpecies', storeKey: 'darkvision' },
  speciesResistances: { storeFn: 'updateSpecies', storeKey: 'resistances' },
  speciesImmunities: { storeFn: 'updateSpecies', storeKey: 'immunities' },
  speciesChoices: { storeFn: 'updateSpecies', storeKey: 'choices' },

  // Feats
  selectedOriginFeats: { storeFn: 'updateFeats', storeKey: 'selectedOriginFeats' },
  requiredFeatCount: { storeFn: 'updateFeats', storeKey: 'requiredFeatCount' },
  featFeatures: { storeFn: 'updateFeats', storeKey: 'featFeatures' },
  featSpells: { storeFn: 'updateFeats', storeKey: 'featSpells' },
  featChoices: { storeFn: 'updateFeats', storeKey: 'featChoices' },

  // Equipment (handled specially - no individual field mapping)
  selectedEquipment: { storeFn: 'updateEquipment', storeKey: '_direct' },

  // Spells (handled specially - no individual field mapping)
  spellbook: { storeFn: 'updateSpellbook', storeKey: '_direct' },
  spellWizardStep: { storeFn: 'updateSpellbook', storeKey: 'currentStep' },

  // Resources
  resources: { storeFn: 'updateResources', storeKey: '_direct' },
};

/**
 * Apply updates from CharacterBuilderData to the Zustand store
 * Automatically routes each field to the correct store update function
 */
export function applyBuilderDataUpdates(
  updates: Partial<CharacterBuilderData>,
  storeFunctions: StoreUpdateFunctions,
  context: {
    speciesIsHuman: boolean;
    featsRequiredFeatCount: number;
    currentOriginFeats: string[];
  }
) {
  // Group updates by store function
  const grouped = new Map<keyof StoreUpdateFunctions, Record<string, any>>();

  // Handle special cases first
  const specialUpdates = {
    selectedSpecies: updates.selectedSpecies,
    requiredFeatCount: updates.requiredFeatCount,
  };

  // Process each update
  for (const [field, value] of Object.entries(updates)) {
    if (value === undefined) continue;

    const mapping = FIELD_TO_STORE_MAPPING[field as keyof CharacterBuilderData];
    if (!mapping) continue;

    const { storeFn, storeKey } = mapping;

    // Handle special direct mappings (equipment, spellbook, resources)
    if (storeKey === '_direct') {
      if (field === 'selectedEquipment') {
        storeFunctions.updateEquipment(value);
      } else if (field === 'spellbook') {
        const spellUpdates: any = {};
        if (value.known !== undefined) spellUpdates.known = value.known;
        if (value.prepared !== undefined) spellUpdates.prepared = value.prepared;
        if (value.cantrips !== undefined) spellUpdates.cantrips = value.cantrips;
        if (value.wizardSpellbook !== undefined) spellUpdates.wizardSpellbook = value.wizardSpellbook;
        if (Object.keys(spellUpdates).length > 0) {
          storeFunctions.updateSpellbook(spellUpdates);
        }
      } else if (field === 'resources') {
        storeFunctions.updateResources(value);
      }
      continue;
    }

    // Group regular updates by store function
    if (!grouped.has(storeFn)) {
      grouped.set(storeFn, {});
    }
    grouped.get(storeFn)![storeKey] = value;
  }

  // Handle species -> human -> feats logic
  if (specialUpdates.selectedSpecies !== undefined) {
    const nextIsHuman = specialUpdates.selectedSpecies
      ? specialUpdates.selectedSpecies.toLowerCase() === 'human'
      : context.speciesIsHuman;
    const nextRequiredCount = nextIsHuman ? 2 : 1;

    // Add to grouped updates
    if (!grouped.has('updateSpecies')) grouped.set('updateSpecies', {});
    grouped.get('updateSpecies')!.isHuman = nextIsHuman;

    if (!grouped.has('updateFeats')) grouped.set('updateFeats', {});
    grouped.get('updateFeats')!.requiredFeatCount = nextRequiredCount;

    if (nextRequiredCount !== context.featsRequiredFeatCount) {
      grouped.get('updateFeats')!.selectedOriginFeats = [];
    }
  }

  // Handle requiredFeatCount logic
  if (specialUpdates.requiredFeatCount !== undefined) {
    if (context.currentOriginFeats.length > specialUpdates.requiredFeatCount) {
      if (!grouped.has('updateFeats')) grouped.set('updateFeats', {});
      grouped.get('updateFeats')!.selectedOriginFeats = context.currentOriginFeats.slice(
        0,
        specialUpdates.requiredFeatCount
      );
    }
  }

  // Apply all grouped updates
  for (const [storeFn, updateData] of grouped.entries()) {
    if (Object.keys(updateData).length > 0) {
      (storeFunctions[storeFn] as any)(updateData);
    }
  }

  // Handle spellWizardStep separately
  if (updates.spellWizardStep !== undefined) {
    storeFunctions.updateSpellbook({ currentStep: updates.spellWizardStep });
  }
}
