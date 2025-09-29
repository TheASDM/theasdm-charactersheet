// Comprehensive feature and trait system for D&D 2024 characters

export type FeatureType =
  | 'passive'        // Always active (e.g., Darkvision, Armor Proficiency)
  | 'active'         // Requires action/bonus action (e.g., Action Surge, Rage)
  | 'reaction'       // Triggered by specific events (e.g., Opportunity Attack)
  | 'resource'       // Has limited uses (e.g., Channel Divinity, Spell Slots)
  | 'choice'         // Grants options/choices (e.g., Fighting Style, Expertise)
  | 'conditional'    // Situational benefits (e.g., Advantage on saves vs magic)
  | 'upgrade';       // Improves existing abilities (e.g., Extra Attack)

export type FeatureSource =
  | 'class'
  | 'subclass'
  | 'species'
  | 'background'
  | 'feat'
  | 'magic-item'
  | 'custom';

export type ActionType =
  | 'action'
  | 'bonus-action'
  | 'reaction'
  | 'free'
  | 'passive'
  | 'special';

export type ResourceType =
  | 'per-turn'
  | 'per-round'
  | 'per-short-rest'
  | 'per-long-rest'
  | 'per-day'
  | 'charges'
  | 'permanent';

export interface FeatureResource {
  type: ResourceType;
  maxUses: number | 'proficiency' | 'ability-modifier' | 'level';
  abilityModifier?: keyof CharacterAbilityScores; // For ability-modifier type
  currentUses?: number;
  rechargeOn?: string[]; // What triggers recharge
}

export interface FeatureAction {
  type: ActionType;
  range?: string;        // "Self", "30 feet", "Touch", etc.
  duration?: string;     // "Instantaneous", "1 minute", "8 hours", etc.
  savingThrow?: {
    ability: keyof CharacterAbilityScores;
    dc: number | 'spell-save' | 'ability-based';
  };
  attack?: {
    type: 'melee' | 'ranged' | 'spell';
    bonus?: number | 'proficiency' | 'ability-modifier';
    abilityModifier?: keyof CharacterAbilityScores;
  };
  damage?: {
    dice: string;      // "1d8", "2d6+3", etc.
    type: string;      // "slashing", "fire", etc.
    abilityModifier?: keyof CharacterAbilityScores;
  };
}

export interface FeatureEffect {
  type: 'bonus' | 'advantage' | 'disadvantage' | 'resistance' | 'immunity' | 'proficiency' | 'expertise' | 'custom';
  target: string;        // What this affects: "Perception checks", "Fire damage", etc.
  value?: number;        // Numeric bonus if applicable
  condition?: string;    // When this applies: "while raging", "against spells", etc.
}

export interface FeatureChoice {
  id: string;
  name: string;
  description: string;
  category: string;      // "Fighting Style", "Expertise", "Cantrip", etc.
  options: string[];     // Available choices
  maxSelections: number; // How many can be selected
  levelRequired?: number;
  prerequisites?: string[];
}

export interface CharacterFeature {
  id: string;
  name: string;
  source: FeatureSource;
  sourceDetail: string;  // "Fighter", "Tiefling", "Magic Initiate", etc.
  type: FeatureType;
  level?: number;         // Level when gained

  // Variant system support
  baseFeatureId?: string; // Links variants to their base feature
  variant?: string;       // "Acid", "Fire", "Defense", etc.

  // Core description and rules
  description: string;
  shortDescription?: string; // One-line summary for compact display

  // Mechanical components
  action?: FeatureAction;
  resource?: FeatureResource;
  effects?: FeatureEffect[];
  choices?: FeatureChoice[];

  // Selected choices (for features that grant options)
  selectedChoices?: { [choiceId: string]: string[] };

  // Display and organization
  category?: string;      // "Combat", "Utility", "Social", etc.
  tags?: string[];        // ["magical", "combat", "detection"] for filtering

  // Rules references
  rulesText?: string;     // Full rules text if different from description
  pageReference?: string; // "PHB p.72" or similar

  // State tracking
  isActive?: boolean;     // For toggleable features
  currentUses?: number;   // For resource-based features

  // Conditional logic
  prerequisites?: string[];
  restrictions?: string[];
  incompatibleWith?: string[];
}

// Helper type for ability scores
interface CharacterAbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

// Feature collections for character sheet
export interface CharacterFeatures {
  classFeatures: CharacterFeature[];
  subclassFeatures: CharacterFeature[];
  speciesTraits: CharacterFeature[];
  backgroundFeatures: CharacterFeature[];
  feats: CharacterFeature[];
  magicItemFeatures: CharacterFeature[];
  customFeatures: CharacterFeature[];
}

// Utility type for feature creation
export interface CreateFeatureParams {
  name: string;
  source: FeatureSource;
  sourceDetail: string;
  type: FeatureType;
  description: string;
  level?: number;
  action?: Partial<FeatureAction>;
  resource?: Partial<FeatureResource>;
  effects?: FeatureEffect[];
  choices?: FeatureChoice[];
}

// Feature display configuration
export interface FeatureDisplayConfig {
  showSource: boolean;
  showLevel: boolean;
  showResources: boolean;
  showChoices: boolean;
  compactMode: boolean;
  groupBySource: boolean;
  filterByType?: FeatureType[];
  filterBySource?: FeatureSource[];
}

// Feature interaction results
export interface FeatureInteractionResult {
  success: boolean;
  message: string;
  updatedFeature?: CharacterFeature;
  stateChanges?: { [key: string]: any };
}