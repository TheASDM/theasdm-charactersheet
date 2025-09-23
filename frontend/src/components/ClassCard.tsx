import React from 'react';
import { CharacterClass } from '../types/api';

interface ClassCardProps {
  characterClass: CharacterClass;
  onLevelsClick?: () => void;
  onDetailsClick?: () => void;
  compact?: boolean;
}

const ClassCard: React.FC<ClassCardProps> = ({
  characterClass,
  onLevelsClick,
  onDetailsClick,
  compact = false,
}) => {
  const handleLevelsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLevelsClick) onLevelsClick();
  };

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDetailsClick) onDetailsClick();
  };

  // Helper function to format primary abilities
  const formatPrimaryAbilities = (abilities: string[]): string => {
    if (!abilities || abilities.length === 0) return 'None';
    return abilities.join(' or ');
  };

  // Helper function to format saving throws
  const formatSavingThrows = (saves: string[]): string => {
    if (!saves || saves.length === 0) return 'None';
    return saves.join(', ');
  };

  // Helper function to get subclass count
  const getSubclassCount = (): number => {
    // Check subclassFeatures instead of subclasses
    if (!characterClass.subclassFeatures) return 0;
    if (
      typeof characterClass.subclassFeatures === 'object' &&
      characterClass.subclassFeatures !== null
    ) {
      return Object.keys(characterClass.subclassFeatures).length;
    }
    return 0;
  };

  return (
    <div
      style={{
        backgroundColor: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: compact ? '12px' : '16px',
        transition: 'all 0.2s ease',
        height: compact ? 'auto' : '240px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      {/* Class Name */}
      <h3
        style={{
          margin: '0 0 8px 0',
          fontSize: compact ? '16px' : '18px',
          fontWeight: 'bold',
          color: '#8B5A2B',
          fontFamily: '"Cinzel", serif',
        }}
      >
        {characterClass.name}
      </h3>

      {/* Hit Die and Subclass Count */}
      <div
        style={{
          fontSize: '14px',
          color: '#666',
          marginBottom: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <span>
          <strong>Hit Die:</strong> d{characterClass.hitDie}
        </span>
        <span>
          <strong>Subclasses:</strong> {getSubclassCount()}
        </span>
      </div>

      {/* Primary Ability */}
      <div
        style={{
          fontSize: '12px',
          color: '#666',
          marginBottom: '8px',
        }}
      >
        <strong>Primary:</strong>{' '}
        {formatPrimaryAbilities(characterClass.primaryAbility)}
      </div>

      {/* Saving Throws */}
      <div
        style={{
          fontSize: '12px',
          color: '#666',
          marginBottom: '12px',
        }}
      >
        <strong>Saves:</strong>{' '}
        {formatSavingThrows(characterClass.savingThrowProficiencies)}
      </div>

      {/* Spellcaster Badge */}
      {characterClass.spellcastingAbility && (
        <div
          style={{
            display: 'inline-block',
            backgroundColor: '#e3f2fd',
            color: '#1976d2',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '500',
            marginBottom: '8px',
            alignSelf: 'flex-start',
          }}
        >
          {characterClass.spellcastingAbility} Caster
        </div>
      )}

      {/* Action Buttons */}
      {(onLevelsClick || onDetailsClick) && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginTop: 'auto',
            paddingTop: '12px',
          }}
        >
          {onLevelsClick && (
            <button
              onClick={handleLevelsClick}
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: '500',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1976D2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2196F3';
              }}
            >
              📊 Levels Table
            </button>
          )}
          {onDetailsClick && (
            <button
              onClick={handleDetailsClick}
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: '500',
                backgroundColor: '#8B5A2B',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#7A4A1F';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#8B5A2B';
              }}
            >
              📖 Full Details
            </button>
          )}
        </div>
      )}

      {/* Source Information */}
      {!compact &&
        characterClass.source &&
        !(onLevelsClick || onDetailsClick) && (
          <div
            style={{
              fontSize: '11px',
              color: '#999',
              marginTop: 'auto',
            }}
          >
            Source: {characterClass.source}
            {characterClass.page ? `, p. ${characterClass.page}` : ''}
          </div>
        )}
    </div>
  );
};

export default ClassCard;
