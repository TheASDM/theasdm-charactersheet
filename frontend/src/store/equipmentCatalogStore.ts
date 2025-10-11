import { create } from 'zustand';
import type { Equipment } from '@/types/api';
import { listEquipment } from '@/services/equipmentService';
import { isError } from '@/types/api';

const PAGE_SIZE = 50;

interface EquipmentCatalogState {
  items: Equipment[];
  isLoading: boolean;
  error?: string;
  lastFetched?: number;
  loadEquipment: (options?: { force?: boolean }) => Promise<void>;
}

const fetchAllEquipment = async (): Promise<Equipment[]> => {
  const aggregated: Equipment[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const result = await listEquipment({ page, limit: PAGE_SIZE });
    if (isError(result)) {
      throw new Error(result.error);
    }

    const payload = result.data;
    const pageItems = payload?.items ?? [];
    aggregated.push(...pageItems);
    totalPages = payload?.pagination?.pages ?? page;
    page += 1;
  } while (page <= totalPages);

  return aggregated;
};

export const useEquipmentCatalogStore = create<EquipmentCatalogState>((set, get) => ({
  items: [],
  isLoading: false,
  async loadEquipment(options) {
    const state = get();
    if (!options?.force && (state.isLoading || state.items.length > 0)) {
      return;
    }

    set({ isLoading: true });

    try {
      const items = await fetchAllEquipment();
      set({
        items,
        isLoading: false,
        lastFetched: Date.now(),
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error loading equipment.',
      });
    }
  },
}));

type EquipmentFilterParams = {
  searchTerm?: string;
  typeFilter?: string;
  rarityFilter?: string;
};

const createEquipmentFilterMemo = () => {
  let lastItems: Equipment[] | null = null;
  let lastKey = '';
  let lastResult: Equipment[] = [];

  return (items: Equipment[], filters: EquipmentFilterParams) => {
    const normalizedSearch = (filters.searchTerm ?? '').trim().toLowerCase();
    const normalizedType = filters.typeFilter ?? 'all';
    const normalizedRarity = (filters.rarityFilter ?? 'all').toLowerCase();
    const cacheKey = `${items.length}-${normalizedSearch}-${normalizedType}-${normalizedRarity}`;

    if (lastItems === items && lastKey === cacheKey) {
      return lastResult;
    }

    const result = items.filter((item) => {
      if (normalizedSearch) {
        const nameMatch = item.name?.toLowerCase().includes(normalizedSearch);
        if (!nameMatch) return false;
      }

      if (normalizedType !== 'all') {
        if ((item.type ?? '') !== normalizedType) {
          return false;
        }
      }

      if (normalizedRarity !== 'all') {
        const itemRarity = item.rarity?.toLowerCase() ?? '';
        if (itemRarity !== normalizedRarity) {
          return false;
        }
      }

      return true;
    });

    lastItems = items;
    lastKey = cacheKey;
    lastResult = result;
    return result;
  };
};

export const makeFilteredEquipmentSelector = (filters: EquipmentFilterParams) => {
  const memo = createEquipmentFilterMemo();
  return (state: EquipmentCatalogState): Equipment[] => memo(state.items, filters);
};

export const selectAllEquipment = (state: EquipmentCatalogState) => state.items;
