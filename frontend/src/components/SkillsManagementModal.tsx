import React, { useState, useEffect } from 'react';
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

// Main Modal Container
const SkillsModal = styled.div`
  background: linear-gradient(135deg, #2a2520 0%, #1a1a1a 100%);
  border: 3px solid #ce9016;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
  max-width: 900px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
  padding: 20px;
  color: #f4e7d1;
  font-family: 'Cinzel', serif;
`;

const ModalTitle = styled.h2`
  color: #ce9016;
  margin: 0 0 20px 0;
  font-size: 1.4rem;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 2px solid #ce9016;
  padding-bottom: 10px;
`;

// Skills Grid
const SkillsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
`;

const SkillCard = styled.div<{ proficient?: boolean }>`
  background: ${props => props.proficient ? 'rgba(206, 144, 22, 0.2)' : 'rgba(139, 105, 20, 0.1)'};
  border: 2px solid ${props => props.proficient ? '#ce9016' : 'rgba(139, 105, 20, 0.3)'};
  border-radius: 8px;
  padding: 15px;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    background: rgba(206, 144, 22, 0.15);
    border-color: #ce9016;
    transform: translateY(-1px);
  }
`;

const SkillHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const SkillName = styled.h3`
  color: #ce9016;
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
`;

const SkillAbility = styled.span`
  color: #8b6914;
  font-size: 0.8rem;
  font-weight: 400;
  text-transform: uppercase;
`;

const ProficiencyToggle = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CheckboxWrapper = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #f4e7d1;
  font-size: 0.9rem;
  font-weight: 500;

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    appearance: none;
    border: 2px solid #8b6914;
    border-radius: 3px;
    background: transparent;
    transition: all 0.3s ease;
    position: relative;

    &:checked {
      background: #ce9016;
      border-color: #ce9016;
      box-shadow: 0 0 8px rgba(206, 144, 22, 0.5);

      &::after {
        content: '✓';
        position: absolute;
        color: #2c1810;
        font-size: 12px;
        font-weight: bold;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }
    }

    &:hover {
      border-color: #ce9016;
      background: rgba(206, 144, 22, 0.1);
    }
  }
`;

const SkillModifier = styled.div`
  margin-top: 8px;
  color: #c4b49d;
  font-size: 0.85rem;
`;

// Add Custom Skill Section
const AddSkillSection = styled.div`
  background: rgba(206, 144, 22, 0.1);
  border: 2px dashed #ce9016;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
`;

const AddSkillTitle = styled.h3`
  color: #ce9016;
  margin: 0 0 15px 0;
  font-size: 1.1rem;
  text-align: center;
`;

const AddSkillForm = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 15px;
  align-items: end;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  color: #8b6914;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 5px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Input = styled.input`
  background: rgba(139, 105, 20, 0.2);
  border: 2px solid #8b6914;
  border-radius: 6px;
  color: #f4e7d1;
  font-family: 'Crimson Text', serif;
  font-size: 1rem;
  padding: 10px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #ce9016;
    background: rgba(206, 144, 22, 0.1);
    box-shadow: 0 0 8px rgba(206, 144, 22, 0.3);
  }

  &::placeholder {
    color: rgba(244, 231, 209, 0.5);
  }
`;

const Select = styled.select`
  background: rgba(139, 105, 20, 0.2);
  border: 2px solid #8b6914;
  border-radius: 6px;
  color: #f4e7d1;
  font-family: 'Crimson Text', serif;
  font-size: 1rem;
  padding: 10px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #ce9016;
    background: rgba(206, 144, 22, 0.1);
    box-shadow: 0 0 8px rgba(206, 144, 22, 0.3);
  }

  option {
    background: #2a2520;
    color: #f4e7d1;
  }
`;

// Button Container
const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
`;

const Button = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Cinzel', serif;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const AddButton = styled(Button)`
  background: linear-gradient(145deg, #28a745, #20892c);
  color: white;

  &:hover {
    background: linear-gradient(145deg, #20892c, #1e7e34);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
  }

  &:disabled {
    background: linear-gradient(145deg, #6c757d, #5a6268);
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const CancelButton = styled(Button)`
  background: rgba(139, 69, 19, 0.8);
  color: #f4e7d1;

  &:hover {
    background: rgba(139, 69, 19, 1);
    transform: translateY(-2px);
  }
`;

const SaveButton = styled(Button)`
  background: linear-gradient(145deg, #ce9016, #b8860b);
  color: #2c1810;

  &:hover {
    background: linear-gradient(145deg, #b8860b, #a0801b);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(206, 144, 22, 0.4);
  }
`;

const DeleteSkillButton = styled.button`
  background: linear-gradient(145deg, #dc3545, #c82333);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  margin-left: 10px;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 2px 6px rgba(220, 53, 69, 0.4);
  }

  &:active {
    transform: scale(0.95);
  }
`;

// Types
interface SkillData {
  proficient: boolean;
  modifier: number;
}

interface SkillsManagementModalProps {
  isOpen: boolean;
  skills: Record<string, SkillData>;
  abilityScores: Record<string, number>;
  proficiencyBonus: number;
  onSave: (skills: Record<string, SkillData>) => void;
  onCancel: () => void;
}

// Default D&D 5e skills and their associated abilities
const DEFAULT_SKILLS = {
  'Acrobatics': 'dexterity',
  'Animal Handling': 'wisdom',
  'Arcana': 'intelligence',
  'Athletics': 'strength',
  'Deception': 'charisma',
  'History': 'intelligence',
  'Insight': 'wisdom',
  'Intimidation': 'charisma',
  'Investigation': 'intelligence',
  'Medicine': 'wisdom',
  'Nature': 'intelligence',
  'Perception': 'wisdom',
  'Performance': 'charisma',
  'Persuasion': 'charisma',
  'Religion': 'intelligence',
  'Sleight of Hand': 'dexterity',
  'Stealth': 'dexterity',
  'Survival': 'wisdom'
};

const ABILITIES = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

const calculateModifier = (score: number): number => {
  return Math.floor((score - 10) / 2);
};

const SkillsManagementModal: React.FC<SkillsManagementModalProps> = ({
  isOpen,
  skills,
  abilityScores,
  proficiencyBonus,
  onSave,
  onCancel
}) => {
  const [currentSkills, setCurrentSkills] = useState<Record<string, SkillData>>({});
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillAbility, setNewSkillAbility] = useState('dexterity');

  // Initialize with provided skills when modal opens
  useEffect(() => {
    if (isOpen) {
      // Create a complete skills object with all default skills
      const allSkills: Record<string, SkillData> = {};

      // Add default skills
      Object.keys(DEFAULT_SKILLS).forEach(skillName => {
        const ability = DEFAULT_SKILLS[skillName as keyof typeof DEFAULT_SKILLS];
        const abilityModifier = calculateModifier(abilityScores[ability] || 10);
        const isProficient = skills[skillName]?.proficient || false;
        const modifier = abilityModifier + (isProficient ? proficiencyBonus : 0);

        allSkills[skillName] = {
          proficient: isProficient,
          modifier: modifier
        };
      });

      // Add any custom skills
      Object.entries(skills).forEach(([skillName, skillData]) => {
        if (!DEFAULT_SKILLS[skillName as keyof typeof DEFAULT_SKILLS]) {
          allSkills[skillName] = { ...skillData };
        }
      });

      setCurrentSkills(allSkills);
      setNewSkillName('');
      setNewSkillAbility('dexterity');
    }
  }, [isOpen, skills, abilityScores, proficiencyBonus]);

  const handleSkillProficiencyToggle = (skillName: string) => {
    setCurrentSkills(prev => {
      const skill = prev[skillName];
      const newProficient = !skill.proficient;

      // Recalculate modifier based on proficiency
      const ability = DEFAULT_SKILLS[skillName as keyof typeof DEFAULT_SKILLS] || 'dexterity';
      const abilityModifier = calculateModifier(abilityScores[ability] || 10);
      const newModifier = abilityModifier + (newProficient ? proficiencyBonus : 0);

      return {
        ...prev,
        [skillName]: {
          proficient: newProficient,
          modifier: newModifier
        }
      };
    });
  };

  const handleAddCustomSkill = () => {
    if (!newSkillName.trim()) return;

    const abilityModifier = calculateModifier(abilityScores[newSkillAbility] || 10);

    setCurrentSkills(prev => ({
      ...prev,
      [newSkillName]: {
        proficient: false,
        modifier: abilityModifier
      }
    }));

    setNewSkillName('');
    setNewSkillAbility('dexterity');
  };

  const handleRemoveCustomSkill = (skillName: string) => {
    // Only allow removal of custom skills (not default D&D skills)
    if (DEFAULT_SKILLS[skillName as keyof typeof DEFAULT_SKILLS]) return;

    setCurrentSkills(prev => {
      const newSkills = { ...prev };
      delete newSkills[skillName];
      return newSkills;
    });
  };

  const handleSave = () => {
    onSave(currentSkills);
  };

  const getAbilityForSkill = (skillName: string): string => {
    return DEFAULT_SKILLS[skillName as keyof typeof DEFAULT_SKILLS] || 'dexterity';
  };

  const isDefaultSkill = (skillName: string): boolean => {
    return !!DEFAULT_SKILLS[skillName as keyof typeof DEFAULT_SKILLS];
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay isOpen={isOpen} onClick={(e) => {
      if (e.target === e.currentTarget) {
        onCancel();
      }
    }}>
      <SkillsModal>
        <ModalTitle>🎯 Manage Skills & Proficiencies</ModalTitle>

        <SkillsGrid>
          {Object.entries(currentSkills).map(([skillName, skillData]) => (
            <SkillCard
              key={skillName}
              proficient={skillData.proficient}
              onClick={() => handleSkillProficiencyToggle(skillName)}
            >
              <SkillHeader>
                <div>
                  <SkillName>{skillName}</SkillName>
                  <SkillAbility>
                    {getAbilityForSkill(skillName).substring(0, 3).toUpperCase()}
                  </SkillAbility>
                </div>
                {!isDefaultSkill(skillName) && (
                  <DeleteSkillButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveCustomSkill(skillName);
                    }}
                    title="Remove custom skill"
                  >
                    ✕
                  </DeleteSkillButton>
                )}
              </SkillHeader>

              <ProficiencyToggle onClick={(e) => e.stopPropagation()}>
                <CheckboxWrapper>
                  <input
                    type="checkbox"
                    checked={skillData.proficient}
                    onChange={() => handleSkillProficiencyToggle(skillName)}
                  />
                  Proficient
                </CheckboxWrapper>
              </ProficiencyToggle>

              <SkillModifier>
                Modifier: {skillData.modifier >= 0 ? '+' : ''}{skillData.modifier}
                {skillData.proficient && (
                  <span style={{ color: '#ce9016', marginLeft: '8px' }}>
                    (includes proficiency bonus)
                  </span>
                )}
              </SkillModifier>
            </SkillCard>
          ))}
        </SkillsGrid>

        {/* Add Custom Skill Section */}
        <AddSkillSection>
          <AddSkillTitle>➕ Add Custom Skill</AddSkillTitle>
          <AddSkillForm>
            <FormGroup>
              <Label>Skill Name</Label>
              <Input
                type="text"
                value={newSkillName}
                placeholder="e.g., Gaming, Sailing, Engineering"
                onChange={(e) => setNewSkillName(e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <Label>Associated Ability</Label>
              <Select
                value={newSkillAbility}
                onChange={(e) => setNewSkillAbility(e.target.value)}
              >
                {ABILITIES.map(ability => (
                  <option key={ability} value={ability}>
                    {ability.charAt(0).toUpperCase() + ability.slice(1)}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <AddButton
              onClick={handleAddCustomSkill}
              disabled={!newSkillName.trim()}
            >
              Add Skill
            </AddButton>
          </AddSkillForm>
        </AddSkillSection>

        {/* Modal Actions */}
        <ButtonContainer>
          <CancelButton onClick={onCancel}>
            Cancel
          </CancelButton>
          <SaveButton onClick={handleSave}>
            Save Changes
          </SaveButton>
        </ButtonContainer>
      </SkillsModal>
    </ModalOverlay>
  );
};

export default SkillsManagementModal;