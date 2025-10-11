import type { StateCreator } from 'zustand';
import type { CharacterBuilderStore, BasicInfoSlice } from './types';
import { createInitialBasicInfo } from './types';

export const createBasicInfoSlice: StateCreator<
  CharacterBuilderStore,
  [],
  [],
  BasicInfoSlice
> = (set) => ({
  basicInfo: createInitialBasicInfo(),
  updateBasicInfo: (updates) =>
    set((state) => ({
      basicInfo: {
        ...state.basicInfo,
        ...updates,
      },
    })),
});
