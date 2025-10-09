import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  WizardContainer,
  WizardHeader,
  WizardProgress,
  WizardContent,
  WizardControls
} from '../styles/components/CharacterGeneratorWizard.styles';
import { Step0CharacterInfo } from './wizard-steps/Step0_CharacterInfo';
import { Step1AbilityScores } from './wizard-steps/Step1_AbilityScores';
import { Step2ClassSelection } from './wizard-steps/Step2_ClassSelection';
import { Step3ABackgroundSelection } from './wizard-steps/Step3A_BackgroundSelection';
import { Step3BSpeciesSelection } from './wizard-steps/Step3B_SpeciesSelection';
import { Step3DOriginFeats } from './wizard-steps/Step3D_OriginFeats';
import { Step4EquipmentSelection } from './wizard-steps/Step4_EquipmentSelection';
import { Step5ReviewCreate } from './wizard-steps/Step5_ReviewCreate';
import { SpellSelectionWizard } from './wizard-steps/SpellSelectionWizard';
import { AbilityScoresHeader } from './wizard-steps/AbilityScoresHeader';
import { useCharacterBuilderStore, WizardStep } from '../store/characterBuilderStore';
import { shallow } from 'zustand/shallow';
import WizardModal from './wizard/WizardModal';
import { getCasterProgressionMeta } from '../helpers/spellRules';

export interface CharacterBuilderData {
  // Step 0: Character Info
  characterName: string;
  playerName: string;

  // Step 1: Ability Scores
  abilityScoreMethod: 'standard-array' | 'custom';
  abilityScores: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };

  // Step 2: Class
  selectedClass: string;
  selectedClassSkills: string[];
  selectedClassChoices: { [category: string]: string[] }; // Fighting Style, Divine Order, etc.
  classStep: number; // 1 = class selection, 2 = skills, 3 = features
  classFeatureData: any; // Store full class data for feature display

  // Class-derived data
  classProficiencies?: {
    armor: string[];
    weapons: string[];
    tools: string[];
    savingThrows: string[];
  };
  classStartingEquipment?: string[];
  classFeatures?: any[];
  hitDice?: string;
  primaryAbility?: string[];
  spellcaster?: boolean;
  spellcastingAbility?: string;

  // Step 3A: Background
  selectedBackground: string;
  backgroundAbilityScoreAllocations?: { [ability: string]: number };
  selectedLanguages?: string[];

  // Background-derived data
  backgroundSkillProficiencies?: string[];
  backgroundToolProficiencies?: string[];
  backgroundStartingEquipment?: string[];
  backgroundFeatures?: any[];

  // Step 3B: Species
  selectedSpecies: string;
  isHuman: boolean; // Determines feat count

  // Species-derived data
  speciesTraits?: any[];
  speciesSpells?: {
    cantrips?: string[];
    level1?: string[];
    level3?: string[];
    level5?: string[];
  };
  speciesSize?: string;
  speciesSpeed?: number;
  speciesDarkvision?: number;
  speciesResistances?: string[];
  speciesImmunities?: string[];

  // Step 3C: Species Choices
  speciesChoices?: { [key: string]: string };

  // Step 3D: Origin Feats
  selectedOriginFeats: string[];
  requiredFeatCount: number;

  // Feat-derived data
  featFeatures?: { [featName: string]: any[] };
  featSpells?: { [featName: string]: string[] };

  // Step 3E: Feat Choices
  featChoices?: { [featName: string]: any };

  // Step 4: Equipment
  selectedEquipment: {
    armor?: string;
    weapons?: string[];
    shield?: string;
    equipment?: string[];
  };

  spellbook: {
    known: string[];
    prepared?: string[];
  };

  resources?: {
    manaCurrent?: number;
    manaMax?: number;
  };
}

const WIZARD_STEPS: WizardStep[] = [
  'character-info',
  'ability-scores',
  'class-selection',
  'background-selection',
  'species-selection',
  'origin-feats',
  'spell-selection',
  'equipment-selection',
  'review-create'
];

const STEP_LABELS = {
  'character-info': 'Character & Player Info',
  'ability-scores': 'Ability Scores',
  'class-selection': 'Class',
  'background-selection': 'Background',
  'species-selection': 'Species',
  'origin-feats': 'Origin Feats',
  'spell-selection': 'Spells',
  'equipment-selection': 'Equipment',
  'review-create': 'Review & Create'
};

export default function CharacterGeneratorWizard() {
  const navigate = useNavigate();

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showStartOverModal, setShowStartOverModal] = useState(false);
  const [isSpellStepValid, setIsSpellStepValid] = useState(true);

  useEffect(() => {
    if (showStartOverModal) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [showStartOverModal]);

  // DEV ONLY: Quick-fill for testing
  const isDev = import.meta.env.DEV;

  const {
    currentStep,
    completedSteps,
    basicInfo,
    abilityScores,
    classSelection,
    background,
    species,
    feats,
    equipment,
    spells,
    resources,
    setCurrentStep,
    markStepComplete,
    resetBuilder,
    updateBasicInfo,
    updateAbilityScores,
    updateClassSelection,
    updateBackground,
    updateSpecies,
    updateFeats,
    updateEquipment,
    updateSpellbook,
    updateResources,
  } = useCharacterBuilderStore(
    (state) => ({
      currentStep: state.currentStep,
      completedSteps: state.completedSteps,
      basicInfo: state.basicInfo,
      abilityScores: state.abilityScores,
      classSelection: state.classSelection,
      background: state.background,
      species: state.species,
      feats: state.feats,
      equipment: state.equipment,
      spells: state.spells,
      resources: state.resources,
      setCurrentStep: state.setCurrentStep,
      markStepComplete: state.markStepComplete,
      resetBuilder: state.resetBuilder,
      updateBasicInfo: state.updateBasicInfo,
      updateAbilityScores: state.updateAbilityScores,
      updateClassSelection: state.updateClassSelection,
      updateBackground: state.updateBackground,
      updateSpecies: state.updateSpecies,
      updateFeats: state.updateFeats,
      updateEquipment: state.updateEquipment,
      updateSpellbook: state.updateSpellbook,
      updateResources: state.updateResources,
    }),
    shallow
  );

  const speciesIsHuman = species.isHuman;
  const currentOriginFeats = feats.selectedOriginFeats;
  const featsRequiredFeatCount = feats.requiredFeatCount;

  const builderData = useMemo<CharacterBuilderData>(
    () => {
      const selectedEquipment: CharacterBuilderData['selectedEquipment'] = {};
      if (equipment.armor !== undefined) {
        selectedEquipment.armor = equipment.armor;
      }
      if (equipment.weapons !== undefined) {
        selectedEquipment.weapons = equipment.weapons;
      }
      if (equipment.shield !== undefined) {
        selectedEquipment.shield = equipment.shield;
      }
      if (equipment.equipment !== undefined) {
        selectedEquipment.equipment = equipment.equipment;
      }

      const result: CharacterBuilderData = {
        characterName: basicInfo.characterName,
        playerName: basicInfo.playerName,
        abilityScoreMethod: abilityScores.method,
        abilityScores: abilityScores.scores,
        selectedClass: classSelection.selectedClass,
        selectedClassSkills: classSelection.selectedClassSkills,
        selectedClassChoices: classSelection.selectedClassChoices,
        classStep: classSelection.classStep,
        classFeatureData: classSelection.classFeatureData,
        selectedBackground: background.selectedBackground,
        selectedSpecies: species.selectedSpecies,
        isHuman: species.isHuman,
        selectedOriginFeats: feats.selectedOriginFeats,
        requiredFeatCount: feats.requiredFeatCount,
        selectedEquipment,
        spellbook: {
          known: [...spells.known],
          prepared: [...(spells.prepared ?? [])],
        },
      };

      if (Object.keys(resources).length > 0) {
        result.resources = { ...resources };
      }

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

      if (background.abilityScoreAllocations !== undefined) {
        result.backgroundAbilityScoreAllocations =
          background.abilityScoreAllocations;
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

      if (feats.featFeatures !== undefined) {
        result.featFeatures = feats.featFeatures;
      }
      if (feats.featSpells !== undefined) {
        result.featSpells = feats.featSpells;
      }
      if (feats.featChoices !== undefined) {
        result.featChoices = feats.featChoices;
      }

      return result;
    },
    [
      basicInfo,
      abilityScores,
      classSelection,
      background,
      species,
      feats,
      equipment,
      spells,
      resources,
    ]
  );

  const casterAbilityScore = useMemo(() => {
    const abilityName = classSelection.spellcastingAbility;
    if (!abilityName) {
      return undefined;
    }

    const normalized = abilityName.toLowerCase() as keyof typeof abilityScores.scores;
    return abilityScores.scores[normalized];
  }, [classSelection.spellcastingAbility, abilityScores.scores]);

  const spellProgressionMeta = useMemo(() => {
    if (!builderData.selectedClass) {
      return null;
    }
    const params = {
      classId: builderData.selectedClass,
      level: 1,
      ...(casterAbilityScore !== undefined
        ? { spellcastingAbilityScore: casterAbilityScore }
        : {}),
    } as const;

    return getCasterProgressionMeta(params);
  }, [builderData.selectedClass, casterAbilityScore]);

  const hasClassSpellcasting = useMemo(
    () => Boolean(spellProgressionMeta && spellProgressionMeta.casterType !== 'none'),
    [spellProgressionMeta]
  );

  const hasSpeciesGrantedSpells = useMemo(() => {
    const granted = builderData.speciesSpells;
    if (!granted) {
      return false;
    }

    return Object.values(granted).some(
      (list) => Array.isArray(list) && list.length > 0
    );
  }, [builderData.speciesSpells]);

  const hasFeatGrantedSpells = useMemo(() => {
    const granted = builderData.featSpells;
    if (!granted) {
      return false;
    }

    return Object.values(granted).some(
      (list) => Array.isArray(list) && list.length > 0
    );
  }, [builderData.featSpells]);

  const shouldShowSpellStep = hasClassSpellcasting || hasSpeciesGrantedSpells || hasFeatGrantedSpells;

  useEffect(() => {
    if (!shouldShowSpellStep && currentStep === 'spell-selection') {
      setCurrentStep('equipment-selection');
    }
  }, [shouldShowSpellStep, currentStep, setCurrentStep]);

  const visibleSteps = useMemo(
    () => WIZARD_STEPS.filter((step) => step !== 'spell-selection' || shouldShowSpellStep),
    [shouldShowSpellStep]
  );

  const updateBuilderData = useCallback(
    (updates: Partial<CharacterBuilderData>) => {
      const basicInfoUpdates: Partial<typeof basicInfo> = {};
      if (updates.characterName !== undefined) {
        basicInfoUpdates.characterName = updates.characterName;
      }
      if (updates.playerName !== undefined) {
        basicInfoUpdates.playerName = updates.playerName;
      }
      if (Object.keys(basicInfoUpdates).length > 0) {
        updateBasicInfo(basicInfoUpdates);
      }

      if (
        updates.abilityScoreMethod !== undefined ||
        updates.abilityScores !== undefined
      ) {
        const abilityUpdates: Parameters<
          typeof updateAbilityScores
        >[0] = {};
        if (updates.abilityScoreMethod !== undefined) {
          abilityUpdates.method = updates.abilityScoreMethod;
        }
        if (updates.abilityScores !== undefined) {
          abilityUpdates.scores = updates.abilityScores;
        }
        updateAbilityScores(abilityUpdates);
      }

      const classUpdates: Partial<typeof classSelection> = {};
      if (updates.selectedClass !== undefined) {
        classUpdates.selectedClass = updates.selectedClass;
      }
      if (updates.selectedClassSkills !== undefined) {
        classUpdates.selectedClassSkills = updates.selectedClassSkills;
      }
      if (updates.selectedClassChoices !== undefined) {
        classUpdates.selectedClassChoices = updates.selectedClassChoices;
      }
      if (updates.classStep !== undefined) {
        classUpdates.classStep = updates.classStep;
      }
      if (updates.classFeatureData !== undefined) {
        classUpdates.classFeatureData = updates.classFeatureData;
      }
      if (updates.classProficiencies !== undefined) {
        classUpdates.classProficiencies = updates.classProficiencies;
      }
      if (updates.classStartingEquipment !== undefined) {
        classUpdates.classStartingEquipment = updates.classStartingEquipment;
      }
      if (updates.classFeatures !== undefined) {
        classUpdates.classFeatures = updates.classFeatures;
      }
      if (updates.hitDice !== undefined) {
        classUpdates.hitDice = updates.hitDice;
      }
      if (updates.primaryAbility !== undefined) {
        classUpdates.primaryAbility = updates.primaryAbility;
      }
      if (updates.spellcaster !== undefined) {
        classUpdates.spellcaster = updates.spellcaster;
      }
      if (updates.spellcastingAbility !== undefined) {
        classUpdates.spellcastingAbility = updates.spellcastingAbility;
      }
      if (Object.keys(classUpdates).length > 0) {
        updateClassSelection(classUpdates);
      }

      const backgroundUpdates: Partial<typeof background> = {};
      if (updates.selectedBackground !== undefined) {
        backgroundUpdates.selectedBackground = updates.selectedBackground;
      }
      if (updates.backgroundAbilityScoreAllocations !== undefined) {
        backgroundUpdates.abilityScoreAllocations =
          updates.backgroundAbilityScoreAllocations;
      }
      if (updates.selectedLanguages !== undefined) {
        backgroundUpdates.selectedLanguages = updates.selectedLanguages;
      }
      if (updates.backgroundSkillProficiencies !== undefined) {
        backgroundUpdates.skillProficiencies =
          updates.backgroundSkillProficiencies;
      }
      if (updates.backgroundToolProficiencies !== undefined) {
        backgroundUpdates.toolProficiencies =
          updates.backgroundToolProficiencies;
      }
      if (updates.backgroundStartingEquipment !== undefined) {
        backgroundUpdates.startingEquipment =
          updates.backgroundStartingEquipment;
      }
      if (updates.backgroundFeatures !== undefined) {
        backgroundUpdates.features = updates.backgroundFeatures;
      }
      if (Object.keys(backgroundUpdates).length > 0) {
        updateBackground(backgroundUpdates);
      }

      const speciesUpdates: Partial<typeof species> = {};
      const pendingFeatsUpdates: Partial<typeof feats> = {};

      if (updates.selectedSpecies !== undefined) {
        speciesUpdates.selectedSpecies = updates.selectedSpecies;
        const nextIsHuman = updates.selectedSpecies
          ? updates.selectedSpecies.toLowerCase() === 'human'
          : speciesIsHuman;
        speciesUpdates.isHuman = nextIsHuman;
        const nextRequiredCount = nextIsHuman ? 2 : 1;
        pendingFeatsUpdates.requiredFeatCount = nextRequiredCount;
        if (nextRequiredCount !== featsRequiredFeatCount) {
          pendingFeatsUpdates.selectedOriginFeats = [];
        }
      }

      if (updates.isHuman !== undefined) {
        speciesUpdates.isHuman = updates.isHuman;
      }
      if (updates.speciesTraits !== undefined) {
        speciesUpdates.traits = updates.speciesTraits;
      }
      if (updates.speciesSpells !== undefined) {
        speciesUpdates.spells = updates.speciesSpells;
      }
      if (updates.speciesSize !== undefined) {
        speciesUpdates.size = updates.speciesSize;
      }
      if (updates.speciesSpeed !== undefined) {
        speciesUpdates.speed = updates.speciesSpeed;
      }
      if (updates.speciesDarkvision !== undefined) {
        speciesUpdates.darkvision = updates.speciesDarkvision;
      }
      if (updates.speciesResistances !== undefined) {
        speciesUpdates.resistances = updates.speciesResistances;
      }
      if (updates.speciesImmunities !== undefined) {
        speciesUpdates.immunities = updates.speciesImmunities;
      }
      if (updates.speciesChoices !== undefined) {
        speciesUpdates.choices = updates.speciesChoices;
      }
      if (Object.keys(speciesUpdates).length > 0) {
        updateSpecies(speciesUpdates);
      }

      if (updates.selectedOriginFeats !== undefined) {
        pendingFeatsUpdates.selectedOriginFeats = updates.selectedOriginFeats;
      }
      if (updates.requiredFeatCount !== undefined) {
        pendingFeatsUpdates.requiredFeatCount = updates.requiredFeatCount;
        if (currentOriginFeats.length > updates.requiredFeatCount) {
          pendingFeatsUpdates.selectedOriginFeats = currentOriginFeats.slice(
            0,
            updates.requiredFeatCount
          );
        }
      }
      if (updates.featFeatures !== undefined) {
        pendingFeatsUpdates.featFeatures = updates.featFeatures;
      }
      if (updates.featSpells !== undefined) {
        pendingFeatsUpdates.featSpells = updates.featSpells;
      }
      if (updates.featChoices !== undefined) {
        pendingFeatsUpdates.featChoices = updates.featChoices;
      }
  if (Object.keys(pendingFeatsUpdates).length > 0) {
    updateFeats(pendingFeatsUpdates);
  }

  if (updates.selectedEquipment !== undefined) {
    updateEquipment(updates.selectedEquipment);
  }

  if (updates.spellbook !== undefined) {
    const spellUpdates: Partial<typeof spells> = {};
    if (updates.spellbook.known !== undefined) {
      spellUpdates.known = updates.spellbook.known;
    }
    if (updates.spellbook.prepared !== undefined) {
      spellUpdates.prepared = updates.spellbook.prepared;
    }
    if (Object.keys(spellUpdates).length > 0) {
      updateSpellbook(spellUpdates);
    }
  }

  if (updates.resources !== undefined) {
    updateResources(updates.resources);
  }
},
[
  updateBasicInfo,
  updateAbilityScores,
  updateClassSelection,
  updateBackground,
    updateSpecies,
    updateFeats,
    updateEquipment,
    updateSpellbook,
    updateResources,
    speciesIsHuman,
    currentOriginFeats,
    featsRequiredFeatCount,
  ]
  );

  const completedStepsSet = useMemo(
    () => new Set(completedSteps),
    [completedSteps]
  );


  // Start Over functionality
  const handleStartOver = useCallback(() => {
    setShowStartOverModal(true);
  }, []);

  const confirmStartOver = useCallback(() => {
    resetBuilder();
    setShowStartOverModal(false);
    setIsTransitioning(false);
  }, [resetBuilder]);

  const cancelStartOver = useCallback(() => {
    setShowStartOverModal(false);
  }, []);

  // DEV ONLY: Quick-fill with test data
  const quickFillWizard = useCallback(() => {
    // Basic Info
    updateBasicInfo({
      characterName: 'Test Wizard',
      playerName: 'Dev Tester',
    });
    markStepComplete('character-info');

    // Ability Scores (standard array with high INT for Wizard testing)
    updateAbilityScores({
      method: 'standard-array',
      scores: {
        strength: 8,
        dexterity: 14,
        constitution: 13,
        intelligence: 15, // +2 from background = 17 (+3 mod)
        wisdom: 12,
        charisma: 10,
      },
    });
    markStepComplete('ability-scores');

    // Class (Wizard)
    updateClassSelection({
      selectedClass: 'Wizard',
      selectedClassSkills: ['Arcana', 'History'],
      selectedClassChoices: {},
      classStep: 3,
    });
    markStepComplete('class-selection');

    // Background (Sage)
    updateBackground({
      selectedBackground: 'Sage',
      abilityScoreAllocations: { intelligence: 2, wisdom: 1 },
      selectedLanguages: ['Draconic', 'Elvish'],
    });
    markStepComplete('background-selection');

    // Species (Human)
    updateSpecies({
      selectedSpecies: 'Human',
      isHuman: true,
      choices: { humanSkill: 'Perception' },
    });
    markStepComplete('species-selection');

    // Feats (2 for Human)
    updateFeats({
      selectedOriginFeats: ['Alert', 'Magic Initiate (Wizard)'],
      requiredFeatCount: 2,
    });
    markStepComplete('origin-feats');

    // Jump to spell selection
    setCurrentStep('spell-selection');
  }, [
    updateBasicInfo,
    updateAbilityScores,
    updateClassSelection,
    updateBackground,
    updateSpecies,
    updateFeats,
    setCurrentStep,
    markStepComplete,
  ]);

  // Navigation functions
  const getCurrentStepIndex = useCallback(
    () => visibleSteps.indexOf(currentStep),
    [currentStep, visibleSteps]
  );

  const canGoNext = useCallback(() => {
    const currentIndex = getCurrentStepIndex();
    return currentIndex > -1 && currentIndex < visibleSteps.length - 1;
  }, [getCurrentStepIndex, visibleSteps.length]);

  const canGoBack = useCallback(
    () => getCurrentStepIndex() > 0,
    [getCurrentStepIndex]
  );

  const goToStep = useCallback(
    (step: WizardStep) => {
      if (!visibleSteps.includes(step)) {
        return;
      }
      setCurrentStep(step);
    },
    [setCurrentStep, visibleSteps]
  );

  const goNext = useCallback(() => {
    if (!canGoNext()) return;

    const currentIndex = getCurrentStepIndex();
    if (currentIndex === -1) return;

    const nextStep = visibleSteps[currentIndex + 1];
    if (!nextStep) return;

    setIsTransitioning(true);

    setTimeout(() => {
      markStepComplete(currentStep);
      setCurrentStep(nextStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
    }, 300);
  }, [canGoNext, currentStep, getCurrentStepIndex, markStepComplete, setCurrentStep, visibleSteps]);

  const goBack = useCallback(() => {
    if (!canGoBack()) return;

    const currentIndex = getCurrentStepIndex();
    if (currentIndex <= 0) return;

    const prevStep = visibleSteps[currentIndex - 1];
    if (!prevStep) return;
    setCurrentStep(prevStep);
  }, [canGoBack, getCurrentStepIndex, setCurrentStep, visibleSteps]);


  // Check if ability scores are complete
  const isAbilityScoresComplete = (): boolean => {
    if (builderData.abilityScoreMethod === 'standard-array') {
      const usedScores = Object.values(builderData.abilityScores).filter(s => s > 0).sort();
      const standardArray = [15, 14, 13, 12, 10, 8].sort();
      return usedScores.length === 6 && JSON.stringify(usedScores) === JSON.stringify(standardArray);
    } else {
      return Object.values(builderData.abilityScores).every(score => score >= 3 && score <= 20);
    }
  };

  // Check if class selection is complete
  const isClassSelectionComplete = (): boolean => {
    if (!builderData.selectedClass) return false;

    // Import the CLASS_SKILL_CHOICES to get accurate requirements
    const CLASS_SKILL_CHOICES: { [key: string]: number } = {
      'Artificer': 2,
      'Barbarian': 2,
      'Bard': 3,
      'Cleric': 2,
      'Druid': 2,
      'Fighter': 2,
      'Monk': 2,
      'Paladin': 2,
      'Ranger': 3,
      'Rogue': 4,
      'Sorcerer': 2,
      'Warlock': 2,
      'Wizard': 2
    };

    const requiredSkillCount = CLASS_SKILL_CHOICES[builderData.selectedClass] || 0;
    const isSkillComplete = requiredSkillCount === 0 || builderData.selectedClassSkills.length === requiredSkillCount;

    // For now, we'll consider class features complete if a class is selected
    // This can be enhanced later with specific class feature validation
    const isClassFeatureComplete = true;

    return isSkillComplete && isClassFeatureComplete;
  };

  // Check if background selection is complete
  const isBackgroundSelectionComplete = (): boolean => {
    return !!(builderData.selectedBackground &&
              builderData.backgroundAbilityScoreAllocations &&
              builderData.selectedLanguages);
  };

  // Check if species selection is complete
  const isSpeciesSelectionComplete = (): boolean => {
    return !!builderData.selectedSpecies;
  };

  // Check if origin feats selection is complete
  const isOriginFeatsComplete = (): boolean => {
    return builderData.selectedOriginFeats.length >= builderData.requiredFeatCount;
  };

  const isSpellSelectionComplete = useCallback(
    () => !shouldShowSpellStep || isSpellStepValid,
    [shouldShowSpellStep, isSpellStepValid]
  );

  // Check if equipment selection is complete
  const isEquipmentSelectionComplete = (): boolean => {
    return !!(builderData.selectedEquipment.armor ||
              (builderData.selectedEquipment.weapons && builderData.selectedEquipment.weapons.length > 0) ||
              (builderData.selectedEquipment.equipment && builderData.selectedEquipment.equipment.length > 0));
  };

  // Check if character info is complete
  const isCharacterInfoComplete = (): boolean => {
    return !!(builderData.characterName && builderData.playerName);
  };

  const isStepMarkedComplete = (step: WizardStep): boolean => {
    switch (step) {
      case 'character-info':
        return isCharacterInfoComplete();
      case 'ability-scores':
        return isAbilityScoresComplete();
      case 'class-selection':
        return isClassSelectionComplete();
      case 'background-selection':
        return isBackgroundSelectionComplete();
      case 'species-selection':
        return isSpeciesSelectionComplete();
      case 'origin-feats':
        return isOriginFeatsComplete();
      case 'spell-selection':
        return isSpellSelectionComplete();
      case 'equipment-selection':
        return isEquipmentSelectionComplete();
      case 'review-create':
        return completedStepsSet.has(step);
      default:
        return completedStepsSet.has(step);
    }
  };

  // Check if current step is complete
  const isCurrentStepComplete = (): boolean => {
    switch (currentStep) {
      case 'character-info':
        return isCharacterInfoComplete();
      case 'ability-scores':
        return isAbilityScoresComplete();
      case 'class-selection':
        return isClassSelectionComplete();
      case 'background-selection':
        return isBackgroundSelectionComplete();
      case 'species-selection':
        return isSpeciesSelectionComplete();
      case 'origin-feats':
        return isOriginFeatsComplete();
      case 'spell-selection':
        return isSpellSelectionComplete();
      case 'equipment-selection':
        return isEquipmentSelectionComplete();
      case 'review-create':
        return true; // Review step is always complete for navigation
      default:
        return false;
    }
  };

  return (
    <WizardContainer>
      <div className="character-generator-wizard">
        {/* Header */}
        <WizardHeader>
          <h1>Create New Character</h1>
        </WizardHeader>

        {/* Step Content */}
        <WizardContent style={{
          opacity: isTransitioning ? 0.3 : 1,
          transition: 'opacity 0.3s ease',
          position: 'relative'
        }}>
          {/* Transition Screen */}
          {isTransitioning && (
            <div style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 999,
              background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2520 100%)',
              border: '3px solid #d4af37',
              borderRadius: '12px',
              padding: '2rem 3rem',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8)',
              animation: 'fadeInScale 0.3s ease',
            }}>
              <h2 style={{
                color: '#d4af37',
                fontFamily: 'Cinzel, serif',
                fontSize: '1.8rem',
                margin: 0,
                textAlign: 'center',
              }}>
                Loading Next Step...
              </h2>
              <p style={{
                color: '#ccc',
                marginTop: '0.5rem',
                textAlign: 'center',
              }}>
                Preparing your character configuration
              </p>
            </div>
          )}
          {currentStep === 'character-info' && (
            <Step0CharacterInfo
              data={builderData}
              onUpdate={updateBuilderData}
            />
          )}
          {currentStep === 'ability-scores' && (
            <Step1AbilityScores
              data={builderData}
              onUpdate={updateBuilderData}
            />
          )}
          {currentStep === 'class-selection' && (
            <>
              <AbilityScoresHeader data={builderData} />
              <Step2ClassSelection
                data={builderData}
                onUpdate={updateBuilderData}
                onAdvance={goNext}
              />
            </>
          )}
          {currentStep === 'background-selection' && (
            <>
              <AbilityScoresHeader data={builderData} />
              <Step3ABackgroundSelection
                data={builderData}
                onUpdate={updateBuilderData}
                onAdvance={goNext}
              />
            </>
          )}
          {currentStep === 'species-selection' && (
            <Step3BSpeciesSelection
              data={builderData}
              onUpdate={updateBuilderData}
              onAdvance={goNext}
            />
          )}
          {currentStep === 'origin-feats' && (
            <Step3DOriginFeats
              data={builderData}
              onUpdate={updateBuilderData}
              onAdvance={goNext}
            />
          )}
          {currentStep === 'spell-selection' && shouldShowSpellStep && (
            <SpellSelectionWizard
              data={builderData}
              onUpdate={updateBuilderData}
              onValidityChange={setIsSpellStepValid}
            />
          )}
          {currentStep === 'equipment-selection' && (
            <Step4EquipmentSelection
              data={builderData}
              onUpdate={updateBuilderData}
            />
          )}
          {currentStep === 'review-create' && (
            <Step5ReviewCreate
              data={builderData}
              onComplete={(characterId: number) => {
                // Reset wizard state before navigating
                resetBuilder();
                // Navigate directly to character sheet - choices are now handled in Step2
                navigate(`/characters/${characterId}`);
              }}
            />
          )}
          {!['character-info', 'ability-scores', 'class-selection', 'background-selection', 'species-selection', 'origin-feats', 'spell-selection', 'equipment-selection', 'review-create'].includes(currentStep) && (
            <div className="step-placeholder">
              <h2>{STEP_LABELS[currentStep]}</h2>
              <p>Step content coming soon...</p>
              <pre>{JSON.stringify(builderData, null, 2)}</pre>
            </div>
          )}

          {/* Progress Bar */}
          <WizardProgress className="bottom-progress">
            {visibleSteps.map((step, index) => (
              <div
                key={step}
                className={`progress-step ${
                  step === currentStep ? 'current' : ''
                } ${
                  completedStepsSet.has(step) ? 'completed' : ''
                }`}
                onClick={() => goToStep(step)}
              >
                <span className="step-number">{index + 1}</span>
                <span className="step-label" style={{
                  color: isStepMarkedComplete(step) ? '#4caf50' : undefined
                }}>
                  {STEP_LABELS[step]}
                </span>
              </div>
            ))}
          </WizardProgress>

          {/* Navigation Controls */}
          <WizardControls>
            <div className="wizard-controls-left">
              <button
                onClick={goBack}
                disabled={!canGoBack()}
                className="wizard-btn wizard-btn-secondary"
              >
                Back
              </button>
              <button
                onClick={handleStartOver}
                className="wizard-btn wizard-btn-danger"
                style={{
                  background: 'linear-gradient(145deg, #dc3545, #c82333)',
                  borderColor: '#dc3545',
                  color: '#fff',
                  marginLeft: '0.5rem'
                }}
              >
                Start Over
              </button>
              {isDev && (
                <button
                  onClick={quickFillWizard}
                  className="wizard-btn"
                  style={{
                    background: 'linear-gradient(145deg, #17a2b8, #138496)',
                    borderColor: '#17a2b8',
                    color: '#fff',
                    marginLeft: '0.5rem'
                  }}
                  title="DEV: Quick-fill wizard with test Wizard character"
                >
                  ⚡ Quick Fill (DEV)
                </button>
              )}
            </div>

            <div className="wizard-controls-right">
              {currentStep !== 'review-create' && (
                <button
                  onClick={goNext}
                  className="wizard-btn wizard-btn-primary"
                  style={{
                    background: isCurrentStepComplete() ? 'linear-gradient(145deg, #4caf50, #45a049)' : undefined,
                    borderColor: isCurrentStepComplete() ? '#4caf50' : undefined
                  }}
                  disabled={!isCurrentStepComplete()}
                >
                  Next {!isCurrentStepComplete() && '⚠️'}
                </button>
              )}
            </div>
          </WizardControls>
        </WizardContent>
      </div>

      <WizardModal
        isOpen={showStartOverModal}
        onClose={cancelStartOver}
        title="Start Over?"
        subtitle="This action clears all progress in the character generator."
        maxWidth="480px"
        footer={
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <button
              onClick={cancelStartOver}
              className="wizard-btn wizard-btn-secondary"
              style={{
                flex: 1,
                padding: '12px 24px',
                fontSize: '1rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Cancel
            </button>
            <button
              onClick={confirmStartOver}
              className="wizard-btn wizard-btn-danger"
              style={{
                flex: 1,
                padding: '12px 24px',
                fontSize: '1rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                background: 'linear-gradient(145deg, #dc3545, #c82333)',
                borderColor: '#dc3545',
                color: '#fff',
              }}
            >
              Start Over
            </button>
          </div>
        }
      >
        <p
          style={{
            color: '#ccc',
            fontSize: '1rem',
            lineHeight: '1.4',
            margin: 0,
            textAlign: 'center',
          }}
        >
          Are you sure you want to start over? This will clear all character data and return you to the beginning. This action cannot be undone.
        </p>
      </WizardModal>
    </WizardContainer>
  );
}
