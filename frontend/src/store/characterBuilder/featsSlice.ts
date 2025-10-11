import type { StateCreator } from 'zustand';
import type { CharacterBuilderStore, FeatsSlice } from './types';
import { createInitialFeats } from './types';

export const createFeatsSlice: StateCreator<
  CharacterBuilderStore,
  [],
  [],
  FeatsSlice
> = (set) => ({
  feats: createInitialFeats(),
  updateFeats: (updates) =>
    set((state) => ({
      feats: {
        ...state.feats,
        ...updates,
      },
    })),
});
