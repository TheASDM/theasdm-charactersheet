import type { StateCreator } from 'zustand';
import type { CharacterBuilderStore, SpeciesSlice } from './types';
import { createInitialSpecies } from './types';

export const createSpeciesSlice: StateCreator<
  CharacterBuilderStore,
  [],
  [],
  SpeciesSlice
> = (set) => ({
  species: createInitialSpecies(),
  updateSpecies: (updates) =>
    set((state) => ({
      species: {
        ...state.species,
        ...updates,
      },
    })),
});
