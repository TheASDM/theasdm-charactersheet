import { CharacterSheetData } from './characterSheet';
import type { Character as PrismaCharacter } from '../../../backend/src/types';

export type ApiErrorCode =
  | 'validation'
  | 'auth'
  | 'not_found'
  | 'network_error'
  | 'timeout'
  | 'rate_limited'
  | 'server_error'
  | 'unknown';

export type ApiSuccess<T> = {
  ok: true;
  data: T;
  statusCode?: number | undefined;
};

export type ApiFailure = {
  ok: false;
  data?: undefined;
  error: string;
  statusCode?: number | undefined;
  errorCode?: ApiErrorCode | undefined;
  cause?: unknown;
};

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export const ok = <T>(data: T, statusCode?: number): ApiSuccess<T> => ({
  ok: true,
  data,
  ...(statusCode !== undefined && { statusCode }),
});

export const fail = (
  message: string,
  options: {
    statusCode?: number;
    errorCode?: ApiErrorCode;
    cause?: unknown;
  } = {}
): ApiFailure => ({
  ok: false,
  error: message,
  ...(options.statusCode !== undefined && { statusCode: options.statusCode }),
  ...(options.errorCode !== undefined && { errorCode: options.errorCode }),
  ...(options.cause !== undefined && { cause: options.cause }),
});

export const isError = <T>(result: ApiResult<T>): result is ApiFailure => !result.ok;

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
/**
 * @deprecated Prefer using ApiResult via request() helpers instead.
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number | undefined;
  errorCode?: ApiErrorCode | undefined;
  raw?: unknown;
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
  characterData: CharacterSheetData;
  user?: {
    id: number;
    username: string;
  };
  campaign?: {
    id: number;
    name: string;
  };
};

// Helper type for functions that work with partial character data (tests, incremental updates)
// Makes characterData optional and partial when it exists
export type PartialCharacter = Omit<Partial<Character>, 'characterData'> & {
  characterData?: Partial<CharacterSheetData>;
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
  spellbook?: {
    known?: string[];
    prepared?: string[];
  };
  resources?: {
    manaCurrent?: number;
    manaMax?: number;
  };
}

// Spell Types
export interface Spell {
  id: number;
  name: string;
  source?: string;
  page?: number;
  level: number;
  school?: string | { code: string; name: string; description?: string }; // Can be code string or full object
  schoolCode?: string; // Single letter code (A, C, D, E, V, I, N, T)
  classes?: string[]; // Array of class names (lowercase) that can use this spell
  description?: string; // Simplified text description from database
  time?: DnDTime[]; // JSONB - complex time structure
  range?: DnDRange; // JSONB - complex range structure
  components?: DnDComponents; // JSONB - component structure
  duration?: DnDDuration[]; // JSONB - duration array
  entries?: any; // JSONB - description entries
  entriesHigherLevel?: any; // JSONB - higher level effects
  scalingLevelDice?: Record<string, string>; // JSONB - cantrip scaling
  damageInflict?: string[];
  spellAttack?: string[];
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
  raw?: any; // Full raw content from 5etools (includes raw.raw.entries)
  mechanics?: any; // Full 5etools structure from raw.content.raw - used by spellActionBuilder
  createdAt: string;
  updatedAt: string;
}

// Class Types
export interface CharacterClass {
  id: string; // Changed from number to string (backend returns string)
  name: string; // For compatibility
  className?: string; // New field from database API
  slug?: string;
  source?: string;
  page?: number;
  hitDie: number;
  primaryAbilities: string[]; // Transformed from 5etools format to readable names (e.g., ["Strength", "Dexterity"])
  savingThrows: string[]; // Transformed from abbreviations to full names (e.g., ["Strength", "Constitution"])
  proficiencies?: {
    armor?: string[];
    weapons?: string[];
    tools?: any[];
    skills?: any;
    savingThrows?: string[];
  };
  spellcastingAbility?: string;
  subclassTitle?: string;
  mechanics?: Record<string, any>; // Full 5etools raw structure
  features?: any[]; // Flat array of features from 5etools
  classFeatures?: Record<string, any[]>; // Features grouped by level (e.g., {"1": [...], "2": [...]})
  // Legacy fields - may be deprecated
  primaryAbility?: string[];
  savingThrowProficiencies?: string[];
  armorProficiencies?: Record<string, unknown>;
  weaponProficiencies?: Record<string, unknown>;
  toolProficiencies?: Record<string, unknown>;
  skillProficiencies?: Record<string, unknown>;
  skillProficiencyOptions?: Record<string, unknown>;
  equipmentProficiencies?: Record<string, unknown>;
  startingEquipment?: Record<string, unknown>;
  subclassFeatures?: Record<string, unknown>;
  spellcastingFocus?: string;
  spellsKnownProgression?: Record<string, unknown>;
  spellSlotProgression?: Record<string, unknown>;
  subclasses?: Record<string, unknown>;
  srd52?: boolean;
  basicRules2024?: boolean;
  contentVersion?: string;
  createdAt?: string;
  updatedAt?: string;
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
  mechanics?: Record<string, any>; // Full 5etools structure from raw.raw
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
  mechanics?: Record<string, any>; // Full 5etools structure from raw.raw
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
  property?: string[];
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

// Equipment Types (API v2)
export interface Equipment {
  id: number;
  name: string;
  source?: string;
  sourceBook?: string;
  page?: number;
  type: string;
  typeAlt?: string;
  rarity?: string;
  weight?: number;
  value?: number;
  valueCurrency?: string;
  entries?: unknown;
  additionalEntries?: unknown;
  weaponCategory?: string;
  property?: string[];
  range?: string;
  dmg1?: string;
  dmg2?: string;
  dmgType?: string;
  ac?: number;
  strength?: number;
  stealth?: boolean;
  armorType?: string;
  reqAttune?: string | boolean;
  charges?: number;
  recharge?: string;
  bonusWeapon?: string;
  bonusAc?: number;
  bonusSpellAttack?: number;
  bonusSpellSaveDc?: number;
  spells?: Record<string, unknown>;
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
  sourceBook?: string;
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
