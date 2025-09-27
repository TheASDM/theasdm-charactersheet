import { useState, useCallback } from 'react';
import { CharacterSheetData } from '../../types/characterSheet';

interface SkillProficiency {
  proficient: boolean;
  modifier: number;
}

export const useSkillsManagement = (
  updateCharacter: (updates: Partial<CharacterSheetData>) => void
) => {
  // Modal state
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);

  // Manage skills modal handler
  const handleManageSkills = useCallback(() => {
    setIsSkillsModalOpen(true);
  }, []);

  // Save skills handler
  const handleSaveSkills = useCallback((newSkills: Record<string, SkillProficiency>) => {
    updateCharacter({ skills: newSkills });
    setIsSkillsModalOpen(false);
  }, [updateCharacter]);

  // Cancel skills modal handler
  const handleCancelSkillsModal = useCallback(() => {
    setIsSkillsModalOpen(false);
  }, []);

  return {
    // State
    isSkillsModalOpen,
    setIsSkillsModalOpen,

    // Handlers
    handleManageSkills,
    handleSaveSkills,
    handleCancelSkillsModal,
  };
};