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
  selectionMode?: boolean;
  isSelected?: boolean;
}

// Character card container (matching new black theme)
const Card = styled.div<{ $clickable?: boolean; $hasActions?: boolean; $selectionMode?: boolean; $isSelected?: boolean }>`
  background: ${props => props.$isSelected
    ? 'rgba(212, 175, 55, 0.15)'
    : 'rgba(255, 255, 255, 0.03)'};
  border: 2px solid ${props => props.$isSelected ? '#d4af37' : '#333'};
  border-radius: 12px;
  box-shadow: ${props => props.$isSelected
    ? '0 6px 20px rgba(212, 175, 55, 0.3)'
    : '0 4px 12px rgba(0, 0, 0, 0.5)'};
  margin: 0;
  overflow: hidden;
  position: relative;
  transition: all 0.3s ease;
  cursor: ${props => props.$clickable || props.$selectionMode ? 'pointer' : 'default'};
  height: ${props => props.$hasActions ? '280px' : '240px'};
  display: flex;
  flex-direction: column;
  transform: ${props => props.$isSelected ? 'translateY(-2px)' : 'none'};
  backdrop-filter: blur(10px);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(212, 175, 55, 0.2);
    border-color: #d4af37;
    background: rgba(255, 255, 255, 0.05);
  }
`;

const SelectionIndicator = styled.div<{ $isSelected: boolean }>`
  position: absolute;
  bottom: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  border: 2px solid #d4af37;
  border-radius: 50%;
  background: ${props => props.$isSelected ? '#d4af37' : 'rgba(26, 26, 26, 0.9)'};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);

  &::after {
    content: '✓';
    color: ${props => props.$isSelected ? '#1a1a1a' : '#d4af37'};
    font-weight: bold;
    font-size: 16px;
    opacity: ${props => props.$isSelected ? 1 : 0.3};
    transition: opacity 0.3s ease;
  }
`;

const CharacterHeader = styled.div`
  background: linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(15, 15, 15, 0.95) 100%);
  border-bottom: 1px solid #333;
  padding: 16px;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 70px;

  @media (max-width: 480px) {
    padding: 14px;
    min-height: 60px;
  }
`;

const CharacterNameContainer = styled.div`
  flex: 1;
  margin-right: 12px;
  display: flex;
  align-items: center;
`;

const CharacterName = styled.h3<{ $nameLength: number }>`
  margin: 0;
  font-size: ${props => {
    if (props.$nameLength > 25) return '1rem';
    if (props.$nameLength > 20) return '1.1rem';
    if (props.$nameLength > 15) return '1.2rem';
    return '1.3rem';
  }};
  font-weight: 700;
  color: #d4af37;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  line-height: 1.3;
  word-break: break-word;

  @media (max-width: 480px) {
    font-size: ${props => {
      if (props.$nameLength > 25) return '0.9rem';
      if (props.$nameLength > 20) return '1rem';
      return '1.1rem';
    }};
  }
`;

const PrivacyTag = styled.span<{ $isPublic: boolean }>`
  background: ${props => props.$isPublic
    ? 'rgba(76, 175, 80, 0.2)'
    : 'rgba(255, 152, 0, 0.2)'};
  color: ${props => props.$isPublic ? '#4CAF50' : '#ff9800'};
  border: 1px solid ${props => props.$isPublic ? '#4CAF50' : '#ff9800'};
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
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
  color: #e0e0e0;
  font-size: 0.95rem;
  line-height: 1.5;

  strong {
    color: #d4af37;
    font-weight: 700;
  }
`;

const MetaInfo = styled.div<{ $hasActions?: boolean }>`
  margin-bottom: ${props => props.$hasActions ? '12px' : '0'};
  margin-top: auto;
`;

const CreatedBy = styled.div`
  font-size: 0.8rem;
  color: #888;
  font-style: italic;
  margin-bottom: 4px;
`;

const LastUpdated = styled.div`
  font-size: 0.75rem;
  color: #666;
  font-style: italic;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #333;
`;

const ActionButton = styled.button<{ $variant: 'edit' | 'delete' | 'open' }>`
  background: ${props => {
    if (props.$variant === 'edit') return 'rgba(33, 150, 243, 0.15)';
    if (props.$variant === 'delete') return 'rgba(244, 67, 54, 0.15)';
    return 'rgba(212, 175, 55, 0.15)';
  }};
  color: ${props => {
    if (props.$variant === 'edit') return '#2196F3';
    if (props.$variant === 'delete') return '#f44336';
    return '#d4af37';
  }};
  border: 1px solid ${props => {
    if (props.$variant === 'edit') return '#2196F3';
    if (props.$variant === 'delete') return '#f44336';
    return '#d4af37';
  }};
  padding: 8px 14px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  font-size: 0.75rem;
  text-align: center;
  line-height: 1.2;

  &:hover {
    background: ${props => {
      if (props.$variant === 'edit') return 'rgba(33, 150, 243, 0.25)';
      if (props.$variant === 'delete') return 'rgba(244, 67, 54, 0.25)';
      return 'rgba(212, 175, 55, 0.25)';
    }};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${props => {
      if (props.$variant === 'edit') return 'rgba(33, 150, 243, 0.3)';
      if (props.$variant === 'delete') return 'rgba(244, 67, 54, 0.3)';
      return 'rgba(212, 175, 55, 0.3)';
    }};
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
  selectionMode = false,
  isSelected = false,
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
    <Card
      $clickable={!!onClick}
      $hasActions={showActions}
      $selectionMode={selectionMode}
      $isSelected={isSelected}
      onClick={handleCardClick}
    >
      <CharacterHeader>
        <CharacterNameContainer>
          <CharacterName $nameLength={character.name.length}>
            {character.name}
          </CharacterName>
        </CharacterNameContainer>
        <PrivacyTag $isPublic={character.isPublic}>
          {character.isPublic ? 'Public' : 'Private'}
        </PrivacyTag>
      </CharacterHeader>

      <CharacterContent>
        <CharacterInfo>
          <InfoRow>
            <>
              <strong>Level {character.level}</strong> {species} {characterClass}
            </>
          </InfoRow>
          {character.campaign && (
            <InfoRow>
              Campaign: {character.campaign.name}
            </InfoRow>
          )}
        </CharacterInfo>

        <MetaInfo $hasActions={showActions}>
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
              <ActionButton $variant="open" onClick={handleOpenInNewTab}>
                Open Tab
              </ActionButton>
            )}
            {onEdit && (
              <ActionButton $variant="edit" onClick={handleEdit}>
                Edit
              </ActionButton>
            )}
            {onDelete && (
              <ActionButton $variant="delete" onClick={handleDelete}>
                Delete
              </ActionButton>
            )}
          </ActionButtons>
        )}
      </CharacterContent>

      {selectionMode && (
        <SelectionIndicator $isSelected={isSelected} />
      )}
    </Card>
  );
};

export default CharacterCard;
