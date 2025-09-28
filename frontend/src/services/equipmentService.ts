import { apiClient } from './api';
import { ApiResponse } from '../types/api';

export interface Equipment {
  id: number;
  name: string;
  source: string;
  page: number;
  type: string;
  typeAlt?: string;
  rarity: string;
  weight?: number;
  value?: number;
  valueCurrency?: string;
  entries?: any;
  additionalEntries?: any;

  // Weapon properties
  weaponCategory?: string;
  property?: string[];
  range?: string;
  dmg1?: string;
  dmg2?: string;
  dmgType?: string;

  // Armor properties
  ac?: number;
  strength?: number;
  stealth?: boolean;
  armorType?: string;

  // Magic item properties
  reqAttune?: string | boolean;
  charges?: number;
  recharge?: string;
  bonusWeapon?: string;
  bonusAc?: number;
  bonusSpellAttack?: number;
  bonusSpellSaveDc?: number;
  spells?: any;

  // Metadata
  sourceBook: string;
  contentVersion: string;
  isHomebrew: boolean;
  createdAt: string;
  updatedAt: string;
}

export const equipmentService = {
  // Get all equipment
  getAll: async (): Promise<ApiResponse<{ items: Equipment[], pagination?: any }>> => {
    return apiClient.get<{ items: Equipment[], pagination?: any }>('/items');
  },

  // Get equipment by ID
  getById: async (id: number): Promise<ApiResponse<Equipment>> => {
    return apiClient.get<Equipment>(`/items/${id}`);
  },

  // Get equipment by name
  getByName: async (name: string): Promise<ApiResponse<Equipment>> => {
    return apiClient.get<Equipment>(`/items/name/${encodeURIComponent(name)}`);
  },

  // Get equipment by type
  getByType: async (type: string): Promise<ApiResponse<Equipment[]>> => {
    return apiClient.get<Equipment[]>(`/items?type=${encodeURIComponent(type)}`);
  },

  // Get weapons
  getWeapons: async (): Promise<ApiResponse<Equipment[]>> => {
    return apiClient.get<Equipment[]>('/items?category=weapon');
  },

  // Get armor
  getArmor: async (): Promise<ApiResponse<Equipment[]>> => {
    return apiClient.get<Equipment[]>('/items?category=armor');
  },

  // Get adventuring gear
  getAdventuringGear: async (): Promise<ApiResponse<Equipment[]>> => {
    return apiClient.get<Equipment[]>('/items?category=gear');
  },
};

// Equipment categories for easy reference
export const EQUIPMENT_CATEGORIES = {
  WEAPONS: 'weapons',
  ARMOR: 'armor',
  ADVENTURING_GEAR: 'adventuring-gear',
  MAGIC_ITEMS: 'magic-items',
  TOOLS: 'tools',
  MOUNTS: 'mounts',
  VEHICLES: 'vehicles',
} as const;

// Equipment type mappings for the API
export const EQUIPMENT_TYPE_MAP = {
  // Weapons
  'M|XPHB': 'Melee Weapon',
  'R|XPHB': 'Ranged Weapon',
  'RW|XPHB': 'Ranged Weapon',

  // Armor
  'LA|XPHB': 'Light Armor',
  'MA|XPHB': 'Medium Armor',
  'HA|XPHB': 'Heavy Armor',
  'S|XPHB': 'Shield',

  // Gear
  'G|XPHB': 'Adventuring Gear',
  'AT|XPHB': 'Artisan Tools',
  'MNT|XPHB': 'Mount',
  'VEH|XPHB': 'Vehicle',
  'FD|XPHB': 'Food & Drink',
  'SCF|XPHB': 'Spellcasting Focus',
  'A|XPHB': 'Ammunition',

  // Magic Items
  'RD|XDMG': 'Rod',
  'WD|XDMG': 'Wand',
  '$G|XDMG': 'Gemstone',
  'AIR|XPHB': 'Vehicle (Air)',
} as const;

// Weapon categories
export const WEAPON_CATEGORIES = {
  SIMPLE_MELEE: 'simple melee',
  SIMPLE_RANGED: 'simple ranged',
  MARTIAL_MELEE: 'martial melee',
  MARTIAL_RANGED: 'martial ranged',
} as const;

// Armor types
export const ARMOR_TYPES = {
  LIGHT: 'light',
  MEDIUM: 'medium',
  HEAVY: 'heavy',
  SHIELD: 'shield',
} as const;

export default equipmentService;