/**
 * INTEGRATION EXAMPLE
 *
 * This is a complete example of how to integrate the class choice system
 * into your character creation or level-up flow.
 *
 * Copy the relevant parts into your existing component.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { detectRequiredChoices } from '../utils/classChoiceDetection';
import { loadClassData } from '../utils/classDataLoader';
import { ChoiceSelectionModal } from '../components/ChoiceSelectionModal';
import { characterApi, Character } from '../services/characterApi';
import { ChoicePrompt } from '../types/classFeatures';

export const CharacterCreationExample: React.FC = () => {
  const navigate = useNavigate();

  // State for the created character
  const [character, setCharacter] = useState<Character | null>(null);

  // State for choice prompts
  const [pendingPrompts, setPendingPrompts] = useState<ChoicePrompt[]>([]);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [isProcessingChoice, setIsProcessingChoice] = useState(false);

  // Get the current prompt being displayed
  const currentPrompt =
    pendingPrompts.length > 0 ? pendingPrompts[currentPromptIndex] : null;

  /**
   * Step 1: After character is created, check for required choices
   */
  const checkForRequiredChoices = async (char: Character) => {
    try {
      // Load the class data
      const classData = await loadClassData(char.characterData.class);

      // Detect incomplete choices
      const detection = detectRequiredChoices(
        classData,
        char.characterData.level,
        char.characterData.selectedClassChoices || {},
        char.characterData.subclass
      );

      if (detection.hasIncompleteChoices) {
        console.log(`Found ${detection.prompts.length} incomplete choice(s)`);
        setPendingPrompts(detection.prompts);
        setCurrentPromptIndex(0);
      } else {
        // No choices needed - go directly to character sheet
        console.log('All choices complete, navigating to character sheet');
        navigate(`/characters/${char.id}`);
      }
    } catch (error) {
      console.error('Error checking for choices:', error);
      // On error, still navigate to character sheet
      navigate(`/characters/${char.id}`);
    }
  };

  /**
   * Step 2: Handle character creation
   * (This would be called when user completes the creation wizard)
   */
  const handleCreateCharacter = async (characterData: any) => {
    try {
      // Create the character
      const newCharacter = await characterApi.create({
        name: characterData.name,
        level: characterData.level,
        characterData: characterData,
        isPublic: false
      });

      if (newCharacter) {
        setCharacter(newCharacter);

        // Check if choices are needed
        await checkForRequiredChoices(newCharacter);
      }
    } catch (error) {
      console.error('Error creating character:', error);
    }
  };

  /**
   * Step 3: Handle choice submission
   */
  const handleChoiceSubmit = async (selectedIds: string[]) => {
    if (!currentPrompt || !character) {
      console.error('Missing prompt or character');
      return;
    }

    setIsProcessingChoice(true);

    try {
      // Save the choice
      const result = await characterApi.updateChoices(character.id, {
        choiceGroupId: currentPrompt.choiceGroup,
        selectedFeatureIds: selectedIds
      });

      if (result?.success) {
        console.log('Choice saved successfully:', result.choiceApplied);

        // Update local character state
        setCharacter(result.character);

        // Check if there are more prompts
        if (currentPromptIndex < pendingPrompts.length - 1) {
          // Move to next prompt
          setCurrentPromptIndex(currentPromptIndex + 1);
        } else {
          // All prompts complete - check again in case new choices appeared
          await checkForRequiredChoices(result.character);
        }
      } else {
        alert('Failed to save choice. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting choice:', error);
      alert('An error occurred while saving your choice.');
    } finally {
      setIsProcessingChoice(false);
    }
  };

  /**
   * Step 4: Handle cancel/skip
   * (Only for non-required choices like multiple Cunning Strike options)
   */
  const handleChoiceCancel = () => {
    if (!currentPrompt) return;

    // For required single choices (minSelections=1), don't allow cancel
    if (currentPrompt.minSelections && currentPrompt.minSelections > 0) {
      alert('This choice is required to continue.');
      return;
    }

    // For optional multiple choices, allow skipping
    if (currentPromptIndex < pendingPrompts.length - 1) {
      setCurrentPromptIndex(currentPromptIndex + 1);
    } else {
      // Navigate to character sheet
      if (character) {
        navigate(`/characters/${character.id}`);
      }
    }
  };

  /**
   * Example render
   */
  return (
    <div>
      {/* Your character creation wizard UI goes here */}
      <h1>Character Creation Wizard</h1>

      {/* Example: When user clicks "Create Character" */}
      <button
        onClick={() =>
          handleCreateCharacter({
            name: 'Test Character',
            class: 'Cleric',
            level: 1,
            species: 'Human'
            // ... other data
          })
        }
      >
        Create Character
      </button>

      {/* Choice modal appears when needed */}
      {currentPrompt && character && (
        <ChoiceSelectionModal
          prompt={currentPrompt}
          onSubmit={handleChoiceSubmit}
          onCancel={handleChoiceCancel}
          isLoading={isProcessingChoice}
        />
      )}

      {/* Optional: Show progress indicator */}
      {pendingPrompts.length > 0 && (
        <div style={{ position: 'fixed', top: 20, right: 20 }}>
          Choice {currentPromptIndex + 1} of {pendingPrompts.length}
        </div>
      )}
    </div>
  );
};

/**
 * ALTERNATIVE: Integration into existing character sheet viewer
 *
 * If you want to show an "Incomplete Choices" warning on the character sheet:
 */
export const CharacterSheetWithChoices: React.FC<{ characterId: number }> = ({
  characterId
}) => {
  const [character, setCharacter] = useState<Character | null>(null);
  const [hasIncompleteChoices, setHasIncompleteChoices] = useState(false);
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<ChoicePrompt | null>(null);

  useEffect(() => {
    loadCharacterAndCheckChoices();
  }, [characterId]);

  const loadCharacterAndCheckChoices = async () => {
    const char = await characterApi.getById(characterId);
    if (!char) return;

    setCharacter(char);

    // Check for incomplete choices
    const classData = await loadClassData(char.characterData.class);
    const detection = detectRequiredChoices(
      classData,
      char.characterData.level,
      char.characterData.selectedClassChoices || {},
      char.characterData.subclass
    );

    setHasIncompleteChoices(detection.hasIncompleteChoices);

    if (detection.hasIncompleteChoices) {
      setCurrentPrompt(detection.prompts[0]);
    }
  };

  const handleCompleteChoices = () => {
    setShowChoiceModal(true);
  };

  const handleChoiceSubmit = async (selectedIds: string[]) => {
    if (!character || !currentPrompt) return;

    await characterApi.updateChoices(character.id, {
      choiceGroupId: currentPrompt.choiceGroup,
      selectedFeatureIds: selectedIds
    });

    // Reload character
    await loadCharacterAndCheckChoices();
    setShowChoiceModal(false);
  };

  return (
    <div>
      {/* Warning banner */}
      {hasIncompleteChoices && (
        <div
          style={{
            background: '#ffa500',
            padding: '12px',
            textAlign: 'center',
            marginBottom: '20px'
          }}
        >
          ⚠️ This character has incomplete class choices.{' '}
          <button onClick={handleCompleteChoices}>Complete Now</button>
        </div>
      )}

      {/* Your character sheet UI */}
      <h1>{character?.name}</h1>

      {/* Choice modal */}
      {showChoiceModal && currentPrompt && (
        <ChoiceSelectionModal
          prompt={currentPrompt}
          onSubmit={handleChoiceSubmit}
          onCancel={() => setShowChoiceModal(false)}
        />
      )}
    </div>
  );
};

/**
 * LEVEL-UP INTEGRATION
 *
 * If you have a level-up system, check for new choices:
 */
export const useLevelUpChoices = (character: Character, newLevel: number) => {
  const [choicesNeeded, setChoicesNeeded] = useState<ChoicePrompt[]>([]);

  useEffect(() => {
    checkLevelUpChoices();
  }, [character, newLevel]);

  const checkLevelUpChoices = async () => {
    const classData = await loadClassData(character.characterData.class);

    // Get choices for new level
    const detection = detectRequiredChoices(
      classData,
      newLevel,
      character.characterData.selectedClassChoices || {},
      character.characterData.subclass
    );

    // Filter to only NEW choices (not old incomplete ones)
    const newChoices = detection.prompts.filter((prompt) => prompt.level === newLevel);

    setChoicesNeeded(newChoices);
  };

  return { choicesNeeded, hasNewChoices: choicesNeeded.length > 0 };
};
