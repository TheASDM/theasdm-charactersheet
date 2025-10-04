import { useCallback } from 'react';
import { CharacterSheetData } from '../types/characterSheet';

type StatType = 'currentHP' | 'maxHP' | 'armorClass';

export function useStatsManagement(
  character: CharacterSheetData,
  updateCharacter: (updates: Partial<CharacterSheetData>) => void
) {
  const adjustStat = useCallback((stat: StatType, direction: 'up' | 'down') => {
    const adjustment = direction === 'up' ? 1 : -1;

    switch (stat) {
      case 'currentHP':
        updateCharacter({
          hitPoints: {
            ...character.hitPoints,
            current: Math.max(
              0,
              Math.min(
                character.hitPoints.max,
                character.hitPoints.current + adjustment
              )
            ),
          },
        });
        break;

      case 'maxHP': {
        const newMaxHP = Math.max(1, character.hitPoints.max + adjustment);
        updateCharacter({
          hitPoints: {
            ...character.hitPoints,
            max: newMaxHP,
            current: Math.min(character.hitPoints.current, newMaxHP),
          },
        });
        break;
      }

      case 'armorClass':
        updateCharacter({
          armorClass: Math.max(1, Math.min(30, character.armorClass + adjustment)),
        });
        break;
    }
  }, [character, updateCharacter]);

  return {
    adjustStat,
  };
}
