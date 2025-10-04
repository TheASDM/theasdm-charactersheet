import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { CharacterList, CharacterSheetModal } from '../components';
import { Character } from '../types/api';

// Main page container with black background (matching new design)
const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

// Content wrapper
const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

// Header section
const Header = styled.div`
  margin-bottom: 2rem;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: #d4af37;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.125rem;
  color: #b0b0b0;
  margin: 0;
`;

// Action buttons section
const ActionButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  background: ${props => props.variant === 'secondary'
    ? 'rgba(255, 255, 255, 0.05)'
    : 'linear-gradient(135deg, #d4af37 0%, #b8941f 100%)'};
  color: ${props => props.variant === 'secondary' ? '#d4af37' : '#1a1a1a'};
  border: ${props => props.variant === 'secondary' ? '1px solid #333' : 'none'};
  padding: 0.875rem 1.75rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background: ${props => props.variant === 'secondary'
      ? 'rgba(255, 255, 255, 0.08)'
      : 'linear-gradient(135deg, #b8941f 0%, #a0801b 100%)'};
    transform: translateY(-2px);
    box-shadow: 0 6px 16px ${props => props.variant === 'secondary'
      ? 'rgba(212, 175, 55, 0.2)'
      : 'rgba(212, 175, 55, 0.4)'};
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    padding: 0.75rem 1.5rem;
    font-size: 0.9rem;
  }
`;

const CharactersPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null
  );
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);

  const handleCharacterClick = (character: Character) => {
    setSelectedCharacter(character);
    setIsSheetModalOpen(true);
  };

  const handleCharacterEdit = (character: Character) => {
    setSelectedCharacter(character);
    setIsSheetModalOpen(true);
  };

  const handleCharacterDelete = (_character: Character) => {
    // Character is already deleted by CharacterList component
  };

  const handleCharacterOpenInNewTab = (character: Character) => {
    const url = `/characters/${character.id}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCloseSheetModal = () => {
    setIsSheetModalOpen(false);
    setSelectedCharacter(null);
  };

  const handleSheetSave = (_updatedCharacter: Character) => {
    // The character list will refresh automatically
  };

  const handleCreateNewCharacter = () => {
    navigate('/generator');
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
  };

  return (
    <PageContainer>
      <ContentContainer>
        <Header>
          <Title>Your Characters</Title>
          <Subtitle>Manage your heroes and their adventures</Subtitle>
        </Header>

        <ActionButtonContainer>
          <ActionButton onClick={handleCreateNewCharacter}>
            <span>⚔</span>
            Create New Hero
          </ActionButton>
          <ActionButton variant="secondary" onClick={toggleSelectionMode}>
            <span>{selectionMode ? '✕' : '☑'}</span>
            {selectionMode ? 'Exit Selection' : 'Select Multiple'}
          </ActionButton>
        </ActionButtonContainer>

        <CharacterList
          showActions={true}
          selectionMode={selectionMode}
          onCharacterClick={handleCharacterClick}
          onCharacterEdit={handleCharacterEdit}
          onCharacterDelete={handleCharacterDelete}
          onCharacterOpenInNewTab={handleCharacterOpenInNewTab}
        />
      </ContentContainer>

      <CharacterSheetModal
        isOpen={isSheetModalOpen}
        onClose={handleCloseSheetModal}
        {...(selectedCharacter ? { character: selectedCharacter } : {})}
        onSave={handleSheetSave}
      />
    </PageContainer>
  );
};

export default CharactersPage;
