import { create } from 'zustand';
import type { Spell } from '@/types/api';
import { listSpells } from '@/services/spellService';
import type { SpellFilters } from '@/services/spellService';
import { isError } from '@/types/api';
import { extractSpellClassNames } from '@/utils/spellUtils';

const CLASS_NAME_KEY = (className: string) => className.trim().toLowerCase();

interface SpellCacheEntry {
  spells: Spell[];
  isLoading: boolean;
  error?: string;
  fetchedAt?: number;
}

interface SpellLibraryState {
  classCache: Record<string, SpellCacheEntry>;
  fetchClassSpells: (className: string, options?: { force?: boolean }) => Promise<void>;
}

const ensureCacheEntry = (
  cache: Record<string, SpellCacheEntry>,
  key: string
): Record<string, SpellCacheEntry> => {
  if (cache[key]) return cache;
  return {
    ...cache,
    [key]: {
      spells: [],
      isLoading: false,
    },
  };
};

const normaliseClassKey = (className: string) =>
  className ? CLASS_NAME_KEY(className) : '';

const DEFAULT_LIMIT = 500;

export const useSpellLibraryStore = create<SpellLibraryState>((set) => ({
  classCache: {},
  async fetchClassSpells(className: string, options?: { force?: boolean }) {
    const key = normaliseClassKey(className);
    if (!key) return;

    set((state) => {
      const nextCache = ensureCacheEntry(state.classCache, key);
      const entry = nextCache[key];

      if (!options?.force && entry.spells.length > 0 && !entry.error) {
        return state;
      }

      return {
        classCache: {
          ...nextCache,
          [key]: {
            ...entry,
            isLoading: true,
          },
        },
      };
    });

    const result = await listSpells(
      {
        className,
        limit: DEFAULT_LIMIT,
        page: 1,
      } satisfies SpellFilters,
    );

    if (isError(result)) {
      set((state) => {
        const nextCache = ensureCacheEntry(state.classCache, key);
        return {
          classCache: {
            ...nextCache,
            [key]: {
              ...nextCache[key],
              isLoading: false,
              error: result.error,
            },
          },
        };
      });
      return;
    }

    const payload = result.data;
    const spells = Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray((payload as any)?.spells)
        ? (payload as any).spells
        : [];

    set((state) => {
      const nextCache = ensureCacheEntry(state.classCache, key);
      return {
        classCache: {
          ...nextCache,
          [key]: {
            spells,
            isLoading: false,
            fetchedAt: Date.now(),
          },
        },
      };
    });
  },
}));

const EMPTY_CACHE_ENTRY: Readonly<SpellCacheEntry> = Object.freeze({
  spells: [],
  isLoading: false,
});

export const selectClassEntry = (className: string) => (state: SpellLibraryState): SpellCacheEntry =>
  state.classCache[normaliseClassKey(className)] ?? (EMPTY_CACHE_ENTRY as SpellCacheEntry);

export const selectClassSpells = (className: string) => (state: SpellLibraryState): Spell[] =>
  selectClassEntry(className)(state).spells;

export const selectClassStatus = (className: string) => (state: SpellLibraryState) =>
  selectClassEntry(className)(state);

type WizardLevelMemo = {
  base: Spell[] | null;
  query: string | null;
  derived: Spell[];
};

const wizardLevelMemo: WizardLevelMemo = {
  base: null,
  query: null,
  derived: [],
};

const normaliseQuery = (query: string | undefined) =>
  (query ?? '').trim().toLowerCase();

const filterWizardLevelSpells = (spells: Spell[], q: string): Spell[] => {
  const query = normaliseQuery(q);

  return spells.filter((spell) => {
    if (spell.level !== 1) return false;

    const classNames = extractSpellClassNames(spell as unknown as { classes?: { name?: string }[] });
    if (!classNames.includes('wizard')) {
      return false;
    }

    if (!query) return true;

    return spell.name.toLowerCase().includes(query);
  });
};

export const selectWizardLevelOneSpells = (q: string) => (state: SpellLibraryState): Spell[] => {
  const base = selectClassSpells('Wizard')(state);
  const query = normaliseQuery(q);

  if (wizardLevelMemo.base === base && wizardLevelMemo.query === query) {
    return wizardLevelMemo.derived;
  }

  wizardLevelMemo.base = base;
  wizardLevelMemo.query = query;
  wizardLevelMemo.derived = filterWizardLevelSpells(base, query);

  return wizardLevelMemo.derived;
};
