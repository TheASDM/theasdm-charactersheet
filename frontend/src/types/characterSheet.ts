import { CharacterFeatures } from './features';

// Enhanced inventory system types
export interface InventoryItem {
  id: string; // Unique identifier for the inventory slot
  name: string;
  quantity: number;
  equipped?: boolean; // For armor, weapons, shields
  attuned?: boolean; // For magic items requiring attunement
  itemId?: number; // Reference to the official item database
  customProperties?: {
    damage?: string;
    ac?: number;
    properties?: string[];
  };
}

export interface EquipmentConstraints {
  maxArmor: number; // Usually 1
  maxShields: number; // Usually 1
  maxAttunedItems: number; // Usually 3
  weightLimit?: number; // Optional encumbrance
}

export interface EquipmentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Utility types for equipment management
export type EquipmentSlotType = 'armor' | 'shield' | 'weapon' | 'accessory' | 'consumable';

export interface EquipmentSlot {
  type: EquipmentSlotType;
  item?: InventoryItem;
  constraints?: {
    allowedTypes?: string[];
    maxQuantity?: number;
  };
}

// Character sheet specific types that will be stored in Character.characterData
export interface CharacterSheetData {
  name: string;
  background: string;
  class: string;
  species: string;
  subclass: string;
  level: number;
  equippedItemIds: string[];

  // Species choices from character generator
  speciesChoices?: { [key: string]: string };
  speciesAdditionalSpeeds?: Record<string, number>;
  speciesResistances?: string[];
  speciesImmunities?: string[];

  // Background data from character generator
  backgroundFeatures?: any[];
  backgroundEquipment?: string[];
  selectedLanguages?: string[];

  // Feat data from character generator
  selectedOriginFeats?: string[];
  featFeatures?: { [featName: string]: any[] };
  featSpells?: { [featName: string]: string[] };
  featChoices?: { [featName: string]: any };

  // Class choices from character generator
  classChoices?: {
    fightingStyle?: string | undefined;
    [key: string]: any;
  };

  // Selected class choices from character generator
  // Maps choiceGroup ID to array of selected feature IDs
  // Example: { "divine-order-1": ["divine-order-protector-1"] }
  // Example: { "cunning-strike-5": ["cunning-strike-poison-cost-1d6-5", "cunning-strike-trip-cost-1d6-5"] }
  selectedClassChoices?: {
    [choiceGroupId: string]: string[]; // Array of selected feature IDs (supports single or multiple selections)
  };

  spellbook?: {
    known: string[];
    prepared?: string[];
    cantrips?: string[];
    wizardSpellbook?: string[];
    grantedSpells?: string[];
  };

  // Weapon Mastery tracking
  weaponMasteries?: {
    available: number; // How many weapon masteries the character can have active
    active: Array<{
      weapon: string; // e.g., "Longsword", "Greatsword"
      property: string; // e.g., "Sap", "Graze"
    }>;
  };

  xp: number;
  abilityScores: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  proficiencyBonus: number;
  armorClass: number;
  initiative: number;
  speed: number;
  size: string;
  passivePerception: number;
  darkvision?: number; // Darkvision range in feet, 0 or undefined if none
  hitPoints: {
    current: number;
    max: number;
    temp: number;
  };
  hitDice: {
    current: number;
    max: number;
    spent: number;
  };
  deathSaves: {
    successes: number;
    failures: number;
  };
  heroicInspiration: boolean;
  wounds: number;
  mana: {
    current: number;
    max: number;
  };
  resources: {
    [key: string]: number;
  };

  // Enhanced inventory system
  inventory: InventoryItem[];
  equipment: string[]; // Keep for legacy compatibility

  // Equipment constraints
  equipmentConstraints: EquipmentConstraints;

  // Equipped items tracking
  equippedArmor?: InventoryItem;
  equippedShield?: InventoryItem;
  equippedWeapons: InventoryItem[];
  attunedItems: InventoryItem[];
  skills: {
    [key: string]: {
      proficient: boolean;
      modifier: number;
    };
  };
  savingThrows: {
    [key: string]: {
      proficient: boolean;
      modifier: number;
    };
  };
  // New structured features system
  features: CharacterFeatures;

  // Legacy support - can be removed after migration
  classFeatures?: string[];
  speciesTraits?: string[];
  feats?: string[];
  weapons: Array<{
    name: string;
    atkBonus: string;
    damage: string;
    notes: string;
  }>;
  actions: Array<{
    name: string;
    atkBonus: string;
    damage: string;
  }>;
  proficiencies: {
    armor: string[];
    weapons: string[];
    tools: string[];
    skills: string[];
    savingThrows: string[];
  };
}

export interface CharacterSheetProps {
  character: CharacterSheetData;
  onUpdate: (character: CharacterSheetData) => void;
  onSave?: ((character: CharacterSheetData, options?: { silent?: boolean }) => void | Promise<void>) | undefined;
  initialEditMode?: {
    abilities?: boolean;
    stats?: boolean;
    skills?: boolean;
    spells?: boolean;
    mana?: boolean;
    characterInfo?: boolean;
    actions?: boolean;
    inventory?: boolean;
  };
}

// Helper functions for character sheet calculations
export const calculateModifier = (score: number): number => {
  return Math.floor((score - 10) / 2);
};

export const formatModifier = (modifier: number): string => {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
};

export const calculateProficiencyBonus = (level: number): number => {
  return Math.ceil(level / 4) + 1;
};

export const calculateSkillModifier = (
  abilityScore: number,
  proficiencyBonus: number,
  isProficient: boolean
): number => {
  const abilityModifier = calculateModifier(abilityScore);
  return isProficient ? abilityModifier + proficiencyBonus : abilityModifier;
};

export const calculateSavingThrowModifier = (
  abilityScore: number,
  proficiencyBonus: number,
  isProficient: boolean
): number => {
  const abilityModifier = calculateModifier(abilityScore);
  return isProficient ? abilityModifier + proficiencyBonus : abilityModifier;
};

// Default character sheet data template
export const createDefaultCharacterSheet = (): CharacterSheetData => ({
  name: '',
  background: '',
  class: '',
  species: '',
  subclass: '',
  level: 1,
  equippedItemIds: [],
  speciesAdditionalSpeeds: {},
  speciesResistances: [],
  speciesImmunities: [],
  xp: 0,
  abilityScores: {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  },
  proficiencyBonus: 2,
  armorClass: 10,
  initiative: 0,
  speed: 30,
  size: 'Medium',
  passivePerception: 10,
  hitPoints: {
    current: 8,
    max: 8,
    temp: 0,
  },
  hitDice: {
    current: 1,
    max: 1,
    spent: 0,
  },
  deathSaves: {
    successes: 0,
    failures: 0,
  },
  heroicInspiration: false,
  wounds: 0,
  mana: {
    current: 0,
    max: 0,
  },
  resources: {},

  // Enhanced inventory system
  inventory: [],
  equipment: [], // Keep for legacy compatibility

  // Equipment constraints
  equipmentConstraints: {
    maxArmor: 1,
    maxShields: 1,
    maxAttunedItems: 3,
  },

  // Equipped items tracking
  equippedWeapons: [],
  attunedItems: [],
  skills: {
    Acrobatics: { proficient: false, modifier: 0 },
    'Animal Handling': { proficient: false, modifier: 0 },
    Arcana: { proficient: false, modifier: 0 },
    Athletics: { proficient: false, modifier: 0 },
    Deception: { proficient: false, modifier: 0 },
    History: { proficient: false, modifier: 0 },
    Insight: { proficient: false, modifier: 0 },
    Intimidation: { proficient: false, modifier: 0 },
    Investigation: { proficient: false, modifier: 0 },
    Medicine: { proficient: false, modifier: 0 },
    Nature: { proficient: false, modifier: 0 },
    Perception: { proficient: false, modifier: 0 },
    Performance: { proficient: false, modifier: 0 },
    Persuasion: { proficient: false, modifier: 0 },
    Religion: { proficient: false, modifier: 0 },
    'Sleight of Hand': { proficient: false, modifier: 0 },
    Stealth: { proficient: false, modifier: 0 },
    Survival: { proficient: false, modifier: 0 },
  },
  savingThrows: {
    strength: { proficient: false, modifier: 0 },
    dexterity: { proficient: false, modifier: 0 },
    constitution: { proficient: false, modifier: 0 },
    intelligence: { proficient: false, modifier: 0 },
    wisdom: { proficient: false, modifier: 0 },
    charisma: { proficient: false, modifier: 0 },
  },
  // New structured features system
  features: {
    classFeatures: [],
    subclassFeatures: [],
    speciesTraits: [],
    backgroundFeatures: [],
    feats: [],
    magicItemFeatures: [],
    customFeatures: [],
  },

  // Legacy support - can be removed after migration
  classFeatures: [],
  speciesTraits: [],
  feats: [],
  weapons: [
    { name: '', atkBonus: '', damage: '', notes: '' },
    { name: '', atkBonus: '', damage: '', notes: '' },
    { name: '', atkBonus: '', damage: '', notes: '' },
  ],
  actions: [],
  proficiencies: {
    armor: [],
    weapons: [],
    tools: [],
    skills: [],
    savingThrows: [],
  },
});

// Skill to ability mapping
export const skillToAbility: {
  [key: string]: keyof CharacterSheetData['abilityScores'];
} = {
  Acrobatics: 'dexterity',
  'Animal Handling': 'wisdom',
  Arcana: 'intelligence',
  Athletics: 'strength',
  Deception: 'charisma',
  History: 'intelligence',
  Insight: 'wisdom',
  Intimidation: 'charisma',
  Investigation: 'intelligence',
  Medicine: 'wisdom',
  Nature: 'intelligence',
  Perception: 'wisdom',
  Performance: 'charisma',
  Persuasion: 'charisma',
  Religion: 'intelligence',
  'Sleight of Hand': 'dexterity',
  Stealth: 'dexterity',
  Survival: 'wisdom',
};
