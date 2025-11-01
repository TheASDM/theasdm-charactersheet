/**
 * Types for D&D 2024 class features with choice system
 */

/**
 * Mechanics data for a feature (damage, abilities, etc.)
 */
export interface FeatureMechanics {
  diceRolls: string[];
  damageTypes: string[];
  abilities: string[];
  actionType: 'action' | 'bonus-action' | 'reaction' | 'free' | null;
  range: string | null;
  duration: string | null;
  savingThrow: string | null;
  proficiencies: string[];
  spellsGranted: string[];
  scales: boolean;
  uses?: number;
  rechargeOn?: ('short-rest' | 'long-rest')[];
  damage?: string;
  expertise?: number;
  invocations?: number;
  spellsByLevel?: {
    [level: string]: string[];
  };
}

/**
 * Scaling progression for features that change with level
 */
export interface ScalingProgression {
  level: number;
  changes: {
    damage?: string;
    diceRolls?: string[];
    uses?: number;
    expertise?: number;
    [key: string]: any;
  };
}

/**
 * External reference for choices that load data from external files
 */
export interface ExternalReference {
  type: 'feat' | 'invocations' | 'skills' | 'spells';
  count: number;
  dataFile?: string; // For invocations: "EldritchInvocations.json"
  category?: string; // For feats: "Fighting Style"
  source?: string; // For skills: "proficient-skills"
  filterByPrerequisites?: boolean;
  applyExpertise?: boolean;
  allowCustomOption?: boolean;
  customOption?: {
    id: string;
    name: string;
    description: string;
  };
}

/**
 * A single class feature from the processed class data OR database
 */
export interface ClassFeature {
  id?: string;
  name: string;
  level: number;
  source: string;
  page?: number;
  featureType?: 'base' | 'subclass';

  // Old format: flat description string (from processed JSON files)
  description?: string;

  // New format: nested entries array (from database)
  entries?: any[]; // 5etools entry array structure

  mechanics?: FeatureMechanics;

  // Choice system properties
  isChoice?: boolean;
  requiresSelection?: boolean;
  choiceGroup?: string; // For embedded choices (old system)

  // External reference system (new system)
  choiceType?: 'external-feat' | 'external-invocations' | 'external-skills' | 'external-spells';
  externalReference?: ExternalReference;

  // Granted options system
  grantedOptions?: string[]; // Array of feature IDs that are automatically granted
  parentFeature?: string;
  usageType?: 'granted-option';

  // Scaling system
  scales?: boolean;
  scalingProgression?: ScalingProgression[];

  // Subclass tracking
  subclass?: string;
  className?: string;
  classSource?: string;

  prerequisites?: string[];
}

/**
 * Structure of a complete class data file (e.g., Cleric.json, Rogue.json)
 */
export interface ClassData {
  className: string;
  slug?: string;
  source: string;
  hitDie?: number;
  primaryAbilities?: string[];
  savingThrows?: string[];
  proficiencies?: {
    armor?: string[];
    weapons?: string[];
    tools?: string[];
  };
  spellcastingAbility?: string;
  subclassTitle?: string;
  spellcasting?: {
    ability: string;
    progression: string;
  } | null;
  features: ClassFeature[];
  subclasses?: {
    [subclassName: string]: ClassFeature[];
  } | any[];
  mechanics?: any; // Full 5etools raw structure
}

/**
 * A choice prompt that needs to be presented to the user
 */
export interface ChoicePrompt {
  choiceGroup: string;
  level: number;
  title: string;
  description: string;
  selectionMode: 'single' | 'multiple';
  minSelections?: number;
  maxSelections?: number;
  options: ClassFeature[];
  isRequired: boolean;
  // For external reference choices
  choiceType?: 'external-feat' | 'external-invocations' | 'external-skills' | 'external-spells';
  externalReference?: ExternalReference;
}

/**
 * Result of detecting required choices for a character
 */
export interface ChoiceDetectionResult {
  hasIncompleteChoices: boolean;
  prompts: ChoicePrompt[];
}

/**
 * A user's selection for a choice group
 */
export interface ChoiceSelection {
  choiceGroupId: string;
  selectedFeatureIds: string[];
  timestamp: Date;
}

/**
 * Result of applying a choice to a character
 */
export interface ChoiceApplicationResult {
  success: boolean;
  errors: string[];
  updatedCharacter?: any;
}
