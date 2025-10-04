import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { StepContainer } from '../../styles/components/CharacterGeneratorWizard.styles';
import { CharacterBuilderData } from '../CharacterGeneratorWizard';
import { listFeats } from '@/services/featsService';
import { Feat } from '@/types/api';
import { AbilityScoresHeader } from './AbilityScoresHeader';
import { useApiCall } from '@/hooks/useApiCall';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Step3EFeatChoicesProps {
  data: CharacterBuilderData;
  onUpdate: (updates: Partial<CharacterBuilderData>) => void;
}


// All skills list for Skilled feat
const ALL_SKILLS = [
  'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception',
  'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine',
  'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion',
  'Sleight of Hand', 'Stealth', 'Survival'
];

// All artisan tools for Crafter feat
const ARTISAN_TOOLS = [
  "Alchemist's Supplies", "Brewer's Supplies", "Calligrapher's Supplies",
  "Carpenter's Tools", "Cartographer's Tools", "Cobbler's Tools",
  "Cook's Utensils", "Glassblower's Tools", "Jeweler's Tools",
  "Leatherworker's Tools", "Mason's Tools", "Painter's Supplies",
  "Potter's Tools", "Smith's Tools", "Tinker's Tools", "Weaver's Tools",
  "Woodcarver's Tools"
];

// All musical instruments for Musician feat
const MUSICAL_INSTRUMENTS = [
  "Bagpipes", "Drum", "Dulcimer", "Flute", "Lute", "Lyre",
  "Horn", "Pan Flute", "Shawm", "Viol"
];

// All tools for Skilled feat (combining artisan's tools, gaming sets, and vehicles)
const ALL_TOOLS = [
  "Alchemist's Supplies", "Brewer's Supplies", "Calligrapher's Supplies",
  "Carpenter's Tools", "Cartographer's Tools", "Cobbler's Tools",
  "Cook's Utensils", "Glassblower's Tools", "Jeweler's Tools",
  "Leatherworker's Tools", "Mason's Tools", "Painter's Supplies",
  "Potter's Tools", "Smith's Tools", "Tinker's Tools", "Weaver's Tools",
  "Woodcarver's Tools", "Gaming Set (Dice)", "Gaming Set (Cards)",
  "Gaming Set (Chess)", "Thieves' Tools", "Navigator's Tools",
  "Vehicles (Land)", "Vehicles (Water)"
];

// Combined skills and tools for Skilled feat
const SKILLS_AND_TOOLS = [
  ...ALL_SKILLS.map(skill => ({ name: skill, type: 'skill' })),
  ...ALL_TOOLS.map(tool => ({ name: tool, type: 'tool' }))
];

// Spell classes for Magic Initiate
const SPELL_CLASSES = ['Cleric', 'Druid', 'Wizard'];
const SPELLCASTING_ABILITIES = {
  'Cleric': 'wis',
  'Druid': 'wis',
  'Wizard': 'int'
};

const CHOICE_FEATS = ['Magic Initiate', 'Skilled', 'Crafter', 'Musician'] as const;
type ChoiceFeatName = (typeof CHOICE_FEATS)[number];
const isChoiceFeat = (featName: string): featName is ChoiceFeatName =>
  CHOICE_FEATS.includes(featName as ChoiceFeatName);

const ChoicesContainer = styled.div`
  .choice-section {
    margin-bottom: 2rem;

    .section-title {
      color: #d4af37;
      font-family: 'Cinzel', serif;
      font-size: 1.2rem;
      margin-bottom: 0.75rem;
      text-align: center;
    }

    .section-description {
      color: #ccc;
      font-size: 0.9rem;
      text-align: center;
      margin-bottom: 1rem;
      line-height: 1.4;
    }
  }

  .feat-header {
    background: rgba(212, 175, 55, 0.1);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;

    .feat-name {
      color: #d4af37;
      font-family: 'Cinzel', serif;
      font-size: 1.3rem;
      margin-bottom: 0.5rem;
      text-align: center;
    }

    .feat-description {
      color: #ccc;
      font-size: 0.9rem;
      text-align: center;
      line-height: 1.4;
    }
  }
`;

const ChoiceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
`;

const ChoiceCard = styled.div<{ selected: boolean }>`
  background: rgba(26, 26, 26, 0.8);
  border: 2px solid ${props => props.selected ? '#d4af37' : '#444'};
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  &:hover {
    border-color: #d4af37;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
  }

  ${props => props.selected && `
    background: rgba(212, 175, 55, 0.1);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);
  `}
`;

const ChoiceName = styled.h3`
  color: #d4af37;
  margin: 0;
  font-family: 'Cinzel', serif;
  font-size: 0.9rem;
  text-align: center;
`;

const SelectionSummary = styled.div`
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1.5rem;
  text-align: center;

  .summary-title {
    color: #d4af37;
    font-weight: 600;
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }

  .summary-text {
    color: #ccc;
    font-size: 0.9rem;
  }
`;

export const Step3EFeatChoices: React.FC<Step3EFeatChoicesProps> = ({
  data,
  onUpdate
}) => {
  const [featChoices, setFeatChoices] = useState<{ [featName: string]: any }>({});
  const [featsData, setFeatsData] = useState<{ [name: string]: Feat }>({});
  const {
    error: loadError,
    isLoading: isFeatsLoading,
    execute: fetchFeats,
  } = useApiCall(listFeats, {
    onSuccess: (allFeats) => {
      setFeatsData((prev) => {
        const next = { ...prev };
        allFeats.forEach((feat) => {
          next[feat.name] = feat;
        });
        return next;
      });
    },
  });

  const featsWithChoices = useMemo(
    () =>
      (data.selectedOriginFeats ?? []).filter((featName) => isChoiceFeat(featName)),
    [data.selectedOriginFeats]
  );

  const missingFeats = useMemo(
    () => featsWithChoices.filter((featName) => !featsData[featName]),
    [featsWithChoices, featsData]
  );

  useEffect(() => {
    if (data.featChoices) {
      setFeatChoices(data.featChoices);
    }
  }, [data.featChoices]);

  useEffect(() => {
    if (!missingFeats.length) return;
    fetchFeats();
  }, [fetchFeats, missingFeats]);

  const updateFeatChoice = (featName: string, choiceKey: string, value: any) => {
    const newFeatChoices = {
      ...featChoices,
      [featName]: {
        ...featChoices[featName],
        [choiceKey]: value
      }
    };
    setFeatChoices(newFeatChoices);
    onUpdate({ featChoices: newFeatChoices });
  };

  const renderMagicInitiateChoices = (featName: string) => {
    const choices = featChoices[featName] || {};

    return (
      <div className="choice-section">
        <div className="section-title">Choose Spell Class</div>
        <div className="section-description">
          Select which spell class you want to learn spells from. This determines your spellcasting ability.
        </div>
        <ChoiceGrid>
          {SPELL_CLASSES.map((spellClass) => (
            <ChoiceCard
              key={spellClass}
              selected={choices.spellClass === spellClass}
              onClick={() => updateFeatChoice(featName, 'spellClass', spellClass)}
            >
              <ChoiceName>{spellClass}</ChoiceName>
              <div style={{ color: '#ccc', fontSize: '0.8rem', textAlign: 'center', marginTop: '0.25rem' }}>
                Spellcasting Ability: {SPELLCASTING_ABILITIES[spellClass as keyof typeof SPELLCASTING_ABILITIES]?.toUpperCase()}
              </div>
            </ChoiceCard>
          ))}
        </ChoiceGrid>

        {choices.spellClass && (
          <div style={{ marginTop: '1.5rem' }}>
            <div className="section-title">Choose Cantrips</div>
            <div className="section-description">
              Choose 2 cantrips from the {choices.spellClass} spell list.
            </div>
            <SelectionSummary>
              <div className="summary-title">Spell Selections</div>
              <div className="summary-text">
                Class: {choices.spellClass}<br/>
                Note: Specific spell selection will be handled during character creation.
              </div>
            </SelectionSummary>
          </div>
        )}
      </div>
    );
  };

  const renderSkilledChoices = (featName: string) => {
    const choices = featChoices[featName] || {};
    const selectedItems = choices.skills || [];

    return (
      <div className="choice-section">
        <div className="section-title">Choose Skills or Tools</div>
        <div className="section-description">
          Select any combination of 3 skills or tools. Selected: {selectedItems.length}/3
        </div>
        <ChoiceGrid>
          {SKILLS_AND_TOOLS.map((item) => {
            const isSelected = selectedItems.includes(item.name);
            const canSelect = selectedItems.length < 3 || isSelected;

            return (
              <ChoiceCard
                key={item.name}
                selected={isSelected}
                onClick={() => {
                  if (isSelected) {
                    // Remove item
                    const newItems = selectedItems.filter((s: string) => s !== item.name);
                    updateFeatChoice(featName, 'skills', newItems);
                  } else if (canSelect) {
                    // Add item
                    const newItems = [...selectedItems, item.name];
                    updateFeatChoice(featName, 'skills', newItems);
                  }
                }}
                style={{
                  opacity: canSelect ? 1 : 0.5,
                  cursor: canSelect ? 'pointer' : 'not-allowed'
                }}
              >
                <ChoiceName>{item.name}</ChoiceName>
                <div style={{
                  color: '#888',
                  fontSize: '0.7rem',
                  textAlign: 'center',
                  marginTop: '0.25rem',
                  textTransform: 'capitalize'
                }}>
                  {item.type}
                </div>
              </ChoiceCard>
            )}
          )}
        </ChoiceGrid>

        {selectedItems.length > 0 && (
          <SelectionSummary>
            <div className="summary-title">Selected Skills/Tools</div>
            <div className="summary-text">
              {selectedItems.join(', ')}
            </div>
          </SelectionSummary>
        )}

        {selectedItems.length !== 3 && (
          <div style={{
            textAlign: 'center',
            color: '#ff6b6b',
            marginTop: '1rem',
            fontSize: '0.9rem'
          }}>
            ⚠️ Please select exactly 3 skills or tools.
          </div>
        )}
      </div>
    );
  };

  const renderCrafterChoices = (featName: string) => {
    const choices = featChoices[featName] || {};
    const selectedTools = choices.tools || [];

    return (
      <div className="choice-section">
        <div className="section-title">Choose Artisan's Tools</div>
        <div className="section-description">
          Choose 3 different Artisan's Tools. Selected: {selectedTools.length}/3
        </div>
        <ChoiceGrid>
          {ARTISAN_TOOLS.map((tool) => {
            const isSelected = selectedTools.includes(tool);
            const canSelect = selectedTools.length < 3 || isSelected;

            return (
              <ChoiceCard
                key={tool}
                selected={isSelected}
                onClick={() => {
                  if (isSelected) {
                    // Remove tool
                    const newTools = selectedTools.filter((t: string) => t !== tool);
                    updateFeatChoice(featName, 'tools', newTools);
                  } else if (canSelect) {
                    // Add tool
                    const newTools = [...selectedTools, tool];
                    updateFeatChoice(featName, 'tools', newTools);
                  }
                }}
                style={{
                  opacity: canSelect ? 1 : 0.5,
                  cursor: canSelect ? 'pointer' : 'not-allowed'
                }}
              >
                <ChoiceName>{tool}</ChoiceName>
              </ChoiceCard>
            )}
          )}
        </ChoiceGrid>

        {selectedTools.length > 0 && (
          <SelectionSummary>
            <div className="summary-title">Selected Tools</div>
            <div className="summary-text">
              {selectedTools.join(', ')}
            </div>
          </SelectionSummary>
        )}

        {selectedTools.length !== 3 && (
          <div style={{
            textAlign: 'center',
            color: '#ff6b6b',
            marginTop: '1rem',
            fontSize: '0.9rem'
          }}>
            ⚠️ Please select exactly 3 artisan's tools.
          </div>
        )}
      </div>
    );
  };

  const renderMusicianChoices = (featName: string) => {
    const choices = featChoices[featName] || {};
    const selectedInstruments = choices.instruments || [];

    return (
      <div className="choice-section">
        <div className="section-title">Choose Musical Instruments</div>
        <div className="section-description">
          Choose 3 different Musical Instruments. Selected: {selectedInstruments.length}/3
        </div>
        <ChoiceGrid>
          {MUSICAL_INSTRUMENTS.map((instrument) => {
            const isSelected = selectedInstruments.includes(instrument);
            const canSelect = selectedInstruments.length < 3 || isSelected;

            return (
              <ChoiceCard
                key={instrument}
                selected={isSelected}
                onClick={() => {
                  if (isSelected) {
                    // Remove instrument
                    const newInstruments = selectedInstruments.filter((i: string) => i !== instrument);
                    updateFeatChoice(featName, 'instruments', newInstruments);
                  } else if (canSelect) {
                    // Add instrument
                    const newInstruments = [...selectedInstruments, instrument];
                    updateFeatChoice(featName, 'instruments', newInstruments);
                  }
                }}
                style={{
                  opacity: canSelect ? 1 : 0.5,
                  cursor: canSelect ? 'pointer' : 'not-allowed'
                }}
              >
                <ChoiceName>{instrument}</ChoiceName>
              </ChoiceCard>
            )}
          )}
        </ChoiceGrid>

        {selectedInstruments.length > 0 && (
          <SelectionSummary>
            <div className="summary-title">Selected Instruments</div>
            <div className="summary-text">
              {selectedInstruments.join(', ')}
            </div>
          </SelectionSummary>
        )}

        {selectedInstruments.length !== 3 && (
          <div style={{
            textAlign: 'center',
            color: '#ff6b6b',
            marginTop: '1rem',
            fontSize: '0.9rem'
          }}>
            ⚠️ Please select exactly 3 musical instruments.
          </div>
        )}
      </div>
    );
  };

  const getFeatDescription = (featName: string, feat?: Feat): string => {
    // Provide clean descriptions for feats with choices
    switch (featName) {
      case 'Magic Initiate':
        return 'Learn cantrips and a 1st-level spell from a chosen spell list. Choose your spellcasting ability based on the selected class.';
      case 'Skilled':
        return 'You gain proficiency in any combination of three skills or tools of your choice.';
      case 'Crafter':
        return 'You gain proficiency with three different Artisan\'s Tools, crafting discounts, and the ability to create temporary gear.';
      case 'Musician':
        return 'You gain proficiency with three Musical Instruments and can inspire allies with encouraging songs during rests.';
      default:
        return feat?.entries?.description?.[0] || 'This feat requires additional choices.';
    }
  };

  const needsChoices = featsWithChoices.length > 0;

  const isComplete = () =>
    featsWithChoices.every((featName) => {
      const choices = featChoices[featName];
      if (!choices) return false;

      switch (featName) {
        case 'Magic Initiate':
          return !!choices.spellClass;
        case 'Skilled':
          return choices.skills?.length === 3;
        case 'Crafter':
          return choices.tools?.length === 3;
        case 'Musician':
          return choices.instruments?.length === 3;
        default:
          return true;
      }
    });

  if (needsChoices && missingFeats.length > 0) {
    if (isFeatsLoading) {
      return (
        <StepContainer>
          <div className="step-title">Feat Choices</div>
          <AbilityScoresHeader data={data} />
          <div className="step-content">
            <LoadingSpinner message="Loading feat details..." />
          </div>
        </StepContainer>
      );
    }

    if (loadError) {
      return (
        <StepContainer>
          <div className="step-title">Feat Choices</div>
          <AbilityScoresHeader data={data} />
          <div className="step-content">
            <SelectionSummary>
              <div className="summary-title">Unable to load feat details</div>
              <div className="summary-text">
                {loadError}<br />
                Please retry after adjusting your selections or reloading the page.
              </div>
            </SelectionSummary>
          </div>
        </StepContainer>
      );
    }

    return (
      <StepContainer>
        <div className="step-title">Feat Choices</div>
        <AbilityScoresHeader data={data} />
        <div className="step-content">
          <SelectionSummary>
            <div className="summary-title">Missing feat details</div>
            <div className="summary-text">
              We couldn't find complete information for your selected feats. Try selecting different feats or reloading.
            </div>
          </SelectionSummary>
        </div>
      </StepContainer>
    );
  }

  if (!needsChoices) {
    return (
      <StepContainer>
        <div className="step-title">Feat Choices</div>
        <div className="step-description">
          Your selected feats don't require additional choices.
        </div>

        <AbilityScoresHeader data={data} />

        <div className="step-content">
          <SelectionSummary>
            <div className="summary-title">No Choices Required</div>
            <div className="summary-text">
              All your selected Origin Feats have their abilities automatically determined. You can proceed to the next step.
            </div>
          </SelectionSummary>
        </div>
      </StepContainer>
    );
  }

  return (
    <StepContainer>
      <div className="step-title">Feat Choices</div>
      <div className="step-description">
        Some of your selected feats require additional choices. Make all required selections below.
      </div>

      <AbilityScoresHeader data={data} />

      <div className="step-content">
        <ChoicesContainer>
          {featsWithChoices.map((featName) => {
            const feat = featsData[featName];

            return (
              <div key={featName}>
                <div className="feat-header">
                  <div className="feat-name">{featName}</div>
                  <div className="feat-description">
                    {getFeatDescription(featName, feat)}
                  </div>
                </div>

                {featName === 'Magic Initiate' && renderMagicInitiateChoices(featName)}
                {featName === 'Skilled' && renderSkilledChoices(featName)}
                {featName === 'Crafter' && renderCrafterChoices(featName)}
                {featName === 'Musician' && renderMusicianChoices(featName)}
              </div>
            );
          })}

          {!isComplete() && (
            <div style={{
              textAlign: 'center',
              color: '#ff6b6b',
              marginTop: '1.5rem',
              fontSize: '0.9rem'
            }}>
              ⚠️ Please make all required feat choices before proceeding.
            </div>
          )}
        </ChoicesContainer>
      </div>
    </StepContainer>
  );
};
