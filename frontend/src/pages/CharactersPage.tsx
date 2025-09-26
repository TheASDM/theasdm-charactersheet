import { useState } from 'react';
import styled from 'styled-components';
import { CharacterList, Hero, CharacterSheetModal } from '../components';
import { Character } from '../types/api';

// Import medieval fonts
const FontImport = styled.div`
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:wght@400;600&display=swap');
`;

// Main page container with forest green background (matching other pages)
const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(
    135deg,
    #363636ff 0%,
    #4b4b4bff 25%,
    #323232ff 50%,
    #222222ff 75%,
    #0e0e0eff 100%
  );
  padding: 0;
  font-family: 'Crimson Text', serif;
`;

// Content wrapper
const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
`;

// Main container that holds everything below the hero (matching other pages)
const MainContainer = styled.div`
  background: linear-gradient(
    145deg,
    rgba(90, 58, 42, 0.8),
    rgba(74, 42, 26, 0.8)
  );
  border: 2px solid #8b6914;
  border-radius: 20px 20px 15px 15px;
  margin: 0 20px;
  margin-top: -5px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3), 0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(139, 105, 20, 0.3);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);

  /* Medieval parchment texture */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><filter id="paper"><feTurbulence baseFrequency="0.02" numOctaves="3" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="0.8"/></filter></defs><rect width="100" height="100" fill="rgba(101,67,33,0.1)" filter="url(%23paper)"/></svg>')
      repeat;
    opacity: 0.6;
    pointer-events: none;
    z-index: 1;
  }

  @media (max-width: 768px) {
    margin: 0 10px;
    margin-top: -2px;
  }

  @media (max-width: 480px) {
    margin: 0 5px;
    margin-top: -2px;
  }
`;

// Content inside the main container
const MainContent = styled.div`
  position: relative;
  z-index: 2;
  padding: 30px;

  @media (max-width: 768px) {
    padding: 20px;
  }

  @media (max-width: 480px) {
    padding: 15px;
  }
`;

const ActionButtonContainer = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  padding: 20px;
  background: linear-gradient(145deg, #f4e7d1, #e8d5b7);
  border: 3px solid #8b6914;
  border-radius: 15px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
`;

const ActionButton = styled.button`
  background: linear-gradient(145deg, #d4af37, #b8941f);
  color: #2c1810;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Cinzel', serif;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);

  &:hover {
    background: linear-gradient(145deg, #b8941f, #a0801b);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

const CharactersPage: React.FC = () => {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null
  );
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);

  const handleCharacterClick = (character: Character) => {
    console.log('Character clicked:', character);
    setSelectedCharacter(character);
    setIsSheetModalOpen(true);
  };

  const handleCharacterEdit = (character: Character) => {
    console.log('Edit character:', character);
    setSelectedCharacter(character);
    setIsSheetModalOpen(true);
  };

  const handleCharacterDelete = (character: Character) => {
    console.log('Character deleted:', character);
    // Character is already deleted by CharacterList component
  };

  const handleCloseSheetModal = () => {
    setIsSheetModalOpen(false);
    setSelectedCharacter(null);
  };

  const handleSheetSave = (updatedCharacter: Character) => {
    console.log('Character sheet updated:', updatedCharacter);
    // The character list will refresh automatically
  };

  const handleCreateNewCharacter = () => {
    // Create a basic character for the sheet
    const newCharacter: Character = {
      id: 0, // Will be assigned by backend
      userId: 1, // TODO: Get from auth context
      name: '',
      level: 1,
      characterData: {},
      isPublic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSelectedCharacter(newCharacter);
    setIsSheetModalOpen(true);
  };

  return (
    <>
      <FontImport />
      <PageContainer>
        <ContentContainer>
          <Hero
            title="D&D CHARACTERS"
            subtitle="Manage Your Heroes"
            height="280px"
          />

          <MainContainer>
            <MainContent>
              <ActionButtonContainer>
                <ActionButton onClick={handleCreateNewCharacter}>
                  ⚔️ Create New Hero
                </ActionButton>
              </ActionButtonContainer>

              <CharacterList
                showActions={true}
                onCharacterClick={handleCharacterClick}
                onCharacterEdit={handleCharacterEdit}
                onCharacterDelete={handleCharacterDelete}
              />
            </MainContent>
          </MainContainer>
        </ContentContainer>
      </PageContainer>

      <CharacterSheetModal
        isOpen={isSheetModalOpen}
        onClose={handleCloseSheetModal}
        {...(selectedCharacter ? { character: selectedCharacter } : {})}
        onSave={handleSheetSave}
      />
    </>
  );
};

export default CharactersPage;
