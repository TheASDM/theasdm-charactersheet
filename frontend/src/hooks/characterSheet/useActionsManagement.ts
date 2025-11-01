import { useState, useCallback } from 'react';
import { CharacterSheetData, CharacterAction } from '../../types/characterSheet';

export const useActionsManagement = (
  character: CharacterSheetData,
  updateCharacter: (updates: Partial<CharacterSheetData>) => void
) => {
  // Modal state
  const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);

  const createEmptyAction = useCallback((): CharacterAction => ({
    name: '',
    type: 'custom',
    attack: null,
    damage: null,
    healing: null,
    displayOverrides: { attack: '', damage: '' },
    legacy: { atkBonus: '', damage: '' },
  }), []);

  // Action update handler
  const handleActionUpdate = useCallback(
    (index: number, field: 'name' | 'atkBonus' | 'damage', value: string) => {
      const updatedActions: CharacterAction[] = [...character.actions];
      const current = updatedActions[index] ? { ...updatedActions[index] } : createEmptyAction();

      if (field === 'name') {
        updatedActions[index] = {
          ...current,
          name: value,
          type: current.type ?? 'custom',
        };
      } else {
        const displayOverrides = {
          ...(current.displayOverrides ?? {}),
          [field === 'atkBonus' ? 'attack' : 'damage']: value,
        };

        const legacy = {
          ...(current.legacy ?? {}),
          [field === 'atkBonus' ? 'atkBonus' : 'damage']: value,
        };

        updatedActions[index] = {
          ...current,
          type: current.type ?? 'custom',
          displayOverrides,
          legacy,
        };
      }

      updateCharacter({ actions: updatedActions });
    },
    [character.actions, updateCharacter, createEmptyAction]
  );

  // Remove action handler
  const handleRemoveAction = useCallback((index: number) => {
    const updatedActions = character.actions.filter((_, i) => i !== index);
    updateCharacter({ actions: updatedActions });
  }, [character.actions, updateCharacter, createEmptyAction]);

  // Reorder actions handler (drag and drop)
  const handleReorderActions = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const updatedActions = [...character.actions];
    const [movedAction] = updatedActions.splice(fromIndex, 1);
    updatedActions.splice(toIndex, 0, movedAction);

    updateCharacter({ actions: updatedActions });
  }, [character.actions, updateCharacter]);

  // Manage actions modal handler
  const handleManageActions = useCallback(() => {
    setIsActionsModalOpen(true);
  }, []);

  const addOrReplaceAction = useCallback((newAction: CharacterAction) => {
    const updatedActions: CharacterAction[] = [...character.actions];
    const targetName = newAction.name?.toLowerCase() ?? '';

    if (!targetName) {
      return;
    }

    const existingIndex = updatedActions.findIndex(
      (action) => action?.name?.toLowerCase() === targetName
    );

    if (existingIndex !== -1) {
      updatedActions[existingIndex] = {
        ...newAction,
        type: newAction.type ?? 'custom',
      };
    } else {
      const emptyIndex = updatedActions.findIndex(
        (action) => !action || !action.name || !action.name.trim()
      );

      if (emptyIndex !== -1) {
        updatedActions[emptyIndex] = {
          ...newAction,
          type: newAction.type ?? 'custom',
        };
      } else {
        updatedActions.push({
          ...newAction,
          type: newAction.type ?? 'custom',
        });
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
        return createEmptyAction();
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
  const handleSaveActions = useCallback((newActions: CharacterAction[]) => {
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
    handleReorderActions,
    handleManageActions,
    handleSaveActions,
    handleCancelActionsModal,
    addOrReplaceAction,
    removeActionByName,
    hasAction,
  };
};
