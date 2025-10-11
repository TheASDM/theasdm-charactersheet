import type { StateCreator } from 'zustand';
import type { CharacterBuilderStore, ResetSlice } from './types';
import { createInitialCharacterBuilderData } from './types';

export const createResetSlice: StateCreator<
  CharacterBuilderStore,
  [],
  [],
  ResetSlice
> = (set) => ({
  resetBuilder: () => set(() => createInitialCharacterBuilderData()),
});
