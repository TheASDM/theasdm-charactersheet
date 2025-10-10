/**
 * Lookup tables for dynamic feature template resolution
 */

export interface DraconicAncestryData {
  name: string;
  damageType: string;
  areaType: string;
  saveType: 'dexterity' | 'constitution';
  color: string;
}

export const DRACONIC_ANCESTRIES: { [key: string]: DraconicAncestryData } = {
  'Black Dragon': {
    name: 'Black Dragon',
    damageType: 'acid',
    areaType: '15-foot cone',
    saveType: 'dexterity',
    color: '#2c2c2c'
  },
  'Blue Dragon': {
    name: 'Blue Dragon',
    damageType: 'lightning',
    areaType: '30-foot line',
    saveType: 'dexterity',
    color: '#4169e1'
  },
  'Brass Dragon': {
    name: 'Brass Dragon',
    damageType: 'fire',
    areaType: '30-foot line',
    saveType: 'dexterity',
    color: '#b5651d'
  },
  'Bronze Dragon': {
    name: 'Bronze Dragon',
    damageType: 'lightning',
    areaType: '30-foot line',
    saveType: 'dexterity',
    color: '#cd7f32'
  },
  'Copper Dragon': {
    name: 'Copper Dragon',
    damageType: 'acid',
    areaType: '30-foot line',
    saveType: 'dexterity',
    color: '#b87333'
  },
  'Gold Dragon': {
    name: 'Gold Dragon',
    damageType: 'fire',
    areaType: '15-foot cone',
    saveType: 'dexterity',
    color: '#e0a523'
  },
  'Green Dragon': {
    name: 'Green Dragon',
    damageType: 'poison',
    areaType: '15-foot cone',
    saveType: 'constitution',
    color: '#228b22'
  },
  'Red Dragon': {
    name: 'Red Dragon',
    damageType: 'fire',
    areaType: '15-foot cone',
    saveType: 'dexterity',
    color: '#dc143c'
  },
  'Silver Dragon': {
    name: 'Silver Dragon',
    damageType: 'cold',
    areaType: '15-foot cone',
    saveType: 'constitution',
    color: '#c0c0c0'
  },
  'White Dragon': {
    name: 'White Dragon',
    damageType: 'cold',
    areaType: '15-foot cone',
    saveType: 'constitution',
    color: '#f8f8ff'
  }
};

export interface ElfLineageData {
  name: string;
  features: string[];
  cantrip?: string;
  spells?: string[];
}

export const ELF_LINEAGES: { [key: string]: ElfLineageData } = {
  'Drow': {
    name: 'Drow',
    features: ['Drow Magic'],
    cantrip: 'Dancing Lights',
    spells: ['Faerie Fire', 'Darkness']
  },
  'High Elf': {
    name: 'High Elf',
    features: ['High Elf Magic'],
    cantrip: 'Choose a Wizard cantrip'
  },
  'Wood Elf': {
    name: 'Wood Elf',
    features: ['Keen Senses', 'Mask of the Wild']
  }
};

export interface GnomeLineageData {
  name: string;
  features: string[];
  spells?: string[];
}

export const GNOME_LINEAGES: { [key: string]: GnomeLineageData } = {
  'Forest Gnome': {
    name: 'Forest Gnome',
    features: ['Speak with Animals'],
    spells: ['Speak with Animals']
  },
  'Rock Gnome': {
    name: 'Rock Gnome',
    features: ['Artisan\'s Lore', 'Tinker']
  }
};

export interface GiantAncestryData {
  name: string;
  damageType: string;
  features: string[];
}

export const GIANT_ANCESTRIES: { [key: string]: GiantAncestryData } = {
  'Cloud Giant': {
    name: 'Cloud Giant',
    damageType: 'thunder',
    features: ['Cloud Giant Magic']
  },
  'Fire Giant': {
    name: 'Fire Giant',
    damageType: 'fire',
    features: ['Fire Giant Magic']
  },
  'Frost Giant': {
    name: 'Frost Giant',
    damageType: 'cold',
    features: ['Frost Giant Magic']
  },
  'Hill Giant': {
    name: 'Hill Giant',
    damageType: 'bludgeoning',
    features: ['Hill Giant Magic']
  },
  'Stone Giant': {
    name: 'Stone Giant',
    damageType: 'force',
    features: ['Stone Giant Magic']
  },
  'Storm Giant': {
    name: 'Storm Giant',
    damageType: 'lightning',
    features: ['Storm Giant Magic']
  }
};

export interface FiendishLegacyData {
  name: string;
  damageType: string;
  spells: string[];
}

export const FIENDISH_LEGACIES: { [key: string]: FiendishLegacyData } = {
  'Abyssal': {
    name: 'Abyssal',
    damageType: 'necrotic',
    spells: ['Ray of Sickness', 'Hold Person', 'Fireball']
  },
  'Chthonic': {
    name: 'Chthonic',
    damageType: 'necrotic',
    spells: ['False Life', 'Ray of Enfeeblement', 'Vampiric Touch']
  },
  'Infernal': {
    name: 'Infernal',
    damageType: 'fire',
    spells: ['Hellish Rebuke', 'Darkness', 'Fireball']
  }
};

// Character context interface for template resolution
export interface CharacterContext {
  level: number;
  proficiencyBonus: number;
  strengthModifier: number;
  dexterityModifier: number;
  constitutionModifier: number;
  intelligenceModifier: number;
  wisdomModifier: number;
  charismaModifier: number;

  // Species choices
  draconicAncestry?: string;
  elfLineage?: string;
  gnomeLineage?: string;
  giantAncestry?: string;
  fiendishLegacy?: string;
  humanSkill?: string;

  // Class choices
  selectedClass?: string;
  selectedSubclass?: string;

  // Background
  selectedBackground?: string;
}

// Helper function to get draconic ancestry data
export function getDraconicAncestryData(ancestry: string): DraconicAncestryData | null {
  return DRACONIC_ANCESTRIES[ancestry] || null;
}

// Helper function to calculate proficiency bonus from level
export function calculateProficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

// Helper function to calculate ability modifier
export function calculateAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}