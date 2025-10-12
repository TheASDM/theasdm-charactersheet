import { useEffect, useMemo } from 'react';
import styled from 'styled-components';
import {
  CharacterSheetData,
  CharacterSheetProps,
  calculateModifier,
  formatModifier,
  calculateSkillModifier,
  calculateSavingThrowModifier,
  skillToAbility,
  calculateProficiencyBonus,
} from '../types/characterSheet';

// Import medieval fonts
const FontImport = styled.div`
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:wght@400;600&display=swap');
`;

const SheetContainer = styled.div`
  background: linear-gradient(145deg, #f4e7d1, #e8d5b7);
  border: 3px solid #8b6914;
  border-radius: 15px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  font-family: 'Crimson Text', serif;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  color: #2c1810;
`;

const SheetHeader = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 1fr;
  gap: 10px;
  margin-bottom: 20px;
`;

const HeaderField = styled.div`
  display: flex;
  flex-direction: column;

  label {
    color: #8b6914;
    font-family: 'Cinzel', serif;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
  }

  input {
    background: rgba(139, 105, 20, 0.1);
    border: 2px solid rgba(139, 105, 20, 0.3);
    border-radius: 5px;
    padding: 8px;
    font-family: 'Crimson Text', serif;
    font-size: 1rem;
    color: #2c1810;

    &:focus {
      outline: none;
      border-color: #8b6914;
      box-shadow: 0 0 5px rgba(139, 105, 20, 0.3);
    }
  }
`;

const MainContent = styled.div`
  display: grid;
  grid-template-columns: 200px 1fr 250px;
  gap: 20px;
  margin-bottom: 20px;
`;

const AbilityScoresColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const AbilityScore = styled.div`
  background: linear-gradient(
    145deg,
    rgba(90, 58, 42, 0.8),
    rgba(74, 42, 26, 0.8)
  );
  border: 2px solid #8b6914;
  border-radius: 10px;
  padding: 10px;
  text-align: center;

  .ability-name {
    color: #d4af37;
    font-family: 'Cinzel', serif;
    font-size: 0.9rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 5px;
  }

  .score-circle {
    background: rgba(139, 105, 20, 0.1);
    border: 2px solid #8b6914;
    border-radius: 50%;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 8px;

    input {
      background: transparent;
      border: none;
      text-align: center;
      font-size: 1.5rem;
      font-weight: bold;
      color: #2c1810;
      width: 40px;

      &:focus {
        outline: none;
      }
    }
  }

  .modifier {
    color: #d4af37;
    font-size: 1.1rem;
    font-weight: bold;
    margin-bottom: 8px;
  }

  .saving-throw {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    font-size: 0.9rem;
    color: #c9a961;

    input[type='checkbox'] {
      transform: scale(1.2);
    }

    .save-modifier {
      font-weight: bold;
      color: #d4af37;
      margin-left: 5px;
    }
  }
`;

const CenterColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const SkillsSection = styled.div`
  background: rgba(139, 105, 20, 0.1);
  border: 2px solid #8b6914;
  border-radius: 10px;
  padding: 15px;

  h3 {
    color: #8b6914;
    font-family: 'Cinzel', serif;
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0 0 10px 0;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
`;

const SkillRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 0.9rem;

  input[type='checkbox'] {
    margin-right: 8px;
    transform: scale(1.1);
  }

  .modifier {
    margin-left: auto;
    font-weight: bold;
    color: #8b6914;
    min-width: 25px;
    text-align: right;
  }

  .skill-name {
    flex: 1;
  }
`;

const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const StatBox = styled.div`
  background: rgba(139, 105, 20, 0.1);
  border: 2px solid #8b6914;
  border-radius: 10px;
  padding: 12px;
  text-align: center;

  .label {
    color: #8b6914;
    font-family: 'Cinzel', serif;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 5px;
  }

  input {
    background: transparent;
    border: none;
    text-align: center;
    font-size: 1.2rem;
    font-weight: bold;
    color: #2c1810;
    width: 100%;

    &:focus {
      outline: none;
    }

    &:read-only {
      color: #8b6914;
    }
  }
`;

const HitPointsSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
`;

const DeathSaves = styled.div`
  background: rgba(139, 105, 20, 0.1);
  border: 2px solid #8b6914;
  border-radius: 10px;
  padding: 12px;

  .label {
    color: #8b6914;
    font-family: 'Cinzel', serif;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    text-align: center;
    margin-bottom: 8px;
  }

  .saves-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;

    span {
      font-size: 0.8rem;
      color: #2c1810;
    }

    .checkboxes {
      display: flex;
      gap: 5px;
    }
  }
`;

const BottomSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
`;

const SectionBox = styled.div`
  background: rgba(139, 105, 20, 0.1);
  border: 2px solid #8b6914;
  border-radius: 10px;
  padding: 15px;

  h3 {
    color: #8b6914;
    font-family: 'Cinzel', serif;
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 10px 0;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  textarea {
    background: transparent;
    border: none;
    width: 100%;
    min-height: 120px;
    resize: vertical;
    font-family: 'Crimson Text', serif;
    font-size: 0.9rem;
    color: #2c1810;

    &:focus {
      outline: none;
    }

    &:read-only {
      color: #8b6914;
    }
  }
`;

const WeaponsSection = styled.div`
  background: rgba(139, 105, 20, 0.1);
  border: 2px solid #8b6914;
  border-radius: 10px;
  padding: 15px;

  h3 {
    color: #8b6914;
    font-family: 'Cinzel', serif;
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 10px 0;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .weapon-headers {
    display: grid;
    grid-template-columns: 2fr 1fr 2fr 2fr;
    gap: 10px;
    margin-bottom: 8px;
    font-size: 0.8rem;
    color: #8b6914;
    font-weight: 600;
    text-transform: uppercase;
  }

  .weapon-row {
    display: grid;
    grid-template-columns: 2fr 1fr 2fr 2fr;
    gap: 10px;
    margin-bottom: 5px;

    input {
      background: rgba(139, 105, 20, 0.1);
      border: 1px solid rgba(139, 105, 20, 0.3);
      border-radius: 3px;
      padding: 4px;
      font-size: 0.9rem;
      color: #2c1810;

      &:focus {
        outline: none;
        border-color: #8b6914;
      }
    }
  }
`;

const SaveButton = styled.button`
  background: linear-gradient(145deg, #d4af37, #b8941f);
  color: #2c1810;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Cinzel', serif;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  margin: 20px auto;
  display: block;

  &:hover {
    background: linear-gradient(145deg, #b8941f, #a0801b);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

export default function CharacterSheet({
  character,
  onUpdate,
  onSave,
}: CharacterSheetProps) {
  // Calculate derived values
  const derivedValues = useMemo(() => {
    const proficiencyBonus = calculateProficiencyBonus(character.level);
    const initiative = calculateModifier(character.abilityScores.dexterity);

    // Calculate skill modifiers
    const updatedSkills = { ...character.skills };
    Object.keys(updatedSkills).forEach((skillName) => {
      const abilityKey = skillToAbility[skillName];
      if (abilityKey) {
        const modifier = calculateSkillModifier(
          character.abilityScores[abilityKey],
          proficiencyBonus,
          updatedSkills[skillName].proficient
        );
        updatedSkills[skillName] = {
          ...updatedSkills[skillName],
          modifier,
        };
      }
    });

    // Calculate saving throw modifiers
    const updatedSavingThrows = { ...character.savingThrows };
    Object.keys(updatedSavingThrows).forEach((ability) => {
      const abilityKey = ability as keyof CharacterSheetData['abilityScores'];
      const modifier = calculateSavingThrowModifier(
        character.abilityScores[abilityKey],
        proficiencyBonus,
        updatedSavingThrows[ability].proficient
      );
      updatedSavingThrows[ability] = {
        ...updatedSavingThrows[ability],
        modifier,
      };
    });

    // Calculate passive perception
    const perceptionModifier = updatedSkills['Perception']?.modifier || 0;
    const passivePerception = 10 + perceptionModifier;

    return {
      proficiencyBonus,
      initiative,
      skills: updatedSkills,
      savingThrows: updatedSavingThrows,
      passivePerception,
    };
  }, [
    character.abilityScores,
    character.level,
    character.skills,
    character.savingThrows,
  ]);

  // Update character with derived values when they change
  useEffect(() => {
    const updatedCharacter: CharacterSheetData = {
      ...character,
      proficiencyBonus: derivedValues.proficiencyBonus,
      initiative: derivedValues.initiative,
      skills: derivedValues.skills,
      savingThrows: derivedValues.savingThrows,
      passivePerception: derivedValues.passivePerception,
    };

    onUpdate(updatedCharacter);
  }, [derivedValues]);

  const handleSaveClick = () => {
    if (onSave) {
      onSave(character);
    }
  };

  const updateDeathSaves = (type: 'successes' | 'failures', value: number) => {
    onUpdate({
      ...character,
      deathSaves: {
        ...character.deathSaves,
        [type]: value,
      },
    });
  };

  const abilities = [
    'strength',
    'dexterity',
    'constitution',
    'intelligence',
    'wisdom',
    'charisma',
  ] as const;

  const skills = [
    'Acrobatics',
    'Animal Handling',
    'Arcana',
    'Athletics',
    'Deception',
    'History',
    'Insight',
    'Intimidation',
    'Investigation',
    'Medicine',
    'Nature',
    'Perception',
    'Performance',
    'Persuasion',
    'Religion',
    'Sleight of Hand',
    'Stealth',
    'Survival',
  ];

  return (
    <>
      <FontImport />
      <SheetContainer>
        {/* Header Section */}
        <SheetHeader>
          <HeaderField>
            <label>Character Name</label>
            <input
              type="text"
              value={character.name}
              onChange={(e) => onUpdate({ ...character, name: e.target.value })}
            />
          </HeaderField>
          <HeaderField>
            <label>Background</label>
            <input
              type="text"
              value={character.background}
              onChange={(e) =>
                onUpdate({ ...character, background: e.target.value })
              }
            />
          </HeaderField>
          <HeaderField>
            <label>Class</label>
            <input
              type="text"
              value={character.class}
              onChange={(e) =>
                onUpdate({ ...character, class: e.target.value })
              }
            />
          </HeaderField>
          <HeaderField>
            <label>Species</label>
            <input
              type="text"
              value={character.species}
              onChange={(e) =>
                onUpdate({ ...character, species: e.target.value })
              }
            />
          </HeaderField>
          <HeaderField>
            <label>Subclass</label>
            <input
              type="text"
              value={character.subclass}
              onChange={(e) =>
                onUpdate({ ...character, subclass: e.target.value })
              }
            />
          </HeaderField>
          <HeaderField>
            <label>Level</label>
            <input
              type="number"
              value={character.level}
              min="1"
              max="20"
              onChange={(e) =>
                onUpdate({
                  ...character,
                  level: Math.max(1, parseInt(e.target.value) || 1),
                })
              }
            />
          </HeaderField>
          <HeaderField>
            <label>XP</label>
            <input
              type="number"
              value={character.xp}
              min="0"
              onChange={(e) =>
                onUpdate({
                  ...character,
                  xp: Math.max(0, parseInt(e.target.value) || 0),
                })
              }
            />
          </HeaderField>
        </SheetHeader>

        {/* Main Content Grid */}
        <MainContent>
          {/* Left Column - Ability Scores */}
          <AbilityScoresColumn>
            {abilities.map((ability) => {
              const score = character.abilityScores[ability];
              const modifier = calculateModifier(score);
              const savingThrow = derivedValues.savingThrows[ability];

              return (
                <AbilityScore key={ability}>
                  <div className="ability-name">{ability}</div>
                  <div className="score-circle">
                    <input
                      type="number"
                      value={score}
                      min="1"
                      max="20"
                      onChange={(e) =>
                        onUpdate({
                          ...character,
                          abilityScores: {
                            ...character.abilityScores,
                            [ability]: Math.max(
                              1,
                              Math.min(20, parseInt(e.target.value) || 10)
                            ),
                          },
                        })
                      }
                    />
                  </div>
                  <div className="modifier">{formatModifier(modifier)}</div>
                  <div className="saving-throw">
                    <input
                      type="checkbox"
                      checked={savingThrow.proficient}
                      onChange={(e) =>
                        onUpdate({
                          ...character,
                          savingThrows: {
                            ...character.savingThrows,
                            [ability]: {
                              ...savingThrow,
                              proficient: e.target.checked,
                            },
                          },
                        })
                      }
                    />
                    <span>Save</span>
                    <span className="save-modifier">
                      {formatModifier(savingThrow.modifier)}
                    </span>
                  </div>
                </AbilityScore>
              );
            })}
          </AbilityScoresColumn>

          {/* Center Column - Skills */}
          <CenterColumn>
            <SkillsSection>
              <h3>Skills</h3>
              {skills.map((skill) => {
                const skillData = derivedValues.skills[skill] || {
                  proficient: false,
                  modifier: 0,
                };
                return (
                  <SkillRow key={skill}>
                    <input
                      type="checkbox"
                      checked={skillData.proficient}
                      onChange={(e) =>
                        onUpdate({
                          ...character,
                          skills: {
                            ...character.skills,
                            [skill]: {
                              ...skillData,
                              proficient: e.target.checked,
                            },
                          },
                        })
                      }
                    />
                    <span className="skill-name">{skill}</span>
                    <span className="modifier">
                      {formatModifier(skillData.modifier)}
                    </span>
                  </SkillRow>
                );
              })}
            </SkillsSection>
          </CenterColumn>

          {/* Right Column - Combat Stats */}
          <RightColumn>
            <StatBox>
              <div className="label">Proficiency Bonus</div>
              <input
                type="text"
                value={formatModifier(derivedValues.proficiencyBonus)}
                readOnly
              />
            </StatBox>

            <StatBox>
              <div className="label">Armor Class</div>
              <input
                type="number"
                value={character.armorClass}
                min="1"
                onChange={(e) =>
                  onUpdate({
                    ...character,
                    armorClass: Math.max(1, parseInt(e.target.value) || 10),
                  })
                }
              />
            </StatBox>

            <StatBox>
              <div className="label">Initiative</div>
              <input
                type="text"
                value={formatModifier(derivedValues.initiative)}
                readOnly
              />
            </StatBox>

            <StatBox>
              <div className="label">Speed</div>
              <input
                type="text"
                value={`${character.speed} ft`}
                onChange={(e) => {
                  const value = e.target.value.replace(' ft', '');
                  const speed = parseInt(value) || 30;
                  onUpdate({ ...character, speed });
                }}
              />
            </StatBox>

            <StatBox>
              <div className="label">Size</div>
              <input
                type="text"
                value={character.size}
                onChange={(e) =>
                  onUpdate({ ...character, size: e.target.value })
                }
              />
            </StatBox>

            <StatBox>
              <div className="label">Passive Perception</div>
              <input
                type="text"
                value={derivedValues.passivePerception.toString()}
                readOnly
              />
            </StatBox>

            <HitPointsSection>
              <StatBox>
                <div className="label">Current HP</div>
                <input
                  type="number"
                  value={character.hitPoints.current}
                  min="0"
                  onChange={(e) =>
                    onUpdate({
                      ...character,
                      hitPoints: {
                        ...character.hitPoints,
                        current: Math.max(0, parseInt(e.target.value) || 0),
                      },
                    })
                  }
                />
              </StatBox>
              <StatBox>
                <div className="label">Max HP</div>
                <input
                  type="number"
                  value={character.hitPoints.max}
                  min="1"
                  onChange={(e) =>
                    onUpdate({
                      ...character,
                      hitPoints: {
                        ...character.hitPoints,
                        max: Math.max(1, parseInt(e.target.value) || 1),
                      },
                    })
                  }
                />
              </StatBox>
              <StatBox>
                <div className="label">Temp HP</div>
                <input
                  type="number"
                  value={character.hitPoints.temp}
                  min="0"
                  onChange={(e) =>
                    onUpdate({
                      ...character,
                      hitPoints: {
                        ...character.hitPoints,
                        temp: Math.max(0, parseInt(e.target.value) || 0),
                      },
                    })
                  }
                />
              </StatBox>
            </HitPointsSection>

            <DeathSaves>
              <div className="label">Death Saves</div>
              <div className="saves-row">
                <span>Successes</span>
                <div className="checkboxes">
                  {[1, 2, 3].map((i) => (
                    <input
                      key={`success-${i}`}
                      type="checkbox"
                      checked={character.deathSaves.successes >= i}
                      onChange={(e) => {
                        const newValue = e.target.checked
                          ? Math.max(character.deathSaves.successes, i)
                          : Math.min(character.deathSaves.successes, i - 1);
                        updateDeathSaves('successes', newValue);
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="saves-row">
                <span>Failures</span>
                <div className="checkboxes">
                  {[1, 2, 3].map((i) => (
                    <input
                      key={`failure-${i}`}
                      type="checkbox"
                      checked={character.deathSaves.failures >= i}
                      onChange={(e) => {
                        const newValue = e.target.checked
                          ? Math.max(character.deathSaves.failures, i)
                          : Math.min(character.deathSaves.failures, i - 1);
                        updateDeathSaves('failures', newValue);
                      }}
                    />
                  ))}
                </div>
              </div>
            </DeathSaves>
          </RightColumn>
        </MainContent>

        {/* Weapons & Damage Section */}
        <WeaponsSection>
          <h3>Weapons & Damage / Cantrips</h3>
          <div className="weapon-headers">
            <span>Name</span>
            <span>Atk Bonus/DC</span>
            <span>Damage & Type</span>
            <span>Notes</span>
          </div>
          {character.weapons.map((weapon, index) => (
            <div key={index} className="weapon-row">
              <input
                type="text"
                value={weapon.name}
                onChange={(e) => {
                  const newWeapons = [...character.weapons];
                  newWeapons[index] = { ...weapon, name: e.target.value };
                  onUpdate({ ...character, weapons: newWeapons });
                }}
              />
              <input
                type="text"
                value={weapon.atkBonus}
                onChange={(e) => {
                  const newWeapons = [...character.weapons];
                  newWeapons[index] = { ...weapon, atkBonus: e.target.value };
                  onUpdate({ ...character, weapons: newWeapons });
                }}
              />
              <input
                type="text"
                value={weapon.damage}
                onChange={(e) => {
                  const newWeapons = [...character.weapons];
                  newWeapons[index] = { ...weapon, damage: e.target.value };
                  onUpdate({ ...character, weapons: newWeapons });
                }}
              />
              <input
                type="text"
                value={weapon.notes}
                onChange={(e) => {
                  const newWeapons = [...character.weapons];
                  newWeapons[index] = { ...weapon, notes: e.target.value };
                  onUpdate({ ...character, weapons: newWeapons });
                }}
              />
            </div>
          ))}
        </WeaponsSection>

        {/* Bottom Section */}
        <BottomSection>
          <SectionBox>
            <h3>Equipment Training & Proficiencies</h3>
            <textarea
              placeholder="Armor, weapons, tools..."
              value={[
                `Armor: ${character.proficiencies.armor.join(', ')}`,
                `Weapons: ${character.proficiencies.weapons.join(', ')}`,
                `Tools: ${character.proficiencies.tools.join(', ')}`,
              ].join('\n\n')}
              readOnly
            />
          </SectionBox>

          <SectionBox>
            <h3>Class Features</h3>
            <textarea
              placeholder="List your class features..."
              value={character.classFeatures.join('\n\n')}
              onChange={(e) => {
                const features = e.target.value
                  .split('\n\n')
                  .filter((f) => f.trim());
                onUpdate({ ...character, classFeatures: features });
              }}
            />
          </SectionBox>

          <SectionBox>
            <h3>Species Traits</h3>
            <textarea
              placeholder="List your species traits..."
              value={character.speciesTraits.join('\n\n')}
              onChange={(e) => {
                const traits = e.target.value
                  .split('\n\n')
                  .filter((t) => t.trim());
                onUpdate({ ...character, speciesTraits: traits });
              }}
            />
          </SectionBox>

          <SectionBox>
            <h3>Feats</h3>
            <textarea
              placeholder="List your feats..."
              value={character.feats.join('\n\n')}
              onChange={(e) => {
                const feats = e.target.value
                  .split('\n\n')
                  .filter((f) => f.trim());
                onUpdate({ ...character, feats: feats });
              }}
            />
          </SectionBox>
        </BottomSection>

        {onSave && (
          <SaveButton onClick={handleSaveClick}>
            ⚔️ Save Character Sheet
          </SaveButton>
        )}
      </SheetContainer>
    </>
  );
}
