import type { StateCreator } from 'zustand';
import type { AbilityScoreValue, AbilityScoresSlice, CharacterBuilderStore } from './types';
import { createInitialAbilityScores } from './types';

const mergeScores = (
  previous: AbilityScoreValue,
  updates: Partial<AbilityScoreValue> | AbilityScoreValue
): AbilityScoreValue => ({
  ...previous,
  ...(updates as Partial<AbilityScoreValue>),
});

export const createAbilityScoresSlice: StateCreator<
  CharacterBuilderStore,
  [],
  [],
  AbilityScoresSlice
> = (set) => ({
  abilityScores: createInitialAbilityScores(),
  updateAbilityScores: (updates) =>
    set((state) => {
      const { scores, ...rest } = updates;
      const nextScores =
        scores !== undefined ? mergeScores(state.abilityScores.scores, scores) : state.abilityScores.scores;

      return {
        abilityScores: {
          ...state.abilityScores,
          ...rest,
          scores: nextScores,
        },
      };
    }),
});
