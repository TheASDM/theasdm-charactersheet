import { apiClient } from './api';
import { Item, ApiResponse, PaginatedResponse } from '../types/api';

export interface ItemFilters {
  type?: string;
  rarity?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const itemService = {
  // Get all items with pagination and filtering
  getAll: async (
    filters: ItemFilters = {}
  ): Promise<ApiResponse<PaginatedResponse<Item>>> => {
    const params = {
      ...(filters.type && { type: filters.type }),
      ...(filters.rarity && { rarity: filters.rarity }),
      ...(filters.search && { search: filters.search }),
      page: filters.page || 1,
      limit: filters.limit || 50,
    };
    return apiClient.get<PaginatedResponse<Item>>('/items', params);
  },

  // Get a single item by ID
  getById: async (id: number): Promise<ApiResponse<Item>> => {
    return apiClient.get<Item>(`/items/${id}`);
  },

  // Get items by type
  getByType: async (
    type: string
  ): Promise<ApiResponse<PaginatedResponse<Item>>> => {
    return itemService.getAll({ type });
  },

  // Get items by rarity
  getByRarity: async (
    rarity: string
  ): Promise<ApiResponse<PaginatedResponse<Item>>> => {
    return itemService.getAll({ rarity });
  },

  // Search items by name
  search: async (
    query: string,
    limit = 20
  ): Promise<ApiResponse<PaginatedResponse<Item>>> => {
    return itemService.getAll({ search: query, limit });
  },

  // Get weapons
  getWeapons: async (): Promise<ApiResponse<PaginatedResponse<Item>>> => {
    return itemService.getByType('weapon');
  },

  // Get armor
  getArmor: async (): Promise<ApiResponse<PaginatedResponse<Item>>> => {
    return itemService.getByType('armor');
  },

  // Get adventuring gear
  getAdventuringGear: async (): Promise<
    ApiResponse<PaginatedResponse<Item>>
  > => {
    return itemService.getByType('adventuring gear');
  },

  // Get magic items
  getMagicItems: async (): Promise<ApiResponse<PaginatedResponse<Item>>> => {
    return itemService.getAll({
      rarity: 'uncommon,rare,very rare,legendary,artifact',
    });
  },
};

// Item type constants
export const ITEM_TYPES = {
  WEAPON: 'weapon',
  ARMOR: 'armor',
  SHIELD: 'shield',
  ADVENTURING_GEAR: 'adventuring gear',
  TOOL: 'tool',
  MOUNT: 'mount',
  VEHICLE: 'vehicle',
  TREASURE: 'treasure',
  MAGIC_ITEM: 'wondrous item',
} as const;

// Rarity constants
export const ITEM_RARITIES = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  VERY_RARE: 'very rare',
  LEGENDARY: 'legendary',
  ARTIFACT: 'artifact',
} as const;

// Weapon properties
export const WEAPON_PROPERTIES = {
  AMMUNITION: 'ammunition',
  FINESSE: 'finesse',
  HEAVY: 'heavy',
  LIGHT: 'light',
  LOADING: 'loading',
  RANGE: 'range',
  REACH: 'reach',
  SPECIAL: 'special',
  THROWN: 'thrown',
  TWO_HANDED: 'two-handed',
  VERSATILE: 'versatile',
} as const;

export default itemService;
