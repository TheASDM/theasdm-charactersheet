import React, { useState } from 'react';
import styled from 'styled-components';
import { ChoicePrompt } from '../types/classFeatures';
import { validateChoiceSelection } from '../utils/classChoiceDetection';
import { parseComplexDnDEntry } from '../utils/dndTemplateParser';
import { logger } from '../utils/logger';

interface ChoiceSelectionModalProps {
  prompt: ChoicePrompt;
  onSubmit: (selectedIds: string[]) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const ChoiceSelectionModal: React.FC<ChoiceSelectionModalProps> = ({
  prompt,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const handleToggleSelection = (featureId: string) => {
    if (isLoading) return;

    setErrors([]); // Clear errors when selection changes

    if (prompt.selectionMode === 'single') {
      // Single selection - replace current selection
      setSelectedIds([featureId]);
    } else {
      // Multiple selection - toggle
      if (selectedIds.includes(featureId)) {
        setSelectedIds(selectedIds.filter((id) => id !== featureId));
      } else {
        setSelectedIds([...selectedIds, featureId]);
      }
    }
  };

  const handleSubmit = async () => {
    // Validate selection
    const validation = validateChoiceSelection(prompt, selectedIds);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Submit selection
    try {
      await onSubmit(selectedIds);
    } catch (error) {
      logger.error('Error submitting choice:', error);
      setErrors(['Failed to save choice. Please try again.']);
    }
  };

  const canSubmit = selectedIds.length > 0 && !isLoading;

  return (
    <ModalOverlay>
      <ModalContainer>
        <ModalHeader>
          <ModalTitle>{prompt.title}</ModalTitle>
          <LevelBadge>Level {prompt.level}</LevelBadge>
        </ModalHeader>

        <ModalDescription>{prompt.description}</ModalDescription>

        {prompt.selectionMode === 'single' && (
          <SelectionHint>Select one option:</SelectionHint>
        )}
        {prompt.selectionMode === 'multiple' && (
          <SelectionHint>
            Select as many options as you'd like
            {prompt.minSelections && ` (minimum ${prompt.minSelections})`}
            {prompt.maxSelections && ` (maximum ${prompt.maxSelections})`}:
          </SelectionHint>
        )}

        <OptionsContainer>
          {prompt.options.map((option) => (
            <OptionCard
              key={option.id}
              $selected={selectedIds.includes(option.id)}
              onClick={() => handleToggleSelection(option.id)}
              $disabled={isLoading}
            >
              <OptionHeader>
                <SelectionIndicator $selectionMode={prompt.selectionMode}>
                  {prompt.selectionMode === 'single' ? (
                    <RadioButton $checked={selectedIds.includes(option.id)} />
                  ) : (
                    <Checkbox $checked={selectedIds.includes(option.id)}>
                      {selectedIds.includes(option.id) && '✓'}
                    </Checkbox>
                  )}
                </SelectionIndicator>
                <OptionTitle>{option.name}</OptionTitle>
              </OptionHeader>

              <OptionDescription
                dangerouslySetInnerHTML={{
                  __html: parseComplexDnDEntry(option.description)
                    .replace(/\n\n/g, '<br/><br/>')
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                }}
              />

              {option.mechanics && renderMechanics(option.mechanics)}
            </OptionCard>
          ))}
        </OptionsContainer>

        {errors.length > 0 && (
          <ErrorContainer>
            {errors.map((error, index) => (
              <ErrorMessage key={index}>{error}</ErrorMessage>
            ))}
          </ErrorContainer>
        )}

        <ModalActions>
          {onCancel && (
            <CancelButton onClick={onCancel} disabled={isLoading}>
              Cancel
            </CancelButton>
          )}
          <SubmitButton onClick={handleSubmit} disabled={!canSubmit}>
            {isLoading ? 'Saving...' : 'Confirm Selection'}
          </SubmitButton>
        </ModalActions>
      </ModalContainer>
    </ModalOverlay>
  );
};

// Helper function to render mechanics info
function renderMechanics(mechanics: any): React.ReactNode {
  const parts: string[] = [];

  if (mechanics.actionType) {
    parts.push(`Action: ${mechanics.actionType}`);
  }

  if (mechanics.range) {
    parts.push(`Range: ${mechanics.range}`);
  }

  if (mechanics.duration) {
    parts.push(`Duration: ${mechanics.duration}`);
  }

  if (mechanics.damage || mechanics.diceRolls?.length > 0) {
    const damageText = mechanics.damage || mechanics.diceRolls.join(', ');
    parts.push(`Damage: ${damageText}`);
  }

  if (parts.length === 0) return null;

  return <MechanicsInfo>{parts.join(' • ')}</MechanicsInfo>;
}

// Styled Components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  overflow-y: auto;
`;

const ModalContainer = styled.div`
  background: #1a1a1a;
  border-radius: 12px;
  border: 2px solid #8b4513;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  padding: 24px;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 2px solid #8b4513;
`;

const ModalTitle = styled.h2`
  color: #ce9016;
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
`;

const LevelBadge = styled.span`
  background: #8b4513;
  color: #e0a523;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
`;

const ModalDescription = styled.p`
  color: #e0e0e0;
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 16px;
`;

const SelectionHint = styled.p`
  color: #b0b0b0;
  font-size: 14px;
  font-style: italic;
  margin-bottom: 20px;
`;

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
`;

const OptionCard = styled.div<{ $selected: boolean; $disabled?: boolean }>`
  background: ${(props) => (props.$selected ? '#2a2a2a' : '#222')};
  border: 2px solid ${(props) => (props.$selected ? '#ce9016' : '#444')};
  border-radius: 8px;
  padding: 16px;
  cursor: ${(props) => (props.$disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s ease;
  opacity: ${(props) => (props.$disabled ? 0.6 : 1)};

  &:hover {
    ${(props) =>
      !props.$disabled &&
      `
      border-color: ${props.$selected ? '#e0a523' : '#666'};
      background: ${props.$selected ? '#333' : '#2a2a2a'};
    `}
  }
`;

const OptionHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
`;

const SelectionIndicator = styled.div<{ $selectionMode: 'single' | 'multiple' }>`
  flex-shrink: 0;
  margin-top: 2px;
`;

const RadioButton = styled.div<{ $checked: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid ${(props) => (props.$checked ? '#ce9016' : '#666')};
  background: ${(props) => (props.$checked ? '#ce9016' : 'transparent')};
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${(props) => (props.$checked ? '#1a1a1a' : 'transparent')};
  }
`;

const Checkbox = styled.div<{ $checked: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 2px solid ${(props) => (props.$checked ? '#ce9016' : '#666')};
  background: ${(props) => (props.$checked ? '#ce9016' : 'transparent')};
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1a1a1a;
  font-weight: 700;
  font-size: 14px;
`;

const OptionTitle = styled.h3`
  color: #ce9016;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  flex: 1;
`;

const OptionDescription = styled.div`
  color: #e0e0e0;
  font-size: 14px;
  line-height: 1.6;
  padding-left: 32px;

  strong {
    color: #e0a523;
  }
`;

const MechanicsInfo = styled.div`
  color: #b0b0b0;
  font-size: 12px;
  padding-left: 32px;
  margin-top: 8px;
  font-style: italic;
`;

const ErrorContainer = styled.div`
  background: rgba(220, 53, 69, 0.1);
  border: 1px solid #dc3545;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 20px;
`;

const ErrorMessage = styled.div`
  color: #ff6b6b;
  font-size: 14px;

  &:not(:last-child) {
    margin-bottom: 6px;
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(Button)`
  background: #444;
  color: #e0e0e0;

  &:hover:not(:disabled) {
    background: #555;
  }
`;

const SubmitButton = styled(Button)`
  background: #8b4513;
  color: #e0a523;

  &:hover:not(:disabled) {
    background: #a0522d;
  }

  &:disabled {
    background: #555;
    color: #999;
  }
`;