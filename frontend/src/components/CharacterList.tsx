import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import CharacterCard from './CharacterCard';
import { Character, isError } from '../types/api';
import { characterService } from '../services';
import { useApiCall } from '@/hooks/useApiCall';
import { showError } from '@/utils/errorDisplay';
import { logger } from '../utils/logger';

interface CharacterListProps {
  userId?: number;
  showActions?: boolean;
  selectionMode?: boolean;
  onCharacterClick?: (character: Character) => void;
  onCharacterEdit?: (character: Character) => void;
  onCharacterDelete?: (character: Character) => void;
  onCharacterOpenInNewTab?: (character: Character) => void;
}

const BulkActionsBar = styled.div`
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid #333;
  border-radius: 8px;
  padding: 14px 18px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
`;

const BulkActionButton = styled.button<{ variant?: 'danger' | 'primary' }>`
  background: ${props => props.variant === 'danger'
    ? 'rgba(244, 67, 54, 0.15)'
    : 'rgba(212, 175, 55, 0.15)'};
  color: ${props => props.variant === 'danger' ? '#f44336' : '#d4af37'};
  border: 1px solid ${props => props.variant === 'danger' ? '#f44336' : '#d4af37'};
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-left: 8px;

  &:hover {
    background: ${props => props.variant === 'danger'
      ? 'rgba(244, 67, 54, 0.25)'
      : 'rgba(212, 175, 55, 0.25)'};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${props => props.variant === 'danger'
      ? 'rgba(244, 67, 54, 0.3)'
      : 'rgba(212, 175, 55, 0.3)'};
  }

  &:active {
    transform: translateY(0);
  }
`;

const SelectionInfo = styled.span`
  font-weight: 600;
  font-size: 1rem;
  color: #d4af37;
`;

const CharacterList: React.FC<CharacterListProps> = ({
  userId,
  showActions = false,
  selectionMode = false,
  onCharacterClick,
  onCharacterEdit,
  onCharacterDelete,
  onCharacterOpenInNewTab,
}) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacters, setSelectedCharacters] = useState<Set<number>>(new Set());

  const {
    data,
    error,
    isLoading,
    execute: fetchCharacters,
  } = useApiCall(characterService.list, {
    onSuccess: setCharacters,
  });

  useEffect(() => {
    fetchCharacters(userId ? { userId } : {});
  }, [userId, fetchCharacters]);

  useEffect(() => {
    if (data) {
      setCharacters(data);
    }
  }, [data]);

  // Clear selections when exiting selection mode
  useEffect(() => {
    if (!selectionMode) {
      setSelectedCharacters(new Set());
    }
  }, [selectionMode]);

  const handleDelete = async (character: Character) => {
    const response = await characterService.delete(character.id);
    if (isError(response)) {
      showError(response.error ?? 'Failed to delete character', response.statusCode, response.errorCode);
      return;
    }

    setCharacters((prev) => prev.filter((c) => c.id !== character.id));
    onCharacterDelete?.(character);
  };

  const handleSelectCharacter = (characterId: number) => {
    setSelectedCharacters(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(characterId)) {
        newSelected.delete(characterId);
      } else {
        newSelected.add(characterId);
      }
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    if (selectedCharacters.size === characters.length) {
      setSelectedCharacters(new Set());
    } else {
      setSelectedCharacters(new Set(characters.map(c => c.id)));
    }
  };

  const handleBulkDelete = async () => {
    const selectedCount = selectedCharacters.size;
    const confirmMessage = `Are you sure you want to delete ${selectedCount} character${selectedCount > 1 ? 's' : ''}? This action cannot be undone.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    const deletePromises = Array.from(selectedCharacters).map(async (characterId) => {
      const response = await characterService.delete(characterId);
      if (isError(response)) {
        logger.error(`Failed to delete character ${characterId}:`, response.error);
        return { success: false, characterId, error: response.error };
      }
      return { success: true, characterId };
    });

    const results = await Promise.all(deletePromises);
    const successfulDeletes = results.filter(r => r.success).map(r => r.characterId);
    const failedDeletes = results.filter(r => !r.success);

    // Remove successfully deleted characters from state
    setCharacters(prev => prev.filter(c => !successfulDeletes.includes(c.id)));
    setSelectedCharacters(new Set());

    if (failedDeletes.length > 0) {
      showError(
        `Failed to delete ${failedDeletes.length} character${failedDeletes.length > 1 ? 's' : ''}. Check console for details.`
      );
    }
  };

  if (isLoading && characters.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
          color: '#666',
        }}
      >
        <div>Loading characters...</div>
      </div>
    );
  }

  if (error && characters.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
          color: '#f44336',
        }}
      >
        <div>Error: {error}</div>
        <button
          onClick={() => fetchCharacters(userId ? { userId } : {})}
          style={{
            marginTop: '12px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
          color: '#666',
          flexDirection: 'column',
        }}
      >
        <div style={{ fontSize: '18px', marginBottom: '8px' }}>
          No characters found
        </div>
        <div style={{ fontSize: '14px' }}>
          {userId
            ? 'This user has no characters yet.'
            : 'No characters have been created yet.'}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      {/* Bulk Actions Bar */}
      {showActions && selectionMode && (
        <BulkActionsBar>
          <div>
            <BulkActionButton onClick={handleSelectAll}>
              {selectedCharacters.size === characters.length ? 'Deselect All' : 'Select All'}
            </BulkActionButton>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {selectedCharacters.size > 0 && (
              <>
                <SelectionInfo>
                  {selectedCharacters.size} selected
                </SelectionInfo>
                <BulkActionButton variant="danger" onClick={handleBulkDelete}>
                  Delete Selected
                </BulkActionButton>
              </>
            )}
          </div>
        </BulkActionsBar>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px',
          justifyContent: 'center',
        }}
      >
        {characters.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            onClick={
              selectionMode
                ? () => handleSelectCharacter(character.id)
                : onCharacterClick ? () => onCharacterClick(character) : undefined
            }
            onEdit={
              !selectionMode && onCharacterEdit ? () => onCharacterEdit(character) : undefined
            }
            onDelete={showActions && !selectionMode ? () => handleDelete(character) : undefined}
            onOpenInNewTab={
              !selectionMode && onCharacterOpenInNewTab ? () => onCharacterOpenInNewTab(character) : undefined
            }
            showActions={showActions && !selectionMode}
            selectionMode={selectionMode}
            isSelected={selectedCharacters.has(character.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default CharacterList;