import { create } from 'zustand';

export type WizardStep =
  | 'character-info'
  | 'ability-scores'
  | 'class-selection'
  | 'background-selection'
  | 'species-selection'
  | 'origin-feats'
  | 'equipment-selection'
  | 'review-create';

export type AbilityScoreValue = {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
};

export interface BasicInfoState {
  characterName: string;
  playerName: string;
}

export interface AbilityScoresState {
  method: 'standard-array' | 'custom';
  scores: AbilityScoreValue;
}

export interface ClassSelectionState {
  selectedClass: string;
  selectedClassSkills: string[];
  selectedClassChoices: Record<string, string[]>;
  classStep: number;
  classFeatureData: any;
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
}

export interface BackgroundState {
  selectedBackground: string;
  abilityScoreAllocations?: Record<string, number>;
  selectedLanguages?: string[];
  skillProficiencies?: string[];
  toolProficiencies?: string[];
  startingEquipment?: string[];
  features?: any[];
}

export interface SpeciesState {
  selectedSpecies: string;
  isHuman: boolean;
  traits?: any[];
  spells?: {
    cantrips?: string[];
    level1?: string[];
    level3?: string[];
    level5?: string[];
  };
  size?: string;
  speed?: number;
  darkvision?: number;
  resistances?: string[];
  immunities?: string[];
  choices?: Record<string, string>;
}

export interface FeatsState {
  selectedOriginFeats: string[];
  requiredFeatCount: number;
  featFeatures?: Record<string, any[]>;
  featSpells?: Record<string, string[]>;
  featChoices?: Record<string, any>;
}

export interface EquipmentState {
  armor?: string;
  weapons?: string[];
  shield?: string;
  equipment?: string[];
}

const defaultAbilityScores = (): AbilityScoreValue => ({
  strength: 0,
  dexterity: 0,
  constitution: 0,
  intelligence: 0,
  wisdom: 0,
  charisma: 0,
});

const createDefaultSections = () => ({
  basicInfo: {
    characterName: '',
    playerName: '',
  },
  abilityScores: {
    method: 'standard-array' as const,
    scores: defaultAbilityScores(),
  },
  classSelection: {
    selectedClass: '',
    selectedClassSkills: [],
    selectedClassChoices: {},
    classStep: 1,
    classFeatureData: null,
  } as ClassSelectionState,
  background: {
    selectedBackground: '',
  } as BackgroundState,
  species: {
    selectedSpecies: '',
    isHuman: false,
  } as SpeciesState,
  feats: {
    selectedOriginFeats: [],
    requiredFeatCount: 1,
  } as FeatsState,
  equipment: {
    weapons: [],
    equipment: [],
  } as EquipmentState,
});

export interface CharacterBuilderStore {
  currentStep: WizardStep;
  completedSteps: WizardStep[];
  basicInfo: BasicInfoState;
  abilityScores: AbilityScoresState;
  classSelection: ClassSelectionState;
  background: BackgroundState;
  species: SpeciesState;
  feats: FeatsState;
  equipment: EquipmentState;
  setCurrentStep: (step: WizardStep) => void;
  markStepComplete: (step: WizardStep) => void;
  resetProgress: () => void;
  updateBasicInfo: (updates: Partial<BasicInfoState>) => void;
  updateAbilityScores: (updates: Partial<Omit<AbilityScoresState, 'scores'>> & { scores?: Partial<AbilityScoreValue> | AbilityScoreValue }) => void;
  updateClassSelection: (updates: Partial<ClassSelectionState>) => void;
  updateBackground: (updates: Partial<BackgroundState>) => void;
  updateSpecies: (updates: Partial<SpeciesState>) => void;
  updateFeats: (updates: Partial<FeatsState>) => void;
  updateEquipment: (updates: Partial<EquipmentState>) => void;
  resetBuilder: () => void;
}

export const useCharacterBuilderStore = create<CharacterBuilderStore>((set) => ({
  currentStep: 'character-info',
  completedSteps: [],
  ...createDefaultSections(),
  setCurrentStep: (step) => set({ currentStep: step }),
  markStepComplete: (step) =>
    set((state) =>
      state.completedSteps.includes(step)
        ? state
        : { completedSteps: [...state.completedSteps, step] }
    ),
  resetProgress: () => set({ currentStep: 'character-info', completedSteps: [] }),
  updateBasicInfo: (updates) =>
    set((state) => ({
      basicInfo: {
        ...state.basicInfo,
        ...updates,
      },
    })),
  updateAbilityScores: (updates) =>
    set((state) => {
      const nextScores =
        updates.scores !== undefined
          ? {
              ...state.abilityScores.scores,
              ...(updates.scores as Partial<AbilityScoreValue>),
            }
          : state.abilityScores.scores;

      return {
        abilityScores: {
          ...state.abilityScores,
          ...updates,
          scores: nextScores,
        },
      };
    }),
  updateClassSelection: (updates) =>
    set((state) => ({
      classSelection: {
        ...state.classSelection,
        ...updates,
      },
    })),
  updateBackground: (updates) =>
    set((state) => ({
      background: {
        ...state.background,
        ...updates,
      },
    })),
  updateSpecies: (updates) =>
    set((state) => ({
      species: {
        ...state.species,
        ...updates,
      },
    })),
  updateFeats: (updates) =>
    set((state) => ({
      feats: {
        ...state.feats,
        ...updates,
      },
    })),
  updateEquipment: (updates) =>
    set((state) => ({
      equipment: {
        ...state.equipment,
        ...updates,
      },
    })),
  resetBuilder: () =>
    set(() => ({
      currentStep: 'character-info',
      completedSteps: [],
      ...createDefaultSections(),
    })),
}));
