import React from 'react';
import styled from 'styled-components';

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
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(3px);
`;

// Class Selection Popup Styles
const ClassPopupModal = styled.div`
  background: linear-gradient(135deg, #2a2520 0%, #1a1a1a 100%);
  border: 3px solid #d4af37;
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
  color: #d4af37;
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
  color: #d4af37;
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
  background: ${props => props.selected ? 'rgba(212, 175, 55, 0.2)' : 'rgba(139, 105, 20, 0.1)'};
  border: 2px solid ${props => props.selected ? '#d4af37' : 'rgba(139, 105, 20, 0.3)'};
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  font-size: 0.9rem;
  color: ${props => props.selected ? '#d4af37' : '#f4e7d1'};

  &:hover {
    background: rgba(212, 175, 55, 0.15);
    border-color: #d4af37;
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
  background: ${props => props.disabled ? 'rgba(212, 175, 55, 0.3)' : 'linear-gradient(145deg, #d4af37, #b8941f)'};
  color: ${props => props.disabled ? '#8a8a8a' : '#2c1810'};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};

  &:hover:not(:disabled) {
    background: linear-gradient(145deg, #b8941f, #a0801b);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4);
  }
`;

// Helper function to parse class level 1 choices from features
const parseClassChoices = (classFeatures: any[]) => {
  const choices: { [category: string]: { options: string[], count: number } } = {};

  classFeatures.forEach(feature => {
    // Check for Eldritch Invocations (Warlock)
    if (feature.name === 'Eldritch Invocations') {
      const invocationOptions = feature.entries?.find((entry: any) => entry.type === 'options');
      if (invocationOptions) {
        choices['Eldritch Invocations'] = {
          options: invocationOptions.entries.map((entry: any) =>
            entry.optionalfeature?.split('|')[0] || 'Unknown Option'
          ).slice(0, 2), // Limit to 2 choices at level 1
          count: 2
        };
      }
    }

    // Check for Fighting Style (Fighter, Paladin, Ranger)
    if (feature.name === 'Fighting Style') {
      const styleOptions = feature.entries?.find((entry: any) => entry.type === 'options');
      if (styleOptions) {
        choices['Fighting Style'] = {
          options: styleOptions.entries.map((entry: any) =>
            entry.name || 'Unknown Style'
          ),
          count: 1
        };
      }
    }

    // Check for Metamagic (Sorcerer)
    if (feature.name === 'Metamagic' && feature.entries) {
      const metamagicOptions = feature.entries.find((entry: any) => entry.type === 'options');
      if (metamagicOptions) {
        choices['Metamagic'] = {
          options: metamagicOptions.entries.map((entry: any) =>
            entry.name || 'Unknown Metamagic'
          ),
          count: 2
        };
      }
    }

    // Check for Wild Shape (Druid)
    if (feature.name === 'Wild Shape') {
      // Druids don't typically have choices at level 1 for Wild Shape
      // But we can add this for future levels
    }

    // Check for additional class-specific features
    if (feature.entries) {
      feature.entries.forEach((entry: any) => {
        if (entry.type === 'options' && !choices[feature.name]) {
          choices[feature.name] = {
            options: entry.entries.map((opt: any) => opt.name || opt.optionalfeature?.split('|')[0] || 'Unknown'),
            count: entry.count || 1
          };
        }
      });
    }
  });

  return choices;
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
                ) : (
                  <>
                    {Object.entries(parseClassChoices(Array.isArray(currentClassData.classFeatures) ? currentClassData.classFeatures.filter((f: any) => f.level === 1) : [])).map(([category, choiceData]) => (
                      <div key={category} style={{ marginBottom: '20px' }}>
                        <ClassSkillsTitle>
                          Choose {choiceData.count} {category}:
                        </ClassSkillsTitle>
                        <ClassSkillsGrid>
                          {choiceData.options.map((option) => (
                            <ClassSkillChoice
                              key={option}
                              selected={selectedClassChoices[category]?.includes(option) || false}
                              onClick={() => onChoiceToggle(category, option, choiceData.count)}
                            >
                              {option}
                            </ClassSkillChoice>
                          ))}
                        </ClassSkillsGrid>
                        <div style={{ textAlign: 'center', marginTop: '10px', color: '#8b6914' }}>
                          Selected: {selectedClassChoices[category]?.length || 0} / {choiceData.count}
                        </div>
                      </div>
                    ))}
                    {Object.keys(parseClassChoices(Array.isArray(currentClassData.classFeatures) ? currentClassData.classFeatures.filter((f: any) => f.level === 1) : [])).length === 0 && (
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
                    disabled={!currentClassData ? false : Object.entries(parseClassChoices(Array.isArray(currentClassData.classFeatures) ? currentClassData.classFeatures.filter((f: any) => f.level === 1) : [])).some(([category, choiceData]) =>
                      (selectedClassChoices[category]?.length || 0) !== choiceData.count
                    )}
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
export { parseClassChoices };