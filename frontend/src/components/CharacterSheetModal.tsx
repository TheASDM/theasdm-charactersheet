import { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import CharacterSheetPretty from './CharacterSheetPretty';
import {
  CharacterSheetData,
  createDefaultCharacterSheet,
} from '../types/characterSheet';
import { Character } from '../types/api';
import { characterService } from '../services/characterService';

interface CharacterSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  character?: Character;
  onSave?: (updatedCharacter: Character) => void;
}

const ModalOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 1000;
  display: ${(props) => (props.isOpen ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: #f4e7d1;
  border: 3px solid #8b6914;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  max-width: 95vw;
  max-height: 95vh;
  overflow: auto;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 20px;
  background: #d4af37;
  color: #2c1810;
  border: none;
  border-radius: 50%;
  width: 35px;
  height: 35px;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #b8941f;
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const ErrorMessage = styled.div`
  background: rgba(220, 53, 69, 0.1);
  border: 2px solid #dc3545;
  border-radius: 8px;
  color: #721c24;
  padding: 12px;
  margin: 10px 0;
  text-align: center;
  font-weight: 600;
`;

const SuccessMessage = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(145deg, rgba(34, 139, 34, 0.9), rgba(46, 125, 50, 0.9));
  border: 3px solid rgba(76, 175, 80, 0.8);
  border-radius: 20px;
  color: #ffffff;
  padding: 24px 48px;
  text-align: center;
  font-weight: 600;
  font-size: 2rem;
  font-family: 'Cinzel', serif;
  text-transform: uppercase;
  letter-spacing: 2px;
  z-index: 9999;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  opacity: 0.95;
  transition: all 0.3s ease;
`;

export default function CharacterSheetModal({
  isOpen,
  onClose,
  character,
  onSave,
}: CharacterSheetModalProps) {
  // Initialize character sheet data from the passed character, similar to generator page
  const [characterSheetData, setCharacterSheetData] = useState<CharacterSheetData>(() => {
    if (character?.characterData && typeof character.characterData === 'object') {
      return { ...createDefaultCharacterSheet(), ...character.characterData };
    } else if (character) {
      const defaultSheet = createDefaultCharacterSheet();
      return {
        ...defaultSheet,
        name: character.name || '',
        level: character.level || 1,
      };
    }
    return createDefaultCharacterSheet();
  });

  // Fetch fresh character data when modal opens for existing characters
  useEffect(() => {
    const fetchCharacterData = async () => {
      if (!isOpen || !character) return;

      let newData: CharacterSheetData;

      if (character.id > 0) {
        // For existing characters, fetch fresh data from server
        try {
          const response = await characterService.getById(character.id);
          if (response.data && response.data.characterData) {
            newData = { ...createDefaultCharacterSheet(), ...response.data.characterData };
          } else {
            newData = character.characterData && typeof character.characterData === 'object'
              ? { ...createDefaultCharacterSheet(), ...character.characterData }
              : { ...createDefaultCharacterSheet(), name: character.name || '', level: character.level || 1 };
          }
        } catch (error) {
          console.error('❌ Modal: Failed to fetch fresh character data:', error);
          // Fallback to prop data
          newData = character.characterData && typeof character.characterData === 'object'
            ? { ...createDefaultCharacterSheet(), ...character.characterData }
            : { ...createDefaultCharacterSheet(), name: character.name || '', level: character.level || 1 };
        }
      } else if (character.id === -1) {
        // For newly created characters from generator, always use the provided data
        // This data should persist across modal opens/closes until the character is saved
        newData = character.characterData && typeof character.characterData === 'object'
          ? { ...createDefaultCharacterSheet(), ...character.characterData }
          : { ...createDefaultCharacterSheet(), name: character.name || '', level: character.level || 1 };

        console.log('🔄 Modal: Using generator data for new character (ID: -1)');
      } else {
        // Fallback for other cases
        newData = character.characterData && typeof character.characterData === 'object'
          ? { ...createDefaultCharacterSheet(), ...character.characterData }
          : { ...createDefaultCharacterSheet(), name: character.name || '', level: character.level || 1 };
      }

      setCharacterSheetData(newData);
    };

    fetchCharacterData();
  }, [character, isOpen]);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Simple update handler like the generator page
  const handleUpdate = useCallback((updatedData: CharacterSheetData) => {
    setCharacterSheetData(updatedData);
    setError(null);
    setSuccess(null);
  }, []);

  const handleSave = useCallback(
    async (data: CharacterSheetData, options?: { silent?: boolean }) => {
      if (!character) {
        setError('No character selected to save');
        return;
      }


      const isSilent = options?.silent || false;

      setIsSaving(true);
      if (!isSilent) {
        setError(null);
        setSuccess(null);
      }

      try {
        let response;

        if (character.id === 0) {
          // New character - create it
          response = await characterService.create({
            userId: character.userId || 1, // TODO: Get from auth context
            name: data.name || 'Unnamed Character',
            level: data.level || 1,
            characterData: data,
            isPublic: character.isPublic || false,
          });
        } else {
          // Existing character - update it
          response = await characterService.updateCharacterSheet(
            character.id,
            data
          );
        }


        if (response.error) {
          console.error('❌ Modal: API Error:', response.error);
          if (!isSilent) {
            setError(response.error);
          }
          return;
        }

        if (response.data) {

          // Only show notification for non-silent saves
          if (!isSilent) {
            setSuccess('Saved');
            // Clear success message after 1 second for brief notification
            setTimeout(() => {
              setSuccess(null);
            }, 1000);
          }

          // Update the character state to reflect the new/updated character
          // This is especially important for new characters to get their ID
          if (character.id === 0 && response.data.id) {
            // For new characters, update the character with the new ID
            character.id = response.data.id;
          }

          if (onSave) {
            onSave(response.data);
          }
        } else {
          setError('Save completed but no data returned');
        }
      } catch (err) {
        console.error('❌ Modal: Exception saving character sheet:', err);
        if (!isSilent) {
          setError('Failed to save character sheet. Please try again.');
        }
      } finally {
        setIsSaving(false);
      }
    },
    [character, onSave, onClose]
  );

  const handleClose = useCallback(() => {
    setError(null);
    setSuccess(null);
    onClose();
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay isOpen={isOpen} onClick={handleOverlayClick}>
      <ModalContent>
        <CloseButton onClick={handleClose} disabled={isSaving}>
          ×
        </CloseButton>

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}

        <CharacterSheetPretty
          character={characterSheetData}
          onUpdate={handleUpdate}
          onSave={isSaving ? undefined : handleSave}
        />
      </ModalContent>
    </ModalOverlay>
  );
}
