import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { StepContainer } from '../../styles/components/CharacterGeneratorWizard.styles';
import { CharacterBuilderData } from '../CharacterGeneratorWizard';
import { listSpecies } from '@/services/speciesService';
import { Species as ApiSpecies } from '@/types/api';
import { parseComplexDnDEntry } from '@/utils/dndTemplateParser';
import { useApiCall } from '@/hooks/useApiCall';
import LoadingSpinner from '@/components/LoadingSpinner';
import { AbilityScoresHeader } from './AbilityScoresHeader';
import { CompactList } from '../wizard/CompactList';
import { DetailsModal } from '../wizard/DetailsModal';
import { SelectModal } from '../wizard/SelectModal';
import { useAutoScroll } from '@/hooks/useAutoScroll';

// Species choice constants
const DRAGONBORN_ANCESTRY = [
  { type: 'Black', damage: 'Acid', area: '15-foot line (5 feet wide)' },
  { type: 'Blue', damage: 'Lightning', area: '15-foot line (5 feet wide)' },
  { type: 'Brass', damage: 'Fire', area: '15-foot line (5 feet wide)' },
  { type: 'Bronze', damage: 'Lightning', area: '15-foot line (5 feet wide)' },
  { type: 'Copper', damage: 'Acid', area: '15-foot line (5 feet wide)' },
  { type: 'Gold', damage: 'Fire', area: '15-foot cone' },
  { type: 'Green', damage: 'Poison', area: '15-foot cone' },
  { type: 'Red', damage: 'Fire', area: '15-foot cone' },
  { type: 'Silver', damage: 'Cold', area: '15-foot cone' },
  { type: 'White', damage: 'Cold', area: '15-foot cone' },
];

const ELF_LINEAGES = [
  { name: 'Drow', description: 'The range of your Darkvision increases to 120 feet. You also know the Dancing Lights cantrip.', level3: 'Faerie Fire', level5: 'Darkness' },
  { name: 'High Elf', description: 'You know the Prestidigitation cantrip. Whenever you finish a Long Rest, you can replace that cantrip with a different cantrip from the Wizard spell list.', level3: 'Detect Magic', level5: 'Misty Step' },
  { name: 'Wood Elf', description: 'Your Speed increases to 35 feet. You also know the Druidcraft cantrip.', level3: 'Longstrider', level5: 'Pass without Trace' }
];

const GNOME_LINEAGES = [
  { name: 'Forest Gnome', description: 'You know the Minor Illusion cantrip. You also always have the Speak with Animals spell prepared.' },
  { name: 'Rock Gnome', description: 'You know the Mending and Prestidigitation cantrips. You can create tiny clockwork devices using Prestidigitation.' }
];

const GOLIATH_GIANT_ANCESTRY = [
  { name: "Cloud's Jaunt (Cloud Giant)", description: 'As a Bonus Action, you magically teleport up to 30 feet to an unoccupied space you can see.' },
  { name: "Fire's Burn (Fire Giant)", description: 'When you hit a target with an attack roll and deal damage to it, you can also deal 1d10 Fire damage to that target.' },
  { name: "Frost's Chill (Frost Giant)", description: 'When you hit a target with an attack roll and deal damage to it, you can also deal 1d6 Cold damage to that target and reduce its Speed by 10 feet until the start of your next turn.' },
  { name: "Hill's Tumble (Hill Giant)", description: 'When you hit a Large or smaller creature with an attack roll and deal damage to it, you can give that target the Prone condition.' },
  { name: "Stone's Endurance (Stone Giant)", description: 'When you take damage, you can take a Reaction to roll 1d12. Add your Constitution modifier to the number rolled and reduce the damage by that total.' },
  { name: "Storm's Thunder (Storm Giant)", description: 'When you take damage from a creature within 60 feet of you, you can take a Reaction to deal 1d8 Thunder damage to that creature.' }
];

const TIEFLING_FIENDISH_LEGACIES = [
  { name: 'Abyssal', description: 'You have Resistance to Poison damage. You also know the Poison Spray cantrip.', level3: 'Ray of Sickness', level5: 'Hold Person' },
  { name: 'Chthonic', description: 'You have Resistance to Necrotic damage. You also know the Chill Touch cantrip.', level3: 'False Life', level5: 'Ray of Enfeeblement' },
  { name: 'Infernal', description: 'You have Resistance to Fire damage. You also know the Fire Bolt cantrip.', level3: 'Hellish Rebuke', level5: 'Darkness' }
];

const ALL_SKILLS = [
  'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception',
  'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine',
  'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion',
  'Sleight of Hand', 'Stealth', 'Survival'
];

interface Step3BSpeciesSelectionProps {
  data: CharacterBuilderData;
  onUpdate: (updates: Partial<CharacterBuilderData>) => void;
}

type Species = ApiSpecies;

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

  ul {
    color: #e0d9c6;
    line-height: 1.6;
    margin-bottom: 0.75rem;
    padding-left: 1.5rem;
  }
`;

const FeatureLabel = styled.span`
  color: #ce9016;
  font-weight: 600;
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
  text-align: left;

  &:hover:not(:disabled) {
    border-color: #ce9016;
    background: rgba(206, 144, 22, 0.1);
  }

  &:focus-visible {
    outline: 2px solid #ce9016;
    outline-offset: 2px;
  }

  .option-name {
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  .option-description {
    font-size: 0.8rem;
    color: #999;
  }
`;

export const Step3BSpeciesSelection: React.FC<Step3BSpeciesSelectionProps> = ({ data, onUpdate }) => {
  const { scrollToBottom } = useAutoScroll();
  const [detailsSpecies, setDetailsSpecies] = useState<Species | null>(null);
  const [selectSpecies, setSelectSpecies] = useState<Species | null>(null);

  // State for species configuration choices
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedLineage, setSelectedLineage] = useState<string | null>(null);
  const [selectedAncestry, setSelectedAncestry] = useState<string | null>(null);
  const [selectedLegacy, setSelectedLegacy] = useState<string | null>(null);

  const { data: species, isLoading, error, execute } = useApiCall<Species[], []>(
    listSpecies
  );

  useEffect(() => {
    execute();
  }, [execute]);

  // Auto-scroll when species selected
  useEffect(() => {
    if (data.selectedSpecies) {
      scrollToBottom({ offset: 20 });
    }
  }, [data.selectedSpecies, scrollToBottom]);

  const handleDetailsClick = (species: Species) => {
    setDetailsSpecies(species);
  };

  const handleSelectClick = (species: Species) => {
    setSelectSpecies(species);

    // Reset configuration state
    setSelectedSkill(null);
    setSelectedLineage(null);
    setSelectedAncestry(null);
    setSelectedLegacy(null);
  };

  const handleConfirmSelection = () => {
    if (!selectSpecies) return;

    const updates: Partial<CharacterBuilderData> = {
      selectedSpecies: selectSpecies.name,
      isHuman: selectSpecies.name === 'Human',
      speciesChoices: {
        ...(selectedSkill && selectSpecies.name === 'Human' && { skill: selectedSkill }),
        ...(selectedSkill && selectSpecies.name === 'Elf' && { elfSkill: selectedSkill }),
        ...(selectedLineage && selectSpecies.name === 'Elf' && { elfLineage: selectedLineage }),
        ...(selectedLineage && selectSpecies.name === 'Gnome' && { gnomeLineage: selectedLineage }),
        ...(selectedAncestry && selectSpecies.name === 'Dragonborn' && { draconicAncestry: selectedAncestry }),
        ...(selectedAncestry && selectSpecies.name === 'Goliath' && { giantAncestry: selectedAncestry }),
        ...(selectedLegacy && selectSpecies.name === 'Tiefling' && { fiendishLegacy: selectedLegacy })
      },
      speciesTraits: selectSpecies.traits
        ? (Array.isArray(selectSpecies.traits) ? selectSpecies.traits : [selectSpecies.traits])
        : []
    };

    onUpdate(updates);
    setSelectSpecies(null);
  };

  const renderSpeciesDetails = (species: Species) => {
    // Parse the traits array through the template parser
    const parsedTraits = parseComplexDnDEntry(species.traits);

    return (
      <DetailsContent>
        {species.description && <p>{species.description}</p>}

        <h3>Traits</h3>
        <div style={{ whiteSpace: 'pre-wrap' }}>{parsedTraits}</div>

        <h3>Basic Info</h3>
        <p><FeatureLabel>Creature Type:</FeatureLabel> {species.creatureType}</p>
        <p><FeatureLabel>Size:</FeatureLabel> {Array.isArray(species.size) ? species.size.join(', ') : species.size}</p>
        <p><FeatureLabel>Speed:</FeatureLabel> {typeof species.speed === 'object' ? JSON.stringify(species.speed) : `${species.speed} feet`}</p>
        {species.languages && species.languages.length > 0 && (
          <p><FeatureLabel>Languages:</FeatureLabel> {species.languages.join(', ')}</p>
        )}
      </DetailsContent>
    );
  };

  const getSpeciesSummary = (species: Species): string => {
    const parts: string[] = [];

    if (species.creatureType) parts.push(species.creatureType);
    if (species.size) {
      const sizeStr = Array.isArray(species.size) ? species.size[0] : species.size;
      parts.push(sizeStr);
    }

    return parts.join(' • ');
  };

  const renderSelectConfiguration = () => {
    if (!selectSpecies) return null;

    const needsSkillChoice = selectSpecies.name === 'Human';
    const needsLineageChoice = selectSpecies.name === 'Elf' || selectSpecies.name === 'Gnome';
    const needsAncestryChoice = selectSpecies.name === 'Dragonborn' || selectSpecies.name === 'Goliath';
    const needsLegacyChoice = selectSpecies.name === 'Tiefling';

    const hasChoices = needsSkillChoice || needsLineageChoice || needsAncestryChoice || needsLegacyChoice;

    if (!hasChoices) {
      return (
        <ConfigSection>
          <p style={{ color: '#c0aa70', textAlign: 'center' }}>
            No additional choices required for {selectSpecies.name}.
          </p>
        </ConfigSection>
      );
    }

    return (
      <>
        {needsSkillChoice && (
          <ConfigSection>
            <SectionTitle>Choose a Skill (Human Versatility)</SectionTitle>
            <SelectionCount>Selected: {selectedSkill ? '1' : '0'} / 1</SelectionCount>
            <OptionGrid>
              {ALL_SKILLS.map((skill) => (
                <OptionButton
                  key={skill}
                  $isSelected={selectedSkill === skill}
                  onClick={() => setSelectedSkill(skill)}
                >
                  {skill}
                </OptionButton>
              ))}
            </OptionGrid>
          </ConfigSection>
        )}

        {needsLineageChoice && selectSpecies.name === 'Elf' && (
          <>
            <ConfigSection>
              <SectionTitle>Choose Elf Lineage</SectionTitle>
              <SelectionCount>Selected: {selectedLineage ? '1' : '0'} / 1</SelectionCount>
              <OptionGrid>
                {ELF_LINEAGES.map((lineage) => (
                  <OptionButton
                    key={lineage.name}
                    $isSelected={selectedLineage === lineage.name}
                    onClick={() => setSelectedLineage(lineage.name)}
                  >
                    <div className="option-name">{lineage.name}</div>
                    <div className="option-description">{lineage.description}</div>
                  </OptionButton>
                ))}
              </OptionGrid>
            </ConfigSection>

            <ConfigSection>
              <SectionTitle>Choose Keen Senses Skill</SectionTitle>
              <SelectionCount>Selected: {selectedSkill ? '1' : '0'} / 1</SelectionCount>
              <OptionGrid>
                {['Insight', 'Perception', 'Survival'].map((skill) => (
                  <OptionButton
                    key={skill}
                    $isSelected={selectedSkill === skill}
                    onClick={() => setSelectedSkill(skill)}
                  >
                    <div className="option-name">{skill}</div>
                    <div className="option-description">
                      {skill === 'Insight' && 'Sense the true intentions of creatures'}
                      {skill === 'Perception' && 'Spot, hear, or detect the presence of things'}
                      {skill === 'Survival' && 'Track, hunt, and navigate wilderness'}
                    </div>
                  </OptionButton>
                ))}
              </OptionGrid>
            </ConfigSection>
          </>
        )}

        {needsLineageChoice && selectSpecies.name === 'Gnome' && (
          <ConfigSection>
            <SectionTitle>Choose Gnome Lineage</SectionTitle>
            <SelectionCount>Selected: {selectedLineage ? '1' : '0'} / 1</SelectionCount>
            <OptionGrid>
              {GNOME_LINEAGES.map((lineage) => (
                <OptionButton
                  key={lineage.name}
                  $isSelected={selectedLineage === lineage.name}
                  onClick={() => setSelectedLineage(lineage.name)}
                >
                  <div className="option-name">{lineage.name}</div>
                  <div className="option-description">{lineage.description}</div>
                </OptionButton>
              ))}
            </OptionGrid>
          </ConfigSection>
        )}

        {needsAncestryChoice && selectSpecies.name === 'Dragonborn' && (
          <ConfigSection>
            <SectionTitle>Choose Draconic Ancestry</SectionTitle>
            <SelectionCount>Selected: {selectedAncestry ? '1' : '0'} / 1</SelectionCount>
            <OptionGrid>
              {DRAGONBORN_ANCESTRY.map((ancestry) => (
                <OptionButton
                  key={ancestry.type}
                  $isSelected={selectedAncestry === ancestry.type}
                  onClick={() => setSelectedAncestry(ancestry.type)}
                >
                  <div className="option-name">{ancestry.type}</div>
                  <div className="option-description">{ancestry.damage} • {ancestry.area}</div>
                </OptionButton>
              ))}
            </OptionGrid>
          </ConfigSection>
        )}

        {needsAncestryChoice && selectSpecies.name === 'Goliath' && (
          <ConfigSection>
            <SectionTitle>Choose Giant Ancestry</SectionTitle>
            <SelectionCount>Selected: {selectedAncestry ? '1' : '0'} / 1</SelectionCount>
            <OptionGrid>
              {GOLIATH_GIANT_ANCESTRY.map((ancestry) => (
                <OptionButton
                  key={ancestry.name}
                  $isSelected={selectedAncestry === ancestry.name}
                  onClick={() => setSelectedAncestry(ancestry.name)}
                >
                  <div className="option-name">{ancestry.name}</div>
                  <div className="option-description">{ancestry.description}</div>
                </OptionButton>
              ))}
            </OptionGrid>
          </ConfigSection>
        )}

        {needsLegacyChoice && (
          <ConfigSection>
            <SectionTitle>Choose Fiendish Legacy</SectionTitle>
            <SelectionCount>Selected: {selectedLegacy ? '1' : '0'} / 1</SelectionCount>
            <OptionGrid>
              {TIEFLING_FIENDISH_LEGACIES.map((legacy) => (
                <OptionButton
                  key={legacy.name}
                  $isSelected={selectedLegacy === legacy.name}
                  onClick={() => setSelectedLegacy(legacy.name)}
                >
                  <div className="option-name">{legacy.name}</div>
                  <div className="option-description">{legacy.description}</div>
                </OptionButton>
              ))}
            </OptionGrid>
          </ConfigSection>
        )}
      </>
    );
  };

  const isConfigurationValid = (): boolean => {
    if (!selectSpecies) return false;

    if (selectSpecies.name === 'Human') return !!selectedSkill;
    if (selectSpecies.name === 'Elf') return !!selectedLineage && !!selectedSkill;
    if (selectSpecies.name === 'Gnome') return !!selectedLineage;
    if (selectSpecies.name === 'Dragonborn' || selectSpecies.name === 'Goliath') return !!selectedAncestry;
    if (selectSpecies.name === 'Tiefling') return !!selectedLegacy;

    // No configuration needed for other species
    return true;
  };

  if (isLoading) {
    return (
      <StepContainer>
        <LoadingState>
          <LoadingSpinner message="Loading species..." />
        </LoadingState>
      </StepContainer>
    );
  }

  if (error || !species) {
    return (
      <StepContainer>
        <ErrorMessage>
          Failed to load species. Please try again.
        </ErrorMessage>
      </StepContainer>
    );
  }

  return (
    <StepContainer>
      <AbilityScoresHeader data={data} />

      <div className="step-description" style={{ marginBottom: '1rem' }}>
        Choose your character's species. Each species grants unique traits and abilities.
      </div>

      <CompactList
        items={species}
        isSelected={(s) => s.name === data.selectedSpecies}
        onDetails={handleDetailsClick}
        onSelect={handleSelectClick}
        renderName={(s) => s.name}
        renderSummary={getSpeciesSummary}
      />

      {/* Details Modal - Read Only */}
      <DetailsModal
        isOpen={!!detailsSpecies}
        onClose={() => setDetailsSpecies(null)}
        title={detailsSpecies?.name || ''}
        content={detailsSpecies ? renderSpeciesDetails(detailsSpecies) : null}
      />

      {/* Select Modal - Configuration */}
      <SelectModal
        isOpen={!!selectSpecies}
        onClose={() => setSelectSpecies(null)}
        onConfirm={handleConfirmSelection}
        title={`Configure ${selectSpecies?.name || ''}`}
        isConfirmDisabled={!isConfigurationValid()}
      >
        {renderSelectConfiguration()}
      </SelectModal>
    </StepContainer>
  );
};
