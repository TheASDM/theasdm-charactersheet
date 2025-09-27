import { useState } from 'react';
import styled from 'styled-components';
import { Hero } from '../components';
import CharacterSheetPretty from '../components/CharacterSheetPretty';
import {
  CharacterSheetData,
  createDefaultCharacterSheet,
} from '../types/characterSheet';
import { useUser } from '../contexts/UserContext';

// Import medieval fonts
const FontImport = styled.div`
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:wght@400;600&display=swap');
`;

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

const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
`;

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

const MainContent = styled.div`
  position: relative;
  z-index: 2;
  padding: 30px;

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const GeneratorControls = styled.div`
  background: rgba(139, 105, 20, 0.1);
  border: 2px solid #8b6914;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  text-align: center;
`;

const ControlsTitle = styled.h3`
  color: #8b6914;
  font-family: 'Cinzel', serif;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 20px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
`;




const StatusMessage = styled.div<{ type: 'success' | 'error' | 'info' }>`
  padding: 10px 15px;
  border-radius: 5px;
  margin: 15px 0;
  font-family: 'Crimson Text', serif;
  font-weight: 600;

  ${props => props.type === 'success' && `
    background: rgba(34, 139, 34, 0.2);
    color: #228B22;
    border: 1px solid #228B22;
  `}

  ${props => props.type === 'error' && `
    background: rgba(220, 53, 69, 0.2);
    color: #dc3545;
    border: 1px solid #dc3545;
  `}

  ${props => props.type === 'info' && `
    background: rgba(139, 105, 20, 0.2);
    color: #8b6914;
    border: 1px solid #8b6914;
  `}
`;



const CharacterGeneratorPage: React.FC = () => {
  const { user, loading: userLoading } = useUser();
  const [character, setCharacter] = useState<CharacterSheetData>(() =>
    createDefaultCharacterSheet()
  );
  const [statusMessage, setStatusMessage] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);


  const saveCharacter = async () => {
    if (!user) {
      setStatusMessage({
        message: 'No user found. Please refresh the page.',
        type: 'error'
      });
      return;
    }

    if (!character.name || character.name.trim() === '') {
      setStatusMessage({
        message: 'Please generate a character first!',
        type: 'error'
      });
      return;
    }

    setStatusMessage({ message: 'Saving character...', type: 'info' });

    try {
      console.log('💾 Saving character for user:', user.id, user.username);
      console.log('🎭 Character data:', {
        name: character.name,
        level: character.level,
        species: character.species,
        class: character.class
      });

      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          name: character.name.trim(),
          level: character.level,
          characterData: character,
          isPublic: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to save character: ${response.statusText} ${errorData.error || ''}`);
      }

      const savedCharacter = await response.json();
      console.log('✅ Character saved successfully:', savedCharacter.id);

      setStatusMessage({
        message: `💾 Successfully saved "${character.name}" (ID: ${savedCharacter.id})! Check the Characters page to see it.`,
        type: 'success'
      });

    } catch (error) {
      console.error('❌ Error saving character:', error);
      setStatusMessage({
        message: `Failed to save character: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
    }
  };

  const handleCharacterUpdate = (updatedCharacter: CharacterSheetData) => {
    setCharacter(updatedCharacter);
  };

  // Show loading state while user is being initialized
  if (userLoading) {
    return (
      <>
        <FontImport />
        <PageContainer>
          <ContentContainer>
            <Hero
              title="CHARACTER GENERATOR"
              subtitle="Initializing user..."
              height="280px"
            />
            <MainContainer>
              <MainContent>
                <GeneratorControls>
                  <ControlsTitle>🔄 Loading User...</ControlsTitle>
                </GeneratorControls>
              </MainContent>
            </MainContainer>
          </ContentContainer>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <FontImport />
      <PageContainer>
        <ContentContainer>
          <Hero
            title="CHARACTER GENERATOR"
            subtitle="Create Random D&D 2024 Heroes"
            height="280px"
          />

          <MainContainer>
            <MainContent>
              <GeneratorControls>
                <ControlsTitle>⚔️ Create Character</ControlsTitle>
                {user && (
                  <div style={{
                    fontSize: '0.9rem',
                    color: '#8b6914',
                    marginBottom: '15px',
                    textAlign: 'center'
                  }}>
                    👤 Playing as: <strong>{user.username}</strong>
                  </div>
                )}
                <div style={{
                  fontSize: '0.9rem',
                  color: '#f4e7d1',
                  textAlign: 'center',
                  lineHeight: '1.4',
                  marginBottom: '20px'
                }}>
                  Build your D&D 2024 character by selecting species, class, background, and skills below.
                </div>

                {statusMessage && (
                  <StatusMessage type={statusMessage.type}>
                    {statusMessage.message}
                  </StatusMessage>
                )}
              </GeneratorControls>

              <CharacterSheetPretty
                character={character}
                onUpdate={handleCharacterUpdate}
                onSave={saveCharacter}
                initialEditMode={{
                  characterInfo: true
                }}
              />
            </MainContent>
          </MainContainer>
        </ContentContainer>
      </PageContainer>
    </>
  );
};

export default CharacterGeneratorPage;