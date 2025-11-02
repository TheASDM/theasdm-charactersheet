import styled from 'styled-components';
import { CharacterSheetData, calculateModifier } from '../types/characterSheet';
import { SimpleFeature } from '../utils/simpleFeatureGenerator';
import { getSpellcastingStats } from '../services/characterCalculations';

interface SpellcastingBarProps {
  spellcastingFeature: SimpleFeature | null;
  character: CharacterSheetData;
  maxMana: number; // Calculated max mana from derivedValues
  editingSections: { mana: boolean };
  updateCharacter: (updates: Partial<CharacterSheetData>) => void;
  resources: {
    handleManaUpdate: (type: 'current' | 'max', change: number) => void;
  };
}

const CasterBarContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 0.5rem 1rem;
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid #8b6914;
  border-radius: 8px;
  margin: 0.5rem 0;
  min-height: 40px;
  max-height: 40px;
  flex-wrap: nowrap;
  overflow: hidden;

  @media (max-width: 768px) {
    flex-wrap: wrap;
    max-height: none;
  }
`;

const CasterInfoGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
`;

const InfoLabel = styled.span`
  color: #ce9016;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
`;

const InfoValue = styled.span`
  color: #f0f0f0;
  font-size: 0.8rem;
  font-weight: 700;
  background: rgba(40, 40, 40, 0.8);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  border: 1px solid #555;
  white-space: nowrap;
`;

const Divider = styled.div`
  width: 1px;
  height: 20px;
  background: linear-gradient(to bottom, transparent, #8b6914, transparent);
`;

const ManaDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(40, 40, 40, 0.8);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  border: 1px solid #555;
  font-size: 0.8rem;

  .mana-current {
    color: #f0f0f0;
    font-weight: 600;
    min-width: 20px;
    text-align: center;
  }

  .mana-separator {
    color: #8b6914;
    font-weight: 600;
  }

  .mana-max {
    color: #ce9016;
    font-weight: 600;
    min-width: 20px;
    text-align: center;
  }
`;

export default function SpellcastingBar({
  spellcastingFeature,
  character,
  maxMana,
}: SpellcastingBarProps) {
  if (!spellcastingFeature) return null;

  // Calculate proficiency bonus
  const proficiencyBonus = Math.ceil(character.level / 4) + 1;

  // Calculate ability modifiers
  const abilityModifiers = {
    strength: calculateModifier(character.abilityScores.strength),
    dexterity: calculateModifier(character.abilityScores.dexterity),
    constitution: calculateModifier(character.abilityScores.constitution),
    intelligence: calculateModifier(character.abilityScores.intelligence),
    wisdom: calculateModifier(character.abilityScores.wisdom),
    charisma: calculateModifier(character.abilityScores.charisma),
  };

  // Get spellcasting stats
  const spellcastingStats = getSpellcastingStats(character, proficiencyBonus, abilityModifiers);

  // Determine spellcasting ability based on class
  const spellcastingAbilityMap: Record<string, string> = {
    'Bard': 'Charisma',
    'Cleric': 'Wisdom',
    'Druid': 'Wisdom',
    'Paladin': 'Charisma',
    'Ranger': 'Wisdom',
    'Sorcerer': 'Charisma',
    'Warlock': 'Charisma',
    'Wizard': 'Intelligence',
  };

  const spellcastingAbility = spellcastingAbilityMap[character.class] || 'Unknown';

  return (
    <CasterBarContainer>
      <CasterInfoGroup>
        <InfoLabel>Spellcasting:</InfoLabel>
        <InfoValue>{spellcastingAbility}</InfoValue>
      </CasterInfoGroup>

      <Divider />

      <CasterInfoGroup>
        <InfoLabel>DC:</InfoLabel>
        <InfoValue>{spellcastingStats.spellSaveDC}</InfoValue>
      </CasterInfoGroup>

      <Divider />

      <CasterInfoGroup>
        <InfoLabel>Attack:</InfoLabel>
        <InfoValue>+{spellcastingStats.spellAttackBonus}</InfoValue>
      </CasterInfoGroup>

      <Divider />

      {/* Mana Section */}
      <CasterInfoGroup>
        <InfoLabel>Mana:</InfoLabel>
        <ManaDisplay>
          <div className="mana-current">
            {character.mana.current}
          </div>
          <div className="mana-separator">/</div>
          <div className="mana-max">
            {maxMana}
          </div>
        </ManaDisplay>
      </CasterInfoGroup>
    </CasterBarContainer>
  );
}
