import { useState, useCallback } from 'react';
import { CharacterSheetData } from '../../types/characterSheet';

interface Action {
  name: string;
  atkBonus: string;
  damage: string;
}

export const useActionsManagement = (
  character: CharacterSheetData,
  updateCharacter: (updates: Partial<CharacterSheetData>) => void
) => {
  // Modal state
  const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);

  // Action update handler
  const handleActionUpdate = useCallback((
    index: number,
    field: 'name' | 'atkBonus' | 'damage',
    value: string
  ) => {
    const updatedActions = [...character.actions];
    updatedActions[index] = {
      ...updatedActions[index],
      [field]: value,
    };
    updateCharacter({ actions: updatedActions });
  }, [character.actions, updateCharacter]);

  // Remove action handler
  const handleRemoveAction = useCallback((index: number) => {
    const updatedActions = character.actions.filter((_, i) => i !== index);
    updateCharacter({ actions: updatedActions });
  }, [character.actions, updateCharacter]);

  // Manage actions modal handler
  const handleManageActions = useCallback(() => {
    setIsActionsModalOpen(true);
  }, []);

  const addOrReplaceAction = useCallback((newAction: Action) => {
    const updatedActions = [...character.actions];
    const targetName = newAction.name?.toLowerCase() ?? '';

    if (!targetName) {
      return;
    }

    const existingIndex = updatedActions.findIndex(
      (action) => action?.name?.toLowerCase() === targetName
    );

    if (existingIndex !== -1) {
      updatedActions[existingIndex] = { ...newAction };
    } else {
      const emptyIndex = updatedActions.findIndex(
        (action) => !action || !action.name || !action.name.trim()
      );

      if (emptyIndex !== -1) {
        updatedActions[emptyIndex] = { ...newAction };
      } else {
        updatedActions.push({ ...newAction });
      }
    }

    updateCharacter({ actions: updatedActions });
  }, [character.actions, updateCharacter]);

  const removeActionByName = useCallback((name: string) => {
    if (!name) return;

    const lowerName = name.toLowerCase();
    let changed = false;

    const updatedActions = character.actions.map((action) => {
      if (action?.name?.toLowerCase() === lowerName) {
        changed = true;
        return { name: '', atkBonus: '', damage: '' };
      }
      return action;
    });

    if (changed) {
      updateCharacter({ actions: updatedActions });
    }
  }, [character.actions, updateCharacter]);

  const hasAction = useCallback(
    (name: string) => {
      if (!name) return false;
      const lower = name.toLowerCase();
      return character.actions.some(
        (action) => action?.name?.toLowerCase() === lower
      );
    },
    [character.actions]
  );

  // Save actions handler
  const handleSaveActions = useCallback((newActions: Action[]) => {
    updateCharacter({ actions: newActions });
    setIsActionsModalOpen(false);
  }, [updateCharacter]);

  // Cancel actions modal handler
  const handleCancelActionsModal = useCallback(() => {
    setIsActionsModalOpen(false);
  }, []);

  return {
    // State
    isActionsModalOpen,
    setIsActionsModalOpen,

    // Handlers
    handleActionUpdate,
    handleRemoveAction,
    handleManageActions,
    handleSaveActions,
    handleCancelActionsModal,
    addOrReplaceAction,
    removeActionByName,
    hasAction,
  };
};
