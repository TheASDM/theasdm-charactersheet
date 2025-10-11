import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import CharacterSheetPretty from '../components/CharacterSheetPretty';
import {
  CharacterSheetData,
  createDefaultCharacterSheet,
} from '../types/characterSheet';
import { Character, isError } from '@/types/api';
import { characterService } from '../services';
import { showError } from '@/utils/errorDisplay';
import { useCharacterAutosave } from '@/hooks/useCharacterAutosave';
import { useApiCall } from '@/hooks/useApiCall';

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
  background: rgba(206, 144, 22, 0.15);
  color: #ce9016;
  border: 1px solid #ce9016;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &:hover {
    background: rgba(206, 144, 22, 0.25);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(206, 144, 22, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

const CharacterTitle = styled.h2`
  color: #ce9016;
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
  color: #ce9016;
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
  const [error, setError] = useState<string | null>(null);
  const { save: scheduleAutosave, flush: flushAutosave } = useCharacterAutosave(originalCharacter?.id ?? null);
  const getCharacterById = useCallback(
    (id: number, signal?: AbortSignal) => characterService.getById(id, signal),
    []
  );

  const {
    data: fetchedCharacter,
    error: fetchError,
    isLoading,
    execute: fetchCharacter,
  } = useApiCall(getCharacterById, { showErrorToast: true });

  useEffect(() => {
    if (!characterId) {
      setError('No character ID provided');
      return;
    }

    setError(null);
    void fetchCharacter(parseInt(characterId, 10));
  }, [characterId, fetchCharacter]);

  useEffect(() => {
    if (fetchError) {
      setError(fetchError);
    }
  }, [fetchError]);

  useEffect(() => {
    if (!fetchedCharacter) {
      return;
    }

    setOriginalCharacter(fetchedCharacter);
    const characterSheetData: CharacterSheetData = {
      ...createDefaultCharacterSheet(),
      ...fetchedCharacter.characterData,
      name: fetchedCharacter.name,
      level: fetchedCharacter.level,
    };
    setCharacter(characterSheetData);
  }, [fetchedCharacter]);

  const handleCharacterUpdate = (updatedCharacter: CharacterSheetData) => {
    setCharacter(updatedCharacter);
  };

  const handleCharacterSave = useCallback(
    async (updatedCharacter: CharacterSheetData, options?: { silent?: boolean }) => {
      if (!originalCharacter) return;

      const patch = {
        name: updatedCharacter.name,
        level: updatedCharacter.level,
        characterData: updatedCharacter,
      };

      if (options?.silent) {
        await scheduleAutosave(patch);
        return;
      }

      await flushAutosave();
      const response = await characterService.update(originalCharacter.id, patch);
      if (isError(response)) {
        showError(response.error ?? 'Failed to save character', response.statusCode, response.errorCode);
        return;
      }

      const updated = response.data;
      if (updated) {
        setOriginalCharacter((prev) => (prev ? { ...prev, ...updated } : updated));
      }
    },
    [flushAutosave, originalCharacter, scheduleAutosave]
  );

  const handleBackClick = () => {
    navigate('/characters');
  };

  const isInitialLoading = isLoading && !character && !error;

  if (isInitialLoading) {
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

  if ((error && !character) || (!character && !isLoading)) {
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

  if (!character) {
    return null;
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
          characterId={originalCharacter?.id}
        />
      </ContentContainer>
    </PageContainer>
  );
};

export default CharacterViewPage;
