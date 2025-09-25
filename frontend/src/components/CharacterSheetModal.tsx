import { useState, useCallback } from 'react';
import styled from 'styled-components';
import CharacterSheet from './CharacterSheet';
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
  background: rgba(40, 167, 69, 0.1);
  border: 2px solid #28a745;
  border-radius: 8px;
  color: #155724;
  padding: 12px;
  margin: 10px 0;
  text-align: center;
  font-weight: 600;
`;

export default function CharacterSheetModal({
  isOpen,
  onClose,
  character,
  onSave,
}: CharacterSheetModalProps) {
  const [characterSheetData, setCharacterSheetData] =
    useState<CharacterSheetData>(() => {
      if (character?.characterData) {
        // If character already has character data, use it
        return { ...createDefaultCharacterSheet(), ...character.characterData };
      } else if (character) {
        // If character exists but no character data, create basic sheet from character info
        const defaultSheet = createDefaultCharacterSheet();
        return {
          ...defaultSheet,
          name: character.name,
          level: character.level,
        };
      } else {
        // New character
        return createDefaultCharacterSheet();
      }
    });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleUpdate = useCallback((updatedData: CharacterSheetData) => {
    setCharacterSheetData(updatedData);
    setError(null);
    setSuccess(null);
  }, []);

  const handleSave = useCallback(
    async (data: CharacterSheetData) => {
      if (!character) {
        setError('No character selected to save');
        return;
      }

      setIsSaving(true);
      setError(null);
      setSuccess(null);

      try {
        const response = await characterService.updateCharacterSheet(
          character.id,
          data
        );

        if (response.error) {
          setError(response.error);
          return;
        }

        if (response.data) {
          setSuccess('Character sheet saved successfully!');
          if (onSave) {
            onSave(response.data);
          }

          // Close modal after short delay to show success message
          setTimeout(() => {
            onClose();
          }, 1500);
        }
      } catch (err) {
        console.error('Error saving character sheet:', err);
        setError('Failed to save character sheet. Please try again.');
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

        <CharacterSheet
          character={characterSheetData}
          onUpdate={handleUpdate}
          {...(isSaving ? {} : { onSave: handleSave })}
        />
      </ModalContent>
    </ModalOverlay>
  );
}
