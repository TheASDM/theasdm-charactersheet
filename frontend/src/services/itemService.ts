import { apiClient, request, withSignal } from './api';
import { ApiResult, Item, PaginatedResponse } from '@/types/api';

export interface ItemFilters {
  type?: string;
  rarity?: string;
  search?: string;
  page?: number;
  limit?: number;
}

const buildParams = (filters: ItemFilters = {}) => ({
  ...(filters.type && { type: filters.type }),
  ...(filters.rarity && { rarity: filters.rarity }),
  ...(filters.search && { search: filters.search }),
  page: filters.page ?? 1,
  limit: filters.limit ?? 50,
});

export async function listItems(
  filters: ItemFilters = {},
  signal?: AbortSignal
): Promise<ApiResult<PaginatedResponse<Item>>> {
  const params = buildParams(filters);
  return request(
    () => apiClient.get<PaginatedResponse<Item>>('/items', withSignal({ params }, signal)),
    { retry: true }
  );
}

export async function getItem(
  id: number | string,
  signal?: AbortSignal
): Promise<ApiResult<Item>> {
  return request(
    () => apiClient.get<Item>(`/items/${id}`, withSignal(undefined, signal)),
    { retry: true }
  );
}

export async function createItem(body: Partial<Item>): Promise<ApiResult<Item>> {
  return request(() => apiClient.post<Item>('/items', body));
}

export async function updateItem(
  id: number | string,
  patch: Partial<Item>
): Promise<ApiResult<Item>> {
  return request(() => apiClient.put<Item>(`/items/${id}`, patch));
}

export async function deleteItem(id: number | string): Promise<ApiResult<void>> {
  return request(() => apiClient.delete<void>(`/items/${id}`));
}

export async function searchItems(
  query: string,
  limit = 20,
  signal?: AbortSignal
): Promise<ApiResult<PaginatedResponse<Item>>> {
  return listItems({ search: query, limit }, signal);
}

export const itemService = {
  listItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  search: searchItems,
};

export default itemService;

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

export const ITEM_RARITIES = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  VERY_RARE: 'very rare',
  LEGENDARY: 'legendary',
  ARTIFACT: 'artifact',
} as const;

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

export const isWeapon = (item: Item): boolean => {
  return item.type === 'weapon' || item.type === 'M' || item.type === 'R' || !!item.dmg1;
};

export const isArmor = (item: Item): boolean => {
  return (
    item.type === 'armor' ||
    item.type === 'LA' ||
    item.type === 'MA' ||
    item.type === 'HA' ||
    (!!item.ac && item.armorType !== 'shield')
  );
};

export const isShield = (item: Item): boolean => {
  return item.type === 'S' || item.armorType === 'shield' || item.name.toLowerCase().includes('shield');
};

export const getWeaponAttackBonus = (item: Item): string => {
  if (!isWeapon(item)) return '';

  if (item.property?.includes('F') || item.property?.includes('finesse')) {
    return 'STR or DEX';
  }

  if (item.range === 'ranged' || item.type === 'R') {
    return 'DEX';
  }

  return 'STR';
};

export const getWeaponDamageString = (item: Item): string => {
  if (!isWeapon(item) || !item.dmg1) return '';

  let damage = item.dmg1;
  if (item.dmg2) {
    damage += ` (${item.dmg2} versatile)`;
  }

  if (item.dmgType) {
    damage += ` ${item.dmgType}`;
  }

  return damage;
};

export const calculateArmorClass = (
  dexterityModifier: number,
  equippedArmor?: Item,
  hasShield = false
): number => {
  let ac = 10;

  if (equippedArmor && isArmor(equippedArmor) && equippedArmor.ac) {
    ac = equippedArmor.ac;

    if (equippedArmor.armorType === 'light') {
      ac += dexterityModifier;
    } else if (equippedArmor.armorType === 'medium') {
      ac += Math.min(dexterityModifier, 2);
    }
  } else {
    ac = 10 + dexterityModifier;
  }

  if (hasShield) {
    ac += 2;
  }

  return ac;
};
