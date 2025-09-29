import { useState } from 'react';
import styled from 'styled-components';
import { Hero, CharacterSheet } from '../components';
import {
  CharacterSheetData,
  createDefaultCharacterSheet,
} from '../types/characterSheet';

// Import medieval fonts
const FontImport = styled.div`
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:wght@400;600&display=swap');
`;

// Main page container
const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(
    135deg,
    #363636ff 0%,
    #4b4b4bff 25%,
    #323232ff 50%,
    #222222ff 75%,
    #0e0e0eff 100%
  );
  padding: 0;
  font-family: 'Crimson Text', serif;
`;

// Content wrapper
const ContentContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
`;

// Main container that holds everything below the hero
const MainContainer = styled.div`
  background: linear-gradient(
    145deg,
    rgba(90, 58, 42, 0.8),
    rgba(74, 42, 26, 0.8)
  );
  border: 2px solid #8b6914;
  border-radius: 20px 20px 15px 15px;
  margin: 0 20px;
  margin-top: -5px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3), 0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(139, 105, 20, 0.3);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><filter id="paper"><feTurbulence baseFrequency="0.02" numOctaves="3" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="0.8"/></filter></defs><rect width="100" height="100" fill="rgba(101,67,33,0.1)" filter="url(%23paper)"/></svg>')
      repeat;
    opacity: 0.6;
    pointer-events: none;
    z-index: 1;
  }

  @media (max-width: 768px) {
    margin: 0 10px;
    margin-top: -2px;
  }

  @media (max-width: 480px) {
    margin: 0 5px;
    margin-top: -2px;
  }
`;

// Content inside the main container
const MainContent = styled.div`
  position: relative;
  z-index: 2;
  padding: 30px;

  @media (max-width: 768px) {
    padding: 20px;
  }

  @media (max-width: 480px) {
    padding: 15px;
  }
`;

const TestControls = styled.div`
  background: rgba(139, 105, 20, 0.1);
  border: 2px solid #8b6914;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  text-align: center;
`;

const TestButton = styled.button`
  background: linear-gradient(145deg, #d4af37, #b8941f);
  color: #2c1810;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Cinzel', serif;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  margin: 0 10px;

  &:hover {
    background: linear-gradient(145deg, #b8941f, #a0801b);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

const CharacterSheetTestPage: React.FC = () => {
  const [characterData, setCharacterData] = useState<CharacterSheetData>(() => {
    const defaultData = createDefaultCharacterSheet();
    // Add some sample data to make it more interesting
    return {
      ...defaultData,
      name: 'Aeliana Brightblade',
      background: 'Folk Hero',
      class: 'Paladin',
      species: 'Human',
      subclass: 'Oath of Devotion',
      level: 3,
      xp: 900,
      abilityScores: {
        strength: 16,
        dexterity: 12,
        constitution: 14,
        intelligence: 10,
        wisdom: 13,
        charisma: 15,
      },
      armorClass: 18,
      hitPoints: {
        current: 25,
        max: 25,
        temp: 0,
      },
      speed: 30,
      size: 'Medium',
      classFeatures: [
        'Divine Sense',
        'Lay on Hands',
        'Fighting Style: Defense',
        'Spellcasting',
        'Divine Smite',
        'Divine Health',
        'Sacred Oath: Oath of Devotion',
      ],
      speciesTraits: ['Extra Language', 'Extra Skill Proficiency', 'Versatile'],
      weapons: [
        {
          name: 'Longsword',
          atkBonus: '+5',
          damage: '1d8+3 slashing',
          notes: 'Versatile (1d10)',
        },
        {
          name: 'Shield',
          atkBonus: '+5',
          damage: '1d4+3 bludgeoning',
          notes: '+2 AC',
        },
        {
          name: 'Javelin',
          atkBonus: '+5',
          damage: '1d6+3 piercing',
          notes: 'Thrown (range 30/120)',
        },
      ],
      proficiencies: {
        armor: ['Light Armor', 'Medium Armor', 'Heavy Armor', 'Shields'],
        weapons: ['Simple Weapons', 'Martial Weapons'],
        tools: ["Smith's Tools", 'Vehicles (Land)'],
        skills: ['Athletics', 'Insight', 'Intimidation', 'Medicine'],
        savingThrows: ['Wisdom', 'Charisma'],
      },
    };
  });

  const handleUpdate = (updatedData: CharacterSheetData) => {
    setCharacterData(updatedData);
  };

  const handleSave = (_data: CharacterSheetData) => {
    alert('Character sheet would be saved to the server here!');
  };

  const loadSampleCharacter = () => {
    const sampleData = createDefaultCharacterSheet();
    setCharacterData({
      ...sampleData,
      name: 'Thorin Ironforge',
      background: 'Guild Artisan',
      class: 'Fighter',
      species: 'Dwarf',
      subclass: 'Champion',
      level: 5,
      xp: 6500,
      abilityScores: {
        strength: 18,
        dexterity: 14,
        constitution: 16,
        intelligence: 12,
        wisdom: 13,
        charisma: 10,
      },
      armorClass: 20,
      hitPoints: {
        current: 47,
        max: 47,
        temp: 0,
      },
      speed: 25,
      size: 'Medium',
      classFeatures: [
        'Fighting Style: Great Weapon Fighting',
        'Second Wind',
        'Action Surge',
        'Martial Archetype: Champion',
        'Improved Critical',
        'Extra Attack',
      ],
      speciesTraits: [
        'Darkvision',
        'Dwarven Resilience',
        'Stonecunning',
        'Dwarven Armor Training',
      ],
      weapons: [
        {
          name: 'Greataxe',
          atkBonus: '+7',
          damage: '1d12+4 slashing',
          notes: 'Heavy, two-handed',
        },
        {
          name: 'Handaxe',
          atkBonus: '+7',
          damage: '1d6+4 slashing',
          notes: 'Light, thrown (range 20/60)',
        },
        {
          name: 'Handaxe',
          atkBonus: '+7',
          damage: '1d6+4 slashing',
          notes: 'Light, thrown (range 20/60)',
        },
      ],
      proficiencies: {
        armor: ['Light Armor', 'Medium Armor', 'Heavy Armor', 'Shields'],
        weapons: ['Simple Weapons', 'Martial Weapons'],
        tools: ["Smith's Tools", "Brewer's Supplies"],
        skills: ['Athletics', 'Intimidation', 'Survival', 'Perception'],
        savingThrows: ['Strength', 'Constitution'],
      },
    });
  };

  const resetToDefault = () => {
    setCharacterData(createDefaultCharacterSheet());
  };

  return (
    <>
      <FontImport />
      <PageContainer>
        <ContentContainer>
          <Hero
            title="CHARACTER SHEET TEST"
            subtitle="Testing the Character Sheet Component"
            height="300px"
          />

          <MainContainer>
            <MainContent>
              <TestControls>
                <h3
                  style={{
                    color: '#8b6914',
                    fontFamily: "'Cinzel', serif",
                    marginBottom: '15px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}
                >
                  Test Controls
                </h3>
                <TestButton onClick={loadSampleCharacter}>
                  Load Sample Fighter
                </TestButton>
                <TestButton onClick={resetToDefault}>
                  Reset to Default
                </TestButton>
              </TestControls>

              <CharacterSheet
                character={characterData}
                onUpdate={handleUpdate}
                onSave={handleSave}
              />
            </MainContent>
          </MainContainer>
        </ContentContainer>
      </PageContainer>
    </>
  );
};

export default CharacterSheetTestPage;
