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
export interface Character {
  id: number;
  userId: number;
  name: string;
  level: number;
  characterData: any; // JSONB data - will be more specific later
  passwordHash?: string;
  isPublic: boolean;
  campaignId?: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    username: string;
  };
  campaign?: {
    id: number;
    name: string;
  };
}

export interface CreateCharacterRequest {
  userId: number;
  name: string;
  level?: number;
  characterData: any;
  isPublic?: boolean;
  campaignId?: number;
}

export interface UpdateCharacterRequest {
  name?: string;
  level?: number;
  characterData?: any;
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
  time?: any[]; // JSONB - complex time structure
  range?: any; // JSONB - complex range structure
  components?: any; // JSONB - component structure
  duration?: any[]; // JSONB - duration array
  entries?: any[]; // JSONB - description entries
  entriesHigherLevel?: any[]; // JSONB - higher level effects
  scalingLevelDice?: any; // JSONB - cantrip scaling
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
  armorProficiencies?: any; // JSONB
  weaponProficiencies?: any; // JSONB
  toolProficiencies?: any; // JSONB
  skillProficiencies?: any; // JSONB
  skillProficiencyOptions?: any; // JSONB
  equipmentProficiencies?: any; // JSONB
  startingEquipment?: any; // JSONB
  classFeatures?: any; // JSONB
  subclassFeatures?: any; // JSONB - Contains subclass data
  spellcastingAbility?: string;
  spellcastingFocus?: string;
  spellsKnownProgression?: any; // JSONB
  spellSlotProgression?: any; // JSONB
  subclasses?: any; // JSONB (deprecated - use subclassFeatures)
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
  size: string[];
  speed: any; // JSONB
  additionalSpeeds?: any; // JSONB
  creatureType: string;
  lifespan?: string;
  traits?: any; // JSONB
  abilityScoreIncrease?: any; // JSONB
  languages: string[];
  languageOptions?: any; // JSONB
  skillProficiencies?: any; // JSONB
  toolProficiencies?: any; // JSONB
  weaponProficiencies?: any; // JSONB
  innateSpells?: any; // JSONB
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
  feature?: any; // JSONB
  originFeat?: string;
  abilityScoreIncrease?: any; // JSONB
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
  modifySpeed?: any; // JSONB
  bonusWeapon?: string;
  bonusAc?: number;
  bonusSpellAttack?: number;
  bonusSpellSaveDc?: number;
  spells?: any; // JSONB
  srd52?: boolean;
  basicRules2024?: boolean;
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
