import type { StateCreator } from 'zustand';
import type { BackgroundSlice, CharacterBuilderStore } from './types';
import { createInitialBackground } from './types';

export const createBackgroundSlice: StateCreator<
  CharacterBuilderStore,
  [],
  [],
  BackgroundSlice
> = (set) => ({
  background: createInitialBackground(),
  updateBackground: (updates) =>
    set((state) => ({
      background: {
        ...state.background,
        ...updates,
      },
    })),
});
