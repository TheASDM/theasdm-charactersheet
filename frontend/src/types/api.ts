import { CharacterSheetData } from './characterSheet';
import type { Character as PrismaCharacter } from '../../../backend/src/types';

// Common D&D data structures
export interface DnDTime {
  number: number;
  unit: string;
  condition?: string;
}

export interface DnDRange {
  type: string;
  distance?: {
    type: string;
    amount: number;
  };
}

export interface DnDComponents {
  v?: boolean; // verbal
  s?: boolean; // somatic
  m?: boolean | string; // material
}

export interface DnDDuration {
  type: string;
  duration?: {
    type: string;
    amount?: number;
  };
  concentration?: boolean;
}

export interface EquipmentEntry {
  item?: string;
  name?: string;
  quantity?: number;
  special?: string;
}

export interface ProficiencyEntry {
  armor?: string[];
  weapons?: string[];
  tools?: string[];
  skills?: string[];
  skillsCount?: number;
  anySkill?: boolean;
}

export interface FeatureEntry {
  name: string;
  description?: string;
  entries?: (string | ComplexEntry)[];
  type?: string;
}

export interface ComplexEntry {
  type: string;
  name?: string;
  entries?: (string | ComplexEntry)[];
  items?: string[];
  style?: string;
}

export interface AbilityScoreIncrease {
  choose?: {
    from: string[];
    amount: number;
    count: number;
  };
  [ability: string]: number | unknown;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items?: T[];
  spells?: T[]; // For spells endpoint
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// User Types
export interface User {
  id: number;
  discordId?: string;
  username: string;
  email?: string;
  isDm: boolean;
  createdAt: string;
  updatedAt: string;
}

// Character Types
export type Character = Omit<PrismaCharacter, 'createdAt' | 'updatedAt' | 'characterData'> & {
  createdAt: string;
  updatedAt: string;
  characterData: Record<string, unknown>;
  user?: {
    id: number;
    username: string;
  };
  campaign?: {
    id: number;
    name: string;
  };
};

export interface CreateCharacterRequest {
  userId: number;
  name: string;
  level?: number;
  characterData: CharacterSheetData | Record<string, unknown>;
  isPublic?: boolean;
  campaignId?: number;
}

export interface UpdateCharacterRequest {
  name?: string;
  level?: number;
  characterData?: CharacterSheetData | Record<string, unknown>;
  isPublic?: boolean;
  campaignId?: number;
}

// Spell Types
export interface Spell {
  id: number;
  name: string;
  source?: string;
  page?: number;
  level: number;
  school?: string;
  time?: DnDTime[]; // JSONB - complex time structure
  range?: DnDRange; // JSONB - complex range structure
  components?: DnDComponents; // JSONB - component structure
  duration?: DnDDuration[]; // JSONB - duration array
  entries?: any; // JSONB - description entries
  entriesHigherLevel?: any; // JSONB - higher level effects
  scalingLevelDice?: Record<string, string>; // JSONB - cantrip scaling
  damageInflict?: string[];
  conditionInflict?: string[];
  savingThrow?: string[];
  affectsCreatureType?: string[];
  miscTags?: string[];
  areaTags?: string[];
  srd52?: boolean;
  basicRules2024?: boolean;
  isRitual?: boolean | null;
  sourceBook?: string;
  contentVersion?: string;
  isHomebrew?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Class Types
export interface CharacterClass {
  id: number;
  name: string;
  source?: string;
  page?: number;
  hitDie: number;
  primaryAbility: string[];
  savingThrowProficiencies: string[];
  armorProficiencies?: Record<string, unknown>; // JSONB
  weaponProficiencies?: Record<string, unknown>; // JSONB
  toolProficiencies?: Record<string, unknown>; // JSONB
  skillProficiencies?: Record<string, unknown>; // JSONB
  skillProficiencyOptions?: Record<string, unknown>; // JSONB
  equipmentProficiencies?: Record<string, unknown>; // JSONB
  startingEquipment?: Record<string, unknown>; // JSONB
  classFeatures?: Record<string, unknown>; // JSONB
  subclassFeatures?: Record<string, unknown>; // JSONB - Contains subclass data
  spellcastingAbility?: string;
  spellcastingFocus?: string;
  spellsKnownProgression?: Record<string, unknown>; // JSONB
  spellSlotProgression?: Record<string, unknown>; // JSONB
  subclasses?: Record<string, unknown>; // JSONB (deprecated - use subclassFeatures)
  srd52?: boolean;
  basicRules2024?: boolean;
  contentVersion: string;
  createdAt: string;
  updatedAt: string;
}

// Species Types
export interface Species {
  id: number;
  name: string;
  source?: string;
  page?: number;
  description?: string; // Species description/flavor text
  size: string[];
  speed: any; // JSONB - can be complex object or simple value
  additionalSpeeds?: Record<string, unknown>; // JSONB
  creatureType: string;
  lifespan?: string;
  traits?: any; // JSONB - can be object or array
  abilityScoreIncrease?: Record<string, unknown>; // JSONB
  languages: string[];
  languageOptions?: Record<string, unknown>; // JSONB
  skillProficiencies?: Record<string, unknown>; // JSONB
  toolProficiencies?: Record<string, unknown>; // JSONB
  weaponProficiencies?: Record<string, unknown>; // JSONB
  innateSpells?: Record<string, unknown>; // JSONB
  srd52?: boolean;
  basicRules2024?: boolean;
  sourceBook?: string;
  contentVersion: string;
  isHomebrew: boolean;
  createdAt: string;
  updatedAt: string;
}

// Background Types
export interface Background {
  id: number;
  name: string;
  description?: string;
  skillProficiencies?: any; // JSONB
  languages: string[];
  equipment?: any; // JSONB
  feature?: Record<string, unknown>; // JSONB
  originFeat?: string;
  abilityScoreIncrease?: Record<string, unknown>; // JSONB
  contentVersion: string;
}

// Item Types
export interface Item {
  id: number;
  name: string;
  source?: string;
  page?: number;
  type: string;
  typeAlt?: string;
  rarity?: string;
  weight?: number;
  value?: number;
  valueCurrency?: string;
  entries?: any[]; // JSONB
  additionalEntries?: any[]; // JSONB
  weaponCategory?: string;
  property: string[];
  range?: string;
  dmg1?: string;
  dmg2?: string;
  dmgType?: string;
  ac?: number;
  strength?: number;
  stealth?: boolean;
  armorType?: string;
  reqAttune?: string;
  charges?: number;
  recharge?: string;
  modifySpeed?: Record<string, unknown>; // JSONB
  bonusWeapon?: string;
  bonusAc?: number;
  bonusSpellAttack?: number;
  bonusSpellSaveDc?: number;
  spells?: Record<string, unknown>; // JSONB
  srd52?: boolean;
  basicRules2024?: boolean;
  contentVersion: string;
  isHomebrew: boolean;
  createdAt: string;
  updatedAt: string;
}

// Feat Types
export interface Feat {
  id: number;
  name: string;
  source?: string;
  page?: number;
  category: string;
  level?: number;
  prerequisites?: Record<string, unknown>; // JSONB for complex prerequisites
  abilityScoreIncrease?: Record<string, unknown>; // JSONB
  repeatable?: boolean;
  entries?: any; // JSONB for feat description and benefits
  additionalSpells?: Record<string, unknown>; // JSONB for spells granted by feat
  contentVersion: string;
  isHomebrew: boolean;
  createdAt: string;
  updatedAt: string;
}

// Campaign Types
export interface Campaign {
  id: number;
  name: string;
  description?: string;
  dmId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  dm?: User;
  characters?: Character[];
}
