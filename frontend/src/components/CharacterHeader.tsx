import styled from 'styled-components';
import { CharacterSheetData } from '../types/characterSheet';
import { calculateDerivedValues } from '../services/characterCalculations';
import {
  CharacterName,
  TopStatBox,
  EditableInput,
} from '../styles/components';

// New Responsive Header Container - TIGHT spacing
const HeaderContainer = styled.div`
  border-bottom: 2px solid #333;
  margin-bottom: 0.5rem;
  padding: 0.4rem 0.5rem 0.25rem;

  @media (max-width: 768px) {
    padding: 0.3rem 0.25rem 0.25rem;
  }
`;

// Top Row: Level | Name | Prof Bonus
const TopRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  position: relative;

  @media (max-width: 768px) {
    gap: 0.25rem;
    align-items: center;
  }
`;

// Container for Name + Tab Bar on Desktop
const NameTabContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;

  @media (max-width: 768px) {
    gap: 0;
  }
`;

// Compact Stat Box for mobile
const CompactStatBox = styled(TopStatBox)`
  @media (max-width: 768px) {
    min-width: 50px;

    .stat-label {
      font-size: 0.5rem;
      letter-spacing: 0.3px;
      margin-bottom: 0.1rem;
    }

    .stat-value {
      font-size: 0.75rem;
    }

    input {
      font-size: 0.75rem;
      padding: 0.1rem 0.2rem;
      width: 35px;
    }
  }
`;

// Character Info Row (Species, Class, Subclass, Background)
const CharacterInfoRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.3rem;
  margin-bottom: 0.3rem;

  @media (max-width: 768px) {
    gap: 0.2rem;
    margin-bottom: 0.25rem;
  }
`;

// Info Box - COMPACT
const InfoBox = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid #333;
  border-radius: 4px;
  padding: 0.2rem 0.3rem;
  text-align: center;

  .label {
    font-size: 0.5rem;
    font-weight: 600;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin-bottom: 0.1rem;
  }

  .value {
    font-size: 0.7rem;
    font-weight: 600;
    color: #f8f4e1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @media (max-width: 768px) {
    padding: 0.15rem 0.2rem;

    .label {
      font-size: 0.45rem;
      letter-spacing: 0.2px;
    }

    .value {
      font-size: 0.6rem;
    }
  }
`;

// Tab Bar Container - Centered on both desktop and mobile
const TabBarContainer = styled.div`
  display: flex;
  justify-content: center;

  @media (max-width: 768px) {
    padding: 0.2rem 0;
    overflow-x: auto;
    overflow-y: hidden;
    margin: 0 -0.25rem;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

interface CharacterHeaderProps {
  character: CharacterSheetData;
  updateCharacter: (updates: Partial<CharacterSheetData>) => void;
  onSave?: ((character: CharacterSheetData, options?: { silent?: boolean }) => void | Promise<void>) | undefined;
  tabBar?: React.ReactNode;
}

export default function CharacterHeader({
  character,
  updateCharacter,
  onSave,
  tabBar,
}: CharacterHeaderProps) {
  const derivedValues = calculateDerivedValues(character);

  return (
    <HeaderContainer>
      {/* Top Row: Level | Character Name + Tab Bar (desktop) | Proficiency Bonus */}
      <TopRow>
        <CompactStatBox>
          <div className="stat-label">
            <span className="desktop-label">Level</span>
            <span className="mobile-label" style={{ display: 'none' }}>LV</span>
          </div>
          <div className="stat-value">
            <EditableInput
              type="number"
              value={character.level}
              onChange={(e) => {
                const newLevel = parseInt(e.target.value) || 1;
                const updatedCharacter = { ...character, level: newLevel };
                updateCharacter({ level: newLevel });

                // Auto-save level changes
                if (onSave) {
                  setTimeout(() => {
                    onSave(updatedCharacter, { silent: true });
                  }, 300);
                }
              }}
              min="1"
              max="20"
            />
          </div>
        </CompactStatBox>

        <NameTabContainer>
          <CharacterName>
            <EditableInput
              value={character.name}
              onChange={(e) => updateCharacter({ name: e.target.value })}
              placeholder="Character Name"
            />
          </CharacterName>
          {/* Tab Bar on Desktop - below name, above info */}
          <div className="desktop-tabs" style={{ display: 'block' }}>
            {tabBar && <TabBarContainer>{tabBar}</TabBarContainer>}
          </div>
        </NameTabContainer>

        <CompactStatBox>
          <div className="stat-label">
            <span className="desktop-label">Proficiency Bonus</span>
            <span className="mobile-label" style={{ display: 'none' }}>PROF</span>
          </div>
          <div className="stat-value">
            +{derivedValues.proficiencyBonus}
          </div>
        </CompactStatBox>
      </TopRow>

      {/* Character Info: Species | Class | Subclass | Background - 4 across always */}
      <CharacterInfoRow>
        <InfoBox>
          <div className="label">Species</div>
          <div className="value">
            {character.species || 'Select'}
          </div>
        </InfoBox>
        <InfoBox>
          <div className="label">Class</div>
          <div className="value">
            {character.class || 'Select'}
          </div>
        </InfoBox>
        <InfoBox>
          <div className="label">Subclass</div>
          <div className="value">
            {character.subclass || 'None'}
          </div>
        </InfoBox>
        <InfoBox>
          <div className="label">Background</div>
          <div className="value">
            {character.background || 'Select'}
          </div>
        </InfoBox>
      </CharacterInfoRow>

      {/* Tab Bar on Mobile - centered below info */}
      <div className="mobile-tabs" style={{ display: 'none' }}>
        {tabBar && <TabBarContainer>{tabBar}</TabBarContainer>}
      </div>

      <style>{`
        @media (min-width: 769px) {
          .mobile-label { display: none !important; }
          .desktop-label { display: inline !important; }
          .mobile-tabs { display: none !important; }
          .desktop-tabs { display: block !important; }
        }
        @media (max-width: 768px) {
          .mobile-label { display: inline !important; }
          .desktop-label { display: none !important; }
          .mobile-tabs { display: block !important; }
          .desktop-tabs { display: none !important; }
        }
      `}</style>
    </HeaderContainer>
  );
}
