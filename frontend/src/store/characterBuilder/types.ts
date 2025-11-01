import type { ClassStartingEquipment } from '@/constants/startingEquipment';

export type WizardStep =
  | 'character-info'
  | 'ability-scores'
  | 'class-selection'
  | 'background-selection'
  | 'species-selection'
  | 'origin-feats'
  | 'spell-selection'
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
  classStartingEquipment?: ClassStartingEquipment;
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
  skillProficiencies?: string[];
  toolProficiencies?: string[];
  spells?: {
    cantrips?: string[];
    level1?: string[];
    level3?: string[];
    level5?: string[];
  };
  grantedSpells?: string[]; // Spell IDs granted by species/lineage (for Rock Gnome, Drow, etc.)
  size?: string;
  speed?: number;
  additionalSpeeds?: Record<string, number>;
  darkvision?: number;
  resistances?: string[];
  immunities?: string[];
  choices?: Record<string, string>;
  abilityScoreAllocations?: Record<string, number>;
}

export interface FeatsState {
  selectedOriginFeats: string[];
  requiredFeatCount: number;
  featFeatures?: Record<string, any[]>;
  featSpells?: Record<string, string[]>;
  featChoices?: Record<string, any>;
  skillProficiencies?: string[];
  toolProficiencies?: string[];
}

export interface EquipmentState {
  armor?: string;
  weapons?: string[];
  shield?: string;
  equipment?: string[];
}

export interface SpellbookState {
  known: string[];
  prepared?: string[];
  cantrips?: string[];
  wizardSpellbook?: string[];
  currentStep?: 'cantrips' | 'spellbook' | 'prepared';
}

export interface ResourcesState {
  manaCurrent?: number;
  manaMax?: number;
}

export const createDefaultAbilityScores = (): AbilityScoreValue => ({
  strength: 0,
  dexterity: 0,
  constitution: 0,
  intelligence: 0,
  wisdom: 0,
  charisma: 0,
});

export const createInitialWizardNavigationState = () => ({
  currentStep: 'character-info' as WizardStep,
  completedSteps: [] as WizardStep[],
});

export const createInitialBasicInfo = (): BasicInfoState => ({
  characterName: '',
  playerName: '',
});

export const createInitialAbilityScores = (): AbilityScoresState => ({
  method: 'standard-array',
  scores: createDefaultAbilityScores(),
});

export const createInitialClassSelection = (): ClassSelectionState => ({
  selectedClass: '',
  selectedClassSkills: [],
  selectedClassChoices: {},
  classStep: 1,
  classFeatureData: null,
});

export const createInitialBackground = (): BackgroundState => ({
  selectedBackground: '',
});

export const createInitialSpecies = (): SpeciesState => ({
  selectedSpecies: '',
  isHuman: false,
  skillProficiencies: [],
  toolProficiencies: [],
  abilityScoreAllocations: {},
});

export const createInitialFeats = (): FeatsState => ({
  selectedOriginFeats: [],
  requiredFeatCount: 1,
  skillProficiencies: [],
  toolProficiencies: [],
});

export const createInitialEquipment = (): EquipmentState => ({
  weapons: [],
  equipment: [],
});

export const createInitialSpellbook = (): SpellbookState => ({
  known: [],
  prepared: [],
});

export const createInitialResources = (): ResourcesState => ({});

export const createInitialCharacterBuilderData = () => ({
  ...createInitialWizardNavigationState(),
  basicInfo: createInitialBasicInfo(),
  abilityScores: createInitialAbilityScores(),
  classSelection: createInitialClassSelection(),
  background: createInitialBackground(),
  species: createInitialSpecies(),
  feats: createInitialFeats(),
  equipment: createInitialEquipment(),
  spells: createInitialSpellbook(),
  resources: createInitialResources(),
});

export interface WizardNavigationSlice {
  currentStep: WizardStep;
  completedSteps: WizardStep[];
  setCurrentStep: (step: WizardStep) => void;
  markStepComplete: (step: WizardStep) => void;
  resetProgress: () => void;
}

export interface BasicInfoSlice {
  basicInfo: BasicInfoState;
  updateBasicInfo: (updates: Partial<BasicInfoState>) => void;
}

export interface AbilityScoresSlice {
  abilityScores: AbilityScoresState;
  updateAbilityScores: (
    updates: Partial<Omit<AbilityScoresState, 'scores'>> & {
      scores?: Partial<AbilityScoreValue> | AbilityScoreValue;
    }
  ) => void;
}

export interface ClassSelectionSlice {
  classSelection: ClassSelectionState;
  updateClassSelection: (updates: Partial<ClassSelectionState>) => void;
}

export interface BackgroundSlice {
  background: BackgroundState;
  updateBackground: (updates: Partial<BackgroundState>) => void;
}

export interface SpeciesSlice {
  species: SpeciesState;
  updateSpecies: (updates: Partial<SpeciesState>) => void;
}

export interface FeatsSlice {
  feats: FeatsState;
  updateFeats: (updates: Partial<FeatsState>) => void;
}

export interface EquipmentSlice {
  equipment: EquipmentState;
  updateEquipment: (updates: Partial<EquipmentState>) => void;
}

export interface SpellbookSlice {
  spells: SpellbookState;
  setKnownSpells: (ids: string[]) => void;
  setPreparedSpells: (ids: string[]) => void;
  updateSpellbook: (updates: Partial<SpellbookState>) => void;
}

export interface ResourceSlice {
  resources: ResourcesState;
  setMana: (values: Partial<{ manaCurrent: number; manaMax: number }>) => void;
  updateResources: (updates: Partial<ResourcesState>) => void;
}

export interface ResetSlice {
  resetBuilder: () => void;
}

export type CharacterBuilderStore = WizardNavigationSlice &
  BasicInfoSlice &
  AbilityScoresSlice &
  ClassSelectionSlice &
  BackgroundSlice &
  SpeciesSlice &
  FeatsSlice &
  EquipmentSlice &
  SpellbookSlice &
  ResourceSlice &
  ResetSlice;
