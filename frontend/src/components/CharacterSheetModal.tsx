import { useState, useCallback, useEffect, type MouseEvent } from 'react';
import styled from 'styled-components';
import CharacterSheetPretty from './CharacterSheetPretty';
import {
  CharacterSheetData,
  createDefaultCharacterSheet,
} from '../types/characterSheet';
import { Character, isError } from '@/types/api';
import { characterService } from '../services/characterService';
import { showError } from '@/utils/errorDisplay';

interface CharacterSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  character?: Character;
  onSave?: (updatedCharacter: Character) => void;
}

const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: ${(props) => (props.$isOpen ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
  border: 2px solid #333;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
  max-width: 95vw;
  max-height: 95vh;
  overflow: auto;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 20px;
  background: rgba(212, 175, 55, 0.15);
  color: #d4af37;
  border: 1px solid #d4af37;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;

  &:hover {
    background: rgba(212, 175, 55, 0.25);
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const ErrorMessage = styled.div`
  background: rgba(244, 67, 54, 0.15);
  border: 1px solid #f44336;
  border-radius: 8px;
  color: #f44336;
  padding: 14px;
  margin: 10px 20px;
  text-align: center;
  font-weight: 600;
`;

const SuccessMessage = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(26, 26, 26, 0.95);
  border: 2px solid #4CAF50;
  border-radius: 12px;
  color: #4CAF50;
  padding: 24px 48px;
  text-align: center;
  font-weight: 600;
  font-size: 2rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  z-index: 9999;
  box-shadow: 0 8px 32px rgba(76, 175, 80, 0.4);
  backdrop-filter: blur(10px);
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
        const response = await characterService.getById(character.id);
        if (isError(response) || !response.data?.characterData) {
          if (isError(response)) {
            showError(response.error ?? 'Failed to load character', response.statusCode, response.errorCode);
          }
          newData = character.characterData && typeof character.characterData === 'object'
            ? { ...createDefaultCharacterSheet(), ...character.characterData }
            : { ...createDefaultCharacterSheet(), name: character.name || '', level: character.level || 1 };
        } else {
          newData = { ...createDefaultCharacterSheet(), ...response.data.characterData };
        }
      } else if (character.id === -1) {
        // For newly created characters from generator, always use the provided data
        // This data should persist across modal opens/closes until the character is saved
        newData = character.characterData && typeof character.characterData === 'object'
          ? { ...createDefaultCharacterSheet(), ...character.characterData }
          : { ...createDefaultCharacterSheet(), name: character.name || '', level: character.level || 1 };

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
        let savedCharacter: Character | null = null;

        if (character.id === 0) {
          const response = await characterService.create({
            userId: character.userId || 1, // TODO: Get from auth context
            name: data.name || 'Unnamed Character',
            level: data.level || 1,
            characterData: data,
            isPublic: character.isPublic || false,
          });

          if (isError(response)) {
            showError(response.error ?? 'Failed to create character', response.statusCode, response.errorCode);
            if (!isSilent) {
              setError(response.error ?? 'Failed to create character. Please try again.');
            }
            return;
          }

          savedCharacter = response.data ?? null;
        } else {
          const response = await characterService.updateCharacterSheet(character.id, data);

          if (isError(response)) {
            showError(response.error ?? 'Failed to save character', response.statusCode, response.errorCode);
            if (!isSilent) {
              setError(response.error ?? 'Failed to save character sheet. Please try again.');
            }
            return;
          }

          savedCharacter = response.data ?? null;
        }

        if (!savedCharacter) {
          setError('Save completed but no data returned');
          return;
        }

        if (!isSilent) {
          setSuccess('Saved');
          setTimeout(() => {
            setSuccess(null);
          }, 1000);
        }

        if (character.id === 0 && savedCharacter.id) {
          character.id = savedCharacter.id;
        }

        onSave?.(savedCharacter);
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

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay $isOpen={isOpen} onClick={handleOverlayClick}>
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
