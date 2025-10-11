import type { StateCreator } from 'zustand';
import type { CharacterBuilderStore, ResourceSlice } from './types';
import { createInitialResources } from './types';

export const createResourcesSlice: StateCreator<
  CharacterBuilderStore,
  [],
  [],
  ResourceSlice
> = (set) => ({
  resources: createInitialResources(),
  setMana: (values) =>
    set((state) => ({
      resources: {
        ...state.resources,
        ...values,
      },
    })),
  updateResources: (updates) =>
    set((state) => ({
      resources: {
        ...state.resources,
        ...updates,
      },
    })),
});
