import { apiClient, request, withSignal } from './api';
import { ApiResult, Equipment, PaginatedResponse } from '@/types/api';

export interface EquipmentFilters {
  page?: number;
  limit?: number;
  type?: string;
  rarity?: string;
  search?: string;
  category?: string;
}

const buildParams = (filters: EquipmentFilters = {}) => ({
  ...(filters.page !== undefined && { page: filters.page }),
  ...(filters.limit !== undefined && { limit: filters.limit }),
  ...(filters.type && { type: filters.type }),
  ...(filters.rarity && { rarity: filters.rarity }),
  ...(filters.search && { search: filters.search }),
  ...(filters.category && { category: filters.category }),
});

const withParams = (filters: EquipmentFilters = {}, signal?: AbortSignal) => {
  const params = buildParams(filters);
  return withSignal(
    Object.keys(params).length > 0 ? { params } : undefined,
    signal
  );
};

export const listEquipment = (
  filters: EquipmentFilters = {},
  signal?: AbortSignal
): Promise<ApiResult<PaginatedResponse<Equipment>>> =>
  request(
    () =>
      apiClient.get<PaginatedResponse<Equipment>>(
        '/items',
        withParams(filters, signal)
      ),
    { retry: true }
  );

export const getEquipmentById = (
  id: number,
  signal?: AbortSignal
): Promise<ApiResult<Equipment>> =>
  request(
    () => apiClient.get<Equipment>(`/items/${id}`, withSignal(undefined, signal)),
    { retry: true }
  );

export const getEquipmentByName = (
  name: string,
  signal?: AbortSignal
): Promise<ApiResult<Equipment>> =>
  request(
    () =>
      apiClient.get<Equipment>(
        `/items/name/${encodeURIComponent(name)}`,
        withSignal(undefined, signal)
      ),
    { retry: true }
  );

export const listEquipmentByType = (
  type: string,
  signal?: AbortSignal
): Promise<ApiResult<PaginatedResponse<Equipment>>> =>
  listEquipment({ type }, signal);

export const listWeapons = (signal?: AbortSignal): Promise<ApiResult<PaginatedResponse<Equipment>>> =>
  listEquipment({ category: 'weapon' }, signal);

export const listArmor = (signal?: AbortSignal): Promise<ApiResult<PaginatedResponse<Equipment>>> =>
  listEquipment({ category: 'armor' }, signal);

export const listAdventuringGear = (
  signal?: AbortSignal
): Promise<ApiResult<PaginatedResponse<Equipment>>> => listEquipment({ category: 'gear' }, signal);

export const equipmentService = {
  listEquipment,
  getEquipmentById,
  getEquipmentByName,
  listEquipmentByType,
  listWeapons,
  listArmor,
  listAdventuringGear,
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
