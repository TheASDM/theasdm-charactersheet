import { useCallback } from 'react';
import { CharacterSheetData } from '../../types/characterSheet';
import { EquipmentValidator } from '../../utils/equipmentValidator';
import { useDebouncedCallback } from '../useDebouncedCallback';

export const useAbilityScores = (
  character: CharacterSheetData,
  onUpdate: (updatedCharacter: CharacterSheetData) => void,
  onSave?: (updatedCharacter: CharacterSheetData, options?: { silent?: boolean }) => void | Promise<void>
) => {
  const debouncedSilentSave = useDebouncedCallback(
    (updated: CharacterSheetData) => {
      onSave?.(updated, { silent: true });
    },
    200
  );

  // Adjust ability score handler
  const adjustAbilityScore = useCallback((
    ability: keyof CharacterSheetData['abilityScores'],
    direction: 'up' | 'down'
  ) => {
    const currentScore = character.abilityScores[ability];
    const newScore = direction === 'up'
      ? Math.min(20, currentScore + 1)
      : Math.max(3, currentScore - 1);

    // Create updated character with new ability scores
    const updatedCharacter = {
      ...character,
      abilityScores: {
        ...character.abilityScores,
        [ability]: newScore
      }
    };

    // Recalculate AC if dexterity changed (affects AC) or if any other ability changed
    // (in case of future features that use other abilities for AC)
    const newArmorClass = EquipmentValidator.calculateArmorClass(updatedCharacter);

    // Update character with new ability scores and recalculated AC
    const finalCharacter = {
      ...updatedCharacter,
      armorClass: newArmorClass
    };

    onUpdate(finalCharacter);

    // Auto-save the changes silently
    if (onSave) {
      debouncedSilentSave(finalCharacter);
    }
  }, [character, onUpdate, onSave, debouncedSilentSave]);

  return {
    // Handlers
    adjustAbilityScore,
  };
};
