import React, { useState } from 'react';
import { StepContainer } from '../../styles/components/CharacterGeneratorWizard.styles';
import { CharacterBuilderData } from '../CharacterGeneratorWizard';
import { AbilityScoreMethodModal } from '../ui/AbilityScoreMethodModal';
import styled from 'styled-components';

interface Step1AbilityScoresProps {
  data: CharacterBuilderData;
  onUpdate: (updates: Partial<CharacterBuilderData>) => void;
}

const AbilityScoreGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 1rem;
  margin-top: 0.75rem;
  max-width: none;

  @media (max-width: 900px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  @media (max-width: 400px) {
    grid-template-columns: 1fr;
  }
`;

const AbilityScoreBox = styled.div`
  background: rgba(26, 26, 26, 0.9);
  border: 1px solid #444;
  border-radius: 6px;
  padding: 0.75rem;
  text-align: center;
  min-width: 0;

  .ability-name {
    color: #d4af37;
    font-weight: 600;
    margin-bottom: 0.75rem;
    text-transform: capitalize;
    font-size: 0.9rem;
  }

  .standard-array-options {
    display: flex;
    justify-content: center;
    gap: 0.25rem;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
  }

  .score-option {
    width: 28px;
    height: 28px;
    border: 2px solid #444;
    background: rgba(26, 26, 26, 0.8);
    color: #ccc;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 600;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover:not(.disabled) {
      border-color: #d4af37;
      background: rgba(212, 175, 55, 0.1);
    }

    &.selected {
      background: linear-gradient(145deg, #d4af37, #b8941f);
      border-color: #d4af37;
      color: #1a1a1a;
    }

    &.disabled {
      opacity: 0.3;
      cursor: not-allowed;
      background: rgba(100, 100, 100, 0.2);
    }
  }

  .current-score {
    font-size: 1.4rem;
    font-weight: 700;
    color: #f0f0f0;
    margin-bottom: 0.25rem;
  }

  .ability-modifier {
    text-align: center;
    margin-top: 0.5rem;
    color: #888;
    font-size: 0.8rem;
    font-weight: 500;
  }

  .ability-dropdown {
    width: 100%;
    padding: 8px;
    background: rgba(0, 0, 0, 0.7);
    border: 1px solid #666;
    border-radius: 4px;
    color: #f0f0f0;
    font-size: 1.1rem;
    font-weight: 600;
    text-align: center;
    margin-bottom: 0.5rem;

    &:focus {
      outline: none;
      border-color: #d4af37;
      box-shadow: 0 0 4px rgba(212, 175, 55, 0.3);
    }
  }
`;

const MethodToggle = styled.div<{ disabled?: boolean }>`
  display: inline-flex;
  background: rgba(26, 26, 26, 0.8);
  border: 2px solid #444;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 1.5rem;
  opacity: ${props => props.disabled ? 0.5 : 1};
  transition: all 0.3s ease;

  &:hover {
    opacity: 1;
  }

  .method-option {
    padding: 0.75rem 1.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 600;
    color: #ccc;
    border-right: 1px solid #444;

    &:last-child {
      border-right: none;
    }

    &.active {
      background: linear-gradient(145deg, #d4af37, #b8941f);
      color: #1a1a1a;
    }

    &:hover:not(.active) {
      background: rgba(212, 175, 55, 0.1);
      color: #d4af37;
    }
  }
`;


const RollingSection = styled.div`
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;

  .rolling-title {
    color: #d4af37;
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 1rem;
  }

  .rolled-values {
    display: flex;
    justify-content: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }

  .rolled-value {
    width: 48px;
    height: 48px;
    background: linear-gradient(145deg, #d4af37, #b8941f);
    color: #1a1a1a;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 1.2rem;
    box-shadow: 0 2px 8px rgba(212, 175, 55, 0.3);
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);
    }

    &.used {
      opacity: 0.3;
      cursor: not-allowed;
    }
  }

  .roll-button {
    padding: 12px 24px;
    background: linear-gradient(145deg, #4caf50, #45a049);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 0.5px;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(76, 175, 80, 0.4);
    }

    &.reset {
      background: linear-gradient(145deg, #ff6b6b, #e55353);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
    }
  }

  .roll-description {
    color: #aaa;
    font-size: 0.85rem;
    margin-bottom: 1rem;
  }
`;

const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
const ABILITIES = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const;

function getAbilityModifier(score: number): string {
  const modifier = Math.floor((score - 10) / 2);
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

function rollAbilityScore(): number {
  // Roll 4d6, drop lowest
  const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
  rolls.sort((a, b) => b - a); // Sort descending
  return rolls.slice(0, 3).reduce((sum, roll) => sum + roll, 0); // Sum top 3
}

export const Step1AbilityScores: React.FC<Step1AbilityScoresProps> = ({
  data,
  onUpdate
}) => {
  const [showMethodModal, setShowMethodModal] = useState(!data.abilityScoreMethod || data.abilityScoreMethod === 'standard-array');
  const [rolledValues, setRolledValues] = useState<number[]>([]);
  const [usedRolledIndices, setUsedRolledIndices] = useState<Set<number>>(new Set());
  const [abilityToIndexMap, setAbilityToIndexMap] = useState<Map<string, number>>(new Map());

  const handleMethodSelect = (method: 'standard-array' | 'custom') => {
    setShowMethodModal(false);

    if (method === 'standard-array') {
      onUpdate({
        abilityScoreMethod: method,
        abilityScores: {
          strength: 0,
          dexterity: 0,
          constitution: 0,
          intelligence: 0,
          wisdom: 0,
          charisma: 0
        }
      });
    } else {
      onUpdate({
        abilityScoreMethod: method,
        abilityScores: {
          strength: 0,
          dexterity: 0,
          constitution: 0,
          intelligence: 0,
          wisdom: 0,
          charisma: 0
        }
      });
    }
  };

  const handleMethodToggle = (method: 'standard-array' | 'custom') => {
    if (method !== data.abilityScoreMethod) {
      handleMethodSelect(method);
      setRolledValues([]);
      setUsedRolledIndices(new Set());
    }
  };

  const handleStandardArraySelection = (ability: keyof CharacterBuilderData['abilityScores'], score: number) => {
    if (isScoreUsed(score) && data.abilityScores[ability] !== score) {
      return;
    }

    const newScore = data.abilityScores[ability] === score ? 0 : score;

    onUpdate({
      abilityScores: {
        ...data.abilityScores,
        [ability]: newScore
      }
    });
  };

  const handleDropdownChange = (ability: keyof CharacterBuilderData['abilityScores'], value: number) => {
    onUpdate({
      abilityScores: {
        ...data.abilityScores,
        [ability]: value
      }
    });
  };

  const handleRollValue = (rolledValue: number, rolledIndex: number, ability: keyof CharacterBuilderData['abilityScores']) => {
    if (usedRolledIndices.has(rolledIndex)) return;

    // If this ability already has a rolled value assigned, free up that old index
    const oldIndex = abilityToIndexMap.get(ability);
    if (oldIndex !== undefined) {
      setUsedRolledIndices(prev => {
        const newSet = new Set(prev);
        newSet.delete(oldIndex);
        return newSet;
      });
    }

    // Add the new index and update the mapping
    setUsedRolledIndices(prev => new Set([...prev, rolledIndex]));
    setAbilityToIndexMap(prev => new Map(prev).set(ability, rolledIndex));

    onUpdate({
      abilityScores: {
        ...data.abilityScores,
        [ability]: rolledValue
      }
    });
  };

  const rollStats = () => {
    const newRoll = rollAbilityScore();
    setRolledValues(prev => [...prev, newRoll]);
  };

  const resetRolls = () => {
    setRolledValues([]);
    setUsedRolledIndices(new Set());
    setAbilityToIndexMap(new Map());
    onUpdate({
      abilityScores: {
        strength: 0,
        dexterity: 0,
        constitution: 0,
        intelligence: 0,
        wisdom: 0,
        charisma: 0
      }
    });
  };

  const isScoreUsed = (score: number): boolean => {
    return Object.values(data.abilityScores).filter(s => s > 0).includes(score);
  };

  const isStandardArrayComplete = (): boolean => {
    if (data.abilityScoreMethod !== 'standard-array') return false;
    const usedScores = Object.values(data.abilityScores).filter(s => s > 0).sort();
    const standardArray = [...STANDARD_ARRAY].sort();
    return usedScores.length === 6 && JSON.stringify(usedScores) === JSON.stringify(standardArray);
  };

  const isCustomComplete = (): boolean => {
    if (data.abilityScoreMethod !== 'custom') return false;
    return Object.values(data.abilityScores).every(score => score >= 1 && score <= 20);
  };

  const isComplete = isStandardArrayComplete() || isCustomComplete();


  return (
    <>
      <AbilityScoreMethodModal
        isOpen={showMethodModal}
        onSelect={handleMethodSelect}
      />

      <StepContainer>
        <div className="step-title">Ability Scores</div>
        <div className="step-description">
          Configure your character's six core ability scores.
        </div>

        <div className="step-content">
          {/* Method Toggle */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <MethodToggle disabled={data.abilityScoreMethod === 'standard-array'}>
              <div
                className={`method-option ${data.abilityScoreMethod === 'standard-array' ? 'active' : ''}`}
                onClick={() => handleMethodToggle('standard-array')}
              >
                Standard Array
              </div>
              <div
                className={`method-option ${data.abilityScoreMethod === 'custom' ? 'active' : ''}`}
                onClick={() => handleMethodToggle('custom')}
              >
                Roll / Custom
              </div>
            </MethodToggle>
          </div>


          {/* Custom/Roll Mode */}
          {data.abilityScoreMethod === 'custom' && (
            <RollingSection>
              <div className="rolling-title">Roll for Stats (4d6, drop lowest)</div>
              <div className="roll-description">
                Roll to generate ability scores, then click the values to assign them to abilities.
              </div>

              {rolledValues.length > 0 && (
                <div className="rolled-values">
                  {rolledValues.map((value, index) => (
                    <div
                      key={index}
                      className={`rolled-value ${usedRolledIndices.has(index) ? 'used' : ''}`}
                    >
                      {value}
                    </div>
                  ))}
                </div>
              )}

              <button
                className={`roll-button ${rolledValues.length >= 6 ? 'reset' : ''}`}
                onClick={rolledValues.length >= 6 ? resetRolls : rollStats}
              >
                {rolledValues.length >= 6 ? 'Reset Rolls' : 'Roll Stats'}
              </button>
            </RollingSection>
          )}

          {/* Ability Score Grid */}
          <AbilityScoreGrid>
            {ABILITIES.map(ability => (
              <AbilityScoreBox key={ability}>
                <div className="ability-name">{ability}</div>

                {data.abilityScoreMethod === 'standard-array' ? (
                  <>
                    <div className="standard-array-options">
                      {STANDARD_ARRAY.map(score => (
                        <div
                          key={score}
                          className={`score-option ${
                            data.abilityScores[ability] === score ? 'selected' : ''
                          } ${
                            isScoreUsed(score) && data.abilityScores[ability] !== score ? 'disabled' : ''
                          }`}
                          onClick={() => handleStandardArraySelection(ability, score)}
                        >
                          {score}
                        </div>
                      ))}
                    </div>
                    <div className="current-score">
                      {data.abilityScores[ability] || '--'}
                    </div>
                  </>
                ) : (
                  <>
                    <select
                      className="ability-dropdown"
                      value={data.abilityScores[ability] || ''}
                      onChange={(e) => handleDropdownChange(ability, e.target.value ? parseInt(e.target.value) : 0)}
                    >
                      <option value="">--</option>
                      {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>

                    {rolledValues.length > 0 && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <div style={{ fontSize: '0.7rem', color: '#d4af37', marginBottom: '0.25rem' }}>
                          Click rolled values:
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {rolledValues.map((value, index) => (
                            <div
                              key={index}
                              style={{
                                width: '24px',
                                height: '24px',
                                background: usedRolledIndices.has(index) ? '#666' : '#d4af37',
                                color: usedRolledIndices.has(index) ? '#999' : '#1a1a1a',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.7rem',
                                fontWeight: '600',
                                cursor: usedRolledIndices.has(index) ? 'not-allowed' : 'pointer',
                                opacity: usedRolledIndices.has(index) ? 0.3 : 1
                              }}
                              onClick={() => handleRollValue(value, index, ability)}
                            >
                              {value}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="ability-modifier">
                  {data.abilityScores[ability] ? getAbilityModifier(data.abilityScores[ability]) : '--'}
                </div>
              </AbilityScoreBox>
            ))}
          </AbilityScoreGrid>

          {!isComplete && (
            <div style={{
              marginTop: '1rem',
              textAlign: 'center',
              color: '#d4af37',
              fontSize: '0.9rem',
              padding: '0.75rem',
              background: 'rgba(212, 175, 55, 0.1)',
              borderRadius: '6px',
              border: '1px solid rgba(212, 175, 55, 0.2)'
            }}>
              {data.abilityScoreMethod === 'standard-array'
                ? '💡 Click the circles to assign each standard array value to an ability.'
                : '💡 Use dropdowns to set custom values, or roll for random stats and click to assign them.'
              }
            </div>
          )}
        </div>
      </StepContainer>
    </>
  );
};