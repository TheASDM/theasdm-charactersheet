import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { StepContainer } from '../../styles/components/CharacterGeneratorWizard.styles';
import { CharacterBuilderData } from '../CharacterGeneratorWizard';

interface Step3CSpeciesChoicesProps {
  data: CharacterBuilderData;
  onUpdate: (updates: Partial<CharacterBuilderData>) => void;
}

// Skills list from D&D 2024
const ALL_SKILLS = [
  'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception',
  'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine',
  'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion',
  'Sleight of Hand', 'Stealth', 'Survival'
];

// Species choice data
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
  {
    name: 'Drow',
    description: 'The range of your Darkvision increases to 120 feet. You also know the Dancing Lights cantrip.',
    level3: 'Faerie Fire',
    level5: 'Darkness'
  },
  {
    name: 'High Elf',
    description: 'You know the Prestidigitation cantrip. Whenever you finish a Long Rest, you can replace that cantrip with a different cantrip from the Wizard spell list.',
    level3: 'Detect Magic',
    level5: 'Misty Step'
  },
  {
    name: 'Wood Elf',
    description: 'Your Speed increases to 35 feet. You also know the Druidcraft cantrip.',
    level3: 'Longstrider',
    level5: 'Pass without Trace'
  }
];

const GNOME_LINEAGES = [
  {
    name: 'Forest Gnome',
    description: 'You know the Minor Illusion cantrip. You also always have the Speak with Animals spell prepared.'
  },
  {
    name: 'Rock Gnome',
    description: 'You know the Mending and Prestidigitation cantrips. You can create tiny clockwork devices using Prestidigitation.'
  }
];

const GOLIATH_GIANT_ANCESTRY = [
  {
    name: "Cloud's Jaunt (Cloud Giant)",
    description: 'As a Bonus Action, you magically teleport up to 30 feet to an unoccupied space you can see.'
  },
  {
    name: "Fire's Burn (Fire Giant)",
    description: 'When you hit a target with an attack roll and deal damage to it, you can also deal 1d10 Fire damage to that target.'
  },
  {
    name: "Frost's Chill (Frost Giant)",
    description: 'When you hit a target with an attack roll and deal damage to it, you can also deal 1d6 Cold damage to that target and reduce its Speed by 10 feet until the start of your next turn.'
  },
  {
    name: "Hill's Tumble (Hill Giant)",
    description: 'When you hit a Large or smaller creature with an attack roll and deal damage to it, you can give that target the Prone condition.'
  },
  {
    name: "Stone's Endurance (Stone Giant)",
    description: 'When you take damage, you can take a Reaction to roll 1d12. Add your Constitution modifier to the number rolled and reduce the damage by that total.'
  },
  {
    name: "Storm's Thunder (Storm Giant)",
    description: 'When you take damage from a creature within 60 feet of you, you can take a Reaction to deal 1d8 Thunder damage to that creature.'
  }
];

const TIEFLING_FIENDISH_LEGACIES = [
  {
    name: 'Abyssal',
    description: 'You have Resistance to Poison damage. You also know the Poison Spray cantrip.',
    level3: 'Ray of Sickness',
    level5: 'Hold Person'
  },
  {
    name: 'Chthonic',
    description: 'You have Resistance to Necrotic damage. You also know the Chill Touch cantrip.',
    level3: 'False Life',
    level5: 'Ray of Enfeeblement'
  },
  {
    name: 'Infernal',
    description: 'You have Resistance to Fire damage. You also know the Fire Bolt cantrip.',
    level3: 'Hellish Rebuke',
    level5: 'Darkness'
  }
];

const ChoicesContainer = styled.div`
  .choice-section {
    margin-bottom: 2rem;

    .section-title {
      color: #ce9016;
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
`;

const ChoiceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
`;

const ChoiceCard = styled.div<{ selected: boolean }>`
  background: rgba(26, 26, 26, 0.8);
  border: 2px solid ${props => props.selected ? '#ce9016' : '#444'};
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 120px;
  display: flex;
  flex-direction: column;

  &:hover {
    border-color: #ce9016;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(206, 144, 22, 0.3);
  }

  ${props => props.selected && `
    background: rgba(206, 144, 22, 0.1);
    box-shadow: 0 4px 12px rgba(206, 144, 22, 0.4);
  `}
`;

const ChoiceName = styled.h3`
  color: #ce9016;
  margin: 0 0 0.5rem 0;
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  text-align: center;
`;

const ChoiceDescription = styled.div`
  color: #ccc;
  font-size: 0.8rem;
  line-height: 1.3;
  flex: 1;
  text-align: center;
`;

const ChoiceDetails = styled.div`
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #444;

  .detail-item {
    color: #aaa;
    font-size: 0.75rem;
    margin: 0.2rem 0;
    text-align: center;

    .label {
      color: #ce9016;
      font-weight: 600;
    }
  }
`;

const SelectionSummary = styled.div`
  background: rgba(206, 144, 22, 0.1);
  border: 1px solid rgba(206, 144, 22, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1.5rem;
  text-align: center;

  .summary-title {
    color: #ce9016;
    font-weight: 600;
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }

  .summary-text {
    color: #ccc;
    font-size: 0.9rem;
  }
`;

export const Step3CSpeciesChoices: React.FC<Step3CSpeciesChoicesProps> = ({
  data,
  onUpdate
}) => {
  const [selectedChoices, setSelectedChoices] = useState<{ [key: string]: string }>({});

  // Initialize selected choices from data
  useEffect(() => {
    if (data.speciesChoices) {
      setSelectedChoices(data.speciesChoices);
    }
  }, [data.speciesChoices]);

  const handleChoiceSelect = (choiceType: string, choice: string) => {
    const newChoices = { ...selectedChoices, [choiceType]: choice };
    setSelectedChoices(newChoices);
    onUpdate({ speciesChoices: newChoices });
  };

  const renderDragonbornAncestry = () => (
    <div className="choice-section">
      <div className="section-title">Choose Your Draconic Ancestry</div>
      <div className="section-description">
        Your draconic ancestry determines your breath weapon damage type and resistance.
      </div>
      <ChoiceGrid>
        {DRAGONBORN_ANCESTRY.map((ancestry) => (
          <ChoiceCard
            key={ancestry.type}
            selected={selectedChoices.draconicAncestry === ancestry.type}
            onClick={() => handleChoiceSelect('draconicAncestry', ancestry.type)}
          >
            <ChoiceName>{ancestry.type} Dragon</ChoiceName>
            <ChoiceDescription>
              Your breath weapon and damage resistance are based on {ancestry.type.toLowerCase()} dragons.
            </ChoiceDescription>
            <ChoiceDetails>
              <div className="detail-item">
                <span className="label">Damage Type:</span> {ancestry.damage}
              </div>
              <div className="detail-item">
                <span className="label">Breath Weapon:</span> {ancestry.area}
              </div>
            </ChoiceDetails>
          </ChoiceCard>
        ))}
      </ChoiceGrid>
    </div>
  );

  const renderElfLineage = () => (
    <>
      <div className="choice-section">
        <div className="section-title">Choose Your Elven Lineage</div>
        <div className="section-description">
          Your elven lineage grants you specific magical abilities and spell knowledge.
        </div>
        <ChoiceGrid>
          {ELF_LINEAGES.map((lineage) => (
            <ChoiceCard
              key={lineage.name}
              selected={selectedChoices.elfLineage === lineage.name}
              onClick={() => handleChoiceSelect('elfLineage', lineage.name)}
            >
              <ChoiceName>{lineage.name}</ChoiceName>
              <ChoiceDescription>{lineage.description}</ChoiceDescription>
              <ChoiceDetails>
                <div className="detail-item">
                  <span className="label">Level 3 Spell:</span> {lineage.level3}
                </div>
                <div className="detail-item">
                  <span className="label">Level 5 Spell:</span> {lineage.level5}
                </div>
              </ChoiceDetails>
            </ChoiceCard>
          ))}
        </ChoiceGrid>
      </div>

      <div className="choice-section">
        <div className="section-title">Choose Your Keen Senses Skill</div>
        <div className="section-description">
          Your Keen Senses trait grants you proficiency in one of these skills.
        </div>
        <ChoiceGrid>
          {['Insight', 'Perception', 'Survival'].map((skill) => (
            <ChoiceCard
              key={skill}
              selected={selectedChoices.elfSkill === skill}
              onClick={() => handleChoiceSelect('elfSkill', skill)}
            >
              <ChoiceName>{skill}</ChoiceName>
              <ChoiceDescription>
                {skill === 'Insight' && 'Ability to sense the true intentions of a creature.'}
                {skill === 'Perception' && 'Ability to spot, hear, or otherwise detect the presence of something.'}
                {skill === 'Survival' && 'Ability to follow tracks, hunt wild game, guide others through wilderness.'}
              </ChoiceDescription>
            </ChoiceCard>
          ))}
        </ChoiceGrid>
      </div>
    </>
  );

  const renderGnomeLineage = () => (
    <div className="choice-section">
      <div className="section-title">Choose Your Gnomish Lineage</div>
      <div className="section-description">
        Your gnomish lineage determines your magical abilities and cantrip knowledge.
      </div>
      <ChoiceGrid>
        {GNOME_LINEAGES.map((lineage) => (
          <ChoiceCard
            key={lineage.name}
            selected={selectedChoices.gnomeLineage === lineage.name}
            onClick={() => handleChoiceSelect('gnomeLineage', lineage.name)}
          >
            <ChoiceName>{lineage.name}</ChoiceName>
            <ChoiceDescription>{lineage.description}</ChoiceDescription>
          </ChoiceCard>
        ))}
      </ChoiceGrid>
    </div>
  );

  const renderGoliathAncestry = () => (
    <div className="choice-section">
      <div className="section-title">Choose Your Giant Ancestry</div>
      <div className="section-description">
        Your giant ancestry grants you a supernatural boon that you can use a number of times equal to your Proficiency Bonus.
      </div>
      <ChoiceGrid>
        {GOLIATH_GIANT_ANCESTRY.map((ancestry) => (
          <ChoiceCard
            key={ancestry.name}
            selected={selectedChoices.giantAncestry === ancestry.name}
            onClick={() => handleChoiceSelect('giantAncestry', ancestry.name)}
          >
            <ChoiceName>{ancestry.name.split(' (')[0]}</ChoiceName>
            <ChoiceDescription>{ancestry.description}</ChoiceDescription>
          </ChoiceCard>
        ))}
      </ChoiceGrid>
    </div>
  );

  const renderTieflingLegacy = () => (
    <div className="choice-section">
      <div className="section-title">Choose Your Fiendish Legacy</div>
      <div className="section-description">
        Your fiendish legacy determines your damage resistance, cantrip, and spell progression.
      </div>
      <ChoiceGrid>
        {TIEFLING_FIENDISH_LEGACIES.map((legacy) => (
          <ChoiceCard
            key={legacy.name}
            selected={selectedChoices.fiendishLegacy === legacy.name}
            onClick={() => handleChoiceSelect('fiendishLegacy', legacy.name)}
          >
            <ChoiceName>{legacy.name}</ChoiceName>
            <ChoiceDescription>{legacy.description}</ChoiceDescription>
            <ChoiceDetails>
              <div className="detail-item">
                <span className="label">Level 3 Spell:</span> {legacy.level3}
              </div>
              <div className="detail-item">
                <span className="label">Level 5 Spell:</span> {legacy.level5}
              </div>
            </ChoiceDetails>
          </ChoiceCard>
        ))}
      </ChoiceGrid>
    </div>
  );

  const renderHumanChoices = () => (
    <>
      <div className="choice-section">
        <div className="section-title">Choose Your Skill Proficiency</div>
        <div className="section-description">
          As a Human, you gain proficiency in one skill of your choice from any skill list.
        </div>
        <ChoiceGrid>
          {ALL_SKILLS.map((skill) => (
            <ChoiceCard
              key={skill}
              selected={selectedChoices.humanSkill === skill}
              onClick={() => handleChoiceSelect('humanSkill', skill)}
            >
              <ChoiceName>{skill}</ChoiceName>
              <ChoiceDescription>
                Gain proficiency in {skill}, adding your proficiency bonus to all {skill} checks.
              </ChoiceDescription>
            </ChoiceCard>
          ))}
        </ChoiceGrid>
      </div>

      <div className="choice-section">
        <div className="section-title">Choose Your Second Origin Feat</div>
        <div className="section-description">
          Humans receive an additional Origin Feat. This will be selected in the Origin Feats step.
        </div>
        <SelectionSummary>
          <div className="summary-title">Extra Origin Feat</div>
          <div className="summary-text">
            You will select 2 Origin Feats instead of 1 in the next step. This gives Humans additional versatility and customization options.
          </div>
        </SelectionSummary>
      </div>
    </>
  );

  const getSelectedChoiceSummary = () => {
    const choices = [];
    if (selectedChoices.draconicAncestry) {
      const ancestry = DRAGONBORN_ANCESTRY.find(a => a.type === selectedChoices.draconicAncestry);
      choices.push(`${ancestry?.type} Dragon (${ancestry?.damage} damage)`);
    }
    if (selectedChoices.elfLineage) {
      choices.push(`${selectedChoices.elfLineage} Elf`);
    }
    if (selectedChoices.gnomeLineage) {
      choices.push(`${selectedChoices.gnomeLineage} Gnome`);
    }
    if (selectedChoices.giantAncestry) {
      choices.push(selectedChoices.giantAncestry.split(' (')[0]);
    }
    if (selectedChoices.fiendishLegacy) {
      choices.push(`${selectedChoices.fiendishLegacy} Legacy`);
    }
    if (selectedChoices.humanSkill) {
      choices.push(`${selectedChoices.humanSkill} Skill Proficiency`);
    }
    return choices;
  };

  const hasRequiredChoices = () => {
    switch (data.selectedSpecies?.toLowerCase()) {
      case 'dragonborn':
        return !!selectedChoices.draconicAncestry;
      case 'elf':
        return !!selectedChoices.elfLineage && !!selectedChoices.elfSkill;
      case 'gnome':
        return !!selectedChoices.gnomeLineage;
      case 'goliath':
        return !!selectedChoices.giantAncestry;
      case 'tiefling':
        return !!selectedChoices.fiendishLegacy;
      case 'human':
        return !!selectedChoices.humanSkill;
      default:
        return true; // Species without choices
    }
  };

  const needsChoices = ['dragonborn', 'elf', 'gnome', 'goliath', 'tiefling', 'human'].includes(
    data.selectedSpecies?.toLowerCase() || ''
  );

  if (!needsChoices) {
    return (
      <StepContainer>
        <div className="step-title">Species Choices</div>
        <div className="step-description">
          Your selected species ({data.selectedSpecies}) doesn't require additional choices.
        </div>

        <div className="step-content">
          <SelectionSummary>
            <div className="summary-title">No Additional Choices Required</div>
            <div className="summary-text">
              {data.selectedSpecies} has all their traits automatically determined. You can proceed to the next step.
            </div>
          </SelectionSummary>
        </div>
      </StepContainer>
    );
  }

  return (
    <StepContainer>
      <div className="step-title">Species Choices</div>
      <div className="step-description">
        Make choices specific to your selected species to customize your character's abilities.
      </div>

      <div className="step-content">
        <ChoicesContainer>
          {data.selectedSpecies?.toLowerCase() === 'dragonborn' && renderDragonbornAncestry()}
          {data.selectedSpecies?.toLowerCase() === 'elf' && renderElfLineage()}
          {data.selectedSpecies?.toLowerCase() === 'gnome' && renderGnomeLineage()}
          {data.selectedSpecies?.toLowerCase() === 'goliath' && renderGoliathAncestry()}
          {data.selectedSpecies?.toLowerCase() === 'tiefling' && renderTieflingLegacy()}
          {data.selectedSpecies?.toLowerCase() === 'human' && renderHumanChoices()}

          {getSelectedChoiceSummary().length > 0 && (
            <SelectionSummary>
              <div className="summary-title">Selected Choices</div>
              <div className="summary-text">
                {getSelectedChoiceSummary().join(', ')}
              </div>
            </SelectionSummary>
          )}

          {!hasRequiredChoices() && (
            <div style={{
              textAlign: 'center',
              color: '#ff6b6b',
              marginTop: '1rem',
              fontSize: '0.9rem'
            }}>
              ⚠️ Please make all required choices before proceeding.
            </div>
          )}
        </ChoicesContainer>
      </div>
    </StepContainer>
  );
};