import type { StateCreator } from 'zustand';
import type { CharacterBuilderStore, EquipmentSlice } from './types';
import { createInitialEquipment } from './types';

export const createEquipmentSlice: StateCreator<
  CharacterBuilderStore,
  [],
  [],
  EquipmentSlice
> = (set) => ({
  equipment: createInitialEquipment(),
  updateEquipment: (updates) =>
    set((state) => ({
      equipment: {
        ...state.equipment,
        ...updates,
      },
    })),
});
