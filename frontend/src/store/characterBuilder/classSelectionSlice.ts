import type { StateCreator } from 'zustand';
import type { CharacterBuilderStore, ClassSelectionSlice } from './types';
import { createInitialClassSelection } from './types';

export const createClassSelectionSlice: StateCreator<
  CharacterBuilderStore,
  [],
  [],
  ClassSelectionSlice
> = (set) => ({
  classSelection: createInitialClassSelection(),
  updateClassSelection: (updates) =>
    set((state) => ({
      classSelection: {
        ...state.classSelection,
        ...updates,
      },
    })),
});
