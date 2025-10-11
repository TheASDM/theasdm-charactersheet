import type { StateCreator } from 'zustand';
import type { CharacterBuilderStore, WizardNavigationSlice, WizardStep } from './types';
import { createInitialWizardNavigationState } from './types';

export const createWizardNavigationSlice: StateCreator<
  CharacterBuilderStore,
  [],
  [],
  WizardNavigationSlice
> = (set) => ({
  ...createInitialWizardNavigationState(),
  setCurrentStep: (step: WizardStep) => set({ currentStep: step }),
  markStepComplete: (step: WizardStep) =>
    set((state) =>
      state.completedSteps.includes(step)
        ? state
        : { completedSteps: [...state.completedSteps, step] }
    ),
  resetProgress: () => set(createInitialWizardNavigationState()),
});
