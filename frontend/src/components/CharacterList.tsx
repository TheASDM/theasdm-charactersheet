import React, { useState, useEffect } from 'react';
import CharacterCard from './CharacterCard';
import { Character } from '../types/api';
import { characterService } from '../services';

interface CharacterListProps {
  userId?: number;
  showActions?: boolean;
  onCharacterClick?: (character: Character) => void;
  onCharacterEdit?: (character: Character) => void;
  onCharacterDelete?: (character: Character) => void;
}

const CharacterList: React.FC<CharacterListProps> = ({
  userId,
  showActions = false,
  onCharacterClick,
  onCharacterEdit,
  onCharacterDelete,
}) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCharacters();
  }, [userId]);

  const loadCharacters = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await characterService.getAll(userId);

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setCharacters(response.data);
      }
    } catch (err) {
      setError('Failed to load characters');
      console.error('Error loading characters:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (character: Character) => {
    try {
      const response = await characterService.delete(character.id);

      if (response.error) {
        alert(`Failed to delete character: ${response.error}`);
      } else {
        // Remove character from local state
        setCharacters((prev) => prev.filter((c) => c.id !== character.id));
        if (onCharacterDelete) {
          onCharacterDelete(character);
        }
      }
    } catch (err) {
      alert('Failed to delete character');
      console.error('Error deleting character:', err);
    }
  };

  if (loading) {
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

  if (error) {
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
          onClick={loadCharacters}
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
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '16px',
        }}
      >
        {characters.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            onClick={
              onCharacterClick ? () => onCharacterClick(character) : undefined
            }
            onEdit={
              onCharacterEdit ? () => onCharacterEdit(character) : undefined
            }
            onDelete={showActions ? () => handleDelete(character) : undefined}
            showActions={showActions}
          />
        ))}
      </div>
    </div>
  );
};

export default CharacterList;
