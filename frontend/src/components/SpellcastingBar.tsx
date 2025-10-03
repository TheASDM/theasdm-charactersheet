import styled from 'styled-components';
import { CharacterSheetData } from '../types/characterSheet';
import { SimpleFeature } from '../utils/simpleFeatureGenerator';

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
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(145deg, rgba(75, 0, 130, 0.25), rgba(138, 43, 226, 0.15));
  border: 1px solid #9932cc;
  border-radius: 8px;
  margin: 0.5rem 0;
  min-height: 50px;
  flex-wrap: wrap;

  @media (max-width: 1200px) {
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
  }

  @media (max-width: 768px) {
    gap: 0.5rem;
    padding: 0.5rem;
  }
`;

const CasterLabel = styled.div`
  color: #da70d6;
  font-weight: 600;
  font-size: 0.8rem;
  min-width: fit-content;
  white-space: nowrap;
`;

const CasterInfoGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const InfoLabel = styled.span`
  color: #b19cd9;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;

  @media (max-width: 768px) {
    font-size: 0.7rem;
  }
`;

const InfoValue = styled.span`
  color: #f0f0f0;
  font-size: 0.8rem;
  font-weight: 700;
  background: rgba(153, 50, 204, 0.2);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  border: 1px solid #9932cc;
  white-space: nowrap;

  @media (max-width: 768px) {
    font-size: 0.75rem;
    padding: 0.15rem 0.4rem;
  }
`;

const Divider = styled.div`
  width: 1px;
  height: 30px;
  background: linear-gradient(to bottom, transparent, #9932cc, transparent);
`;

const ManaDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(153, 50, 204, 0.2);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  border: 1px solid #9932cc;
  font-size: 0.8rem;

  .mana-current input {
    background: transparent;
    border: none;
    color: #f0f0f0;
    width: 30px;
    text-align: center;
    font-size: 0.8rem;
    font-weight: 600;

    &:focus {
      outline: 1px solid #9932cc;
      border-radius: 2px;
    }
  }

  .mana-separator {
    color: #9932cc;
    font-weight: 600;
  }

  .mana-max {
    color: #da70d6;
    font-weight: 600;
    min-width: 20px;
    text-align: center;

    input {
      background: transparent;
      border: none;
      color: #da70d6;
      width: 30px;
      text-align: center;
      font-size: 0.8rem;
      font-weight: 600;

      &:focus {
        outline: 1px solid #9932cc;
        border-radius: 2px;
      }
    }
  }

  .mana-controls {
    display: flex;
    flex-direction: column;
    gap: 1px;
    margin-left: 0.25rem;
  }

  .mana-control-btn {
    background: rgba(153, 50, 204, 0.3);
    border: 1px solid #9932cc;
    color: #da70d6;
    width: 16px;
    height: 12px;
    font-size: 8px;
    line-height: 1;
    border-radius: 2px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(153, 50, 204, 0.5);
      transform: scale(1.1);
    }
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
  const title = isPactMagic ? '✨ Pact Magic' : '✨ Spellcasting';

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
            <input
              type="number"
              value={character.mana.current}
              min="0"
              onChange={(e) =>
                updateCharacter({
                  mana: {
                    ...character.mana,
                    current: Math.max(0, parseInt(e.target.value) || 0),
                  },
                })
              }
            />
          </div>
          <div className="mana-separator">/</div>
          <div className="mana-max">
            {editingSections.mana ? (
              <input
                type="number"
                value={character.mana.max}
                min="0"
                onChange={(e) =>
                  updateCharacter({
                    mana: {
                      ...character.mana,
                      max: Math.max(0, parseInt(e.target.value) || 0),
                    },
                  })
                }
              />
            ) : (
              character.mana.max
            )}
          </div>
          <div className="mana-controls">
            <button
              className="mana-control-btn"
              onClick={() => resources.handleManaUpdate('current', 1)}
              title="Increase Current Mana"
            >
              ▲
            </button>
            <button
              className="mana-control-btn"
              onClick={() => resources.handleManaUpdate('current', -1)}
              title="Decrease Current Mana"
            >
              ▼
            </button>
          </div>
          {editingSections.mana && (
            <div className="mana-controls">
              <button
                className="mana-control-btn"
                onClick={() => resources.handleManaUpdate('max', 1)}
                title="Increase Max Mana"
              >
                ▲
              </button>
              <button
                className="mana-control-btn"
                onClick={() => resources.handleManaUpdate('max', -1)}
                title="Decrease Max Mana"
              >
                ▼
              </button>
            </div>
          )}
        </ManaDisplay>
      </CasterInfoGroup>
    </CasterBarContainer>
  );
}
