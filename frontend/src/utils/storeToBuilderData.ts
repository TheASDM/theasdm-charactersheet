/**
 * Utility to convert Zustand store state to CharacterBuilderData format
 * This eliminates duplication between the two data structures
 */

import type { CharacterBuilderData } from '../components/CharacterGeneratorWizard';
import type {
  BasicInfoState,
  AbilityScoresState,
  ClassSelectionState,
  BackgroundState,
  SpeciesState,
  FeatsState,
  EquipmentState,
  SpellbookState,
  ResourcesState,
} from '../store/characterBuilderStore';

/**
 * Convert Zustand store slices to CharacterBuilderData
 */
export function storeToBuilderData(store: {
  basicInfo: BasicInfoState;
  abilityScores: AbilityScoresState;
  classSelection: ClassSelectionState;
  background: BackgroundState;
  species: SpeciesState;
  feats: FeatsState;
  equipment: EquipmentState;
  spells: SpellbookState;
  resources: ResourcesState;
}): CharacterBuilderData {
  const { basicInfo, abilityScores, classSelection, background, species, feats, equipment, spells, resources } = store;

  // Build equipment object
  const selectedEquipment: CharacterBuilderData['selectedEquipment'] = {};
  if (equipment.armor !== undefined) selectedEquipment.armor = equipment.armor;
  if (equipment.weapons !== undefined) selectedEquipment.weapons = equipment.weapons;
  if (equipment.shield !== undefined) selectedEquipment.shield = equipment.shield;
  if (equipment.equipment !== undefined) selectedEquipment.equipment = equipment.equipment;

  const result: CharacterBuilderData = {
    // Basic Info
    characterName: basicInfo.characterName,
    playerName: basicInfo.playerName,

    // Ability Scores
    abilityScoreMethod: abilityScores.method,
    abilityScores: abilityScores.scores,

    // Class Selection
    selectedClass: classSelection.selectedClass,
    selectedClassSkills: classSelection.selectedClassSkills,
    selectedClassChoices: classSelection.selectedClassChoices,
    classStep: classSelection.classStep,
    classFeatureData: classSelection.classFeatureData,

    // Background
    selectedBackground: background.selectedBackground,

    // Species
    selectedSpecies: species.selectedSpecies,
    isHuman: species.isHuman,

    // Feats
    selectedOriginFeats: feats.selectedOriginFeats,
    requiredFeatCount: feats.requiredFeatCount,

    // Equipment
    selectedEquipment,

    // Spells
    spellbook: {
      known: [...spells.known],
      ...(spells.prepared && { prepared: [...spells.prepared] }),
      ...(spells.cantrips && { cantrips: [...spells.cantrips] }),
      ...(spells.wizardSpellbook && { wizardSpellbook: [...spells.wizardSpellbook] }),
    },
    ...(spells.currentStep && { spellWizardStep: spells.currentStep }),
  };

  // Add optional class fields
  if (classSelection.classProficiencies !== undefined) {
    result.classProficiencies = classSelection.classProficiencies;
  }
  if (classSelection.classStartingEquipment !== undefined) {
    result.classStartingEquipment = classSelection.classStartingEquipment;
  }
  if (classSelection.classFeatures !== undefined) {
    result.classFeatures = classSelection.classFeatures;
  }
  if (classSelection.hitDice !== undefined) {
    result.hitDice = classSelection.hitDice;
  }
  if (classSelection.primaryAbility !== undefined) {
    result.primaryAbility = classSelection.primaryAbility;
  }
  if (classSelection.spellcaster !== undefined) {
    result.spellcaster = classSelection.spellcaster;
  }
  if (classSelection.spellcastingAbility !== undefined) {
    result.spellcastingAbility = classSelection.spellcastingAbility;
  }

  // Add optional background fields
  if (background.abilityScoreAllocations !== undefined) {
    result.backgroundAbilityScoreAllocations = background.abilityScoreAllocations;
  }
  if (background.selectedLanguages !== undefined) {
    result.selectedLanguages = background.selectedLanguages;
  }
  if (background.skillProficiencies !== undefined) {
    result.backgroundSkillProficiencies = background.skillProficiencies;
  }
  if (background.toolProficiencies !== undefined) {
    result.backgroundToolProficiencies = background.toolProficiencies;
  }
  if (background.startingEquipment !== undefined) {
    result.backgroundStartingEquipment = background.startingEquipment;
  }
  if (background.features !== undefined) {
    result.backgroundFeatures = background.features;
  }

  // Add optional species fields
  if (species.traits !== undefined) {
    result.speciesTraits = species.traits;
  }
  if (species.spells !== undefined) {
    result.speciesSpells = species.spells;
  }
  if (species.size !== undefined) {
    result.speciesSize = species.size;
  }
  if (species.speed !== undefined) {
    result.speciesSpeed = species.speed;
  }
  if (species.darkvision !== undefined) {
    result.speciesDarkvision = species.darkvision;
  }
  if (species.resistances !== undefined) {
    result.speciesResistances = species.resistances;
  }
  if (species.immunities !== undefined) {
    result.speciesImmunities = species.immunities;
  }
  if (species.choices !== undefined) {
    result.speciesChoices = species.choices;
  }

  // Add optional feat fields
  if (feats.featFeatures !== undefined) {
    result.featFeatures = feats.featFeatures;
  }
  if (feats.featSpells !== undefined) {
    result.featSpells = feats.featSpells;
  }
  if (feats.featChoices !== undefined) {
    result.featChoices = feats.featChoices;
  }

  // Add optional resources
  if (Object.keys(resources).length > 0) {
    result.resources = { ...resources };
  }

  return result;
}
