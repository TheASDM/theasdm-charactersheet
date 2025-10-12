import React from 'react';
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