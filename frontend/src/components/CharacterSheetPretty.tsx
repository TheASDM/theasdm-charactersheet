import { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import {
  CharacterSheetData,
  CharacterSheetProps,
  calculateModifier,
  formatModifier,
  calculateSkillModifier,
  calculateProficiencyBonus,
  skillToAbility,
} from '../types/characterSheet';

// Import medieval fonts
const FontImport = styled.div`
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:wght@400;600&display=swap');
`;

const SheetContainer = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 1rem;
  background: linear-gradient(135deg, #2a2520 0%, #1a1a1a 100%);
  color: #d4af37;
  min-height: 100vh;
  font-family: 'Cinzel', serif;
`;

const MainLayout = styled.div`
  margin-top: 1rem;
`;

const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

// Fixed layout container for the three-column layout
const ThreeColumnContainer = styled.div`
  display: flex;
  gap: 1rem;
  align-items: stretch;
  width: 100%;
  min-height: 250px;
`;

// Character Name and Info Section
const CharacterNameSection = styled.div`
  text-align: center;
  padding: 1rem 0;
  border-bottom: 2px solid #8b6914;
  margin-bottom: 1rem;
`;

const CharacterName = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #d4af37;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-align: center;
  padding: 0.5rem 0;
  border-top: 2px solid #8b6914;
  border-bottom: 2px solid #8b6914;
`;

const CharacterInfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.75rem;
  text-align: center;
`;

const InfoBox = styled.div`
  padding: 0.25rem;

  .label {
    font-size: 0.7rem;
    font-weight: 600;
    color: #8b6914;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.2rem;
  }

  .value {
    font-size: 0.95rem;
    font-weight: 700;
    color: #d4af37;
  }
`;

// Ability Scores Section
const AbilityScoresSection = styled.div`
  border: 2px solid #8b6914;
  border-radius: 6px;
  padding: 0.5rem;
  background: rgba(139, 105, 20, 0.1);
  flex: 2;
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const SectionTitle = styled.div`
  font-size: 1rem;
  font-weight: 700;
  color: #d4af37;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
  text-align: center;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid #8b6914;
`;

const AbilityScoresGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  flex: 1;
`;

const AbilityScore = styled.div`
  text-align: center;
  padding: 0.4rem;
  border: 1px solid #8b6914;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.2);
  position: relative;

  .ability-name {
    font-size: 0.65rem;
    font-weight: 600;
    color: #8b6914;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin-bottom: 0.2rem;
  }

  .score {
    font-size: clamp(1.1rem, 2.5vw, 2rem);
    font-weight: 700;
    color: #d4af37;
    margin-bottom: 0.1rem;
    position: relative;
  }

  .modifier {
    font-size: 0.7rem;
    color: #ffffff;
    font-weight: 600;
  }
`;

const AbilityArrows = styled.div`
  position: absolute;
  right: 2px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const AbilityArrow = styled.button<{ direction: 'up' | 'down' }>`
  background: linear-gradient(145deg, #8b6914, #6d5411);
  color: white;
  border: none;
  width: 14px;
  height: 12px;
  border-radius: 2px;
  cursor: pointer;
  font-size: 0.6rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  line-height: 1;

  &:hover {
    background: linear-gradient(145deg, #6d5411, #5a430e);
    transform: translateY(${props => props.direction === 'up' ? '-1px' : '1px'});
  }

  &:active {
    transform: translateY(0);
  }
`;

// Skills Section
const SkillsSection = styled.div`
  border: 2px solid #8b6914;
  border-radius: 6px;
  padding: 0.5rem;
  background: rgba(139, 105, 20, 0.1);
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 2;
  min-width: 0;
`;

const SkillsList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.15rem 0.6rem;
  flex: 1;
  align-content: start;
  overflow: hidden;
  max-height: calc(100% - 2rem);
  padding-bottom: 1.5rem;
`;

const SkillItem = styled.div`
  display: flex;
  align-items: center;
  padding: 0.2rem 0.3rem;
  font-size: 0.7rem;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.1);
  min-height: 20px;
  max-height: 22px;

  .skill-name {
    color: #ffffff;
    margin-left: 0.15rem;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 500;
  }

  .skill-bonus {
    color: #d4af37;
    font-weight: 700;
    margin-left: auto;
    font-size: 0.65rem;
    min-width: 22px;
    text-align: right;
  }

  input[type="checkbox"] {
    margin-right: 0.15rem;
    transform: scale(0.75);
  }
`;

// Stats Container
const StatsContainer = styled.div`
  border: 2px solid #8b6914;
  border-radius: 6px;
  padding: 0.5rem;
  background: rgba(139, 105, 20, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 1;
  position: relative;
  min-width: 120px;
`;

const StatsSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;

  &:not(:last-child) {
    margin-bottom: 0.5rem;
  }
`;

const StatBox = styled.div`
  padding: 0.4rem;
  border: 1px solid #8b6914;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.2);
  text-align: center;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;

  .stat-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #8b6914;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin-bottom: 0.4rem;
  }

  .stat-value {
    font-size: 1.8rem;
    font-weight: 700;
    color: #d4af37;
    line-height: 1;
  }

  .hp-edit-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;

    .hp-part {
      display: flex;
      align-items: center;
      position: relative;

      .hp-value {
        font-size: 1.8rem;
        font-weight: 700;
        color: #d4af37;
        min-width: 2rem;
        text-align: center;
      }
    }

    .hp-slash {
      font-size: 1.8rem;
      font-weight: 700;
      color: #d4af37;
    }
  }
`;

const StatArrows = styled.div`
  position: absolute;
  right: 2px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const StatArrow = styled.button<{ direction: 'up' | 'down' }>`
  background: linear-gradient(145deg, #8b6914, #6d5411);
  color: white;
  border: none;
  width: 14px;
  height: 12px;
  border-radius: 2px;
  cursor: pointer;
  font-size: 0.6rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  line-height: 1;

  &:hover {
    background: linear-gradient(145deg, #6d5411, #5a430e);
    transform: translateY(${props => props.direction === 'up' ? '-1px' : '1px'});
  }

  &:active {
    transform: translateY(0);
  }
`;

// Spells Section
const SpellsSection = styled.div`
  border: 2px solid #8b6914;
  border-radius: 6px;
  padding: 0.75rem;
  background: rgba(139, 105, 20, 0.1);
  position: relative;
`;

const SpellLevelGroup = styled.div`
  margin-bottom: 0.75rem;

  .level-title {
    font-size: 0.8rem;
    font-weight: 600;
    color: #d4af37;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.3rem;
    padding-bottom: 0.15rem;
    border-bottom: 1px solid #8b6914;
  }

  .cantrips {
    color: #8b6914;
  }
`;

const SpellGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.3rem;
`;

const SpellItem = styled.div`
  font-size: 0.7rem;
  color: #ffffff;
  padding: 0.15rem;
`;

// Input fields for editing
const EditableInput = styled.input`
  background: transparent;
  border: none;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  text-align: inherit;
  width: 100%;
  padding: 0.2rem;
  border-bottom: 1px solid transparent;

  &:focus {
    outline: none;
    border-bottom: 1px solid #d4af37;
    background: rgba(212, 175, 55, 0.1);
  }
`;

const SaveButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  padding: 1.5rem 0;
  border-top: 2px solid #8b6914;
  margin-top: 1.5rem;
`;

// Section Edit/Save Buttons
const SectionEditControls = styled.div`
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  display: flex;
  gap: 0.3rem;
  opacity: 0.7;
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 1;
  }
`;

const SectionEditButton = styled.button<{ variant?: 'edit' | 'save' }>`
  background: ${props => props.variant === 'save'
    ? 'linear-gradient(145deg, #4CAF50, #388E3C)'
    : 'linear-gradient(145deg, #8b6914, #6d5411)'};
  color: white;
  border: none;
  padding: 3px 6px;
  border-radius: 3px;
  font-size: 0.6rem;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  min-width: 32px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

const SaveButton = styled.button`
  background: linear-gradient(145deg, #d4af37, #b8941f);
  color: #2c1810;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.5);

  &:hover {
    background: linear-gradient(145deg, #b8941f, #a0801b);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(212, 175, 55, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

// Sample spells data
const sampleSpells = {
  cantrips: ['Mage Hand', 'Fire Bolt'],
  level1: ['Comprehend Languages', 'Earth Tremor', 'Thunderwave', 'Identify'],
  level2: ["Melf's Acid Arrow", 'Mirror Image', 'Invisibility', 'Scorching Ray'],
  level3: ['Counterspell', 'Lightning Bolt', 'Fly', 'Sending'],
  level4: ['Banishment', 'Polymorph', 'Ice Storm', 'Vitriolic Sphere', 'Dominate Beast'],
  level5: ['Cloudkill']
};

export default function CharacterSheetPretty({
  character,
  onUpdate,
  onSave,
}: CharacterSheetProps) {
  const [editingSections, setEditingSections] = useState<{
    abilities: boolean;
    stats: boolean;
    skills: boolean;
    spells: boolean;
  }>({
    abilities: false,
    stats: false,
    skills: false,
    spells: false,
  });

  const toggleSectionEdit = (section: keyof typeof editingSections) => {
    setEditingSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const adjustStat = (stat: 'currentHP' | 'maxHP' | 'armorClass', direction: 'up' | 'down') => {
    if (stat === 'currentHP') {
      const currentValue = character.hitPoints.current;
      const newValue = direction === 'up' ? currentValue + 1 : Math.max(0, currentValue - 1);
      onUpdate({
        ...character,
        hitPoints: {
          ...character.hitPoints,
          current: newValue
        }
      });
    } else if (stat === 'maxHP') {
      const currentValue = character.hitPoints.max;
      const newValue = direction === 'up' ? currentValue + 1 : Math.max(1, currentValue - 1);
      onUpdate({
        ...character,
        hitPoints: {
          ...character.hitPoints,
          max: newValue
        }
      });
    } else if (stat === 'armorClass') {
      const currentValue = character.armorClass;
      const newValue = direction === 'up' ? Math.min(30, currentValue + 1) : Math.max(1, currentValue - 1);
      onUpdate({
        ...character,
        armorClass: newValue
      });
    }
  };

  const adjustAbilityScore = (ability: keyof CharacterSheetData['abilityScores'], direction: 'up' | 'down') => {
    const currentScore = character.abilityScores[ability];
    const newScore = direction === 'up'
      ? Math.min(20, currentScore + 1)
      : Math.max(3, currentScore - 1);

    onUpdate({
      ...character,
      abilityScores: {
        ...character.abilityScores,
        [ability]: newScore
      }
    });
  };

  const updateCharacter = useCallback((updates: Partial<CharacterSheetData>) => {
    const updatedCharacter = { ...character, ...updates };
    onUpdate(updatedCharacter);
  }, [character, onUpdate]);

  // Calculate derived values
  const derivedValues = useMemo(() => {
    const proficiencyBonus = calculateProficiencyBonus(character.level);

    const skills: Record<string, { proficient: boolean; modifier: number }> = {};
    const skillList = [
      'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 'History',
      'Insight', 'Intimidation', 'Investigation', 'Medicine', 'Nature', 'Perception',
      'Performance', 'Persuasion', 'Religion', 'Sleight of Hand', 'Stealth', 'Survival'
    ];

    skillList.forEach(skill => {
      const ability = skillToAbility[skill];
      const abilityScore = character.abilityScores[ability];
      const isProficient = character.skills[skill]?.proficient || false;
      skills[skill] = {
        proficient: isProficient,
        modifier: calculateSkillModifier(abilityScore, proficiencyBonus, isProficient),
      };
    });

    return { proficiencyBonus, skills };
  }, [character.abilityScores, character.level, character.skills]);

  return (
    <>
      <FontImport />
      <SheetContainer>
        <CharacterNameSection>
          <CharacterName>
            <EditableInput
              value={character.name}
              onChange={(e) => updateCharacter({ name: e.target.value })}
              placeholder="Character Name"
            />
          </CharacterName>

          <CharacterInfoGrid>
            <InfoBox>
              <div className="label">Species</div>
              <div className="value">
                <EditableInput
                  value={character.species}
                  onChange={(e) => updateCharacter({ species: e.target.value })}
                  placeholder="Elf"
                />
              </div>
            </InfoBox>
            <InfoBox>
              <div className="label">Class</div>
              <div className="value">
                <EditableInput
                  value={character.class}
                  onChange={(e) => updateCharacter({ class: e.target.value })}
                  placeholder="Wizard"
                />
              </div>
            </InfoBox>
            <InfoBox>
              <div className="label">Background</div>
              <div className="value">
                <EditableInput
                  value={character.background}
                  onChange={(e) => updateCharacter({ background: e.target.value })}
                  placeholder="Sage"
                />
              </div>
            </InfoBox>
            <InfoBox>
              <div className="label">Level</div>
              <div className="value">
                <EditableInput
                  type="number"
                  value={character.level}
                  onChange={(e) => updateCharacter({ level: parseInt(e.target.value) || 1 })}
                  min="1"
                  max="20"
                />
              </div>
            </InfoBox>
            <InfoBox>
              <div className="label">Proficiency Bonus</div>
              <div className="value">+{derivedValues.proficiencyBonus}</div>
            </InfoBox>
          </CharacterInfoGrid>
        </CharacterNameSection>

        <MainLayout>
          <LeftColumn>
            <ThreeColumnContainer>
              {/* Ability Scores */}
              <AbilityScoresSection>
                <SectionTitle>Ability Scores</SectionTitle>
                <AbilityScoresGrid>
                  {(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const).map((ability) => {
                    const score = character.abilityScores[ability];
                    const modifier = calculateModifier(score);

                    return (
                      <AbilityScore key={ability}>
                        <div className="ability-name">{ability}</div>

                        {editingSections.abilities ? (
                          <>
                            <div className="score">{score}</div>
                            <div className="modifier">{formatModifier(modifier)}</div>
                          </>
                        ) : (
                          <div className="score" style={{ fontSize: 'clamp(1.4rem, 3vw, 2.5rem)', marginBottom: '0.3rem' }}>
                            {formatModifier(modifier)}
                          </div>
                        )}

                        {editingSections.abilities && (
                          <AbilityArrows>
                            <AbilityArrow
                              direction="up"
                              onClick={() => adjustAbilityScore(ability, 'up')}
                            >
                              ▲
                            </AbilityArrow>
                            <AbilityArrow
                              direction="down"
                              onClick={() => adjustAbilityScore(ability, 'down')}
                            >
                              ▼
                            </AbilityArrow>
                          </AbilityArrows>
                        )}
                      </AbilityScore>
                    );
                  })}
                </AbilityScoresGrid>

                <SectionEditControls>
                  {editingSections.abilities ? (
                    <SectionEditButton
                      variant="save"
                      onClick={() => toggleSectionEdit('abilities')}
                    >
                      ✓
                    </SectionEditButton>
                  ) : (
                    <SectionEditButton
                      onClick={() => toggleSectionEdit('abilities')}
                    >
                      ✎
                    </SectionEditButton>
                  )}
                </SectionEditControls>
              </AbilityScoresSection>

              {/* HP/AC Stats Container */}
              <StatsContainer>
                <StatsSection>
                  <StatBox>
                    <div className="stat-label">Hit Points</div>
                    {editingSections.stats ? (
                      <div className="hp-edit-container">
                        <div className="hp-part">
                          <div className="hp-value">{character.hitPoints.current}</div>
                          <StatArrows>
                            <StatArrow
                              direction="up"
                              onClick={() => adjustStat('currentHP', 'up')}
                            >
                              ▲
                            </StatArrow>
                            <StatArrow
                              direction="down"
                              onClick={() => adjustStat('currentHP', 'down')}
                            >
                              ▼
                            </StatArrow>
                          </StatArrows>
                        </div>
                        <div className="hp-slash">/</div>
                        <div className="hp-part">
                          <div className="hp-value">{character.hitPoints.max}</div>
                          <StatArrows>
                            <StatArrow
                              direction="up"
                              onClick={() => adjustStat('maxHP', 'up')}
                            >
                              ▲
                            </StatArrow>
                            <StatArrow
                              direction="down"
                              onClick={() => adjustStat('maxHP', 'down')}
                            >
                              ▼
                            </StatArrow>
                          </StatArrows>
                        </div>
                      </div>
                    ) : (
                      <div className="stat-value">{character.hitPoints.current}/{character.hitPoints.max}</div>
                    )}
                  </StatBox>
                </StatsSection>

                <StatsSection>
                  <StatBox>
                    <div className="stat-label">Armor Class</div>
                    {editingSections.stats ? (
                      <>
                        <div className="stat-value">{character.armorClass}</div>
                        <StatArrows>
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

                <SectionEditControls>
                  {editingSections.stats ? (
                    <SectionEditButton
                      variant="save"
                      onClick={() => toggleSectionEdit('stats')}
                    >
                      ✓
                    </SectionEditButton>
                  ) : (
                    <SectionEditButton
                      onClick={() => toggleSectionEdit('stats')}
                    >
                      ✎
                    </SectionEditButton>
                  )}
                </SectionEditControls>
              </StatsContainer>

              {/* Skills Section */}
              <SkillsSection>
                <SectionTitle>Skills</SectionTitle>
                <SkillsList>
                  {[
                    'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 'History',
                    'Insight', 'Intimidation', 'Investigation', 'Medicine', 'Nature', 'Perception',
                    'Performance', 'Persuasion', 'Religion', 'Sleight of Hand', 'Stealth', 'Survival'
                  ].map((skill) => {
                    const skillData = derivedValues.skills[skill] || { proficient: false, modifier: 0 };

                    return (
                      <SkillItem key={skill}>
                        {editingSections.skills && (
                          <input
                            type="checkbox"
                            checked={skillData.proficient}
                            onChange={(e) =>
                              updateCharacter({
                                skills: {
                                  ...character.skills,
                                  [skill]: { proficient: e.target.checked, modifier: skillData.modifier },
                                },
                              })
                            }
                          />
                        )}
                        <span className="skill-name">{skill}</span>
                        <span className="skill-bonus">{formatModifier(skillData.modifier)}</span>
                      </SkillItem>
                    );
                  })}
                </SkillsList>

                <SectionEditControls>
                  {editingSections.skills ? (
                    <SectionEditButton
                      variant="save"
                      onClick={() => toggleSectionEdit('skills')}
                    >
                      ✓
                    </SectionEditButton>
                  ) : (
                    <SectionEditButton
                      onClick={() => toggleSectionEdit('skills')}
                    >
                      ✎
                    </SectionEditButton>
                  )}
                </SectionEditControls>
              </SkillsSection>
            </ThreeColumnContainer>
          </LeftColumn>
        </MainLayout>

        {/* Spells section */}
        <SpellsSection style={{ margin: '1rem 0' }}>
          <SectionTitle>Spells</SectionTitle>

          <SpellLevelGroup>
            <div className="level-title cantrips">Cantrips</div>
            <SpellGrid>
              {sampleSpells.cantrips.map((spell, index) => (
                <SpellItem key={index}>{spell}</SpellItem>
              ))}
            </SpellGrid>
          </SpellLevelGroup>

          <SpellLevelGroup>
            <div className="level-title">Level 1</div>
            <SpellGrid>
              {sampleSpells.level1.map((spell, index) => (
                <SpellItem key={index}>{spell}</SpellItem>
              ))}
            </SpellGrid>
          </SpellLevelGroup>

          <SpellLevelGroup>
            <div className="level-title">Level 2</div>
            <SpellGrid>
              {sampleSpells.level2.map((spell, index) => (
                <SpellItem key={index}>{spell}</SpellItem>
              ))}
            </SpellGrid>
          </SpellLevelGroup>

          <SpellLevelGroup>
            <div className="level-title">Level 3</div>
            <SpellGrid>
              {sampleSpells.level3.map((spell, index) => (
                <SpellItem key={index}>{spell}</SpellItem>
              ))}
            </SpellGrid>
          </SpellLevelGroup>

          <SpellLevelGroup>
            <div className="level-title">Level 4</div>
            <SpellGrid>
              {sampleSpells.level4.map((spell, index) => (
                <SpellItem key={index}>{spell}</SpellItem>
              ))}
            </SpellGrid>
          </SpellLevelGroup>

          <SpellLevelGroup>
            <div className="level-title">Level 5</div>
            <SpellGrid>
              {sampleSpells.level5.map((spell, index) => (
                <SpellItem key={index}>{spell}</SpellItem>
              ))}
            </SpellGrid>
          </SpellLevelGroup>

          <SectionEditControls>
            {editingSections.spells ? (
              <SectionEditButton
                variant="save"
                onClick={() => toggleSectionEdit('spells')}
              >
                ✓
              </SectionEditButton>
            ) : (
              <SectionEditButton
                onClick={() => toggleSectionEdit('spells')}
              >
                ✎
              </SectionEditButton>
            )}
          </SectionEditControls>
        </SpellsSection>

        {onSave && (
          <SaveButtonContainer>
            <SaveButton onClick={() => onSave(character)}>
              Save Character
            </SaveButton>
          </SaveButtonContainer>
        )}
      </SheetContainer>
    </>
  );
}