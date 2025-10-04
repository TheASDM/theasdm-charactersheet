import { useCallback } from 'react';
import { CharacterSheetData } from '../../types/characterSheet';
import { EquipmentValidator } from '../../utils/equipmentValidator';

export const useAbilityScores = (
  character: CharacterSheetData,
  onUpdate: (updatedCharacter: CharacterSheetData) => void,
  onSave?: (updatedCharacter: CharacterSheetData, options?: { silent?: boolean }) => void | Promise<void>
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
      void onSave(finalCharacter, { silent: true });
    }
  }, [character, onUpdate, onSave]);

  return {
    // Handlers
    adjustAbilityScore,
  };
};
