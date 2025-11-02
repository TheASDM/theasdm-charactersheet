import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  WizardContainer,
  WizardHeader,
  WizardContent,
  WizardControls
} from '../styles/components/CharacterGeneratorWizard.styles';
import { PersistentBottomNav } from './wizard/PersistentBottomNav';
import { Step0CharacterInfo } from './wizard-steps/Step0_CharacterInfo';
import { Step1AbilityScores } from './wizard-steps/Step1_AbilityScores';
import { Step2ClassSelection } from './wizard-steps/Step2_ClassSelection';
import { Step3ABackgroundSelection } from './wizard-steps/Step3A_BackgroundSelection';
import { Step3BSpeciesSelection } from './wizard-steps/Step3B_SpeciesSelection';
import Step3DOriginFeats from './wizard-steps/Step3D_OriginFeats';
// import { Step4EquipmentSelection } from './wizard-steps/Step4_EquipmentSelection'; // REMOVED per UX spec
import { Step5ReviewCreate } from './wizard-steps/Step5_ReviewCreate';
import { SpellSelectionWizard } from './wizard-steps/SpellSelectionWizard';
import { AbilityScoresHeader } from './wizard-steps/AbilityScoresHeader';
import { PrimaryAbilityInfo } from './wizard-steps/PrimaryAbilityInfo';
import { useCharacterBuilderStore, WizardStep } from '../store/characterBuilderStore';
import { shallow } from 'zustand/shallow';
import WizardModal from './wizard/WizardModal';
import { getCasterProgressionMeta } from '../helpers/spellRules';
import { applyBuilderDataUpdates } from '../utils/builderDataMapper';
import { storeToBuilderData } from '../utils/storeToBuilderData';
import type { ClassStartingEquipment } from '../constants/startingEquipment';

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
  classStartingEquipment?: ClassStartingEquipment;
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
  speciesGrantedSpells?: string[]; // Spell IDs granted by species/lineage (for Rock Gnome, Drow, etc.)
  speciesSize?: string;
  speciesSpeed?: number;
  speciesAdditionalSpeeds?: Record<string, number>;
  speciesDarkvision?: number;
  speciesResistances?: string[];
  speciesImmunities?: string[];
  speciesSkillProficiencies?: string[];
  speciesToolProficiencies?: string[];
  speciesAbilityScoreAllocations?: { [ability: string]: number };

  // Step 3C: Species Choices
  speciesChoices?: { [key: string]: string };

  // Step 3D: Origin Feats
  selectedOriginFeats: string[];
  requiredFeatCount: number;

  // Feat-derived data
  featFeatures?: { [featName: string]: any[] };
  featSpells?: { [featName: string]: string[] };
  featSkillProficiencies?: string[];
  featToolProficiencies?: string[];

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
    known: string[]; // Combined: cantrips + wizardSpellbook OR cantrips + prepared
    prepared?: string[];
    cantrips?: string[]; // Separate tracking for UI persistence
    wizardSpellbook?: string[]; // For wizards: spells in spellbook (not cantrips)
  };

  // Track internal spell wizard step (cantrips, spellbook, prepared)
  spellWizardStep?: 'cantrips' | 'spellbook' | 'prepared';

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
  // 'equipment-selection', // REMOVED per UX spec
  'review-create'
];

const STEP_LABELS = {
  'character-info': 'Name',
  'ability-scores': 'Abilities',
  'class-selection': 'Class',
  'background-selection': 'Background',
  'species-selection': 'Species',
  'origin-feats': 'Feats',
  'spell-selection': 'Spells',
  // 'equipment-selection': 'Equipment', // REMOVED per UX spec
  'review-create': 'Review'
};

export default function CharacterGeneratorWizard() {
  const navigate = useNavigate();

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showStartOverModal, setShowStartOverModal] = useState(false);
  // const [isSpellStepValid, setIsSpellStepValid] = useState(true); // No longer needed - validation removed

  // Ref for spell wizard navigation handlers
  const spellWizardNavigationRef = useRef<{
    handleNext?: () => boolean;
    handleBack?: () => boolean;
  }>({});

  // Ref for review step create handler
  const reviewCreateHandlerRef = useRef<{
    handleCreate?: () => Promise<void>;
  }>({});

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
    () => storeToBuilderData({
      basicInfo,
      abilityScores,
      classSelection,
      background,
      species,
      feats,
      equipment,
      spells,
      resources,
    }),
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
      setCurrentStep('review-create'); // Skip to review since equipment step removed
    }
  }, [shouldShowSpellStep, currentStep, setCurrentStep]);

  // Auto-mark spell-selection as complete when it's not applicable
  useEffect(() => {
    if (!shouldShowSpellStep && !completedSteps.includes('spell-selection')) {
      markStepComplete('spell-selection');
    }
  }, [shouldShowSpellStep, completedSteps, markStepComplete]);

  // Always show all steps - spell-selection will be auto-skipped if not applicable
  const visibleSteps = useMemo(() => WIZARD_STEPS, []);

  const updateBuilderData = useCallback(
    (updates: Partial<CharacterBuilderData>) => {
      applyBuilderDataUpdates(
        updates,
        {
          updateBasicInfo,
          updateAbilityScores,
          updateClassSelection,
          updateBackground,
          updateSpecies,
          updateFeats,
          updateEquipment,
          updateSpellbook,
          updateResources,
        },
        {
          speciesIsHuman,
          featsRequiredFeatCount,
          currentOriginFeats,
        }
      );
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

  const progressSteps = useMemo(() => {
    return visibleSteps.map((step) => {
      const isNotApplicable = step === 'spell-selection' && !shouldShowSpellStep;
      return {
        key: step,
        label: STEP_LABELS[step] || step,
        isComplete: completedStepsSet.has(step),
        isCurrent: step === currentStep,
        isNotApplicable,
      };
    });
  }, [visibleSteps, completedStepsSet, currentStep, shouldShowSpellStep]);


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

      // Prevent navigating to spell-selection if not a spellcasting class
      if (step === 'spell-selection' && !shouldShowSpellStep) {
        return;
      }

      setCurrentStep(step);
    },
    [setCurrentStep, visibleSteps, shouldShowSpellStep]
  );

  const goNext = useCallback(() => {
    // Check if on review step - trigger create character (no validation blocking)
    if (currentStep === 'review-create') {
      if (reviewCreateHandlerRef.current.handleCreate) {
        reviewCreateHandlerRef.current.handleCreate();
        return;
      } else {
        console.error('handleCreate not found in ref');
      }
    }

    if (!canGoNext()) {
      return;
    }

    // Check if spell wizard wants to handle Next internally
    if (currentStep === 'spell-selection' && spellWizardNavigationRef.current.handleNext) {
      const handled = spellWizardNavigationRef.current.handleNext();
      if (handled) {
        return; // Spell wizard handled it
      }
    }

    const currentIndex = getCurrentStepIndex();
    if (currentIndex === -1) return;

    let nextStep = visibleSteps[currentIndex + 1];
    if (!nextStep) return;

    // Auto-skip spell-selection if not a spellcasting class
    if (nextStep === 'spell-selection' && !shouldShowSpellStep) {
      // Mark spell step as complete (since we're skipping it)
      markStepComplete('spell-selection');
      // Move to the step after spells
      nextStep = visibleSteps[currentIndex + 2];
      if (!nextStep) return;
    }

    setIsTransitioning(true);

    setTimeout(() => {
      markStepComplete(currentStep);
      setCurrentStep(nextStep);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
    }, 300);
  }, [canGoNext, currentStep, getCurrentStepIndex, markStepComplete, setCurrentStep, visibleSteps, shouldShowSpellStep]);

  const goBack = useCallback(() => {
    if (!canGoBack()) {
      return;
    }

    // Check if spell wizard wants to handle Back internally
    if (currentStep === 'spell-selection' && spellWizardNavigationRef.current.handleBack) {
      const handled = spellWizardNavigationRef.current.handleBack();
      if (handled) {
        return; // Spell wizard handled it
      }
    }

    const currentIndex = getCurrentStepIndex();
    if (currentIndex <= 0) return;

    let prevStep = visibleSteps[currentIndex - 1];
    if (!prevStep) return;

    // Auto-skip spell-selection if not a spellcasting class
    if (prevStep === 'spell-selection' && !shouldShowSpellStep) {
      // Move to the step before spells
      prevStep = visibleSteps[currentIndex - 2];
      if (!prevStep) return;
    }

    setCurrentStep(prevStep);
  }, [canGoBack, getCurrentStepIndex, setCurrentStep, visibleSteps, currentStep, shouldShowSpellStep]);


  // NOTE: All validation functions commented out - we allow character creation with partial data
  // Validation is only used for visual feedback, not blocking navigation

  // // Check if ability scores are complete
  // const isAbilityScoresComplete = (): boolean => {
  //   if (builderData.abilityScoreMethod === 'standard-array') {
  //     const usedScores = Object.values(builderData.abilityScores).filter(s => s > 0).sort();
  //     const standardArray = [15, 14, 13, 12, 10, 8].sort();
  //     return usedScores.length === 6 && JSON.stringify(usedScores) === JSON.stringify(standardArray);
  //   } else {
  //     return Object.values(builderData.abilityScores).every(score => score >= 3 && score <= 20);
  //   }
  // };

  // // Check if class selection is complete
  // const isClassSelectionComplete = (): boolean => {
  //   if (!builderData.selectedClass) return false;
  //   const CLASS_SKILL_CHOICES: { [key: string]: number } = {
  //     'Artificer': 2, 'Barbarian': 2, 'Bard': 3, 'Cleric': 2, 'Druid': 2,
  //     'Fighter': 2, 'Monk': 2, 'Paladin': 2, 'Ranger': 3, 'Rogue': 4,
  //     'Sorcerer': 2, 'Warlock': 2, 'Wizard': 2
  //   };
  //   const requiredSkillCount = CLASS_SKILL_CHOICES[builderData.selectedClass] || 0;
  //   return requiredSkillCount === 0 || builderData.selectedClassSkills.length === requiredSkillCount;
  // };

  // // Check if background selection is complete
  // const isBackgroundSelectionComplete = (): boolean => {
  //   if (!builderData.selectedBackground) return false;
  //   if (!builderData.selectedLanguages || builderData.selectedLanguages.length !== 2) return false;
  //   if (!builderData.backgroundAbilityScoreAllocations) return false;
  //   const total = Object.values(builderData.backgroundAbilityScoreAllocations).reduce((sum, val) => sum + val, 0);
  //   return total === 3;
  // };

  // // Check if species selection is complete
  // const isSpeciesSelectionComplete = (): boolean => {
  //   return !!builderData.selectedSpecies;
  // };

  // // Check if origin feats selection is complete
  // const isOriginFeatsComplete = (): boolean => {
  //   return builderData.selectedOriginFeats.length >= builderData.requiredFeatCount;
  // };

  // const isSpellSelectionComplete = useCallback(
  //   () => !shouldShowSpellStep || isSpellStepValid,
  //   [shouldShowSpellStep, isSpellStepValid]
  // );

  // // Check if equipment selection is complete
  // const isEquipmentSelectionComplete = (): boolean => {
  //   return !!(builderData.selectedEquipment.armor ||
  //             (builderData.selectedEquipment.weapons && builderData.selectedEquipment.weapons.length > 0) ||
  //             (builderData.selectedEquipment.equipment && builderData.selectedEquipment.equipment.length > 0));
  // };

  // // Check if character info is complete
  // const isCharacterInfoComplete = (): boolean => {
  //   return !!(builderData.characterName && builderData.playerName);
  // };

  // Check if current step is complete (for visual indicators only, not blocking)
  // const isCurrentStepComplete = (): boolean => {
  //   switch (currentStep) {
  //     case 'character-info':
  //       return isCharacterInfoComplete();
  //     case 'ability-scores':
  //       return isAbilityScoresComplete();
  //     case 'class-selection':
  //       return isClassSelectionComplete();
  //     case 'background-selection':
  //       return isBackgroundSelectionComplete();
  //     case 'species-selection':
  //       return isSpeciesSelectionComplete();
  //     case 'origin-feats':
  //       return isOriginFeatsComplete();
  //     case 'spell-selection':
  //       return isSpellSelectionComplete();
  //     case 'equipment-selection':
  //       return isEquipmentSelectionComplete();
  //     case 'review-create':
  //       return true; // Review step is always complete for navigation
  //     default:
  //       return false;
  //   }
  // };

  return (
    <WizardContainer>
      <div className="character-generator-wizard" style={{ paddingBottom: '120px' }}>
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
              border: '3px solid #ce9016',
              borderRadius: '12px',
              padding: '2rem 3rem',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8)',
              animation: 'fadeInScale 0.3s ease',
            }}>
              <h2 style={{
                color: '#ce9016',
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
              onMethodSelect={() => {
                // Navigate to ability scores step after method selection
                setCurrentStep('ability-scores');
              }}
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
              <PrimaryAbilityInfo data={builderData} />
              <Step2ClassSelection
                data={builderData}
                onUpdate={updateBuilderData}
              />
            </>
          )}
          {currentStep === 'background-selection' && (
            <>
              <AbilityScoresHeader data={builderData} />
              <PrimaryAbilityInfo data={builderData} />
              <Step3ABackgroundSelection
                data={builderData}
                onUpdate={updateBuilderData}
              />
            </>
          )}
          {currentStep === 'species-selection' && (
            <>
              <AbilityScoresHeader data={builderData} />
              <PrimaryAbilityInfo data={builderData} />
              <Step3BSpeciesSelection
                data={builderData}
                onUpdate={updateBuilderData}
              />
            </>
          )}
          {currentStep === 'origin-feats' && (
            <>
              <AbilityScoresHeader data={builderData} />
              <PrimaryAbilityInfo data={builderData} />
              <Step3DOriginFeats
                data={builderData}
                onUpdate={updateBuilderData}
              />
            </>
          )}
          {currentStep === 'spell-selection' && shouldShowSpellStep && (
            <>
              <AbilityScoresHeader data={builderData} />
              <PrimaryAbilityInfo data={builderData} />
              <SpellSelectionWizard
                data={builderData}
                onUpdate={updateBuilderData}
                onValidityChange={() => {}} // No-op - validation no longer blocks
                navigationHandlersRef={spellWizardNavigationRef}
              />
            </>
          )}
          {/* Equipment selection step removed per UX spec - equipment is auto-derived */}
          {currentStep === 'review-create' && (
            <>
              <AbilityScoresHeader data={builderData} />
              <PrimaryAbilityInfo data={builderData} />
              <Step5ReviewCreate
                data={builderData}
                onComplete={(characterId: number) => {
                  // Reset wizard state before navigating
                  resetBuilder();
                  // Navigate directly to character sheet - choices are now handled in Step2
                  navigate(`/characters/${characterId}`);
                }}
                createHandlerRef={reviewCreateHandlerRef}
              />
            </>
          )}
          {!['character-info', 'ability-scores', 'class-selection', 'background-selection', 'species-selection', 'origin-feats', 'spell-selection', 'review-create'].includes(currentStep) && (
            <div className="step-placeholder">
              <h2>{STEP_LABELS[currentStep]}</h2>
              <p>Step content coming soon...</p>
              <pre>{JSON.stringify(builderData, null, 2)}</pre>
            </div>
          )}

          {/* Dev/Utility Controls */}
          {(isDev || currentStep !== 'character-info') && (
            <WizardControls style={{ padding: '0.75rem 0', marginTop: '1rem' }}>
              <div className="wizard-controls-left">
                {currentStep !== 'character-info' && (
                  <button
                    onClick={handleStartOver}
                    className="wizard-btn wizard-btn-danger"
                    style={{
                      background: 'linear-gradient(145deg, #dc3545, #c82333)',
                      borderColor: '#dc3545',
                      color: '#fff',
                      padding: '8px 16px',
                      fontSize: '0.875rem'
                    }}
                  >
                    Start Over
                  </button>
                )}
                {isDev && (
                  <button
                    onClick={quickFillWizard}
                    className="wizard-btn"
                    style={{
                      background: 'linear-gradient(145deg, #17a2b8, #138496)',
                      borderColor: '#17a2b8',
                      color: '#fff',
                      marginLeft: currentStep !== 'character-info' ? '0.5rem' : '0',
                      padding: '8px 16px',
                      fontSize: '0.875rem'
                    }}
                    title="DEV: Quick-fill wizard with test Wizard character"
                  >
                    ⚡ Quick Fill (DEV)
                  </button>
                )}
              </div>
            </WizardControls>
          )}
        </WizardContent>

        {/* Persistent Bottom Navigation - Hidden on character-info step */}
        {currentStep !== 'character-info' && (
          <PersistentBottomNav
            canGoBack={canGoBack()}
            canGoNext={true}
            canReview={false}
            onBack={goBack}
            onNext={goNext}
            onReview={() => setCurrentStep('review-create')}
            currentStepLabel={STEP_LABELS[currentStep] || ''}
            isNextDisabled={false}
            nextLabel={currentStep === 'review-create' ? 'Create Character' : 'Next'}
            steps={progressSteps}
            onStepClick={(stepKey) => goToStep(stepKey as WizardStep)}
          />
        )}
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
