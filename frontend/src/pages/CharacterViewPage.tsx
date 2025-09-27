import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Hero } from '../components';
import CharacterSheetPretty from '../components/CharacterSheetPretty';
import {
  CharacterSheetData,
  createDefaultCharacterSheet,
} from '../types/characterSheet';
import { Character } from '../types/api';
import { characterService } from '../services';

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

const NavigationBar = styled.div`
  background: rgba(139, 105, 20, 0.1);
  border: 2px solid #8b6914;
  border-radius: 10px;
  padding: 15px 20px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
`;

const BackButton = styled.button`
  background: linear-gradient(145deg, #d4af37, #b8941f);
  color: #2c1810;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.9rem;
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

const CharacterTitle = styled.h2`
  color: #8b6914;
  font-family: 'Cinzel', serif;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-align: center;
  flex: 1;

  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: #8b6914;
  font-family: 'Cinzel', serif;
  font-size: 1.2rem;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: #dc3545;
  font-family: 'Cinzel', serif;
  text-align: center;
`;

const CharacterViewPage: React.FC = () => {
  const { characterId } = useParams<{ characterId: string }>();
  const navigate = useNavigate();
  const [character, setCharacter] = useState<CharacterSheetData | null>(null);
  const [originalCharacter, setOriginalCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (characterId) {
      loadCharacter(parseInt(characterId));
    } else {
      setError('No character ID provided');
      setLoading(false);
    }
  }, [characterId]);

  const loadCharacter = async (id: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await characterService.getById(id);

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setOriginalCharacter(response.data);
        // Convert the character data to CharacterSheetData format
        const characterSheetData: CharacterSheetData = {
          ...createDefaultCharacterSheet(),
          ...response.data.characterData,
          name: response.data.name,
          level: response.data.level,
        };
        setCharacter(characterSheetData);
      }
    } catch (err) {
      setError('Failed to load character');
      console.error('Error loading character:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCharacterUpdate = (updatedCharacter: CharacterSheetData) => {
    setCharacter(updatedCharacter);
  };

  const handleCharacterSave = async (updatedCharacter: CharacterSheetData) => {
    if (!originalCharacter) return;

    try {
      const response = await characterService.update(originalCharacter.id, {
        name: updatedCharacter.name,
        level: updatedCharacter.level,
        characterData: updatedCharacter,
      });

      if (response.error) {
        alert(`Failed to save character: ${response.error}`);
      } else {
        console.log('Character saved successfully');
      }
    } catch (err) {
      alert('Failed to save character');
      console.error('Error saving character:', err);
    }
  };

  const handleBackClick = () => {
    navigate('/characters');
  };

  if (loading) {
    return (
      <>
        <FontImport />
        <PageContainer>
          <ContentContainer>
            <Hero
              title="CHARACTER SHEET"
              subtitle="Loading character..."
              height="280px"
            />
            <MainContainer>
              <MainContent>
                <LoadingContainer>
                  ⚡ Loading Character...
                </LoadingContainer>
              </MainContent>
            </MainContainer>
          </ContentContainer>
        </PageContainer>
      </>
    );
  }

  if (error || !character) {
    return (
      <>
        <FontImport />
        <PageContainer>
          <ContentContainer>
            <Hero
              title="CHARACTER SHEET"
              subtitle="Error loading character"
              height="280px"
            />
            <MainContainer>
              <MainContent>
                <ErrorContainer>
                  <h3>⚠️ Error</h3>
                  <p>{error || 'Character not found'}</p>
                  <BackButton onClick={handleBackClick}>
                    ← Back to Characters
                  </BackButton>
                </ErrorContainer>
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
            title="CHARACTER SHEET"
            subtitle={`${character.name} - Level ${character.level} ${character.species} ${character.class}`}
            height="280px"
          />

          <MainContainer>
            <MainContent>
              <NavigationBar>
                <BackButton onClick={handleBackClick}>
                  ← Back to Characters
                </BackButton>
                <CharacterTitle>
                  {character.name}
                </CharacterTitle>
                <div style={{ width: '140px' }} /> {/* Spacer for centering */}
              </NavigationBar>

              <CharacterSheetPretty
                character={character}
                onUpdate={handleCharacterUpdate}
                onSave={handleCharacterSave}
              />
            </MainContent>
          </MainContainer>
        </ContentContainer>
      </PageContainer>
    </>
  );
};

export default CharacterViewPage;