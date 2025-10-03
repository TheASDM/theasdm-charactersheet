import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { StepContainer } from '../../styles/components/CharacterGeneratorWizard.styles';
import { CharacterBuilderData } from '../CharacterGeneratorWizard';
import backgroundService from '../../services/backgroundService';
import { Background } from '../../types/api';

interface Step3ABackgroundSelectionProps {
  data: CharacterBuilderData;
  onUpdate: (updates: Partial<CharacterBuilderData>) => void;
  onAdvance?: () => void;
}


const BackgroundGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-top: 1rem;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const BackgroundCard = styled.div<{ selected: boolean }>`
  background: rgba(26, 26, 26, 0.8);
  border: 2px solid ${props => props.selected ? '#d4af37' : '#444'};
  border-radius: 6px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 140px;
  display: flex;
  flex-direction: column;

  &:hover {
    border-color: #d4af37;
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(212, 175, 55, 0.3);
  }

  ${props => props.selected && `
    background: rgba(212, 175, 55, 0.1);
    box-shadow: 0 3px 8px rgba(212, 175, 55, 0.4);
  `}
`;

const BackgroundName = styled.h3`
  color: #d4af37;
  margin: 0 0 0.25rem 0;
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  text-align: center;
`;

const BackgroundDescription = styled.p`
  color: #ccc;
  font-size: 0.75rem;
  line-height: 1.2;
  margin: 0 0 0.5rem 0;
  text-align: center;
  flex: 1;
`;

const BackgroundFeatures = styled.div`
  .feature-title {
    color: #d4af37;
    font-weight: 600;
    font-size: 0.7rem;
    margin-bottom: 0.1rem;
  }

  .feature-list {
    color: #aaa;
    font-size: 0.65rem;
    line-height: 1.2;
  }

  .ability-score-main {
    color: #aaa;
    font-size: 0.65rem;
    line-height: 1.2;
  }

  .ability-score-rules {
    color: #d4af37;
    font-size: 0.6rem;
    font-style: italic;
    margin-top: 0.1rem;
  }
`;

const BackgroundSelectionInfo = styled.div`
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 1rem;

  h4 {
    color: #d4af37;
    margin: 0 0 0.25rem 0;
    font-size: 1rem;
  }

  p {
    color: #ccc;
    margin: 0;
    font-size: 0.85rem;
  }
`;

const LoadingSpinner = styled.div`
  text-align: center;
  color: #d4af37;
  padding: 2rem;
  font-size: 1.1rem;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border: 2px solid #d4af37;
  border-radius: 12px;
  padding: 2rem;
  max-width: 900px;
  width: 100%;
  color: #f0f0f0;

  h2 {
    font-family: 'Cinzel', serif;
    color: #d4af37;
    font-size: 1.8rem;
    margin: 0 0 1rem 0;
    text-align: center;
  }

  .background-description {
    color: #ccc;
    text-align: center;
    margin-bottom: 1.5rem;
    font-size: 1rem;
  }
`;

const ModalSection = styled.div`
  margin-bottom: 1.5rem;

  h3 {
    color: #d4af37;
    font-size: 1.1rem;
    margin: 0 0 0.5rem 0;
    font-weight: 600;
  }

  .section-content {
    color: #ccc;
    font-size: 0.9rem;
    line-height: 1.4;
  }
`;

const AbilityScoreAllocation = styled.div`
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;

  h3 {
    color: #d4af37;
    font-size: 1.1rem;
    margin: 0 0 0.75rem 0;
    text-align: center;
  }

  .allocation-description {
    color: #ccc;
    font-size: 0.85rem;
    text-align: center;
    margin-bottom: 1rem;
  }

  .abilities-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }

  .ability-option {
    text-align: center;

    .ability-name {
      color: #d4af37;
      font-weight: 600;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }

    .allocation-buttons {
      display: flex;
      justify-content: center;
      gap: 0.25rem;
    }

    .allocation-btn {
      width: 32px;
      height: 32px;
      border: 2px solid #444;
      background: rgba(26, 26, 26, 0.8);
      color: #ccc;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-weight: 600;
      font-size: 0.9rem;

      &:hover {
        border-color: #d4af37;
      }

      &.selected {
        background: linear-gradient(145deg, #d4af37, #b8941f);
        border-color: #d4af37;
        color: #1a1a1a;
      }

      &.disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
    }
  }
`;

const ModalButtons = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 2rem;

  button {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 0.5px;

    &.btn-cancel {
      background: linear-gradient(145deg, #4a4a4a, #3a3a3a);
      color: #f0f0f0;
      flex: 1;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
      }
    }

    &.btn-confirm {
      background: linear-gradient(145deg, #d4af37, #b8941f);
      color: #1a1a1a;
      flex: 2;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(212, 175, 55, 0.4);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none !important;
      }
    }
  }
`;

const LanguageSelection = styled.div`
  margin-bottom: 1.5rem;

  .languages-description {
    color: #d4af37;
    font-size: 1.1rem;
    text-align: center;
    margin-bottom: 1rem;
    font-weight: 600;
  }

  .languages-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
    margin-bottom: 1rem;

    @media (max-width: 800px) {
      grid-template-columns: repeat(3, 1fr);
    }

    @media (max-width: 600px) {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .language-option {
    background: rgba(26, 26, 26, 0.8);
    border: 2px solid #444;
    border-radius: 6px;
    padding: 0.75rem;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: center;
    font-size: 0.9rem;
    color: #ccc;

    &:hover {
      border-color: #d4af37;
    }

    &.selected {
      background: linear-gradient(145deg, #d4af37, #b8941f);
      border-color: #d4af37;
      color: #1a1a1a;
      font-weight: 600;
    }

    &.disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
  }

  .selection-count {
    text-align: center;
    color: #d4af37;
    font-size: 0.9rem;
    margin-bottom: 1rem;
    font-weight: 600;
  }
`;

// D&D 2024 Standard Languages
const STANDARD_LANGUAGES = [
  'Common', 'Draconic', 'Dwarvish', 'Elvish', 'Giant', 'Gnomish', 'Goblin',
  'Halfling', 'Orc', 'Abyssal', 'Celestial', 'Deep Speech', 'Infernal',
  'Primordial', 'Sylvan', 'Undercommon'
];

export const Step3ABackgroundSelection: React.FC<Step3ABackgroundSelectionProps> = ({
  data,
  onUpdate,
  onAdvance
}) => {
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBackgroundForModal, setSelectedBackgroundForModal] = useState<Background | null>(null);
  const [abilityScoreAllocations, setAbilityScoreAllocations] = useState<{ [ability: string]: number }>({});
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  useEffect(() => {
    fetchBackgrounds();
  }, []);

  const fetchBackgrounds = async () => {
    try {
      setIsLoading(true);
      const response = await backgroundService.getAll();
      if (response.data) {
        setBackgrounds(response.data);
      } else {
        setError(response.error || 'Failed to load backgrounds');
      }
    } catch (err) {
      console.error('Error fetching backgrounds:', err);
      setError('Failed to load backgrounds');
    } finally {
      setIsLoading(false);
    }
  };


  const handleBackgroundClick = (background: Background) => {
    setSelectedBackgroundForModal(background);
    // Initialize ability score allocations to all 0
    if (background.abilityScoreIncrease && 'options' in background.abilityScoreIncrease && Array.isArray(background.abilityScoreIncrease.options)) {
      const initialAllocations: { [ability: string]: number } = {};
      (background.abilityScoreIncrease.options as string[]).forEach((ability: string) => {
        initialAllocations[ability] = 0;
      });
      setAbilityScoreAllocations(initialAllocations);
    }
    // Reset language selection
    setSelectedLanguages([]);
  };

  const handleAbilityScoreAllocation = (ability: string, value: number) => {
    if (!selectedBackgroundForModal?.abilityScoreIncrease?.options) return;

    const newAllocations = { ...abilityScoreAllocations };

    // If clicking the same value, toggle it off
    if (newAllocations[ability] === value) {
      newAllocations[ability] = 0;
    } else {
      newAllocations[ability] = value;
    }

    // Validate allocation rules
    const totalPoints = Object.values(newAllocations).reduce((sum, val) => sum + val, 0);
    const hasTwo = Object.values(newAllocations).includes(2);
    const hasOne = Object.values(newAllocations).includes(1);

    // Rule validation: Either (one +2 and one +1) OR (all three +1)
    const isValid =
      (totalPoints === 3 && hasTwo && hasOne) || // 2+1+0 = 3
      (totalPoints === 3 && !hasTwo && Object.values(newAllocations).every(val => val <= 1)); // 1+1+1 = 3

    if (isValid || totalPoints <= 3) {
      setAbilityScoreAllocations(newAllocations);
    }
  };

  const isAllocationValid = () => {
    const totalPoints = Object.values(abilityScoreAllocations).reduce((sum, val) => sum + val, 0);
    const hasTwo = Object.values(abilityScoreAllocations).includes(2);
    const hasOne = Object.values(abilityScoreAllocations).includes(1);

    return (totalPoints === 3 && hasTwo && hasOne) ||
           (totalPoints === 3 && !hasTwo && Object.values(abilityScoreAllocations).every(val => val <= 1));
  };

  const canSelectValue = (ability: string, value: number): boolean => {
    if (abilityScoreAllocations[ability] === value) return true; // Can always deselect

    const otherAllocations = { ...abilityScoreAllocations };
    delete otherAllocations[ability];
    const currentTotal = Object.values(otherAllocations).reduce((sum, val) => sum + val, 0);

    // Can't exceed 3 total points
    if (currentTotal + value > 3) return false;

    // If trying to select 2, check if another ability already has 2
    if (value === 2 && Object.values(otherAllocations).includes(2)) return false;

    return true;
  };


  const closeModal = () => {
    setSelectedBackgroundForModal(null);
    setAbilityScoreAllocations({});
    setSelectedLanguages([]);
  };

  const handleLanguageSelection = (language: string) => {
    setSelectedLanguages(prev => {
      if (prev.includes(language)) {
        // Remove language if already selected
        return prev.filter(lang => lang !== language);
      } else if (prev.length < 2) {
        // Add language if under limit
        return [...prev, language];
      }
      // Can't add more than 2 languages
      return prev;
    });
  };

  const canSelectLanguage = (language: string): boolean => {
    return selectedLanguages.includes(language) || selectedLanguages.length < 2;
  };

  const renderOriginFeat = (): React.ReactNode => {
    const originFeat = selectedBackgroundForModal?.originFeat;
    if (originFeat && typeof originFeat === 'string') {
      return (
        <ModalSection>
          <h3>Origin Feat</h3>
          <div className="section-content">
            {originFeat}
          </div>
        </ModalSection>
      );
    }
    return null;
  };

  const renderAbilityScoreAllocation = (): React.ReactNode => {
    if (!selectedBackgroundForModal?.abilityScoreIncrease ||
        !('options' in selectedBackgroundForModal.abilityScoreIncrease) ||
        !Array.isArray(selectedBackgroundForModal.abilityScoreIncrease.options)) {
      return null;
    }

    const options = selectedBackgroundForModal.abilityScoreIncrease.options as string[];

    return (
      <AbilityScoreAllocation>
        <h3>Ability Score Increase</h3>
        <div className="allocation-description">
          Choose either: +2 to one ability and +1 to another, OR +1 to all three abilities
        </div>

        <div className="abilities-grid">
          {options.map((ability: string) => {
            const abilityName = ability === 'str' ? 'Strength' :
                               ability === 'dex' ? 'Dexterity' :
                               ability === 'con' ? 'Constitution' :
                               ability === 'int' ? 'Intelligence' :
                               ability === 'wis' ? 'Wisdom' :
                               ability === 'cha' ? 'Charisma' : ability.toUpperCase();

            return (
              <div key={ability} className="ability-option">
                <div className="ability-name">{abilityName}</div>
                <div className="allocation-buttons">
                  {[2, 1, 0].map((value) => (
                    <button
                      key={value}
                      className={`allocation-btn ${
                        abilityScoreAllocations[ability] === value ? 'selected' : ''
                      } ${
                        !canSelectValue(ability, value) ? 'disabled' : ''
                      }`}
                      onClick={() => handleAbilityScoreAllocation(ability, value)}
                      disabled={!canSelectValue(ability, value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </AbilityScoreAllocation>
    );
  };

  const confirmBackgroundSelection = () => {
    if (selectedBackgroundForModal && isAllocationValid() && selectedLanguages.length === 2) {
      // Extract background skill proficiencies
      const extractSkillProficiencies = (skillProfs?: any): string[] => {
        if (!skillProfs) return [];
        if (typeof skillProfs === 'object') {
          // Properly capitalize skill names to match D&D conventions
          const skillNameMap: { [key: string]: string } = {
            'acrobatics': 'Acrobatics',
            'animal handling': 'Animal Handling',
            'arcana': 'Arcana',
            'athletics': 'Athletics',
            'deception': 'Deception',
            'history': 'History',
            'insight': 'Insight',
            'intimidation': 'Intimidation',
            'investigation': 'Investigation',
            'medicine': 'Medicine',
            'nature': 'Nature',
            'perception': 'Perception',
            'performance': 'Performance',
            'persuasion': 'Persuasion',
            'religion': 'Religion',
            'sleight of hand': 'Sleight of Hand',
            'stealth': 'Stealth',
            'survival': 'Survival'
          };

          return Object.keys(skillProfs)
            .filter(skill => skillProfs[skill])
            .map(skill => skillNameMap[skill.toLowerCase()] || skill);
        }
        return [];
      };

      // Extract background starting equipment (using actual equipment structure)
      const extractStartingEquipment = (equipment?: any): string[] => {
        if (!equipment || !Array.isArray(equipment)) return [];

        const items: string[] = [];
        equipment.forEach((equip: any) => {
          if (equip.item && equip.item.A && Array.isArray(equip.item.A)) {
            equip.item.A.forEach((item: any) => {
              if (item.value) {
                // Skip gold values as requested
                return;
              }
              if (item.item && typeof item.item === 'string') {
                const itemName = item.item.split('|')[0];
                const displayName = item.displayName || itemName;
                const quantity = item.quantity ? `${item.quantity}x ` : '';
                const cleaned = displayName
                  .replace(/[']/g, "'")
                  .split(' ')
                  .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ');
                items.push(`${quantity}${cleaned}`);
              }
            });
          }
        });

        return items;
      };

      // Extract tool proficiencies from equipment
      const extractToolProficiencies = (equipment?: any): string[] => {
        if (!equipment || !Array.isArray(equipment)) return [];

        const tools: string[] = [];
        equipment.forEach((equip: any) => {
          if (equip.item && equip.item.A && Array.isArray(equip.item.A)) {
            equip.item.A.forEach((item: any) => {
              if (item.item && typeof item.item === 'string') {
                const itemName = item.item.split('|')[0];
                if (itemName.includes('supplies') ||
                    itemName.includes('kit') ||
                    itemName.includes('tools') ||
                    itemName.includes('instrument')) {
                  const cleaned = itemName
                    .replace(/[']/g, "'")
                    .split(' ')
                    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                  tools.push(cleaned);
                }
              }
            });
          }
        });

        return tools;
      };

      // Extract background features
      const extractBackgroundFeatures = (feature?: any): any[] => {
        if (!feature) return [];
        if (Array.isArray(feature)) return feature;
        return [feature];
      };

      onUpdate({
        selectedBackground: selectedBackgroundForModal.name,
        backgroundAbilityScoreAllocations: abilityScoreAllocations,
        selectedLanguages: selectedLanguages,

        // Extract and store all background data
        backgroundSkillProficiencies: extractSkillProficiencies(selectedBackgroundForModal.skillProficiencies),
        backgroundToolProficiencies: extractToolProficiencies(selectedBackgroundForModal.equipment),
        backgroundStartingEquipment: extractStartingEquipment(selectedBackgroundForModal.equipment),
        backgroundFeatures: extractBackgroundFeatures(selectedBackgroundForModal.feature)
      });
      closeModal();

      // Automatically advance to next step
      if (onAdvance) {
        setTimeout(() => onAdvance(), 300); // Small delay for smooth UX
      }
    }
  };

  const getSkillProficiencyList = (skillProfs?: { [key: string]: boolean }): string => {
    if (!skillProfs) return 'None';
    const skills = Object.keys(skillProfs).filter(skill => skillProfs[skill]);
    return skills.length > 0 ? skills.map(skill =>
      skill.charAt(0).toUpperCase() + skill.slice(1)
    ).join(', ') : 'None';
  };

  const getAbilityScoreInfo = (abilityScoreIncrease?: any): { abilities: string; rules: string } => {
    if (!abilityScoreIncrease || !abilityScoreIncrease.options) {
      return { abilities: 'None', rules: '' };
    }

    const abilities = abilityScoreIncrease.options.map((ability: string) => {
      switch (ability) {
        case 'str': return 'Strength';
        case 'dex': return 'Dexterity';
        case 'con': return 'Constitution';
        case 'int': return 'Intelligence';
        case 'wis': return 'Wisdom';
        case 'cha': return 'Charisma';
        default: return ability.toUpperCase();
      }
    });

    // D&D 2024 background ability score rules
    const abilityNames = abilities.join(', ');
    let rules = '';

    if (abilities.length === 3) {
      rules = '(increase one by 2 and one by 1 or all 3 by 1)';
    } else if (abilities.length === 2) {
      rules = '(increase one by 2 and one by 1)';
    }

    return { abilities: abilityNames, rules };
  };

  const getLanguageInfo = (languages: string[]): string => {
    if (!languages || languages.length === 0) return 'Choose 2 languages';
    return languages.join(', ');
  };

  const getToolProficiencies = (equipment?: any): string => {
    if (!equipment || !Array.isArray(equipment)) return 'None';

    const tools: string[] = [];
    equipment.forEach((equip: any) => {
      if (equip.item && equip.item.A && Array.isArray(equip.item.A)) {
        equip.item.A.forEach((item: any) => {
          if (item.item && typeof item.item === 'string') {
            const itemName = item.item.split('|')[0]; // Remove source
            if (itemName.includes('supplies') ||
                itemName.includes('kit') ||
                itemName.includes('tools') ||
                itemName.includes('instrument')) {
              // Clean up and format
              const cleaned = itemName
                .replace(/[']/g, "'")
                .split(' ')
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
              tools.push(cleaned);
            }
          }
        });
      }
    });

    return tools.length > 0 ? tools.join(', ') : 'None';
  };

  const getStartingEquipment = (equipment?: any): string => {
    if (!equipment || !Array.isArray(equipment)) return 'None';

    const items: string[] = [];
    equipment.forEach((equip: any) => {
      if (equip.item && equip.item.A && Array.isArray(equip.item.A)) {
        equip.item.A.forEach((item: any) => {
          if (item.value) {
            // Skip gold values as requested
            return;
          }
          if (item.item && typeof item.item === 'string') {
            const itemName = item.item.split('|')[0];
            const displayName = item.displayName || itemName;
            const quantity = item.quantity ? `${item.quantity}x ` : '';
            const cleaned = displayName
              .replace(/[']/g, "'")
              .split(' ')
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            items.push(`${quantity}${cleaned}`);
          }
        });
      }
    });

    return items.length > 0 ? items.join(', ') : 'None';
  };

  if (isLoading) {
    return (
      <StepContainer>
        <div className="step-title">Background</div>
        <LoadingSpinner>Loading backgrounds...</LoadingSpinner>
      </StepContainer>
    );
  }

  if (error) {
    return (
      <StepContainer>
        <div className="step-title">Background</div>
        <div style={{ textAlign: 'center', color: '#ff6b6b', padding: '2rem' }}>
          Error: {error}
        </div>
      </StepContainer>
    );
  }

  return (
    <StepContainer>
      <div className="step-title">Background</div>
      <div className="step-description">
        Choose your character's background, which represents their life before becoming an adventurer.
      </div>

      <div className="step-content">
        <BackgroundSelectionInfo>
          <h4>D&D 2024 Backgrounds</h4>
          <p>
            In D&D 2024, backgrounds provide skill proficiencies, languages, equipment, and an Ability Score Increase.
            Each background also grants access to specific Origin Feats.
          </p>
        </BackgroundSelectionInfo>

        <BackgroundGrid>
          {backgrounds.map((background) => (
            <BackgroundCard
              key={background.id}
              selected={data.selectedBackground === background.name}
              onClick={() => handleBackgroundClick(background)}
            >
              <BackgroundName>{background.name}</BackgroundName>

              <BackgroundDescription>
                {background.description || `A ${background.name.toLowerCase()} background with unique skills and experiences.`}
              </BackgroundDescription>

              <BackgroundFeatures>
                <div className="feature-title">Skills:</div>
                <div className="feature-list">{getSkillProficiencyList(background.skillProficiencies)}</div>

                <div className="feature-title">Tool Proficiency:</div>
                <div className="feature-list">{getToolProficiencies(background.equipment)}</div>

                <div className="feature-title">Starting Equipment:</div>
                <div className="feature-list">{getStartingEquipment(background.equipment)}</div>

                <div className="feature-title">Languages:</div>
                <div className="feature-list">{getLanguageInfo(background.languages)}</div>

                <div className="feature-title">Ability Score Increase:</div>
                <div className="ability-score-main">{getAbilityScoreInfo(background.abilityScoreIncrease).abilities}</div>
                {getAbilityScoreInfo(background.abilityScoreIncrease).rules && (
                  <div className="ability-score-rules">{getAbilityScoreInfo(background.abilityScoreIncrease).rules}</div>
                )}

                {background.originFeat && (
                  <>
                    <div className="feature-title">Origin Feat:</div>
                    <div className="feature-list">{background.originFeat}</div>
                  </>
                )}
              </BackgroundFeatures>
            </BackgroundCard>
          ))}
        </BackgroundGrid>


        {!data.selectedBackground && (
          <div style={{
            marginTop: '1.5rem',
            textAlign: 'center',
            color: '#888',
            fontSize: '0.9rem'
          }}>
            💡 Tip: Consider how your background's skills complement your class abilities.
          </div>
        )}
      </div>

      {/* Background Selection Modal */}
      {selectedBackgroundForModal && (
        <ModalOverlay onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <h2>{selectedBackgroundForModal.name}</h2>

            {selectedBackgroundForModal.description && (
              <div className="background-description">
                {selectedBackgroundForModal.description}
              </div>
            )}

            {/* Language Selection */}
            <LanguageSelection>
              <div className="languages-description">
                Choose 2 languages
              </div>

              <div className="selection-count">
                Selected: {selectedLanguages.length} / 2
              </div>

              <div className="languages-grid">
                {STANDARD_LANGUAGES.map((language) => (
                  <div
                    key={language}
                    className={`language-option ${
                      selectedLanguages.includes(language) ? 'selected' : ''
                    } ${
                      !canSelectLanguage(language) ? 'disabled' : ''
                    }`}
                    onClick={() => canSelectLanguage(language) && handleLanguageSelection(language)}
                  >
                    {language}
                  </div>
                ))}
              </div>
            </LanguageSelection>

            {renderOriginFeat()}


            {/* Ability Score Allocation */}
            {renderAbilityScoreAllocation()}

            {/* Small skill proficiencies at bottom */}
            <div style={{
              textAlign: 'center',
              fontSize: '0.7rem',
              color: '#888',
              marginTop: '1rem',
              marginBottom: '1rem'
            }}>
              <strong>Skills:</strong> {getSkillProficiencyList(selectedBackgroundForModal.skillProficiencies)}
            </div>

            <ModalButtons>
              <button className="btn-cancel" onClick={closeModal}>
                Cancel
              </button>
              <button
                className="btn-confirm"
                onClick={confirmBackgroundSelection}
                disabled={!isAllocationValid() || selectedLanguages.length !== 2}
              >
                Select Background
              </button>
            </ModalButtons>
          </ModalContent>
        </ModalOverlay>
      )}

    </StepContainer>
  );
};