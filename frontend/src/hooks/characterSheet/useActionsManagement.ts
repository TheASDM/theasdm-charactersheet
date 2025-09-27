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
  };
};