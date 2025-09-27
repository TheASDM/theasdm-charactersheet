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

// Background Selection Popup Styles
const BackgroundPopupModal = styled.div`
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

const BackgroundPopupTitle = styled.h3`
  color: #d4af37;
  margin: 0 0 15px 0;
  font-size: 1.2rem;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const BackgroundDescription = styled.p`
  color: #f4e7d1;
  font-size: 0.9rem;
  margin: 10px 0 20px 0;
  line-height: 1.4;
  text-align: center;
  font-style: italic;
`;

const BackgroundChoicesContainer = styled.div`
  margin: 15px 0;
`;

const BackgroundChoicesTitle = styled.h4`
  color: #d4af37;
  margin: 0 0 10px 0;
  font-size: 1rem;
  text-align: center;
  text-transform: uppercase;
`;

const BackgroundChoicesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
  margin: 10px 0;
`;

const BackgroundChoice = styled.div<{ selected?: boolean }>`
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

const BackgroundButtonsContainer = styled.div`
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

// D&D 2024 Background data with skills and tools
interface BackgroundData {
  description: string;
  skills: string[];
  toolProficiency: string;
}

const backgroundsData: { [key: string]: BackgroundData } = {
  'Acolyte': {
    description: 'You spent your early days in service to a god or pantheon, performing sacred rites.',
    skills: ['Insight', 'Religion'],
    toolProficiency: 'Calligrapher\'s Supplies'
  },
  'Artisan': {
    description: 'You apprenticed under a master craftsperson, learning to create items of value.',
    skills: ['Investigation', 'Persuasion'],
    toolProficiency: 'Artisan\'s Tools (one of your choice)'
  },
  'Charlatan': {
    description: 'You have always had a talent for deception and made your way through clever schemes.',
    skills: ['Deception', 'Sleight of Hand'],
    toolProficiency: 'Forgery Kit'
  },
  'Criminal': {
    description: 'You fell in with thieves and scoundrels, learning the ways of the underworld.',
    skills: ['Sleight of Hand', 'Stealth'],
    toolProficiency: 'Thieves\' Tools'
  },
  'Entertainer': {
    description: 'You have practiced your art before audiences, bringing joy through performance.',
    skills: ['Acrobatics', 'Performance'],
    toolProficiency: 'Musical Instrument (one of your choice)'
  },
  'Farmer': {
    description: 'You worked the land, understanding the cycles of nature and honest labor.',
    skills: ['Animal Handling', 'Nature'],
    toolProficiency: 'Carpenter\'s Tools'
  },
  'Folk Hero': {
    description: 'You come from humble beginnings but are destined for greatness.',
    skills: ['Animal Handling', 'Survival'],
    toolProficiency: 'Artisan\'s Tools (one of your choice)'
  },
  'Guard': {
    description: 'You served as a protector, maintaining order and defending the innocent.',
    skills: ['Athletics', 'Perception'],
    toolProficiency: 'Gaming Set (one of your choice)'
  },
  'Guide': {
    description: 'You know the wilderness and have led others through dangerous terrain.',
    skills: ['Stealth', 'Survival'],
    toolProficiency: 'Cartographer\'s Tools'
  },
  'Hermit': {
    description: 'You lived in seclusion, either in a sheltered community or alone.',
    skills: ['Medicine', 'Religion'],
    toolProficiency: 'Herbalism Kit'
  },
  'Merchant': {
    description: 'You earned coin by buying and selling goods across trade routes.',
    skills: ['Insight', 'Persuasion'],
    toolProficiency: 'Navigator\'s Tools'
  },
  'Noble': {
    description: 'You were born into wealth and privilege, accustomed to a life of luxury.',
    skills: ['History', 'Persuasion'],
    toolProficiency: 'Gaming Set (one of your choice)'
  },
  'Sage': {
    description: 'You spent years learning the lore of the multiverse through study.',
    skills: ['Arcana', 'History'],
    toolProficiency: 'Calligrapher\'s Supplies'
  },
  'Sailor': {
    description: 'You sailed the seas, learning to navigate and survive on the water.',
    skills: ['Acrobatics', 'Perception'],
    toolProficiency: 'Navigator\'s Tools'
  },
  'Scribe': {
    description: 'You recorded knowledge and served as a keeper of important documents.',
    skills: ['Investigation', 'Perception'],
    toolProficiency: 'Calligrapher\'s Supplies'
  },
  'Soldier': {
    description: 'You fought battles as part of an organized military force.',
    skills: ['Athletics', 'Intimidation'],
    toolProficiency: 'Gaming Set (one of your choice)'
  },
  'Wayfarer': {
    description: 'You have traveled far and wide, never settling in one place for long.',
    skills: ['Insight', 'Stealth'],
    toolProficiency: 'Thieves\' Tools'
  }
};

// Props interface
interface BackgroundSelectionModalProps {
  isOpen: boolean;
  selectedBackground: string;
  onBackgroundSelect: (background: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const BackgroundSelectionModal: React.FC<BackgroundSelectionModalProps> = ({
  isOpen,
  selectedBackground,
  onBackgroundSelect: _onBackgroundSelect,
  onConfirm,
  onCancel
}) => {
  if (!isOpen || !selectedBackground) return null;

  const backgroundData = backgroundsData[selectedBackground];
  if (!backgroundData) return null;

  return (
    <ModalOverlay isOpen={isOpen} onClick={(e) => {
      if (e.target === e.currentTarget) {
        onCancel();
      }
    }}>
      <BackgroundPopupModal>
        <BackgroundPopupTitle>
          {selectedBackground} Background
        </BackgroundPopupTitle>

        <BackgroundDescription>
          {backgroundData.description}
        </BackgroundDescription>

        {/* Skills Granted */}
        <BackgroundChoicesContainer>
          <BackgroundChoicesTitle>
            Skill Proficiencies Granted
          </BackgroundChoicesTitle>
          <BackgroundChoicesGrid>
            {backgroundData.skills.map((skill) => (
              <BackgroundChoice key={skill} selected>
                {skill}
              </BackgroundChoice>
            ))}
          </BackgroundChoicesGrid>
        </BackgroundChoicesContainer>

        {/* Tool Proficiency */}
        <BackgroundChoicesContainer>
          <BackgroundChoicesTitle>
            Tool Proficiency
          </BackgroundChoicesTitle>
          <BackgroundChoicesGrid>
            <BackgroundChoice selected>
              {backgroundData.toolProficiency}
            </BackgroundChoice>
          </BackgroundChoicesGrid>
        </BackgroundChoicesContainer>

        <BackgroundButtonsContainer>
          <CancelButton onClick={onCancel}>
            Cancel
          </CancelButton>
          <ConfirmButton onClick={onConfirm}>
            Confirm Selection
          </ConfirmButton>
        </BackgroundButtonsContainer>
      </BackgroundPopupModal>
    </ModalOverlay>
  );
};

export default BackgroundSelectionModal;
export { backgroundsData };
export type { BackgroundData };