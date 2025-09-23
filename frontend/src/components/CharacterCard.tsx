import React from 'react';
import { Character } from '../types/api';

interface CharacterCardProps {
  character: Character;
  onClick?: (() => void) | undefined;
  onEdit?: (() => void) | undefined;
  onDelete?: (() => void) | undefined;
  showActions?: boolean;
}

const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  onClick,
  onEdit,
  onDelete,
  showActions = false,
}) => {
  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onClick) onClick();
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      onDelete &&
      window.confirm('Are you sure you want to delete this character?')
    ) {
      onDelete();
    }
  };

  // Extract character data for display
  const characterData = character.characterData || {};
  const species = characterData.species || 'Unknown';
  const characterClass = characterData.class || 'Unknown';

  return (
    <div
      className={`character-card ${onClick ? 'clickable' : ''}`}
      onClick={handleCardClick}
      style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '16px',
        margin: '8px',
        backgroundColor: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s ease',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          (e.currentTarget as HTMLElement).style.boxShadow =
            '0 4px 8px rgba(0,0,0,0.2)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          (e.currentTarget as HTMLElement).style.boxShadow =
            '0 2px 4px rgba(0,0,0,0.1)';
        }
      }}
    >
      {/* Character Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <h3
          style={{
            margin: '0',
            color: '#333',
            fontSize: '18px',
            fontWeight: 'bold',
          }}
        >
          {character.name}
        </h3>
        <span
          style={{
            backgroundColor: character.isPublic ? '#4CAF50' : '#ff9800',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
        >
          {character.isPublic ? 'Public' : 'Private'}
        </span>
      </div>

      {/* Character Info */}
      <div style={{ marginBottom: '8px' }}>
        <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
          <strong>Level {character.level}</strong> {species} {characterClass}
        </p>
        {character.campaign && (
          <p style={{ margin: '4px 0', color: '#666', fontSize: '12px' }}>
            Campaign: {character.campaign.name}
          </p>
        )}
        <p style={{ margin: '4px 0', color: '#888', fontSize: '12px' }}>
          Created by: {character.user?.username || 'Unknown'}
        </p>
      </div>

      {/* Last Updated */}
      <div
        style={{
          fontSize: '11px',
          color: '#999',
          marginBottom: showActions ? '8px' : '0',
        }}
      >
        Last updated: {new Date(character.updatedAt).toLocaleDateString()}
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginTop: '12px',
            borderTop: '1px solid #eee',
            paddingTop: '8px',
          }}
        >
          {onEdit && (
            <button
              onClick={handleEdit}
              style={{
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                padding: '4px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              style={{
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                padding: '4px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CharacterCard;
