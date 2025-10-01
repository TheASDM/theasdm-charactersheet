import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import CharacterSheetPretty from '../components/CharacterSheetPretty';
import {
  CharacterSheetData,
  createDefaultCharacterSheet,
} from '../types/characterSheet';
import { Character } from '../types/api';
import { characterService } from '../services';

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }

  @media (max-width: 480px) {
    padding: 0.5rem;
  }
`;

const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const NavigationBar = styled.div`
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid #333;
  border-radius: 8px;
  padding: 1rem 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  backdrop-filter: blur(10px);
`;

const BackButton = styled.button`
  background: rgba(212, 175, 55, 0.15);
  color: #d4af37;
  border: 1px solid #d4af37;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &:hover {
    background: rgba(212, 175, 55, 0.25);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

const CharacterTitle = styled.h2`
  color: #d4af37;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-align: center;
  flex: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);

  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: #d4af37;
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
  color: #f44336;
  text-align: center;
  gap: 1rem;
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
      <PageContainer>
        <ContentContainer>
          <LoadingContainer>
            ⚡ Loading Character...
          </LoadingContainer>
        </ContentContainer>
      </PageContainer>
    );
  }

  if (error || !character) {
    return (
      <PageContainer>
        <ContentContainer>
          <ErrorContainer>
            <h3>⚠️ Error</h3>
            <p>{error || 'Character not found'}</p>
            <BackButton onClick={handleBackClick}>
              ← Back to Characters
            </BackButton>
          </ErrorContainer>
        </ContentContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentContainer>
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
      </ContentContainer>
    </PageContainer>
  );
};

export default CharacterViewPage;