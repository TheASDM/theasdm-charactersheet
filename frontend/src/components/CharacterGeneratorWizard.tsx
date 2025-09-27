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
import { Step4EquipmentSelection } from './wizard-steps/Step4_EquipmentSelection';
import { CLASS_SKILL_CHOICES } from '../services/classService';

// Wizard step types
export type WizardStep =
  | 'character-info'
  | 'ability-scores'
  | 'class-selection'
  | 'background-selection'
  | 'species-selection'
  | 'species-choices'
  | 'origin-feats'
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

  // Step 3A: Background
  selectedBackground: string;
  backgroundAbilityScoreAllocations?: { [ability: string]: number };
  selectedLanguages?: string[];

  // Step 3B: Species
  selectedSpecies: string;
  isHuman: boolean; // Determines feat count

  // Step 3C: Species Choices
  speciesChoices?: { [key: string]: string };

  // Step 3D: Origin Feats
  selectedOriginFeats: string[];
  requiredFeatCount: number;

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
  'equipment-selection': 'Equipment',
  'review-create': 'Review & Create'
};

export default function CharacterGeneratorWizard() {
  const navigate = useNavigate();

  // Wizard navigation state
  const [wizardState, setWizardState] = useState<WizardState>({
    currentStep: 'character-info',
    completedSteps: new Set(),
    canProceed: false
  });

  // Character builder data
  const [builderData, setBuilderData] = useState<CharacterBuilderData>({
    characterName: '',
    playerName: '',
    abilityScoreMethod: 'standard-array',
    abilityScores: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10
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
  });

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

  // Validate current step
  const validateCurrentStep = useCallback((): boolean => {
    switch (wizardState.currentStep) {
      case 'character-info':
        return builderData.characterName.trim() !== '' &&
               builderData.playerName.trim() !== '';

      case 'ability-scores':
        return Object.values(builderData.abilityScores).every(score => score >= 8 && score <= 15);

      case 'class-selection':
        // Must have class selected and completed all class steps
        if (!builderData.selectedClass) return false;

        // Check if we need to complete skill selection
        const requiredSkillCount = CLASS_SKILL_CHOICES[builderData.selectedClass as keyof typeof CLASS_SKILL_CHOICES] || 0;
        if (requiredSkillCount > 0 && builderData.selectedClassSkills.length !== requiredSkillCount) {
          return false;
        }

        // Must be on step 3 (features completed) or higher
        if (builderData.classStep < 3) return false;

        // Check if any class choices are required but not completed
        // This will be validated by the Step2ClassSelection component
        // For now, just check that we've completed step 3
        return builderData.classStep >= 3;

      case 'background-selection':
        return builderData.selectedBackground !== '';

      case 'species-selection':
        return builderData.selectedSpecies !== '';

      case 'species-choices':
        // Check if species requires choices and if they're made
        const speciesNeedingChoices = ['dragonborn', 'elf', 'gnome', 'goliath', 'tiefling'];
        const needsChoices = speciesNeedingChoices.includes(builderData.selectedSpecies?.toLowerCase() || '');

        if (!needsChoices) return true; // No choices needed

        // Check specific requirements
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
          default:
            return true;
        }

      case 'origin-feats':
        return builderData.selectedOriginFeats.length === builderData.requiredFeatCount;

      case 'equipment-selection':
        // Equipment is optional for character creation, but we could require at least one weapon
        return true; // For now, equipment selection is always optional

      case 'review-create':
        return true; // Always valid if we reached this step

      default:
        return false;
    }
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

    setWizardState(prev => ({
      ...prev,
      currentStep: nextStep,
      completedSteps: new Set([...prev.completedSteps, prev.currentStep])
    }));
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

  return (
    <WizardContainer>
      <div className="character-generator-wizard">
        {/* Header */}
        <WizardHeader>
          <h1>Create New Character</h1>
        </WizardHeader>

        {/* Step Content */}
        <WizardContent>
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
            <Step2ClassSelection
              data={builderData}
              onUpdate={updateBuilderData}
            />
          )}
          {wizardState.currentStep === 'background-selection' && (
            <Step3ABackgroundSelection
              data={builderData}
              onUpdate={updateBuilderData}
            />
          )}
          {wizardState.currentStep === 'species-selection' && (
            <Step3BSpeciesSelection
              data={builderData}
              onUpdate={updateBuilderData}
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
          {wizardState.currentStep === 'equipment-selection' && (
            <Step4EquipmentSelection
              data={builderData}
              onUpdate={updateBuilderData}
            />
          )}
          {!['character-info', 'ability-scores', 'class-selection', 'background-selection', 'species-selection', 'species-choices', 'origin-feats', 'equipment-selection'].includes(wizardState.currentStep) && (
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
                onClick={() => wizardState.completedSteps.has(step) && goToStep(step)}
              >
                <span className="step-number">{index + 1}</span>
                <span className="step-label">{STEP_LABELS[step]}</span>
              </div>
            ))}
          </WizardProgress>

          {/* Navigation Controls */}
          <WizardControls>
            <button
              onClick={goBack}
              disabled={!canGoBack()}
              className="wizard-btn wizard-btn-secondary"
            >
              Back
            </button>

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
                >
                  Next
                </button>
              )}
            </div>
          </WizardControls>
        </WizardContent>
      </div>
    </WizardContainer>
  );
}