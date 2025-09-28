import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CharacterSheetData, createDefaultCharacterSheet } from '../types/characterSheet';
import characterService from '../services/characterService';
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
import { Step3CSpeciesChoices } from './wizard-steps/Step3C_SpeciesChoices';
import { Step3DOriginFeats } from './wizard-steps/Step3D_OriginFeats';
import { Step3EFeatChoices } from './wizard-steps/Step3E_FeatChoices';
import { Step4EquipmentSelection } from './wizard-steps/Step4_EquipmentSelection';
import { Step5ReviewCreate } from './wizard-steps/Step5_ReviewCreate';
import { AbilityScoresHeader } from './wizard-steps/AbilityScoresHeader';

// Wizard step types
export type WizardStep =
  | 'character-info'
  | 'ability-scores'
  | 'class-selection'
  | 'background-selection'
  | 'species-selection'
  | 'species-choices'
  | 'origin-feats'
  | 'feat-choices'
  | 'equipment-selection'
  | 'review-create';

export interface WizardState {
  currentStep: WizardStep;
  completedSteps: Set<WizardStep>;
  canProceed: boolean;
}

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
}

const WIZARD_STEPS: WizardStep[] = [
  'character-info',
  'ability-scores',
  'class-selection',
  'background-selection',
  'species-selection',
  'species-choices',
  'origin-feats',
  'feat-choices',
  'equipment-selection',
  'review-create'
];

const STEP_LABELS = {
  'character-info': 'Character & Player Info',
  'ability-scores': 'Ability Scores',
  'class-selection': 'Class',
  'background-selection': 'Background',
  'species-selection': 'Species',
  'species-choices': 'Species Choices',
  'origin-feats': 'Origin Feats',
  'feat-choices': 'Feat Choices',
  'equipment-selection': 'Equipment',
  'review-create': 'Review & Create'
};

// Initial character builder data
const INITIAL_BUILDER_DATA: CharacterBuilderData = {
  characterName: '',
  playerName: '',
  abilityScoreMethod: 'standard-array',
  abilityScores: {
    strength: 0,
    dexterity: 0,
    constitution: 0,
    intelligence: 0,
    wisdom: 0,
    charisma: 0
  },
  selectedClass: '',
  selectedClassSkills: [],
  selectedClassChoices: {},
  classStep: 1,
  classFeatureData: null,
  selectedBackground: '',
  selectedSpecies: '',
  isHuman: false,
  selectedOriginFeats: [],
  requiredFeatCount: 1,
  selectedEquipment: {
    weapons: [],
    equipment: []
  }
};

export default function CharacterGeneratorWizard() {
  const navigate = useNavigate();

  // Wizard navigation state
  const [wizardState, setWizardState] = useState<WizardState>({
    currentStep: 'character-info',
    completedSteps: new Set(),
    canProceed: false
  });

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showStartOverModal, setShowStartOverModal] = useState(false);

  // Character builder data
  const [builderData, setBuilderData] = useState<CharacterBuilderData>(INITIAL_BUILDER_DATA);

  // Update builder data and validate current step
  const updateBuilderData = useCallback((updates: Partial<CharacterBuilderData>) => {
    setBuilderData(prev => {
      const newData = { ...prev, ...updates };

      // Auto-detect Human species for feat count
      if (updates.selectedSpecies) {
        newData.isHuman = updates.selectedSpecies.toLowerCase() === 'human';
        newData.requiredFeatCount = newData.isHuman ? 2 : 1;
        // Reset feat selection if count changed
        if (newData.requiredFeatCount !== prev.requiredFeatCount) {
          newData.selectedOriginFeats = [];
        }
      }

      return newData;
    });
  }, []);

  // Start Over functionality
  const handleStartOver = useCallback(() => {
    setShowStartOverModal(true);
  }, []);

  // Dev mode - quick jump to review with sample data
  const handleQuickTest = useCallback(() => {
    const sampleData: CharacterBuilderData = {
      characterName: 'Test Character',
      playerName: 'Test Player',
      abilityScoreMethod: 'standard-array',
      abilityScores: {
        strength: 15,
        dexterity: 14,
        constitution: 13,
        intelligence: 12,
        wisdom: 10,
        charisma: 8
      },
      selectedClass: 'Fighter',
      selectedClassSkills: ['Athletics', 'Intimidation'],
      selectedClassChoices: {},
      classStep: 3,
      classFeatureData: null,
      classProficiencies: {
        armor: ['Light armor', 'medium armor', 'heavy armor', 'shields'],
        weapons: ['Simple weapons', 'martial weapons'],
        tools: [],
        savingThrows: ['Strength', 'Constitution']
      },
      classFeatures: [
        { name: 'Fighting Style', description: 'You adopt a fighting style that reflects your combat training.' },
        { name: 'Second Wind', description: 'You can use a bonus action to regain hit points.' }
      ],
      hitDice: 'd10',
      primaryAbility: ['Strength'],
      spellcaster: false,
      selectedBackground: 'Soldier',
      backgroundAbilityScoreAllocations: { str: 2, con: 1 },
      selectedLanguages: ['Common', 'Orc'],
      backgroundSkillProficiencies: ['Athletics', 'Intimidation'],
      backgroundStartingEquipment: ['Insignia of rank', 'Trophy from fallen enemy', 'Deck of cards', 'Common clothes', 'Belt pouch with 10 gp'],
      selectedSpecies: 'Human',
      isHuman: true,
      speciesTraits: [
        { name: 'Extra Language', description: 'You know one additional language of your choice.' },
        { name: 'Extra Skill', description: 'You gain proficiency in one skill of your choice.' }
      ],
      speciesSize: 'Medium',
      speciesSpeed: 30,
      selectedOriginFeats: ['Alert', 'Lucky'],
      requiredFeatCount: 2,
      featFeatures: {
        'Alert': [{ description: 'You gain a +5 bonus to initiative and cannot be surprised.' }],
        'Lucky': [{ description: 'You have 3 luck points that you can spend to reroll dice.' }]
      },
      selectedEquipment: {
        weapons: ['Longsword', 'Shield'],
        equipment: ['Chain mail', 'Explorer\'s pack']
      }
    };

    setBuilderData(sampleData);
    setWizardState({
      currentStep: 'review-create',
      completedSteps: new Set(['character-info', 'ability-scores', 'class-selection', 'background-selection', 'species-selection', 'species-choices', 'origin-feats', 'feat-choices', 'equipment-selection']),
      canProceed: true
    });
  }, []);

  const confirmStartOver = useCallback(() => {
    // Reset all data to initial state
    setBuilderData(INITIAL_BUILDER_DATA);
    setWizardState({
      currentStep: 'character-info',
      completedSteps: new Set(),
      canProceed: false
    });
    setShowStartOverModal(false);
    setIsTransitioning(false);
  }, []);

  const cancelStartOver = useCallback(() => {
    setShowStartOverModal(false);
  }, []);

  // Validate current step - all fields are optional now
  const validateCurrentStep = useCallback((): boolean => {
    // All steps are now optional - user can navigate freely
    return true;
  }, [wizardState.currentStep, builderData]);

  // Update validation when data changes
  React.useEffect(() => {
    const isValid = validateCurrentStep();
    setWizardState(prev => ({ ...prev, canProceed: isValid }));
  }, [validateCurrentStep]);

  // Navigation functions
  const getCurrentStepIndex = () => WIZARD_STEPS.indexOf(wizardState.currentStep);

  const canGoNext = () => {
    const currentIndex = getCurrentStepIndex();
    return wizardState.canProceed && currentIndex < WIZARD_STEPS.length - 1;
  };

  const canGoBack = () => getCurrentStepIndex() > 0;

  const goToStep = useCallback((step: WizardStep) => {
    setWizardState(prev => ({
      ...prev,
      currentStep: step
    }));
  }, []);

  const goNext = useCallback(() => {
    if (!canGoNext()) return;

    const currentIndex = getCurrentStepIndex();
    const nextStep = WIZARD_STEPS[currentIndex + 1];

    // Start transition
    setIsTransitioning(true);

    // Small delay for transition effect
    setTimeout(() => {
      setWizardState(prev => ({
        ...prev,
        currentStep: nextStep,
        completedSteps: new Set([...prev.completedSteps, prev.currentStep])
      }));

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // End transition
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
    }, 300);
  }, [wizardState.currentStep, wizardState.canProceed]);

  const goBack = useCallback(() => {
    if (!canGoBack()) return;

    const currentIndex = getCurrentStepIndex();
    const prevStep = WIZARD_STEPS[currentIndex - 1];

    setWizardState(prev => ({
      ...prev,
      currentStep: prevStep
    }));
  }, [wizardState.currentStep]);

  // Create final character and save
  const createCharacter = useCallback(async () => {
    try {
      // Create default character sheet
      const character: CharacterSheetData = createDefaultCharacterSheet();

      // Update with character builder data
      character.name = builderData.characterName;
      character.class = builderData.selectedClass;
      character.background = builderData.selectedBackground;
      character.species = builderData.selectedSpecies;
      character.level = 1;

      // Apply ability scores
      character.abilityScores = {
        strength: builderData.abilityScores.strength,
        dexterity: builderData.abilityScores.dexterity,
        constitution: builderData.abilityScores.constitution,
        intelligence: builderData.abilityScores.intelligence,
        wisdom: builderData.abilityScores.wisdom,
        charisma: builderData.abilityScores.charisma,
      };

      // Apply selected class skills as proficiencies
      builderData.selectedClassSkills.forEach(skillName => {
        if (character.skills[skillName]) {
          character.skills[skillName].proficient = true;
        }
      });

      // Store selected skills in proficiencies for reference
      character.proficiencies.skills = [...builderData.selectedClassSkills];

      // Add selected feats
      character.feats = [...builderData.selectedOriginFeats];

      // Add selected equipment
      const allEquipment = [];
      if (builderData.selectedEquipment.armor) allEquipment.push(builderData.selectedEquipment.armor);
      if (builderData.selectedEquipment.shield) allEquipment.push(builderData.selectedEquipment.shield);
      if (builderData.selectedEquipment.weapons) allEquipment.push(...builderData.selectedEquipment.weapons);
      if (builderData.selectedEquipment.equipment) allEquipment.push(...builderData.selectedEquipment.equipment);

      character.equipment = allEquipment;

      // Store class features (will be processed further by character calculations service)
      // For now, just store the selected class - the character service can derive features
      character.classFeatures = []; // Will be populated by backend based on class and choices

      // Save character using the service
      const response = await characterService.create({
        userId: 1, // TODO: Get actual user ID from context
        name: builderData.characterName,
        level: 1,
        characterData: character,
        isPublic: false,
        // Store additional builder data for backend processing
        builderData: {
          selectedClassChoices: builderData.selectedClassChoices,
          classFeatureData: builderData.classFeatureData
        }
      } as any); // TODO: Update service types to support builderData

      if (!response.data) {
        throw new Error('No character data returned from server');
      }

      const savedCharacter = response.data;

      // Navigate to character sheet
      navigate(`/character/${savedCharacter.id}`);

    } catch (error) {
      console.error('Failed to create character:', error);
      // TODO: Show error message to user
    }
  }, [builderData, navigate]);

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

  // Check if species choices are complete
  const isSpeciesChoicesComplete = (): boolean => {
    // First check if species selection is complete
    if (!isSpeciesSelectionComplete()) return false;

    const needsChoices = ['dragonborn', 'elf', 'gnome', 'goliath', 'tiefling', 'human'].includes(
      builderData.selectedSpecies?.toLowerCase() || ''
    );

    if (!needsChoices) return true; // Species doesn't need choices

    const choices = builderData.speciesChoices || {};
    switch (builderData.selectedSpecies?.toLowerCase()) {
      case 'dragonborn':
        return !!choices.draconicAncestry;
      case 'elf':
        return !!choices.elfLineage;
      case 'gnome':
        return !!choices.gnomeLineage;
      case 'goliath':
        return !!choices.giantAncestry;
      case 'tiefling':
        return !!choices.fiendishLegacy;
      case 'human':
        return !!choices.humanSkill;
      default:
        return true;
    }
  };

  // Check if origin feats selection is complete
  const isOriginFeatsComplete = (): boolean => {
    return builderData.selectedOriginFeats.length >= builderData.requiredFeatCount;
  };

  // Check if feat choices are complete
  const isFeatChoicesComplete = (): boolean => {
    // First check if origin feats selection is complete
    if (!isOriginFeatsComplete()) return false;

    const featsWithChoices = builderData.selectedOriginFeats?.filter(featName =>
      ['Magic Initiate', 'Skilled', 'Crafter', 'Musician'].includes(featName)
    ) || [];

    if (featsWithChoices.length === 0) return true; // No feats require choices

    return featsWithChoices.every(featName => {
      const choices = builderData.featChoices?.[featName];
      if (!choices) return false;

      switch (featName) {
        case 'Magic Initiate':
          return !!choices.spellClass;
        case 'Skilled':
          return choices.skills?.length === 3;
        case 'Crafter':
          return choices.tools?.length === 3;
        case 'Musician':
          return choices.instruments?.length === 3;
        default:
          return true;
      }
    });
  };

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

  // Check if current step is complete
  const isCurrentStepComplete = (): boolean => {
    switch (wizardState.currentStep) {
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
      case 'species-choices':
        return isSpeciesChoicesComplete();
      case 'origin-feats':
        return isOriginFeatsComplete();
      case 'feat-choices':
        return isFeatChoicesComplete();
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
          {wizardState.currentStep === 'character-info' && (
            <Step0CharacterInfo
              data={builderData}
              onUpdate={updateBuilderData}
            />
          )}
          {wizardState.currentStep === 'ability-scores' && (
            <Step1AbilityScores
              data={builderData}
              onUpdate={updateBuilderData}
            />
          )}
          {wizardState.currentStep === 'class-selection' && (
            <>
              <AbilityScoresHeader data={builderData} />
              <Step2ClassSelection
                data={builderData}
                onUpdate={updateBuilderData}
              />
            </>
          )}
          {wizardState.currentStep === 'background-selection' && (
            <>
              <AbilityScoresHeader data={builderData} />
              <Step3ABackgroundSelection
                data={builderData}
                onUpdate={updateBuilderData}
              />
            </>
          )}
          {wizardState.currentStep === 'species-selection' && (
            <Step3BSpeciesSelection
              data={builderData}
              onUpdate={updateBuilderData}
              onAdvance={goNext}
            />
          )}
          {wizardState.currentStep === 'species-choices' && (
            <Step3CSpeciesChoices
              data={builderData}
              onUpdate={updateBuilderData}
            />
          )}
          {wizardState.currentStep === 'origin-feats' && (
            <Step3DOriginFeats
              data={builderData}
              onUpdate={updateBuilderData}
            />
          )}
          {wizardState.currentStep === 'feat-choices' && (
            <Step3EFeatChoices
              data={builderData}
              onUpdate={updateBuilderData}
            />
          )}
          {wizardState.currentStep === 'equipment-selection' && (
            <Step4EquipmentSelection
              data={builderData}
              onUpdate={updateBuilderData}
            />
          )}
          {wizardState.currentStep === 'review-create' && (
            <Step5ReviewCreate
              data={builderData}
              onComplete={() => {
                console.log('Character created successfully!');
                alert('Character created successfully! Redirecting to characters page...');
                navigate('/characters');
              }}
            />
          )}
          {!['character-info', 'ability-scores', 'class-selection', 'background-selection', 'species-selection', 'species-choices', 'origin-feats', 'feat-choices', 'equipment-selection', 'review-create'].includes(wizardState.currentStep) && (
            <div className="step-placeholder">
              <h2>{STEP_LABELS[wizardState.currentStep]}</h2>
              <p>Step content coming soon...</p>
              <pre>{JSON.stringify(builderData, null, 2)}</pre>
            </div>
          )}

          {/* Progress Bar */}
          <WizardProgress className="bottom-progress">
            {WIZARD_STEPS.map((step, index) => (
              <div
                key={step}
                className={`progress-step ${
                  step === wizardState.currentStep ? 'current' : ''
                } ${
                  wizardState.completedSteps.has(step) ? 'completed' : ''
                }`}
                onClick={() => goToStep(step)}
              >
                <span className="step-number">{index + 1}</span>
                <span className="step-label" style={{
                  color: (
                    (step === 'character-info' && isCharacterInfoComplete()) ||
                    (step === 'ability-scores' && isAbilityScoresComplete()) ||
                    (step === 'class-selection' && isClassSelectionComplete()) ||
                    (step === 'background-selection' && isBackgroundSelectionComplete()) ||
                    (step === 'species-selection' && isSpeciesSelectionComplete()) ||
                    (step === 'species-choices' && isSpeciesChoicesComplete()) ||
                    (step === 'origin-feats' && isOriginFeatsComplete()) ||
                    (step === 'feat-choices' && isFeatChoicesComplete()) ||
                    (step === 'equipment-selection' && isEquipmentSelectionComplete())
                  ) ? '#4caf50' : undefined
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
              <button
                onClick={handleQuickTest}
                className="wizard-btn wizard-btn-warning"
                style={{
                  background: 'linear-gradient(145deg, #ffc107, #e0a800)',
                  borderColor: '#ffc107',
                  color: '#000',
                  marginLeft: '0.5rem'
                }}
              >
                Quick Test
              </button>
            </div>

            <div className="wizard-controls-right">
              {wizardState.currentStep === 'review-create' ? (
                <button
                  onClick={createCharacter}
                  className="wizard-btn wizard-btn-primary"
                >
                  Create Character
                </button>
              ) : (
                <button
                  onClick={goNext}
                  disabled={!canGoNext()}
                  className="wizard-btn wizard-btn-primary"
                  style={{
                    background: isCurrentStepComplete() ? 'linear-gradient(145deg, #4caf50, #45a049)' : undefined,
                    borderColor: isCurrentStepComplete() ? '#4caf50' : undefined
                  }}
                >
                  Next
                </button>
              )}
            </div>
          </WizardControls>
        </WizardContent>
      </div>

      {/* Start Over Confirmation Modal */}
      {showStartOverModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            border: '2px solid #dc3545',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            color: '#f0f0f0',
            textAlign: 'center'
          }}>
            <h2 style={{
              fontFamily: 'Cinzel, serif',
              color: '#dc3545',
              fontSize: '1.8rem',
              margin: '0 0 1rem 0'
            }}>
              Start Over?
            </h2>
            <p style={{
              color: '#ccc',
              fontSize: '1rem',
              lineHeight: '1.4',
              margin: '0 0 1.5rem 0'
            }}>
              Are you sure you want to start over? This will clear all your character data and return you to the beginning. This action cannot be undone.
            </p>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '1rem'
            }}>
              <button
                onClick={cancelStartOver}
                className="wizard-btn wizard-btn-secondary"
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
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
                  color: '#fff'
                }}
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}
    </WizardContainer>
  );
}