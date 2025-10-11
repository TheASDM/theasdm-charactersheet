import type { StateCreator } from 'zustand';
import type { CharacterBuilderStore, SpellbookSlice } from './types';
import { createInitialSpellbook } from './types';

export const createSpellbookSlice: StateCreator<
  CharacterBuilderStore,
  [],
  [],
  SpellbookSlice
> = (set) => ({
  spells: createInitialSpellbook(),
  setKnownSpells: (ids) =>
    set((state) => ({
      spells: {
        ...state.spells,
        known: [...ids],
      },
    })),
  setPreparedSpells: (ids) =>
    set((state) => ({
      spells: {
        ...state.spells,
        prepared: [...ids],
      },
    })),
  updateSpellbook: (updates) =>
    set((state) => ({
      spells: {
        ...state.spells,
        ...updates,
      },
    })),
});
