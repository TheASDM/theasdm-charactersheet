import { logger } from '../utils/logger';
/**
 * ClassChoiceManager Component
 *
 * Manages class feature choices after character creation.
 * Detects incomplete choices and shows the ChoiceSelectionModal.
 *
 * Usage:
 *  <ClassChoiceManager
 *    characterId={123}
 *    onComplete={() => navigate(`/characters/${123}`)}
 *  />
 */

import React, { useState, useEffect } from 'react';
import { detectRequiredChoices } from '../utils/classChoiceDetection';
import { loadClassData } from '../utils/classDataLoader';
import { ChoiceSelectionModal } from './ChoiceSelectionModal';
import { characterApi } from '../services/characterApi';
import type { Character } from '@/types/api';
import { isError } from '@/types/api';
import { showError } from '@/utils/errorDisplay';
import { ChoicePrompt } from '../types/classFeatures';
import styled from 'styled-components';

interface ClassChoiceManagerProps {
  characterId: number;
  onComplete: (character: Character) => void;
  onError?: (error: string) => void;
}

export const ClassChoiceManager: React.FC<ClassChoiceManagerProps> = ({
  characterId,
  onComplete,
  onError
}) => {
  const [character, setCharacter] = useState<Character | null>(null);
  const [pendingPrompts, setPendingPrompts] = useState<ChoicePrompt[]>([]);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [isProcessingChoice, setIsProcessingChoice] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get the current prompt being displayed
  const currentPrompt =
    pendingPrompts.length > 0 ? pendingPrompts[currentPromptIndex] : null;

  /**
   * Load character and check for required choices
   */
  useEffect(() => {
    loadCharacterAndCheckChoices();
  }, [characterId]);

  const loadCharacterAndCheckChoices = async () => {
    setIsLoading(true);
    setError(null);

    const response = await characterApi.getCharacter(characterId);

    if (isError(response) || !response.data) {
      const errorMsg = response.error ?? 'Character not found';
      showError(errorMsg, response.statusCode, response.errorCode);
      setError(errorMsg);
      onError?.(errorMsg);
      setIsLoading(false);
      return;
    }

    const char = response.data;
    setCharacter(char);
    await checkForRequiredChoices(char);
    setIsLoading(false);
  };

  /**
   * Check if character has any incomplete choices
   */
  const checkForRequiredChoices = async (char: Character) => {
    try {
      const sheetData = (char.characterData || {}) as Character['characterData'];
      const className = typeof sheetData?.class === 'string' ? sheetData.class : undefined;
      const level = typeof sheetData?.level === 'number' ? sheetData.level : undefined;
      const selectedChoices = (sheetData?.selectedClassChoices ?? {}) as Record<string, unknown>;
      const subclass = typeof sheetData?.subclass === 'string' ? sheetData.subclass : undefined;

      if (!className) {
        onComplete(char);
        return;
      }

      const classData = await loadClassData(className);

      const detection = detectRequiredChoices(
        classData,
        level ?? 1,
        selectedChoices as Record<string, string[]>,
        subclass
      );

      if (detection.hasIncompleteChoices) {
        logger.debug(`Found ${detection.prompts.length} incomplete choice(s)`);
        setPendingPrompts(detection.prompts);
        setCurrentPromptIndex(0);
      } else {
        // No choices needed - complete!
        logger.debug('All choices complete');
        onComplete(char);
      }
    } catch (err) {
      logger.error('Error checking for choices:', err);
      // On error, still complete (don't block character creation)
      onComplete(char);
    }
  };

  /**
   * Handle choice submission
   */
  const handleChoiceSubmit = async (selectedIds: string[]) => {
    if (!currentPrompt || !character) {
      logger.error('Missing prompt or character');
      return;
    }

    setIsProcessingChoice(true);

    try {
      // Save the choice
      const result = await characterApi.updateCharacterChoices(character.id, {
        choiceGroupId: currentPrompt.choiceGroup,
        selectedFeatureIds: selectedIds
      });

      if (isError(result)) {
        const message = result.error ?? 'Failed to save choice. Please try again.';
        showError(message, result.statusCode, result.errorCode);
        setError(message);
        return;
      }

      if (!result.data?.success) {
        const message = 'Failed to save choice. Please try again.';
        showError(message);
        setError(message);
        return;
      }

      const { character: updatedCharacter } = result.data;
      setCharacter(updatedCharacter);

      if (currentPromptIndex < pendingPrompts.length - 1) {
        setCurrentPromptIndex(currentPromptIndex + 1);
      } else {
        await checkForRequiredChoices(updatedCharacter);
      }
    } catch (err) {
      logger.error('Error submitting choice:', err);
      setError('An error occurred while saving your choice.');
    } finally {
      setIsProcessingChoice(false);
    }
  };

  /**
   * Handle cancel/skip (only for non-required choices)
   */
  const handleChoiceCancel = () => {
    if (!currentPrompt) return;

    // For required single choices (minSelections=1), don't allow cancel
    if (currentPrompt.minSelections && currentPrompt.minSelections > 0) {
      setError('This choice is required to continue.');
      return;
    }

    // For optional multiple choices, allow skipping
    if (currentPromptIndex < pendingPrompts.length - 1) {
      setCurrentPromptIndex(currentPromptIndex + 1);
    } else {
      // All prompts handled - complete
      if (character) {
        onComplete(character);
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
        <LoadingText>Checking for class choices...</LoadingText>
      </LoadingContainer>
    );
  }

  // Error state (show but don't block)
  if (error && !currentPrompt) {
    return (
      <ErrorContainer>
        <ErrorMessage>{error}</ErrorMessage>
        <RetryButton onClick={loadCharacterAndCheckChoices}>
          Retry
        </RetryButton>
      </ErrorContainer>
    );
  }

  // Show choice modal if needed
  if (currentPrompt && character) {
    return (
      <>
        <ChoiceSelectionModal
          prompt={currentPrompt}
          onSubmit={handleChoiceSubmit}
          onCancel={handleChoiceCancel}
          isLoading={isProcessingChoice}
        />

        {/* Progress indicator */}
        {pendingPrompts.length > 1 && (
          <ProgressIndicator>
            Choice {currentPromptIndex + 1} of {pendingPrompts.length}
          </ProgressIndicator>
        )}

        {/* Error message overlay */}
        {error && (
          <ErrorOverlay>
            <ErrorMessage>{error}</ErrorMessage>
            <CloseButton onClick={() => setError(null)}>Dismiss</CloseButton>
          </ErrorOverlay>
        )}
      </>
    );
  }

  // No choices needed - this shouldn't render, but just in case
  return null;
};

// Styled Components
const LoadingContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid #444;
  border-top: 4px solid #d4af37;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.div`
  color: #d4af37;
  margin-top: 20px;
  font-size: 16px;
`;

const ErrorContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #1a1a1a;
  border: 2px solid #dc3545;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  z-index: 9999;
  text-align: center;
`;

const ErrorMessage = styled.div`
  color: #ff6b6b;
  margin-bottom: 16px;
  font-size: 14px;
  line-height: 1.5;
`;

const RetryButton = styled.button`
  padding: 10px 20px;
  background: #8b4513;
  color: #ffd700;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #a0522d;
  }
`;

const ProgressIndicator = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(26, 26, 26, 0.95);
  border: 2px solid #8b4513;
  border-radius: 8px;
  padding: 12px 20px;
  color: #d4af37;
  font-size: 14px;
  font-weight: 600;
  z-index: 10000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
`;

const ErrorOverlay = styled.div`
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(220, 53, 69, 0.95);
  border: 1px solid #dc3545;
  border-radius: 8px;
  padding: 16px 24px;
  max-width: 500px;
  z-index: 10001;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
`;

const CloseButton = styled.button`
  padding: 6px 12px;
  background: #fff;
  color: #dc3545;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: #f8f9fa;
  }
`;