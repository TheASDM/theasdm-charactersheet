import React from 'react';
import styled from 'styled-components';
import { CharacterSheetData } from '../types/characterSheet';
import {
  StatsContainer,
  StatsSection,
  StatBox,
  StatArrows,
  StatArrow,
  HPArrows,
  HPArrow,
} from '../styles/components';

// Map class names to hit die types
const CLASS_HIT_DICE: Record<string, string> = {
  'Barbarian': 'd12',
  'Fighter': 'd10',
  'Paladin': 'd10',
  'Ranger': 'd10',
  'Bard': 'd8',
  'Cleric': 'd8',
  'Druid': 'd8',
  'Monk': 'd8',
  'Rogue': 'd8',
  'Warlock': 'd8',
  'Sorcerer': 'd6',
  'Wizard': 'd6',
};

const HitDiceContainer = styled.div`
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(51, 51, 51, 0.5);
  text-align: center;
`;

const HitDiceLabel = styled.div`
  font-size: 0.65rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.3rem;
`;

const HitDiceCheckboxContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.2rem;
  margin-top: 0.25rem;
`;

const HitDiceCheckbox = styled.button<{ $used: boolean }>`
  width: 12px;
  height: 12px;
  border: 1px solid ${props => props.$used ? '#555' : '#ce9016'};
  background: ${props => props.$used ? 'rgba(85, 85, 85, 0.3)' : 'transparent'};
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;

  &:hover {
    background: ${props => props.$used ? 'rgba(85, 85, 85, 0.5)' : 'rgba(206, 144, 22, 0.2)'};
    border-color: #ce9016;
  }
`;

interface CharacterStatsSectionProps {
  character: CharacterSheetData;
  isEditing: boolean;
  updateCharacter: (updates: Partial<CharacterSheetData>) => void;
  adjustStat: (stat: 'currentHP' | 'maxHP' | 'armorClass', direction: 'up' | 'down') => void;
  toggleSectionEdit: () => void;
  cancelSectionEdit: () => void;
}

export const CharacterStatsSection: React.FC<CharacterStatsSectionProps> = ({
  character,
  isEditing,
  updateCharacter,
  adjustStat,
}) => {
  // Get hit die type based on class
  const hitDieType = CLASS_HIT_DICE[character.class] || 'd8';
  const hitDiceTotal = character.hitDice.max;
  const hitDiceSpent = character.hitDice.spent;
  const hitDiceRemaining = hitDiceTotal - hitDiceSpent;

  // Toggle hit dice spent/available
  const toggleHitDice = (index: number) => {
    const newSpent = index < hitDiceSpent ? hitDiceSpent - 1 : hitDiceSpent + 1;
    updateCharacter({
      hitDice: {
        ...character.hitDice,
        spent: Math.max(0, Math.min(hitDiceTotal, newSpent)),
        current: hitDiceTotal - newSpent,
      },
    });
  };

  return (
    <StatsContainer>
      <StatsSection>
        <StatBox>
          <div className="stat-label">Hit Points</div>
          {isEditing ? (
            <div className="hp-edit-container">
              <div className="hp-part">
                <div className="hp-value">
                  <input
                    type="number"
                    value={character.hitPoints.current}
                    min="0"
                    onChange={(e) =>
                      updateCharacter({
                        hitPoints: {
                          ...character.hitPoints,
                          current: Math.max(
                            0,
                            parseInt(e.target.value) || 0
                          ),
                        },
                      })
                    }
                  />
                </div>
                <HPArrows>
                  <HPArrow
                    direction="up"
                    onClick={() => adjustStat('currentHP', 'up')}
                  >
                    ▲
                  </HPArrow>
                  <HPArrow
                    direction="down"
                    onClick={() => adjustStat('currentHP', 'down')}
                  >
                    ▼
                  </HPArrow>
                </HPArrows>
              </div>
              <div className="hp-slash">/</div>
              <div className="hp-part">
                <div className="hp-value">
                  <input
                    type="number"
                    value={character.hitPoints.max}
                    min="1"
                    onChange={(e) =>
                      updateCharacter({
                        hitPoints: {
                          ...character.hitPoints,
                          max: Math.max(
                            1,
                            parseInt(e.target.value) || 1
                          ),
                        },
                      })
                    }
                  />
                </div>
                <HPArrows>
                  <HPArrow
                    direction="up"
                    onClick={() => adjustStat('maxHP', 'up')}
                  >
                    ▲
                  </HPArrow>
                  <HPArrow
                    direction="down"
                    onClick={() => adjustStat('maxHP', 'down')}
                  >
                    ▼
                  </HPArrow>
                </HPArrows>
              </div>
            </div>
          ) : (
            <div className="stat-value">
              {character.hitPoints.current}/{character.hitPoints.max}
            </div>
          )}

          {/* Hit Dice Display */}
          <HitDiceContainer>
            <HitDiceLabel>Hit Dice: {hitDiceRemaining} ({hitDieType})</HitDiceLabel>
            <HitDiceCheckboxContainer>
              {Array.from({ length: hitDiceTotal }).map((_, index) => (
                <HitDiceCheckbox
                  key={index}
                  $used={index < hitDiceSpent}
                  onClick={() => toggleHitDice(index)}
                  title={index < hitDiceSpent ? 'Click to restore' : 'Click to spend'}
                />
              ))}
            </HitDiceCheckboxContainer>
          </HitDiceContainer>
        </StatBox>
      </StatsSection>

      <StatsSection>
        <StatBox>
          <div className="stat-label">Armor Class</div>
          {isEditing ? (
            <>
              <div className="stat-value">
                <input
                  type="number"
                  value={character.armorClass}
                  min="1"
                  max="30"
                  onChange={(e) =>
                    updateCharacter({
                      armorClass: Math.max(
                        1,
                        Math.min(30, parseInt(e.target.value) || 10)
                      ),
                    })
                  }
                />
              </div>
              <StatArrows style={{ right: '-2px' }}>
                <StatArrow
                  direction="up"
                  onClick={() => adjustStat('armorClass', 'up')}
                >
                  ▲
                </StatArrow>
                <StatArrow
                  direction="down"
                  onClick={() => adjustStat('armorClass', 'down')}
                >
                  ▼
                </StatArrow>
              </StatArrows>
            </>
          ) : (
            <div className="stat-value">{character.armorClass}</div>
          )}
        </StatBox>
      </StatsSection>
    </StatsContainer>
  );
};