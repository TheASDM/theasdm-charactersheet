import { useState, useCallback } from 'react';

type EditableSection = 'abilities' | 'stats' | 'skills' | 'spells' | 'mana' | 'characterInfo' | 'actions' | 'inventory';

interface EditingSections {
  abilities: boolean;
  stats: boolean;
  skills: boolean;
  spells: boolean;
  mana: boolean;
  characterInfo: boolean;
  actions: boolean;
  inventory: boolean;
}

export function useEditingSections(initialEditMode = false) {
  const [editingSections, setEditingSections] = useState<EditingSections>({
    abilities: initialEditMode,
    stats: false,
    skills: false,
    spells: false,
    mana: false,
    characterInfo: false,
    actions: false,
    inventory: false,
  });


  const toggleSectionEdit = useCallback((section: EditableSection) => {
    setEditingSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  const cancelSectionEdit = useCallback((section: EditableSection) => {
    setEditingSections(prev => ({
      ...prev,
      [section]: false,
    }));
    // Could restore previous state here if needed
  }, []);

  const setSectionEditing = useCallback((section: EditableSection, isEditing: boolean) => {
    setEditingSections(prev => ({
      ...prev,
      [section]: isEditing,
    }));
  }, []);

  return {
    editingSections,
    toggleSectionEdit,
    cancelSectionEdit,
    setSectionEditing,
  };
}