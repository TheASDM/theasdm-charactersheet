import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { StepContainer } from '../../styles/components/CharacterGeneratorWizard.styles';
import { CharacterBuilderData } from '../CharacterGeneratorWizard';
import { listBackgrounds } from '@/services/backgroundService';
import { Background } from '../../types/api';
import { useApiCall } from '@/hooks/useApiCall';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import LoadingSpinner from '@/components/LoadingSpinner';
import { CompactList } from '../wizard/CompactList';
import { DetailsModal } from '../wizard/DetailsModal';
import { SelectModal } from '../wizard/SelectModal';
import { parseComplexDnDEntry } from '@/utils/dndTemplateParser';
import { extractBackgroundFlavorText } from '@/utils/flavorTextExtractor';

interface Step3ABackgroundSelectionProps {
  data: CharacterBuilderData;
  onUpdate: (updates: Partial<CharacterBuilderData>) => void;
}

const STANDARD_LANGUAGES = [
  'Common', 'Dwarvish', 'Elvish', 'Giant', 'Gnomish', 'Goblin',
  'Halfling', 'Orc', 'Abyssal', 'Celestial', 'Deep Speech', 'Draconic',
  'Infernal', 'Primordial', 'Sylvan', 'Undercommon'
];

// Styled components for configuration inside SelectModal
const ConfigSection = styled.div`
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h3`
  color: #ce9016;
  font-size: 1rem;
  margin: 0 0 0.75rem 0;
  font-family: 'Cinzel', serif;
`;

const SelectionCount = styled.div`
  color: #999;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
`;

const LanguageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.5rem;
`;

const LanguageOption = styled.div<{ $isSelected: boolean; $isDisabled: boolean }>`
  padding: 0.5rem;
  background: ${props => props.$isSelected ? 'rgba(206, 144, 22, 0.2)' : 'rgba(60, 60, 60, 0.6)'};
  border: 1px solid ${props => props.$isSelected ? '#ce9016' : 'rgba(206, 144, 22, 0.3)'};
  border-radius: 4px;
  text-align: center;
  cursor: ${props => props.$isDisabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.$isDisabled ? 0.4 : 1};
  transition: all 0.2s ease;
  font-size: 0.875rem;
  color: ${props => props.$isSelected ? '#ce9016' : '#ccc'};

  &:hover {
    ${props => !props.$isDisabled && `
      background: rgba(206, 144, 22, 0.15);
      border-color: #ce9016;
    `}
  }
`;

const AbilityScoreGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const AbilityBox = styled.div`
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid rgba(206, 144, 22, 0.3);
  border-radius: 6px;
  padding: 0.75rem;
  text-align: center;
`;

const AbilityLabel = styled.div`
  color: #ce9016;
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
`;

const AbilityControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const AbilityButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 4px;
  border: none;
  background: rgba(206, 144, 22, 0.2);
  color: #ce9016;
  font-size: 1.25rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: rgba(206, 144, 22, 0.3);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

const AbilityValue = styled.div`
  font-size: 1.25rem;
  font-weight: 600;
  color: #fff;
  min-width: 32px;
`;

const DetailsContent = styled.div`
  color: #ccc;
  line-height: 1.6;

  h3 {
    color: #ce9016;
    font-family: 'Cinzel', serif;
    font-size: 1.1rem;
    margin: 1.5rem 0 0.75rem 0;
  }

  p {
    margin: 0.75rem 0;
  }

  ul {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
  }

  li {
    margin: 0.25rem 0;
  }
`;

const FeatureLabel = styled.span`
  color: #ce9016;
  font-weight: 600;
`;

export const Step3ABackgroundSelection: React.FC<Step3ABackgroundSelectionProps> = ({
  data,
  onUpdate,
}) => {
  const { scrollToBottom } = useAutoScroll();
  const {
    data: fetchedBackgrounds,
    error,
    isLoading,
    execute: fetchBackgrounds,
  } = useApiCall(listBackgrounds);

  const [detailsBackground, setDetailsBackground] = useState<Background | null>(null);
  const [selectBackground, setSelectBackground] = useState<Background | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [abilityScoreAllocations, setAbilityScoreAllocations] = useState<{ [ability: string]: number }>({});

  useEffect(() => {
    fetchBackgrounds();
  }, [fetchBackgrounds]);

  // Auto-scroll when background is selected
  useEffect(() => {
    if (data.selectedBackground) {
      scrollToBottom({ offset: 20 });
    }
  }, [data.selectedBackground, scrollToBottom]);

  const backgrounds = fetchedBackgrounds ?? [];

  const handleDetailsClick = (background: Background) => {
    setDetailsBackground(background);
  };

  const handleSelectClick = (background: Background) => {
    setSelectBackground(background);

    // Initialize allocations - parse from mechanics.ability
    const initialAllocations: { [ability: string]: number } = {};
    const mechanics = background.mechanics as any;
    if (mechanics?.ability && Array.isArray(mechanics.ability)) {
      // Find the ability entry with choose structure
      const abilityEntry = mechanics.ability.find((entry: any) => entry.choose);
      let abilities: string[] = [];

      // Check for weighted.from structure first (D&D 2024 format)
      if (abilityEntry?.choose?.weighted?.from && Array.isArray(abilityEntry.choose.weighted.from)) {
        abilities = abilityEntry.choose.weighted.from;
      }
      // Fallback to plain choose.from
      else if (abilityEntry?.choose?.from && Array.isArray(abilityEntry.choose.from)) {
        abilities = abilityEntry.choose.from;
      }

      abilities.forEach((ability: string) => {
        initialAllocations[ability.toLowerCase()] = 0;
      });
    }
    setAbilityScoreAllocations(initialAllocations);
    setSelectedLanguages([]);
  };

  const handleLanguageToggle = (language: string) => {
    if (selectedLanguages.includes(language)) {
      setSelectedLanguages(selectedLanguages.filter(l => l !== language));
    } else if (selectedLanguages.length < 2) {
      setSelectedLanguages([...selectedLanguages, language]);
    }
  };

  const canSelectLanguage = (language: string): boolean => {
    // Common cannot be selected (all characters know Common by default)
    if (language === 'Common') return false;
    return selectedLanguages.includes(language) || selectedLanguages.length < 2;
  };

  const handleAbilityScoreChange = (ability: string, delta: number) => {
    const newValue = (abilityScoreAllocations[ability] || 0) + delta;
    if (newValue >= 0) {
      setAbilityScoreAllocations({
        ...abilityScoreAllocations,
        [ability]: newValue,
      });
    }
  };

  const getTotalPointsAllocated = (): number => {
    return Object.values(abilityScoreAllocations).reduce((sum, val) => sum + val, 0);
  };

  const isAllocationValid = (): boolean => {
    if (!selectBackground) return true;

    // Parse from mechanics.ability
    const mechanics = selectBackground.mechanics as any;
    if (mechanics?.ability && Array.isArray(mechanics.ability)) {
      const abilityEntry = mechanics.ability.find((entry: any) => entry.choose);
      if (abilityEntry?.choose?.count) {
        // D&D 2024 backgrounds allocate 3 points total (+2/+1 or +1/+1/+1)
        return getTotalPointsAllocated() === 3;
      }
    }
    return true;
  };

  const handleConfirmSelection = () => {
    if (!selectBackground) return;

    const normalizeSkill = (skill: string) =>
      skill
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    const extractBackgroundSkills = (): string[] => {
      const result: string[] = [];
      const skillData = selectBackground.skillProficiencies as unknown;

      const addSkill = (value: unknown) => {
        if (!value) return;
        if (typeof value === 'string') {
          result.push(normalizeSkill(value));
        } else if (typeof value === 'object' && 'item' in (value as Record<string, unknown>)) {
          const itemValue = (value as { item?: string }).item;
          if (typeof itemValue === 'string') {
            result.push(normalizeSkill(itemValue));
          }
        }
      };

      if (!skillData) {
        return result;
      }

      if (Array.isArray(skillData)) {
        // Check if the array contains objects with boolean skill flags
        // e.g., [{ persuasion: true, investigation: true }]
        skillData.forEach(item => {
          if (typeof item === 'object' && item !== null) {
            const itemRecord = item as Record<string, unknown>;
            Object.entries(itemRecord).forEach(([key, value]) => {
              if (typeof value === 'boolean' && value) {
                result.push(normalizeSkill(key));
              }
            });
          } else {
            addSkill(item);
          }
        });
        return result;
      }

      if (typeof skillData === 'object') {
        const record = skillData as Record<string, unknown>;

        if (record.choose && typeof record.choose === 'object') {
          const choose = record.choose as { from?: unknown[] };
          if (Array.isArray(choose.from)) {
            choose.from.forEach(addSkill);
          }
        }

        Object.entries(record).forEach(([key, value]) => {
          if (key === 'choose') return;

          if (typeof value === 'boolean' && value) {
            result.push(normalizeSkill(key));
          } else if (Array.isArray(value)) {
            value.forEach(addSkill);
          }
        });
      }

      return result;
    };

    const backgroundSkills = extractBackgroundSkills();
    const uniqueBackgroundSkills = Array.from(new Set(backgroundSkills));

    // Update with selected background data
    onUpdate({
      selectedBackground: selectBackground.name,
      selectedLanguages: selectedLanguages,
      backgroundAbilityScoreAllocations: abilityScoreAllocations,
      backgroundStartingEquipment: selectBackground.equipment || [],
      backgroundFeatures: selectBackground.feature
        ? (Array.isArray(selectBackground.feature) ? selectBackground.feature : [selectBackground.feature])
        : [],
      backgroundSkillProficiencies: uniqueBackgroundSkills,
    });

    setSelectBackground(null);
  };

  const renderBackgroundDetails = (background: Background) => {
    // Parse ASI from mechanics.ability
    const mechanics = background.mechanics as any;
    let asiOptions: string[] = [];
    if (mechanics?.ability && Array.isArray(mechanics.ability)) {
      const abilityEntry = mechanics.ability.find((entry: any) => entry.choose);
      // Check for weighted.from structure first (D&D 2024 format)
      if (abilityEntry?.choose?.weighted?.from && Array.isArray(abilityEntry.choose.weighted.from)) {
        asiOptions = abilityEntry.choose.weighted.from.map((a: string) => a.toUpperCase());
      }
      // Fallback to plain choose.from
      else if (abilityEntry?.choose?.from && Array.isArray(abilityEntry.choose.from)) {
        asiOptions = abilityEntry.choose.from.map((a: string) => a.toUpperCase());
      }
    }

    // Parse skills from mechanics.skillProficiencies
    let skills: string[] = [];
    if (mechanics?.skillProficiencies && Array.isArray(mechanics.skillProficiencies) && mechanics.skillProficiencies[0]) {
      const skillsObj = mechanics.skillProficiencies[0];
      skills = Object.keys(skillsObj).filter(key => skillsObj[key] === true);
    }

    // Parse tool proficiencies from mechanics.toolProficiencies
    let tools: string[] = [];
    if (mechanics?.toolProficiencies && Array.isArray(mechanics.toolProficiencies) && mechanics.toolProficiencies[0]) {
      const toolsObj = mechanics.toolProficiencies[0];
      tools = Object.entries(toolsObj)
        .filter(([_, value]) => value)
        .map(([key, value]) => {
          // Handle special tool names
          if (key === 'anyMusicalInstrument') return `Any Musical Instrument (${value})`;
          if (key === 'anyArtisansTool') return `Any Artisan's Tool (${value})`;
          // Capitalize and format normal tool names
          return key.split(/(?=[A-Z])/).join(' ').replace(/^\w/, c => c.toUpperCase());
        });
    }

    // Get origin feat from background.originFeat or mechanics.feat
    const originFeat = background.originFeat || mechanics?.feat;

    // Parse equipment from mechanics.startingEquipment
    const equipmentOptions: string[] = [];
    if (mechanics?.startingEquipment && Array.isArray(mechanics.startingEquipment) && mechanics.startingEquipment[0]) {
      const equipObj = mechanics.startingEquipment[0];

      // Parse Option A
      if (equipObj.A && Array.isArray(equipObj.A)) {
        const itemsA = equipObj.A.map((entry: any) => {
          if (entry.item) {
            const itemName = entry.displayName || entry.item.split('|')[0];
            const qty = entry.quantity ? `${entry.quantity}× ` : '';
            return qty + itemName;
          }
          if (entry.value) return `${entry.value / 100} GP`;
          return null;
        }).filter(Boolean);
        equipmentOptions.push(`Option A: ${itemsA.join(', ')}`);
      }

      // Parse Option B
      if (equipObj.B && Array.isArray(equipObj.B)) {
        const itemsB = equipObj.B.map((entry: any) => {
          if (entry.item) {
            const itemName = entry.displayName || entry.item.split('|')[0];
            const qty = entry.quantity ? `${entry.quantity}× ` : '';
            return qty + itemName;
          }
          if (entry.value) return `${entry.value / 100} GP`;
          return null;
        }).filter(Boolean);
        equipmentOptions.push(`Option B: ${itemsB.join(', ')}`);
      }
    }

    return (
      <DetailsContent>
        <p>{background.description || 'No description available.'}</p>

        <h3>Features</h3>
        {skills.length > 0 && (
          <p>
            <FeatureLabel>Skills:</FeatureLabel>{' '}
            {skills.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}
          </p>
        )}
        {tools.length > 0 && (
          <p>
            <FeatureLabel>Tool Proficiencies:</FeatureLabel> {tools.join(', ')}
          </p>
        )}
        <p><FeatureLabel>Languages:</FeatureLabel> Choose 2</p>

        {asiOptions.length > 0 && (
          <p>
            <FeatureLabel>Ability Scores:</FeatureLabel>{' '}
            {`Allocate +2/+1 or +1/+1/+1 among ${asiOptions.join(', ')}`}
          </p>
        )}

        {equipmentOptions.length > 0 && (
          <>
            <h3>Starting Equipment</h3>
            {equipmentOptions.map((option, idx) => (
              <p key={idx}>{option}</p>
            ))}
          </>
        )}

        {originFeat && (
          <>
            <h3>Origin Feat</h3>
            <p><FeatureLabel>{originFeat}</FeatureLabel></p>
          </>
        )}
      </DetailsContent>
    );
  };

  const renderSelectConfiguration = () => {
    if (!selectBackground) return null;

    // Parse ASI from mechanics.ability
    const mechanics = selectBackground.mechanics as any;
    let asiOptions: string[] = [];
    if (mechanics?.ability && Array.isArray(mechanics.ability)) {
      const abilityEntry = mechanics.ability.find((entry: any) => entry.choose);
      // Check for weighted.from structure first (D&D 2024 format)
      if (abilityEntry?.choose?.weighted?.from && Array.isArray(abilityEntry.choose.weighted.from)) {
        asiOptions = abilityEntry.choose.weighted.from;
      }
      // Fallback to plain choose.from
      else if (abilityEntry?.choose?.from && Array.isArray(abilityEntry.choose.from)) {
        asiOptions = abilityEntry.choose.from;
      }
    }

    // For D&D 2024 backgrounds, allocate +2/+1 or +1/+1/+1 among 3 abilities
    const hasAbilityChoice = asiOptions.length === 3;

    return (
      <>
        {/* Language Selection */}
        <ConfigSection>
          <SectionTitle>Languages</SectionTitle>
          <SelectionCount>Selected: {selectedLanguages.length} / 2</SelectionCount>
          <LanguageGrid>
            {STANDARD_LANGUAGES.map((language) => (
              <LanguageOption
                key={language}
                $isSelected={selectedLanguages.includes(language)}
                $isDisabled={!canSelectLanguage(language)}
                onClick={() => canSelectLanguage(language) && handleLanguageToggle(language)}
              >
                {language}
              </LanguageOption>
            ))}
          </LanguageGrid>
        </ConfigSection>

        {/* Ability Score Allocation - Background grants +2/+1 or +1/+1/+1 */}
        {hasAbilityChoice && (
          <ConfigSection>
            <SectionTitle>Ability Score Increases</SectionTitle>
            <div style={{ color: '#c0aa70', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
              Allocate +2 to one ability and +1 to another, OR +1 to all three
            </div>
            <SelectionCount>
              Allocated: {getTotalPointsAllocated()} / 3 points
            </SelectionCount>
            <AbilityScoreGrid>
              {asiOptions.map((ability) => (
                <AbilityBox key={ability}>
                  <AbilityLabel>{ability.toUpperCase()}</AbilityLabel>
                  <AbilityControls>
                    <AbilityButton
                      onClick={() => handleAbilityScoreChange(ability, -1)}
                      disabled={!abilityScoreAllocations[ability] || abilityScoreAllocations[ability] === 0}
                    >
                      −
                    </AbilityButton>
                    <AbilityValue>+{abilityScoreAllocations[ability] || 0}</AbilityValue>
                    <AbilityButton
                      onClick={() => handleAbilityScoreChange(ability, 1)}
                      disabled={
                        getTotalPointsAllocated() >= 3 ||
                        (abilityScoreAllocations[ability] || 0) >= 2
                      }
                    >
                      +
                    </AbilityButton>
                  </AbilityControls>
                </AbilityBox>
              ))}
            </AbilityScoreGrid>
          </ConfigSection>
        )}
      </>
    );
  };

  if (isLoading) {
    return (
      <StepContainer>
        <div className="step-title">Background</div>
        <LoadingSpinner message="Loading backgrounds..." />
      </StepContainer>
    );
  }

  if (error) {
    return (
      <StepContainer>
        <div className="step-title">Background</div>
        <div style={{ color: '#ff6b6b', textAlign: 'center', padding: '2rem' }}>
          Error loading backgrounds: {error}
        </div>
      </StepContainer>
    );
  }

  return (
    <StepContainer>
      <div className="step-title">Background</div>
      <div className="step-description">
        Your background represents your character's past experiences and training.
      </div>

      <CompactList
        items={backgrounds}
        isSelected={(bg) => bg.name === data.selectedBackground}
        onDetails={handleDetailsClick}
        onSelect={handleSelectClick}
        renderName={(bg) => bg.name}
        renderSummary={(bg) => {
          // Extract narrative flavor text, skipping mechanical entries
          const flavorText = extractBackgroundFlavorText(bg.mechanics);
          if (!flavorText) return '';
          // Parse any template tags and return first ~100 chars
          const parsed = parseComplexDnDEntry(flavorText);
          return parsed.substring(0, 100) + (parsed.length > 100 ? '...' : '');
        }}
      />

      {/* Details Modal - Read Only */}
      <DetailsModal
        isOpen={!!detailsBackground}
        onClose={() => setDetailsBackground(null)}
        title={detailsBackground?.name || ''}
        content={detailsBackground ? renderBackgroundDetails(detailsBackground) : null}
      />

      {/* Select Modal - Configuration */}
      <SelectModal
        isOpen={!!selectBackground}
        onClose={() => setSelectBackground(null)}
        onConfirm={handleConfirmSelection}
        title={`Configure ${selectBackground?.name || ''}`}
        isConfirmDisabled={!isAllocationValid() || selectedLanguages.length !== 2}
        confirmLabel="Select Background"
      >
        {renderSelectConfiguration()}
      </SelectModal>
    </StepContainer>
  );
};
