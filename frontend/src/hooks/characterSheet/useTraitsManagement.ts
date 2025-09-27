import { useState, useCallback } from 'react';
import { CharacterSheetData } from '../../types/characterSheet';

interface TraitData {
  name: string;
  description: string;
  source: string;
  type: string;
}

interface TraitsData {
  classFeatures: string[];
  speciesTraits: string[];
  customTraits: TraitData[];
}

export const useTraitsManagement = (
  updateCharacter: (updates: Partial<CharacterSheetData>) => void
) => {
  // Modal state
  const [isTraitsModalOpen, setIsTraitsModalOpen] = useState(false);

  // Manage traits modal handler
  const handleManageTraits = useCallback(() => {
    setIsTraitsModalOpen(true);
  }, []);

  // Save traits handler
  const handleSaveTraits = useCallback((traits: TraitsData) => {
    updateCharacter({
      classFeatures: traits.classFeatures,
      speciesTraits: traits.speciesTraits
      // Note: customTraits would need to be added to the character schema if we want to persist them
    });
    setIsTraitsModalOpen(false);
  }, [updateCharacter]);

  // Cancel traits modal handler
  const handleCancelTraitsModal = useCallback(() => {
    setIsTraitsModalOpen(false);
  }, []);

  return {
    // State
    isTraitsModalOpen,
    setIsTraitsModalOpen,

    // Handlers
    handleManageTraits,
    handleSaveTraits,
    handleCancelTraitsModal,
  };
};