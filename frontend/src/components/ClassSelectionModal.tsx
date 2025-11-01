import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { detectRequiredChoices } from '../utils/classChoiceDetection';
import type { ChoicePrompt, ClassData, ClassFeature } from '../types/classFeatures';
import { loadExternalChoiceData } from '../utils/externalChoiceLoader';
import { logger } from '../utils/logger';

// Modal Overlay
const ModalOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: ${props => props.isOpen ? 'flex' : 'none'};
  justify-content: center;
  align-items: flex-start;
  z-index: 1000;
  backdrop-filter: blur(3px);
  padding: 3rem 1rem 2rem;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 12px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(206, 144, 22, 0.6);
    border-radius: 6px;

    &:hover {
      background: rgba(206, 144, 22, 0.8);
    }
  }
`;

// Class Selection Popup Styles
const ClassPopupModal = styled.div`
  background: linear-gradient(135deg, #2a2520 0%, #1a1a1a 100%);
  border: 3px solid #ce9016;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
  max-width: 800px;
  width: 85%;
  max-height: 80vh;
  overflow-y: auto;
  padding: 20px;
  color: #f4e7d1;
  font-family: 'Cinzel', serif;
`;

const ClassPopupTitle = styled.h3`
  color: #ce9016;
  margin: 0 0 15px 0;
  font-size: 1.2rem;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const ClassSkillsContainer = styled.div`
  margin: 15px 0;
`;

const ClassSkillsTitle = styled.h4`
  color: #ce9016;
  margin: 0 0 10px 0;
  font-size: 1rem;
  text-align: center;
  text-transform: uppercase;
`;

const ClassSkillsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
  margin: 10px 0;
`;

const ClassSkillChoice = styled.div<{ selected?: boolean }>`
  background: ${props => props.selected ? 'rgba(206, 144, 22, 0.2)' : 'rgba(139, 105, 20, 0.1)'};
  border: 2px solid ${props => props.selected ? '#ce9016' : 'rgba(139, 105, 20, 0.3)'};
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  font-size: 0.9rem;
  color: ${props => props.selected ? '#ce9016' : '#f4e7d1'};

  &:hover {
    background: rgba(206, 144, 22, 0.15);
    border-color: #ce9016;
    transform: translateY(-1px);
  }
`;

const ClassButtonsContainer = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Cinzel', serif;
  text-transform: uppercase;
`;

const CancelButton = styled(Button)`
  background: rgba(139, 69, 19, 0.8);
  color: #f4e7d1;

  &:hover {
    background: rgba(139, 69, 19, 1);
    transform: translateY(-2px);
  }
`;

const ConfirmButton = styled(Button)<{ disabled?: boolean }>`
  background: ${props => props.disabled ? 'rgba(206, 144, 22, 0.3)' : 'linear-gradient(145deg, #ce9016, #b8860b)'};
  color: ${props => props.disabled ? '#8a8a8a' : '#2c1810'};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};

  &:hover:not(:disabled) {
    background: linear-gradient(145deg, #b8860b, #a0801b);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(206, 144, 22, 0.4);
  }
`;

interface ParsedChoiceOption {
  id: string;
  label: string;
  name: string;
  description?: string;
}

interface ParsedChoiceGroup {
  id: string;
  title: string;
  description?: string;
  options: ParsedChoiceOption[];
  minSelections: number;
  maxSelections: number;
  isRequired: boolean;
}

const formatChoiceTitle = (prompt: ChoicePrompt): string => {
  if (prompt.title) {
    const cleaned = prompt.title
      .replace(/^Choose\s+/i, '')
      .replace(/\s+Option(s)?$/i, '')
      .trim();
    if (cleaned) {
      return cleaned;
    }
  }

  const firstOptionName = prompt.options[0]?.name;
  if (firstOptionName) {
    if (firstOptionName.includes(':')) {
      return firstOptionName.split(':')[0].trim();
    }
    if (firstOptionName.includes('-')) {
      return firstOptionName.split('-')[0].trim();
    }
    return firstOptionName;
  }

  return 'Class Choice';
};

const formatChoiceOptionLabel = (name: string): string => {
  if (!name) return 'Option';
  const colonIndex = name.indexOf(':');
  if (colonIndex >= 0 && colonIndex < name.length - 1) {
    return name.slice(colonIndex + 1).trim();
  }
  return name.trim();
};

// Helper function to build class choice groups (supports external references)
const buildClassChoiceGroups = async (
  classData: any,
  existingChoices: Record<string, string[]>
): Promise<ParsedChoiceGroup[]> => {
  if (!classData) {
    return [];
  }

  let features: ClassFeature[] = [];

  if (Array.isArray(classData.features)) {
    features = [...classData.features];
  }

  if (Array.isArray(classData.classFeatures)) {
    features = [...features, ...classData.classFeatures];
  } else if (classData.classFeatures && typeof classData.classFeatures === 'object') {
    Object.values(classData.classFeatures).forEach((featureList) => {
      if (Array.isArray(featureList)) {
        features = [...features, ...featureList];
      }
    });
  }

  const normalizedFeatures: ClassFeature[] = features
    .filter((feature: any): feature is ClassFeature => feature && typeof feature.level === 'number')
    .map((feature) => ({
      ...feature,
      name: feature.name || 'Unknown Feature'
    }));

  if (normalizedFeatures.length === 0) {
    return [];
  }

  const normalizedClassData: ClassData = {
    className: classData.className || classData.name || 'Unknown Class',
    source: classData.source || normalizedFeatures[0]?.source || '',
    features: normalizedFeatures,
    subclasses: classData.subclasses ?? {},
    mechanics: classData.mechanics
  };

  const detection = detectRequiredChoices(
    normalizedClassData,
    1,
    existingChoices || {}
  );

  const promptsWithOptions: ChoicePrompt[] = await Promise.all(
    detection.prompts.map(async (prompt) => {
      if (prompt.externalReference && prompt.choiceType) {
        try {
          const externalOptions = await loadExternalChoiceData(
            prompt.externalReference,
            1,
            existingChoices || {}
          );

          return {
            ...prompt,
            options: externalOptions
          };
        } catch (error) {
          logger.error(`Failed to load external options for ${prompt.title}:`, error);
          return prompt;
        }
      }

      return prompt;
    })
  );

  const dedupedPrompts: ChoicePrompt[] = [];
  const seenOptionSignatures = new Set<string>();
  const seenChoiceGroups = new Set<string>();

  for (const prompt of promptsWithOptions) {
    const normalizedGroupKey = (prompt.choiceGroup || prompt.title || '')
      .toLowerCase()
      .replace(/[^a-z]/g, '');

    if (normalizedGroupKey && seenChoiceGroups.has(normalizedGroupKey)) {
      continue;
    }

    const optionSignature = (prompt.options || [])
      .map((opt) => (opt.name || opt.id || '').toLowerCase())
      .sort()
      .join('|');

    if (optionSignature.length === 0) {
      dedupedPrompts.push(prompt);
      continue;
    }

    if (seenOptionSignatures.has(optionSignature)) {
      continue;
    }

    if (normalizedGroupKey) {
      seenChoiceGroups.add(normalizedGroupKey);
    }
    seenOptionSignatures.add(optionSignature);
    dedupedPrompts.push(prompt);
  }

  return dedupedPrompts
    .filter((prompt) => prompt.isRequired && prompt.level === 1 && prompt.options.length > 0)
    .map((prompt) => {
      const maxSelections =
        prompt.maxSelections ??
        (prompt.selectionMode === 'single' ? 1 : prompt.options.length);
      const minSelections =
        prompt.minSelections ?? (prompt.selectionMode === 'single' ? 1 : 0);

      const options: ParsedChoiceOption[] = prompt.options.map((option) => {
        const parsedOption: ParsedChoiceOption = {
          id: option.id || option.name,
          label: formatChoiceOptionLabel(option.name),
          name: option.name
        };

        if (option.description) {
          parsedOption.description = option.description;
        }

        return parsedOption;
      });

      const parsedGroup: ParsedChoiceGroup = {
        id: prompt.choiceGroup,
        title: formatChoiceTitle(prompt),
        options,
        minSelections,
        maxSelections,
        isRequired: prompt.isRequired
      };

      if (prompt.description) {
        parsedGroup.description = prompt.description;
      }

      return parsedGroup;
    });
};

// Props interface
interface ClassSelectionModalProps {
  isOpen: boolean;
  selectedClass: string;
  selectedClassSkills: string[];
  classChoicesStep: number;
  selectedClassChoices: { [category: string]: string[] };
  currentClassData: any;
  onClassSelect?: (className: string) => void;
  onSkillToggle: (skill: string) => void;
  onChoiceToggle: (category: string, choice: string, count: number) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const ClassSelectionModal: React.FC<ClassSelectionModalProps> = ({
  isOpen,
  selectedClass,
  selectedClassSkills,
  classChoicesStep,
  selectedClassChoices,
  currentClassData,
  onClassSelect: _onClassSelect,
  onSkillToggle,
  onChoiceToggle,
  onNextStep,
  onPrevStep,
  onConfirm,
  onCancel
}) => {
  if (!isOpen || !selectedClass) return null;

  // Extract skills and skill count from API data
  const classSkills = currentClassData?.skillProficiencies || [];
  const requiredSkillCount = currentClassData?.skillChoices || 2;
  const [classChoices, setClassChoices] = useState<ParsedChoiceGroup[]>([]);
  const [isLoadingChoices, setIsLoadingChoices] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const loadChoices = async () => {
      if (!currentClassData) {
        if (!isCancelled) {
          setClassChoices([]);
        }
        return;
      }

      setIsLoadingChoices(true);
      try {
        const detectionSource =
          currentClassData.detailedClassData || currentClassData;
        const choices = await buildClassChoiceGroups(detectionSource, selectedClassChoices);
        if (!isCancelled) {
          setClassChoices(choices);
        }
      } catch (error) {
        if (!isCancelled) {
          setClassChoices([]);
        }
        logger.error('Failed to prepare class choices:', error);
      } finally {
        if (!isCancelled) {
          setIsLoadingChoices(false);
        }
      }
    };

    loadChoices();

    return () => {
      isCancelled = true;
    };
  }, [currentClassData, selectedClassChoices]);

  const areRequiredChoicesComplete = useMemo(() => {
    if (isLoadingChoices) {
      return false;
    }

    return classChoices.every((choice) => {
      if (!choice.isRequired) {
        return true;
      }

      const selectedCount = selectedClassChoices[choice.id]?.length || 0;
      const minSelections = choice.minSelections ?? (choice.isRequired ? 1 : 0);
      const fallbackMax = choice.options.length > 0 ? choice.options.length : Math.max(minSelections, 1);
      const maxSelections = choice.maxSelections ?? fallbackMax;

      if (selectedCount < minSelections) {
        return false;
      }

      if (selectedCount > maxSelections) {
        return false;
      }

      return true;
    });
  }, [classChoices, isLoadingChoices, selectedClassChoices]);

  return (
    <ModalOverlay isOpen={isOpen} onClick={(e) => {
      if (e.target === e.currentTarget) {
        onCancel();
      }
    }}>
      <ClassPopupModal>
        <ClassPopupTitle>
          Select {selectedClass} - Step {classChoicesStep}
          {classChoicesStep === 1 && ' (Skills)'}
          {classChoicesStep === 2 && ' (Class Features)'}
        </ClassPopupTitle>

        {selectedClass && classSkills && (
          <>
            {/* Step 1: Skill Selection */}
            {classChoicesStep === 1 && (
              <ClassSkillsContainer>
                <ClassSkillsTitle>
                  Choose {requiredSkillCount} Skills:
                </ClassSkillsTitle>
                <ClassSkillsGrid>
                  {classSkills.map((skill: any) => (
                    <ClassSkillChoice
                      key={skill}
                      selected={selectedClassSkills.includes(skill)}
                      onClick={() => onSkillToggle(skill)}
                    >
                      {skill}
                    </ClassSkillChoice>
                  ))}
                </ClassSkillsGrid>
                <div style={{ textAlign: 'center', marginTop: '15px', color: '#8b6914' }}>
                  Selected: {selectedClassSkills.length} / {requiredSkillCount}
                </div>
              </ClassSkillsContainer>
            )}

            {/* Step 2: Additional Class Choices */}
            {classChoicesStep === 2 && (
              <ClassSkillsContainer>
                {!currentClassData ? (
                  <div style={{ textAlign: 'center', color: '#8b6914', fontStyle: 'italic', padding: '20px' }}>
                    Loading class features...
                  </div>
                ) : isLoadingChoices ? (
                  <div style={{ textAlign: 'center', color: '#8b6914', fontStyle: 'italic', padding: '20px' }}>
                    Loading class choices...
                  </div>
                ) : (
                  <>
                    {classChoices.length > 0 ? classChoices.map((choice) => {
                      const selectionTarget = Math.max(choice.maxSelections ?? choice.minSelections ?? 1, 1);
                      return (
                        <div key={choice.id} style={{ marginBottom: '20px' }}>
                          <ClassSkillsTitle>
                            Choose {selectionTarget}{' '}
                            {selectionTarget > 1 ? `${choice.title} Options` : choice.title}:
                          </ClassSkillsTitle>
                          {choice.description && (
                            <div style={{ textAlign: 'center', color: '#b0b0b0', fontSize: '0.85rem', marginBottom: '10px' }}>
                              {choice.description}
                            </div>
                          )}
                          <ClassSkillsGrid>
                            {choice.options.map((option) => {
                              const optionId = option.id;
                              const isSelected = selectedClassChoices[choice.id]?.includes(optionId) || false;
                              const maxSelections = Math.max(choice.maxSelections ?? choice.minSelections ?? 1, 1);
                              return (
                                <ClassSkillChoice
                                  key={optionId}
                                  selected={isSelected}
                                  onClick={() => onChoiceToggle(choice.id, optionId, maxSelections)}
                                >
                                  {option.label}
                                </ClassSkillChoice>
                              );
                            })}
                          </ClassSkillsGrid>
                          <div style={{ textAlign: 'center', marginTop: '10px', color: '#8b6914' }}>
                            Selected: {selectedClassChoices[choice.id]?.length || 0} / {selectionTarget}
                          </div>
                        </div>
                      );
                    }) : (
                      <div style={{ textAlign: 'center', color: '#8b6914', fontStyle: 'italic', padding: '20px' }}>
                        No additional level 1 choices for {selectedClass}
                      </div>
                    )}
                  </>
                )}
              </ClassSkillsContainer>
            )}

            <ClassButtonsContainer>
              <CancelButton onClick={onCancel}>
                Cancel
              </CancelButton>

              {classChoicesStep === 1 && (
                <ConfirmButton
                  onClick={onNextStep}
                  disabled={selectedClassSkills.length !== requiredSkillCount}
                >
                  Next: Class Features
                </ConfirmButton>
              )}

              {classChoicesStep === 2 && (
                <>
                  <CancelButton onClick={onPrevStep}>
                    Back to Skills
                  </CancelButton>
                  <ConfirmButton
                    onClick={onConfirm}
                    disabled={!currentClassData ? false : isLoadingChoices || !areRequiredChoicesComplete}
                  >
                    Confirm Selection
                  </ConfirmButton>
                </>
              )}
            </ClassButtonsContainer>
          </>
        )}
      </ClassPopupModal>
    </ModalOverlay>
  );
};

export default ClassSelectionModal;
