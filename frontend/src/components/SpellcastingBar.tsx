import styled from 'styled-components';
import { CharacterSheetData } from '../types/characterSheet';
import { SimpleFeature } from '../utils/simpleFeatureGenerator';
import { calculateSpellSlots } from '../services/characterCalculations';
import { computeManaPool } from '../helpers/manaRules';
import { getCasterType } from '../helpers/spellRules';

interface SpellcastingBarProps {
  spellcastingFeature: SimpleFeature | null;
  character: CharacterSheetData;
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
  overflow-x: auto;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(139, 105, 20, 0.3);
    border-radius: 2px;
  }

  @media (max-width: 1200px) {
    flex-wrap: wrap;
    max-height: none;
  }
`;

const CasterLabel = styled.div`
  color: #ce9016;
  font-weight: 600;
  font-size: 0.8rem;
  min-width: fit-content;
  white-space: nowrap;
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
  editingSections,
  updateCharacter,
  resources,
}: SpellcastingBarProps) {
  if (!spellcastingFeature) return null;

  // Calculate proficiency bonus
  const proficiencyBonus = Math.ceil(character.level / 4) + 1;

  // Calculate total spell slots weighted by level
  const spellSlots = calculateSpellSlots(character);
  const totalSlots = Object.entries(spellSlots).reduce((total, [level, count]) => {
    // Extract spell level number (e.g., "1st" -> 1, "2nd" -> 2)
    const spellLevel = parseInt(level.replace(/\D/g, '')) || 1;
    return total + (spellLevel * count);
  }, 0);

  // Calculate mana pool based on caster type
  const casterType = getCasterType(character.class);
  const calculatedManaMax = computeManaPool(
    [{ classId: character.class, level: character.level }],
    proficiencyBonus,
    totalSlots
  );

  // Parse the spellcasting info from the description
  const parseSpellcastingInfo = (description: string) => {
    const abilityMatch = description.match(/\*\*Spellcasting Ability:\*\*\s*(\w+)/);
    const saveDCMatch = description.match(/\*\*Spell Save DC:\*\*\s*(\d+)/);
    const attackBonusMatch = description.match(/\*\*Spell Attack Bonus:\*\*\s*\+(\d+)/);
    const spellsKnownMatch = description.match(/\*\*(Spells Known|Spells Prepared|Spells in Spellbook):\*\*\s*([^\n]+)/);

    return {
      ability: abilityMatch?.[1] || 'Unknown',
      saveDC: saveDCMatch?.[1] || '0',
      attackBonus: attackBonusMatch?.[1] || '0',
      spellsLabel: spellsKnownMatch?.[1] || 'Spells',
      spellsValue: spellsKnownMatch?.[2] || '0',
    };
  };

  const info = parseSpellcastingInfo(spellcastingFeature.description);

  // Determine if this is Pact Magic or regular Spellcasting
  const isPactMagic = spellcastingFeature.name === 'Pact Magic';
  const title = isPactMagic ? 'Pact Magic' : 'Spellcasting';

  return (
    <CasterBarContainer>
      <CasterLabel>{title}</CasterLabel>

      <Divider />

      <CasterInfoGroup>
        <InfoLabel>Ability:</InfoLabel>
        <InfoValue>{info.ability}</InfoValue>
      </CasterInfoGroup>

      <CasterInfoGroup>
        <InfoLabel>Save DC:</InfoLabel>
        <InfoValue>{info.saveDC}</InfoValue>
      </CasterInfoGroup>

      <CasterInfoGroup>
        <InfoLabel>Attack:</InfoLabel>
        <InfoValue>+{info.attackBonus}</InfoValue>
      </CasterInfoGroup>

      <Divider />

      <CasterInfoGroup>
        <InfoLabel>{info.spellsLabel}:</InfoLabel>
        <InfoValue>{info.spellsValue}</InfoValue>
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
            {calculatedManaMax}
          </div>
        </ManaDisplay>
      </CasterInfoGroup>
    </CasterBarContainer>
  );
}
