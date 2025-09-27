import React from 'react';
import styled from 'styled-components';
import { Character } from '../types/api';

interface CharacterCardProps {
  character: Character;
  onClick?: (() => void) | undefined;
  onEdit?: (() => void) | undefined;
  onDelete?: (() => void) | undefined;
  onOpenInNewTab?: (() => void) | undefined;
  showActions?: boolean;
}

// Character card container (matching medieval theme)
const Card = styled.div<{ clickable?: boolean; hasActions?: boolean }>`
  background: linear-gradient(145deg, #f4e7d1, #e8d5b7);
  border: 2px solid #8b6914;
  border-radius: 10px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.3);
  font-family: 'Crimson Text', serif;
  margin: 8px;
  overflow: hidden;
  position: relative;
  color: #2c1810;
  transition: all 0.3s ease;
  cursor: ${props => props.clickable ? 'pointer' : 'default'};
  will-change: transform;
  contain: layout style paint;
  height: ${props => props.hasActions ? '240px' : '200px'};
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
    border-color: #d4af37;
  }
`;

const CharacterHeader = styled.div`
  background: linear-gradient(
    145deg,
    rgba(90, 58, 42, 0.9),
    rgba(74, 42, 26, 0.9)
  );
  color: #d4af37;
  padding: 12px 16px;
  border-bottom: 2px solid #8b6914;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  min-height: 60px;

  @media (max-width: 480px) {
    padding: 10px 14px;
    height: 50px;
    min-height: 50px;
  }
`;

const CharacterNameContainer = styled.div`
  flex: 1;
  margin-right: 8px;
  display: flex;
  align-items: center;
`;

const CharacterName = styled.h3<{ nameLength: number }>`
  margin: 0;
  font-size: ${props => {
    if (props.nameLength > 25) return '0.9rem';
    if (props.nameLength > 20) return '1.0rem';
    if (props.nameLength > 15) return '1.1rem';
    if (props.nameLength > 10) return '1.2rem';
    return '1.3rem';
  }};
  font-weight: 700;
  color: #d4af37;
  font-family: 'Cinzel', serif;
  letter-spacing: 0.5px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  line-height: 1.2;
  word-break: break-word;
  hyphens: auto;

  @media (max-width: 480px) {
    font-size: ${props => {
      if (props.nameLength > 25) return '0.8rem';
      if (props.nameLength > 20) return '0.9rem';
      if (props.nameLength > 15) return '1.0rem';
      if (props.nameLength > 10) return '1.1rem';
      return '1.2rem';
    }};
  }
`;

const PrivacyTag = styled.span<{ isPublic: boolean }>`
  background: linear-gradient(
    145deg,
    ${props => props.isPublic ? '#4CAF50' : '#ff9800'},
    ${props => props.isPublic ? '#388E3C' : '#f57c00'}
  );
  color: white;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 600;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  font-family: 'Cinzel', serif;
  letter-spacing: 0.5px;
  text-transform: uppercase;
`;

const CharacterContent = styled.div`
  padding: 16px;
  background: transparent;
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: space-between;
`;

const CharacterInfo = styled.div`
  margin-bottom: 12px;
  flex: 1;
`;

const InfoRow = styled.p`
  margin: 4px 0;
  color: #2c1810;
  font-size: 0.9rem;
  line-height: 1.4;

  strong {
    color: #8b6914;
    font-weight: 700;
    font-family: 'Cinzel', serif;
  }
`;

const MetaInfo = styled.div<{ hasActions?: boolean }>`
  margin-bottom: ${props => props.hasActions ? '12px' : '0'};
  margin-top: auto;
`;

const CreatedBy = styled.div`
  font-size: 0.8rem;
  color: #6d5411;
  font-style: italic;
  margin-bottom: 4px;
`;

const LastUpdated = styled.div`
  font-size: 0.75rem;
  color: #6d5411;
  font-style: italic;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 2px solid rgba(139, 105, 20, 0.2);
`;

const ActionButton = styled.button<{ variant: 'edit' | 'delete' | 'open' }>`
  background: linear-gradient(
    145deg,
    ${props => {
      if (props.variant === 'edit') return '#2196F3';
      if (props.variant === 'delete') return '#f44336';
      return '#8b6914'; // open button
    }},
    ${props => {
      if (props.variant === 'edit') return '#1976D2';
      if (props.variant === 'delete') return '#d32f2f';
      return '#6d5411'; // open button
    }}
  );
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  font-size: 0.75rem;
  text-align: center;
  line-height: 1.2;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  onClick,
  onEdit,
  onDelete,
  onOpenInNewTab,
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

  const handleOpenInNewTab = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenInNewTab) {
      onOpenInNewTab();
    }
  };

  // Extract character data for display
  const characterData = character.characterData || {};
  const species = characterData.species || 'Unknown';
  const characterClass = characterData.class || 'Unknown';

  return (
    <Card clickable={!!onClick} hasActions={showActions} onClick={handleCardClick}>
      <CharacterHeader>
        <CharacterNameContainer>
          <CharacterName nameLength={character.name.length}>
            {character.name}
          </CharacterName>
        </CharacterNameContainer>
        <PrivacyTag isPublic={character.isPublic}>
          {character.isPublic ? 'Public' : 'Private'}
        </PrivacyTag>
      </CharacterHeader>

      <CharacterContent>
        <CharacterInfo>
          <InfoRow>
            <strong>Level {character.level}</strong> {species} {characterClass}
          </InfoRow>
          {character.campaign && (
            <InfoRow>
              Campaign: {character.campaign.name}
            </InfoRow>
          )}
        </CharacterInfo>

        <MetaInfo hasActions={showActions}>
          <CreatedBy>
            Created by: {character.user?.username || 'Unknown'}
          </CreatedBy>
          <LastUpdated>
            Last updated: {new Date(character.updatedAt).toLocaleDateString()}
          </LastUpdated>
        </MetaInfo>

        {showActions && (
          <ActionButtons>
            {onOpenInNewTab && (
              <ActionButton variant="open" onClick={handleOpenInNewTab}>
                Open Tab
              </ActionButton>
            )}
            {onEdit && (
              <ActionButton variant="edit" onClick={handleEdit}>
                Edit
              </ActionButton>
            )}
            {onDelete && (
              <ActionButton variant="delete" onClick={handleDelete}>
                Delete
              </ActionButton>
            )}
          </ActionButtons>
        )}
      </CharacterContent>
    </Card>
  );
};

export default CharacterCard;
