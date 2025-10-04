import { useCallback } from 'react';
import { CharacterSheetData } from '../../types/characterSheet';

export const useResourceTracking = (
  character: CharacterSheetData,
  updateCharacter: (updates: Partial<CharacterSheetData>) => void,
  onSave?: (updatedCharacter: CharacterSheetData, options?: { silent?: boolean }) => void | Promise<void>
) => {
  // Resource update handler
  const handleResourceUpdate = useCallback((resourceId: string, newValue: number) => {
    let updatedCharacter;

    // Handle wounds specially since it's stored directly on character
    if (resourceId === 'core-wounds') {
      updatedCharacter = { ...character, wounds: newValue };
      updateCharacter({ wounds: newValue });
    } else {
      // Update the resources object for other resources
      const newResources = {
        ...character.resources,
        [resourceId]: Math.max(0, newValue),
      };
      updatedCharacter = { ...character, resources: newResources };
      updateCharacter({
        resources: newResources,
      });
    }

    // Silent auto-save the changes (no notification)
    if (onSave) {
      void onSave(updatedCharacter, { silent: true });
    }
  }, [character, updateCharacter, onSave]);

  // Mana update handler
  const handleManaUpdate = useCallback((type: 'current' | 'max', delta: number) => {
    const newValue = Math.max(0, character.mana[type] + delta);
    const newMana = {
      ...character.mana,
      [type]: newValue,
    };
    const updatedCharacter = { ...character, mana: newMana };

    updateCharacter({
      mana: newMana,
    });

    // Silent auto-save the changes (no notification)
    if (onSave) {
      void onSave(updatedCharacter, { silent: true });
    }
  }, [character, updateCharacter, onSave]);

  return {
    // Handlers
    handleResourceUpdate,
    handleManaUpdate,
  };
};
