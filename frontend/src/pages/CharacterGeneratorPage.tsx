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

const ButtonGroup = styled.div`
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
`;

const GenerateButton = styled.button`
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

  &:hover:not(:disabled) {
    background: linear-gradient(145deg, #b8941f, #a0801b);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const SaveButton = styled(GenerateButton)`
  background: linear-gradient(145deg, #228B22, #1a6b1a);

  &:hover:not(:disabled) {
    background: linear-gradient(145deg, #1a6b1a, #0f4f0f);
    box-shadow: 0 6px 20px rgba(34, 139, 34, 0.4);
  }
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

const SourceInfo = styled.div`
  background: rgba(139, 105, 20, 0.1);
  border: 2px solid #8b6914;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 20px;
  font-size: 0.9rem;
  color: #8b6914;

  h4 {
    font-family: 'Cinzel', serif;
    font-size: 1rem;
    margin: 0 0 10px 0;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .source-item {
    margin: 5px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .source-name {
    font-weight: 600;
  }

  .source-details {
    font-size: 0.8rem;
    opacity: 0.8;
  }
`;

interface GeneratedCharacterResponse {
  character: CharacterSheetData;
  sources: {
    species: any;
    class: any;
    background: any;
    feat: any;
    spells: any[];
    items: any[];
    indices: any;
    counts: any;
  };
  generated: string;
}

const CharacterGeneratorPage: React.FC = () => {
  const { user, loading: userLoading } = useUser();
  const [character, setCharacter] = useState<CharacterSheetData>(() =>
    createDefaultCharacterSheet()
  );
  const [sourceInfo, setSourceInfo] = useState<GeneratedCharacterResponse['sources'] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const generateRandomCharacter = async () => {
    setIsGenerating(true);
    setStatusMessage({ message: 'Generating random character...', type: 'info' });

    try {
      const response = await fetch('/api/generator/random', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode: 'random' }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate character: ${response.statusText}`);
      }

      const data: GeneratedCharacterResponse = await response.json();

      // Debug log to see what we received
      console.log('🎲 Generated character data:', data.character);
      console.log('🎯 Character keys:', Object.keys(data.character));
      console.log('🧙‍♂️ Name:', data.character.name);
      console.log('⚔️ Class:', data.character.class);
      console.log('🐉 Species:', data.character.species);

      setCharacter(data.character);
      setSourceInfo(data.sources);
      setStatusMessage({
        message: `✨ Generated ${data.character.name}, a Level ${data.character.level} ${data.character.species} ${data.character.class}!`,
        type: 'success'
      });

    } catch (error) {
      console.error('Error generating character:', error);
      setStatusMessage({
        message: `Failed to generate character: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
    } finally {
      setIsGenerating(false);
    }
  };

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
                <ControlsTitle>🎲 Character Generator</ControlsTitle>
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
                <ButtonGroup>
                  <GenerateButton
                    onClick={generateRandomCharacter}
                    disabled={isGenerating}
                  >
                    {isGenerating ? '⚡ Generating...' : '🎲 Generate Random Hero'}
                  </GenerateButton>
                  {character.name && (
                    <SaveButton onClick={saveCharacter}>
                      💾 Save Character
                    </SaveButton>
                  )}
                </ButtonGroup>

                {statusMessage && (
                  <StatusMessage type={statusMessage.type}>
                    {statusMessage.message}
                  </StatusMessage>
                )}
              </GeneratorControls>

              {sourceInfo && (
                <SourceInfo>
                  <h4>📚 Generated From Database</h4>
                  <div className="source-item">
                    <span className="source-name">Species:</span>
                    <span className="source-details">
                      {sourceInfo.species?.name} ({sourceInfo.species?.source})
                    </span>
                  </div>
                  <div className="source-item">
                    <span className="source-name">Class:</span>
                    <span className="source-details">
                      {sourceInfo.class?.name} (d{sourceInfo.class?.hitDie} HD)
                    </span>
                  </div>
                  <div className="source-item">
                    <span className="source-name">Background:</span>
                    <span className="source-details">
                      {sourceInfo.background?.name}
                    </span>
                  </div>
                  <div className="source-item">
                    <span className="source-name">Feat:</span>
                    <span className="source-details">
                      {sourceInfo.feat?.name} ({sourceInfo.feat?.category})
                    </span>
                  </div>
                  <div className="source-item">
                    <span className="source-name">Database:</span>
                    <span className="source-details">
                      {sourceInfo.counts?.spellCount} spells, {sourceInfo.counts?.itemCount} items,
                      {sourceInfo.counts?.featCount} feats available
                    </span>
                  </div>
                </SourceInfo>
              )}

              <CharacterSheetPretty
                character={character}
                onUpdate={handleCharacterUpdate}
                onSave={saveCharacter}
              />
            </MainContent>
          </MainContainer>
        </ContentContainer>
      </PageContainer>
    </>
  );
};

export default CharacterGeneratorPage;