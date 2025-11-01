import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { StepContainer } from '../../styles/components/CharacterGeneratorWizard.styles';
import { CharacterBuilderData } from '../CharacterGeneratorWizard';
import { listFeats } from '@/services/featsService';
import { Feat } from '@/types/api';
import { parseComplexDnDEntry } from '@/utils/dndTemplateParser';
import { AbilityScoresHeader } from './AbilityScoresHeader';
import { useApiCall } from '@/hooks/useApiCall';
import LoadingSpinner from '@/components/LoadingSpinner';
import { CompactList } from '../wizard/CompactList';
import { DetailsModal } from '../wizard/DetailsModal';
import { SelectModal } from '../wizard/SelectModal';
import { useAutoScroll } from '@/hooks/useAutoScroll';

// Constants for feat choices
const ALL_SKILLS = [
  'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception',
  'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine',
  'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion',
  'Sleight of Hand', 'Stealth', 'Survival'
];

const ARTISAN_TOOLS = [
  "Alchemist's Supplies", "Brewer's Supplies", "Calligrapher's Supplies",
  "Carpenter's Tools", "Cartographer's Tools", "Cobbler's Tools",
  "Cook's Utensils", "Glassblower's Tools", "Jeweler's Tools",
  "Leatherworker's Tools", "Mason's Tools", "Painter's Tools",
  "Potter's Tools", "Smith's Tools", "Tinker's Tools", "Weaver's Tools",
  "Woodcarver's Tools"
];

const MUSICAL_INSTRUMENTS = [
  "Bagpipes", "Drum", "Dulcimer", "Flute", "Lute", "Lyre",
  "Horn", "Pan Flute", "Shawm", "Viol"
];

const ALL_TOOLS_AND_SKILLS = [
  ...ALL_SKILLS,
  ...ARTISAN_TOOLS,
  "Thieves' Tools",
  "Navigator's Tools",
  "Vehicles (Land)",
  "Vehicles (Water)",
  ...MUSICAL_INSTRUMENTS
];




interface Step3DOriginFeatsProps {
  data: CharacterBuilderData;
  onUpdate: (updates: Partial<CharacterBuilderData>) => void;
}

const FeatsContainer = styled.div`
  .feats-header {
    background: rgba(206, 144, 22, 0.1);
    border: 1px solid rgba(206, 144, 22, 0.3);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    text-align: center;

    .header-title {
      color: #ce9016;
      font-family: 'Cinzel', serif;
      font-size: 1.2rem;
      margin-bottom: 0.5rem;
    }

    .header-description {
      color: #ccc;
      font-size: 0.9rem;
      line-height: 1.4;
    }
  }
`;

const LoadingState = styled.div`
  display: flex;
  justify-content: center;
  padding: 3rem 0;
`;

const ErrorMessage = styled.div`
  text-align: center;
  color: #ff6b6b;
  padding: 2rem;
  font-size: 1rem;
`;

const DetailsContent = styled.div`
  h3 {
    color: #ce9016;
    font-family: 'Cinzel', serif;
    font-size: 1.1rem;
    margin: 1.5rem 0 0.75rem 0;

    &:first-child {
      margin-top: 0;
    }
  }

  p {
    color: #e0d9c6;
    line-height: 1.6;
    margin-bottom: 0.75rem;
  }
`;


const ConfigSection = styled.div`
  margin-bottom: 1.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  color: #ce9016;
  font-size: 1rem;
  margin-bottom: 0.75rem;
  font-family: 'Cinzel', serif;
`;

const SelectionCount = styled.div`
  color: #c0aa70;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
`;

const OptionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.5rem;
`;

const OptionButton = styled.button<{ $isSelected: boolean; $isDisabled?: boolean }>`
  background: ${({ $isSelected }) => ($isSelected ? 'rgba(206, 144, 22, 0.2)' : 'rgba(26, 26, 26, 0.6)')};
  border: 2px solid ${({ $isSelected }) => ($isSelected ? '#ce9016' : '#444')};
  color: ${({ $isSelected }) => ($isSelected ? '#ce9016' : '#ccc')};
  padding: 0.75rem;
  border-radius: 6px;
  cursor: ${({ $isDisabled }) => ($isDisabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s ease;
  font-size: 0.875rem;
  opacity: ${({ $isDisabled }) => ($isDisabled ? 0.5 : 1)};

  &:hover:not(:disabled) {
    border-color: #ce9016;
    background: rgba(206, 144, 22, 0.1);
  }

  &:focus-visible {
    outline: 2px solid #ce9016;
    outline-offset: 2px;
  }
`;

const AbilityScoreGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.75rem;
`;

const AbilityBox = styled.div`
  background: rgba(26, 26, 26, 0.6);
  border: 1px solid #444;
  border-radius: 6px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`;

const AbilityLabel = styled.div`
  color: #ce9016;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
`;

const AbilityControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const AbilityButton = styled.button`
  background: rgba(60, 60, 60, 0.8);
  border: 1px solid rgba(206, 144, 22, 0.3);
  color: #f0f0f0;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: rgba(80, 80, 80, 0.8);
    border-color: rgba(206, 144, 22, 0.5);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid #ce9016;
    outline-offset: 2px;
  }
`;

const AbilityValue = styled.div`
  color: #ce9016;
  font-weight: 600;
  font-size: 1rem;
  min-width: 32px;
  text-align: center;
`;

const Step3DOriginFeats: React.FC<Step3DOriginFeatsProps> = ({ data, onUpdate }) => {
  const { scrollToBottom } = useAutoScroll();
  const [detailsFeat, setDetailsFeat] = useState<Feat | null>(null);
  const [selectFeat, setSelectFeat] = useState<Feat | null>(null);

  // State for feat configuration choices
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [abilityScoreAllocations, setAbilityScoreAllocations] = useState<{ [ability: string]: number }>({});

  const { data: feats, isLoading, error, execute } = useApiCall<Feat[], [{ category: string }]>(
    listFeats
  );

  useEffect(() => {
    execute({ category: 'Origin' });
  }, [execute]);

  // Auto-scroll when feat selected
  useEffect(() => {
    if (data.selectedOriginFeats.length > 0) {
      scrollToBottom({ offset: 20 });
    }
  }, [data.selectedOriginFeats.length, scrollToBottom]);

  const handleDetailsClick = (feat: Feat) => {
    setDetailsFeat(feat);
  };

  const handleSelectClick = (feat: Feat) => {
    // Determine max allowed origin feats (2 for humans, 1 for others)
    const maxFeats = data.selectedSpecies?.toLowerCase() === 'human' ? 2 : 1;

    // Check if already selected
    if (data.selectedOriginFeats.includes(feat.name)) {
      // Allow viewing/reconfiguring already selected feat
      setSelectFeat(feat);
      return;
    }

    // Check if limit reached
    if (data.selectedOriginFeats.length >= maxFeats) {
      alert(`You can only select ${maxFeats} origin feat${maxFeats > 1 ? 's' : ''}. Please remove an existing feat first.`);
      return;
    }

    setSelectFeat(feat);

    // Reset configuration state
    setSelectedSkills([]);
    setSelectedTools([]);
    setSelectedInstruments([]);
    setSelectedLanguages([]);
    setAbilityScoreAllocations({});
  };

  const handleConfirmSelection = () => {
    if (!selectFeat) return;

    // Aggregate all skill proficiencies from this feat and existing feats
    const existingFeatSkills = data.featSkillProficiencies || [];
    const newSkillsFromThisFeat = selectedSkills.filter(skill =>
      ALL_SKILLS.includes(skill)
    );
    const allFeatSkills = [...existingFeatSkills, ...newSkillsFromThisFeat];

    // Aggregate all tool proficiencies from this feat and existing feats
    const existingFeatTools = data.featToolProficiencies || [];
    const newToolsFromThisFeat = [
      ...selectedTools,
      ...selectedInstruments,
      ...selectedSkills.filter(skill => !ALL_SKILLS.includes(skill)) // Tools from "Skilled" feat
    ];
    const allFeatTools = [...existingFeatTools, ...newToolsFromThisFeat];

    onUpdate({
      selectedOriginFeats: [...data.selectedOriginFeats, selectFeat.name],
      featChoices: {
        ...data.featChoices,
        [selectFeat.name]: {
          ...(selectedSkills.length > 0 && { skills: selectedSkills }),
          ...(selectedTools.length > 0 && { tools: selectedTools }),
          ...(selectedInstruments.length > 0 && { instruments: selectedInstruments }),
          ...(selectedLanguages.length > 0 && { languages: selectedLanguages }),
          ...(Object.keys(abilityScoreAllocations).length > 0 && { abilityScores: abilityScoreAllocations })
        }
      },
      featFeatures: {
        ...data.featFeatures,
        [selectFeat.name]: selectFeat.entries || []
      },
      featSkillProficiencies: allFeatSkills,
      featToolProficiencies: allFeatTools
    });

    setSelectFeat(null);
  };

  const renderFeatDetails = (feat: Feat) => {
    // Parse the entries array through the template parser
    const parsedEntries = parseComplexDnDEntry(feat.entries);

    return (
      <DetailsContent>
        <div style={{ whiteSpace: 'pre-wrap' }}>{parsedEntries}</div>

        {feat.prerequisites && (
          <>
            <h3>Prerequisites</h3>
            <p>{JSON.stringify(feat.prerequisites)}</p>
          </>
        )}
      </DetailsContent>
    );
  };

  const getFeatSummary = (feat: Feat): string => {
    // Extract first sentence or key benefit from feat
    if (feat.entries && Array.isArray(feat.entries) && feat.entries.length > 0) {
      const firstEntry = feat.entries[0];
      if (typeof firstEntry === 'string') {
        const match = firstEntry.match(/^[^.!?]+[.!?]/);
        return match ? match[0] : firstEntry.slice(0, 100) + '...';
      }
    }
    return 'View details for more information';
  };

  const renderSelectConfiguration = () => {
    if (!selectFeat) return null;

    const needsSkillOrToolChoice = selectFeat.name === 'Skilled';
    const needsCrafterTools = selectFeat.name === 'Crafter';
    const needsInstruments = selectFeat.name === 'Musician';
    const needsLanguageChoice = selectFeat.name === 'Linguist';
    const needsAbilityChoice = selectFeat.name === 'Ability Score Improvement';

    const needsAnyChoice = needsSkillOrToolChoice || needsCrafterTools || needsInstruments || needsLanguageChoice || needsAbilityChoice;

    if (!needsAnyChoice) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: '#ccc',
          fontSize: '0.95rem',
          lineHeight: '1.6'
        }}>
          <div style={{ color: '#ce9016', fontWeight: 600, marginBottom: '0.5rem' }}>
            No Selections Required
          </div>
          <div>
            This feat doesn't require any additional choices. Click "CONFIRM" to add it to your character.
          </div>
        </div>
      );
    }

    return (
      <>
        {needsSkillOrToolChoice && (
          <ConfigSection>
            <SectionTitle>Choose 3 Skills or Tools</SectionTitle>
            <SelectionCount>Selected: {selectedSkills.length} / 3</SelectionCount>
            <OptionGrid>
              {ALL_TOOLS_AND_SKILLS.map((option) => (
                <OptionButton
                  key={option}
                  $isSelected={selectedSkills.includes(option)}
                  $isDisabled={!selectedSkills.includes(option) && selectedSkills.length >= 3}
                  onClick={() => {
                    if (selectedSkills.includes(option)) {
                      setSelectedSkills(selectedSkills.filter(s => s !== option));
                    } else if (selectedSkills.length < 3) {
                      setSelectedSkills([...selectedSkills, option]);
                    }
                  }}
                >
                  {option}
                </OptionButton>
              ))}
            </OptionGrid>
          </ConfigSection>
        )}

        {needsCrafterTools && (
          <ConfigSection>
            <SectionTitle>Choose 3 Artisan's Tools</SectionTitle>
            <SelectionCount>Selected: {selectedTools.length} / 3</SelectionCount>
            <OptionGrid>
              {ARTISAN_TOOLS.map((tool) => (
                <OptionButton
                  key={tool}
                  $isSelected={selectedTools.includes(tool)}
                  $isDisabled={!selectedTools.includes(tool) && selectedTools.length >= 3}
                  onClick={() => {
                    if (selectedTools.includes(tool)) {
                      setSelectedTools(selectedTools.filter(t => t !== tool));
                    } else if (selectedTools.length < 3) {
                      setSelectedTools([...selectedTools, tool]);
                    }
                  }}
                >
                  {tool}
                </OptionButton>
              ))}
            </OptionGrid>
          </ConfigSection>
        )}

        {needsInstruments && (
          <ConfigSection>
            <SectionTitle>Choose 3 Musical Instruments</SectionTitle>
            <SelectionCount>Selected: {selectedInstruments.length} / 3</SelectionCount>
            <OptionGrid>
              {MUSICAL_INSTRUMENTS.map((instrument) => (
                <OptionButton
                  key={instrument}
                  $isSelected={selectedInstruments.includes(instrument)}
                  $isDisabled={!selectedInstruments.includes(instrument) && selectedInstruments.length >= 3}
                  onClick={() => {
                    if (selectedInstruments.includes(instrument)) {
                      setSelectedInstruments(selectedInstruments.filter(i => i !== instrument));
                    } else if (selectedInstruments.length < 3) {
                      setSelectedInstruments([...selectedInstruments, instrument]);
                    }
                  }}
                >
                  {instrument}
                </OptionButton>
              ))}
            </OptionGrid>
          </ConfigSection>
        )}

        {needsLanguageChoice && (
          <ConfigSection>
            <SectionTitle>Choose Languages</SectionTitle>
            <SelectionCount>Selected: {selectedLanguages.length} / 3</SelectionCount>
            <OptionGrid>
              {['Common', 'Dwarvish', 'Elvish', 'Giant', 'Gnomish', 'Goblin', 'Halfling', 'Orc', 'Abyssal', 'Celestial', 'Draconic', 'Deep Speech', 'Infernal', 'Primordial', 'Sylvan', 'Undercommon'].map((lang) => (
                <OptionButton
                  key={lang}
                  $isSelected={selectedLanguages.includes(lang)}
                  $isDisabled={!selectedLanguages.includes(lang) && selectedLanguages.length >= 3}
                  onClick={() => {
                    if (selectedLanguages.includes(lang)) {
                      setSelectedLanguages(selectedLanguages.filter(l => l !== lang));
                    } else if (selectedLanguages.length < 3) {
                      setSelectedLanguages([...selectedLanguages, lang]);
                    }
                  }}
                >
                  {lang}
                </OptionButton>
              ))}
            </OptionGrid>
          </ConfigSection>
        )}

        {needsAbilityChoice && (
          <ConfigSection>
            <SectionTitle>Allocate Ability Score Increases</SectionTitle>
            <SelectionCount>
              Allocated: {Object.values(abilityScoreAllocations).reduce((sum, val) => sum + val, 0)} / 3
            </SelectionCount>
            <AbilityScoreGrid>
              {['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map((ability) => (
                <AbilityBox key={ability}>
                  <AbilityLabel>{ability}</AbilityLabel>
                  <AbilityControls>
                    <AbilityButton
                      onClick={() => {
                        const current = abilityScoreAllocations[ability] || 0;
                        if (current > 0) {
                          setAbilityScoreAllocations({
                            ...abilityScoreAllocations,
                            [ability]: current - 1
                          });
                        }
                      }}
                      disabled={!abilityScoreAllocations[ability] || abilityScoreAllocations[ability] === 0}
                    >
                      −
                    </AbilityButton>
                    <AbilityValue>+{abilityScoreAllocations[ability] || 0}</AbilityValue>
                    <AbilityButton
                      onClick={() => {
                        const current = abilityScoreAllocations[ability] || 0;
                        const total = Object.values(abilityScoreAllocations).reduce((sum, val) => sum + val, 0);
                        if (total < 3 && current < 2) {
                          setAbilityScoreAllocations({
                            ...abilityScoreAllocations,
                            [ability]: current + 1
                          });
                        }
                      }}
                      disabled={
                        Object.values(abilityScoreAllocations).reduce((sum, val) => sum + val, 0) >= 3 ||
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

  const isConfigurationValid = (): boolean => {
    if (!selectFeat) return false;

    if (selectFeat.name === 'Skilled') return selectedSkills.length === 3;
    if (selectFeat.name === 'Crafter') return selectedTools.length === 3;
    if (selectFeat.name === 'Musician') return selectedInstruments.length === 3;
    if (selectFeat.name === 'Linguist') return selectedLanguages.length === 3;
    if (selectFeat.name === 'Ability Score Improvement') {
      const total = Object.values(abilityScoreAllocations).reduce((sum, val) => sum + val, 0);
      return total === 3;
    }

    // No configuration needed for other feats
    return true;
  };

  if (isLoading) {
    return (
      <StepContainer>
        <LoadingState>
          <LoadingSpinner message="Loading feats..." />
        </LoadingState>
      </StepContainer>
    );
  }

  if (error || !feats) {
    return (
      <StepContainer>
        <ErrorMessage>
          Failed to load feats. Please try again.
        </ErrorMessage>
      </StepContainer>
    );
  }

  return (
    <StepContainer>
      <AbilityScoresHeader data={data} />

      <FeatsContainer>
        <div className="feats-header">
          <div className="header-title">Choose Your Origin Feat{data.selectedSpecies?.toLowerCase() === 'human' ? 's' : ''}</div>
          <div className="header-description">
            {data.selectedSpecies?.toLowerCase() === 'human'
              ? 'As a Human, you gain 2 Origin feats at 1st level. These feats represent your character\'s innate talents and versatile training.'
              : 'Every character gains an Origin feat at 1st level. This feat represents your character\'s innate talents and training.'
            }
            {data.selectedOriginFeats.length > 0 && (
              <div style={{ marginTop: '0.5rem', color: '#ce9016', fontWeight: 'bold' }}>
                Selected: {data.selectedOriginFeats.length} / {data.selectedSpecies?.toLowerCase() === 'human' ? 2 : 1}
              </div>
            )}
          </div>
        </div>

        <CompactList
          items={feats}
          isSelected={(feat) => data.selectedOriginFeats.includes(feat.name)}
          onDetails={handleDetailsClick}
          onSelect={handleSelectClick}
          renderName={(feat) => feat.name}
          renderSummary={getFeatSummary}
        />

        {/* Details Modal - Read Only */}
        <DetailsModal
          isOpen={!!detailsFeat}
          onClose={() => setDetailsFeat(null)}
          title={detailsFeat?.name || ''}
          content={detailsFeat ? renderFeatDetails(detailsFeat) : null}
        />

        {/* Select Modal - Configuration */}
        <SelectModal
          isOpen={!!selectFeat}
          onClose={() => setSelectFeat(null)}
          onConfirm={handleConfirmSelection}
          title={`Configure ${selectFeat?.name || ''}`}
          isConfirmDisabled={!isConfigurationValid()}
        >
          {renderSelectConfiguration()}
        </SelectModal>
      </FeatsContainer>
    </StepContainer>
  );
};

export default Step3DOriginFeats;
