import { useCallback } from 'react';
import { CharacterSheetData } from '../../types/characterSheet';

export const useAbilityScores = (
  character: CharacterSheetData,
  onUpdate: (updatedCharacter: CharacterSheetData) => void
) => {
  // Adjust ability score handler
  const adjustAbilityScore = useCallback((
    ability: keyof CharacterSheetData['abilityScores'],
    direction: 'up' | 'down'
  ) => {
    const currentScore = character.abilityScores[ability];
    const newScore = direction === 'up'
      ? Math.min(20, currentScore + 1)
      : Math.max(3, currentScore - 1);

    onUpdate({
      ...character,
      abilityScores: {
        ...character.abilityScores,
        [ability]: newScore
      }
    });
  }, [character, onUpdate]);

  return {
    // Handlers
    adjustAbilityScore,
  };
};