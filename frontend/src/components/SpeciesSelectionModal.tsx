import React from 'react';
import styled from 'styled-components';

// Import modal shared styles - we'll create these later
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

// Species Selection Popup Styles
const SpeciesPopupModal = styled.div`
  background: linear-gradient(135deg, #2a2520 0%, #1a1a1a 100%);
  border: 3px solid #d4af37;
  border-radius: 10px;
  padding: 20px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  color: #f4e7d1;
  font-family: 'Cinzel', serif;
`;

const SpeciesPopupTitle = styled.h3`
  color: #d4af37;
  margin: 0 0 10px 0;
  font-size: 1.2rem;
  text-align: center;
  text-transform: uppercase;
`;

const SpeciesDescription = styled.p`
  color: #f4e7d1;
  font-size: 0.9rem;
  margin: 10px 0 15px 0;
  line-height: 1.4;
`;

const SpeciesChoicesContainer = styled.div`
  margin: 12px 0;
`;

const SpeciesChoicesTitle = styled.h4`
  color: #d4af37;
  margin: 0 0 8px 0;
  font-size: 0.95rem;
  text-transform: uppercase;
`;

const SpeciesChoicesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  margin-bottom: 15px;
`;

const SpeciesChoice = styled.div<{ selected?: boolean }>`
  background: ${props => props.selected ? 'rgba(212, 175, 55, 0.2)' : 'rgba(42, 37, 32, 0.5)'};
  border: 2px solid ${props => props.selected ? '#d4af37' : 'rgba(212, 175, 55, 0.3)'};
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #d4af37;
    background: rgba(212, 175, 55, 0.15);
    transform: translateY(-1px);
  }
`;

const SpeciesChoiceName = styled.div`
  font-weight: 600;
  color: #d4af37;
  margin-bottom: 4px;
  font-size: 0.9rem;
`;

const SpeciesChoiceDescription = styled.div`
  font-size: 0.75rem;
  color: #c4b49d;
  line-height: 1.3;
`;

const SpeciesButtonsContainer = styled.div`
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

// Species data interfaces
interface SpeciesChoice {
  category: string;
  options: { name: string; description: string }[];
}

interface SpeciesData {
  description: string;
  choices?: SpeciesChoice[];
}

// Comprehensive species choices structure based on D&D 2024
const speciesChoices: { [key: string]: SpeciesData } = {
  'Aasimar': {
    description: 'Touched by the divine, Aasimar bear the mark of celestial influence.',
    choices: [
      {
        category: 'Celestial Legacy',
        options: [
          { name: 'Protector', description: 'Radiant Soul: sprout spectral wings as bonus action, fly speed 30ft for 1 minute' },
          { name: 'Scourge', description: 'Radiant Consumption: end of turn, you and creatures within 10ft take radiant damage equal to level' },
          { name: 'Fallen', description: 'Necrotic Shroud: frighten creatures within 10ft, bonus necrotic damage equal to level' }
        ]
      }
    ]
  },
  'Dragonborn': {
    description: 'Proud dragon-blooded humanoids with draconic heritage.',
    choices: [
      {
        category: 'Draconic Ancestry',
        options: [
          { name: 'Black Dragon', description: 'Acid damage, 30ft line breath weapon' },
          { name: 'Blue Dragon', description: 'Lightning damage, 30ft line breath weapon' },
          { name: 'Brass Dragon', description: 'Fire damage, 30ft line breath weapon' },
          { name: 'Bronze Dragon', description: 'Lightning damage, 30ft line breath weapon' },
          { name: 'Copper Dragon', description: 'Acid damage, 30ft line breath weapon' },
          { name: 'Gold Dragon', description: 'Fire damage, 15ft cone breath weapon' },
          { name: 'Green Dragon', description: 'Poison damage, 15ft cone breath weapon' },
          { name: 'Red Dragon', description: 'Fire damage, 15ft cone breath weapon' },
          { name: 'Silver Dragon', description: 'Cold damage, 15ft cone breath weapon' },
          { name: 'White Dragon', description: 'Cold damage, 15ft cone breath weapon' }
        ]
      }
    ]
  },
  'Dwarf': {
    description: 'Stout folk known for their craftsmanship and resilience.',
    choices: [
      {
        category: 'Subrace',
        options: [
          { name: 'Mountain Dwarf', description: 'Medium armor proficiency, +2 Strength' },
          { name: 'Hill Dwarf', description: '+1 hit point per level, +2 Wisdom' }
        ]
      }
    ]
  },
  'Elf': {
    description: 'Graceful and long-lived, elves possess keen senses and magical affinity.',
    choices: [
      {
        category: 'Elven Lineage',
        options: [
          { name: 'Drow', description: 'Dark elf with superior darkvision and innate spellcasting' },
          { name: 'High Elf', description: 'Classically trained elf with bonus cantrip and weapon proficiencies' },
          { name: 'Wood Elf', description: 'Forest dweller with enhanced speed and natural stealth' },
        ]
      },
      {
        category: 'Keen Senses',
        options: [
          { name: 'Insight', description: 'Proficiency in Insight skill' },
          { name: 'Perception', description: 'Proficiency in Perception skill' },
          { name: 'Survival', description: 'Proficiency in Survival skill' },
        ]
      },
      {
        category: 'Spellcasting Ability',
        options: [
          { name: 'Intelligence', description: 'Use Intelligence for your lineage spells' },
          { name: 'Wisdom', description: 'Use Wisdom for your lineage spells' },
          { name: 'Charisma', description: 'Use Charisma for your lineage spells' },
        ]
      }
    ]
  },
  'Gnome': {
    description: 'Small and clever, gnomes have a natural affinity for magic and invention.',
    choices: [
      {
        category: 'Gnomish Lineage',
        options: [
          { name: 'Forest Gnome', description: 'Nature-attuned with minor illusion cantrip and speak with small beasts' },
          { name: 'Rock Gnome', description: "Inventive tinker with artificer's lore and clockwork toys" },
        ]
      },
      {
        category: 'Spellcasting Ability',
        options: [
          { name: 'Intelligence', description: 'Use Intelligence for your gnome magic' },
          { name: 'Wisdom', description: 'Use Wisdom for your gnome magic' },
          { name: 'Charisma', description: 'Use Charisma for your gnome magic' },
        ]
      }
    ]
  },
  'Goliath': {
    description: 'Towering mountain-dwellers with natural strength and endurance.',
    choices: [
      {
        category: 'Mountain Heritage',
        options: [
          { name: 'Stone Endurance', description: 'Reduce damage by 1d12 + Constitution modifier once per rest' },
          { name: 'Powerful Build', description: 'Count as one size larger for carrying capacity' }
        ]
      }
    ]
  },
  'Halfling': {
    description: 'Small and lucky folk who value comfort and community.',
    choices: [
      {
        category: 'Subrace',
        options: [
          { name: 'Lightfoot', description: 'Naturally Stealthy: hide behind larger creatures' },
          { name: 'Stout', description: 'Stout Resilience: advantage on saves vs poison, resistance to poison damage' }
        ]
      }
    ]
  },
  'Human': {
    description: 'Versatile and ambitious, humans excel at adapting to any situation.',
    choices: [
      {
        category: 'Skillful',
        options: [
          { name: 'Choose Any Skill', description: 'Select proficiency in any one skill of your choice' },
        ]
      },
      {
        category: 'Versatile',
        options: [
          { name: 'Choose Origin Feat', description: 'Select any feat with the Origin tag' },
        ]
      }
    ]
  },
  'Orc': {
    description: 'Fierce warriors with orcish strength and endurance.',
    choices: [
      {
        category: 'Orcish Heritage',
        options: [
          { name: 'Aggressive', description: 'Move up to speed toward hostile creature as bonus action' },
          { name: 'Savage Attacks', description: 'Roll one additional damage die on critical hits with melee weapons' }
        ]
      }
    ]
  },
  'Tiefling': {
    description: 'Bearing infernal heritage, tieflings possess fiendish powers.',
    choices: [
      {
        category: 'Fiendish Legacy',
        options: [
          { name: 'Abyssal', description: 'Chaotic magic and resistance, with random spell effects' },
          { name: 'Chthonic', description: 'Death and necromancy magic from the lower planes' },
          { name: 'Infernal', description: 'Classic devil heritage with fire magic and charm abilities' },
        ]
      },
      {
        category: 'Spellcasting Ability',
        options: [
          { name: 'Intelligence', description: 'Use Intelligence for your legacy spells' },
          { name: 'Wisdom', description: 'Use Wisdom for your legacy spells' },
          { name: 'Charisma', description: 'Use Charisma for your legacy spells' },
        ]
      }
    ]
  }
};

// Props interface
interface SpeciesSelectionModalProps {
  isOpen: boolean;
  selectedSpecies: string;
  selectedSpeciesChoices: { [category: string]: string };
  onSpeciesSelect?: (species: string) => void;
  onChoiceSelect: (category: string, choice: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const SpeciesSelectionModal: React.FC<SpeciesSelectionModalProps> = ({
  isOpen,
  selectedSpecies,
  selectedSpeciesChoices,
  onSpeciesSelect: _onSpeciesSelect,
  onChoiceSelect,
  onConfirm,
  onCancel
}) => {
  if (!isOpen || !selectedSpecies) return null;

  const speciesData = speciesChoices[selectedSpecies];
  if (!speciesData) return null;

  const hasChoices = speciesData.choices && speciesData.choices.length > 0;
  const allChoicesMade = !hasChoices || speciesData.choices!.every(choice =>
    selectedSpeciesChoices[choice.category]
  );

  return (
    <ModalOverlay isOpen={isOpen} onClick={(e) => {
      if (e.target === e.currentTarget) {
        onCancel();
      }
    }}>
      <SpeciesPopupModal>
        <SpeciesPopupTitle>
          Select {selectedSpecies}
        </SpeciesPopupTitle>

        <SpeciesDescription>
          {speciesData.description}
        </SpeciesDescription>

        {hasChoices && speciesData.choices!.map((choiceCategory) => (
          <SpeciesChoicesContainer key={choiceCategory.category}>
            <SpeciesChoicesTitle>
              Choose {choiceCategory.category}:
            </SpeciesChoicesTitle>
            <SpeciesChoicesGrid>
              {choiceCategory.options.map((option) => (
                <SpeciesChoice
                  key={option.name}
                  selected={selectedSpeciesChoices[choiceCategory.category] === option.name}
                  onClick={() => onChoiceSelect(choiceCategory.category, option.name)}
                >
                  <SpeciesChoiceName>{option.name}</SpeciesChoiceName>
                  <SpeciesChoiceDescription>{option.description}</SpeciesChoiceDescription>
                </SpeciesChoice>
              ))}
            </SpeciesChoicesGrid>
          </SpeciesChoicesContainer>
        ))}

        <SpeciesButtonsContainer>
          <CancelButton onClick={onCancel}>
            Cancel
          </CancelButton>
          <ConfirmButton
            onClick={onConfirm}
            disabled={!allChoicesMade}
          >
            Confirm Selection
          </ConfirmButton>
        </SpeciesButtonsContainer>
      </SpeciesPopupModal>
    </ModalOverlay>
  );
};

export default SpeciesSelectionModal;
export { speciesChoices };
export type { SpeciesData, SpeciesChoice };