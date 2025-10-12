import { CharacterFeatures } from './features';

// Inventory item with full tracking properties
export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  equipped: boolean;
  attuned: boolean;
  itemId?: number; // Reference to the official item in the database
  customProperties?: Record<string, unknown>; // For custom item data
  // Optional properties that may come from the Item database
  type?: string;
  weaponCategory?: string;
  armorCategory?: string;
}

// Equipment validation result
export interface EquipmentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Character sheet specific types that will be stored in Character.characterData
export interface CharacterSheetData {
  name: string;
  background: string;
  class: string;
  species: string;
  subclass: string;
  level: number;
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
  inventory: InventoryItem[];
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
  classFeatures: string[];
  speciesTraits: string[];
  feats: string[];
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
    savingThrows?: string[];
    skills?: string[];
  };
  // Extended properties for advanced features
  equippedItemIds?: string[];
  equippedArmor?: InventoryItem;
  equippedShield?: InventoryItem;
  equippedWeapons?: InventoryItem[];
  attunedItems?: InventoryItem[];
  equipmentConstraints?: {
    maxAttunedItems?: number;
    weightLimit?: number;
    maxArmor?: number;
    maxShields?: number;
  };
  spellbook?: {
    known?: string[];
    prepared?: string[];
    alwaysPrepared?: string[];
    cantrips?: string[];
    wizardSpellbook?: string[];
    grantedSpells?: string[];
  };
  featSpells?: Record<string, string[]>;
  weaponMasteries?: {
    active?: Array<{ weapon: string; property: string; }>;
    available?: Array<{ weapon: string; property: string; }>;
    max?: number;
  };
  darkvision?: number;
  features?: CharacterFeatures;
  classFeatures_parsed?: any[];
  featFeatures?: Record<string, any[]>;
  backgroundFeatures?: any[];
  speciesChoices?: Record<string, unknown>;
  selectedClassChoices?: Record<string, unknown>;
  classChoices?: Record<string, unknown>;
  featChoices?: Record<string, Record<string, unknown>>;
  selectedOriginFeats?: string[];
  selectedLanguages?: string[];
  speciesAdditionalSpeeds?: Record<string, unknown>;
  speciesResistances?: string[];
  speciesImmunities?: string[];
  backgroundEquipment?: any[];
  equipment?: any[];
}

export interface CharacterSheetProps {
  character: CharacterSheetData;
  onUpdate: (character: CharacterSheetData) => void;
  onSave?:
    | ((
        character: CharacterSheetData,
        options?: { silent?: boolean }
      ) => void | Promise<void>)
    | undefined;
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
  inventory: [],
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
  classFeatures: [],
  speciesTraits: [],
  feats: [],
  weapons: [
    { name: '', atkBonus: '', damage: '', notes: '' },
    { name: '', atkBonus: '', damage: '', notes: '' },
    { name: '', atkBonus: '', damage: '', notes: '' },
  ],
  actions: [
    { name: 'Dash', atkBonus: '—', damage: 'Move Speed × 2' },
    { name: 'Dodge', atkBonus: '—', damage: '—' },
    { name: 'Help', atkBonus: '—', damage: '—' },
    { name: '', atkBonus: '', damage: '' },
    { name: '', atkBonus: '', damage: '' },
    { name: '', atkBonus: '', damage: '' },
    { name: '', atkBonus: '', damage: '' },
    { name: '', atkBonus: '', damage: '' },
  ],
  proficiencies: {
    armor: [],
    weapons: [],
    tools: [],
    savingThrows: [],
    skills: [],
  },
  equippedItemIds: [],
  equippedWeapons: [],
  attunedItems: [],
  equipmentConstraints: {
    maxAttunedItems: 3,
  },
  spellbook: {
    known: [],
    prepared: [],
    alwaysPrepared: [],
  },
  featSpells: {},
  weaponMasteries: {
    active: [],
    available: [],
  },
  features: {
    classFeatures: [],
    subclassFeatures: [],
    speciesTraits: [],
    backgroundFeatures: [],
    feats: [],
    magicItemFeatures: [],
    customFeatures: [],
  },
  classFeatures_parsed: [],
  featFeatures: {},
  backgroundFeatures: [],
  speciesChoices: {},
  selectedClassChoices: {},
  classChoices: {},
  featChoices: {},
  selectedOriginFeats: [],
  selectedLanguages: [],
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
