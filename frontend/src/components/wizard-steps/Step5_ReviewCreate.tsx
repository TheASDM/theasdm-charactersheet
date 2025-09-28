import React, { useState } from 'react';
import styled from 'styled-components';
import { StepContainer } from '../../styles/components/CharacterGeneratorWizard.styles';
import { CharacterBuilderData } from '../CharacterGeneratorWizard';
import { AbilityScoresHeader } from './AbilityScoresHeader';
import { mapGeneratorDataToCharacterSheet } from '../../utils/characterDataMapper';
import { characterService } from '../../services/characterService';
import { StructuredFeaturesDisplay } from '../StructuredFeaturesDisplay';

interface Step5ReviewCreateProps {
  data: CharacterBuilderData;
  onComplete: () => void;
}

const ReviewContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-top: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const CharacterCard = styled.div`
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(26, 26, 26, 0.8) 100%);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

  h3 {
    color: #d4af37;
    font-family: 'Cinzel', serif;
    font-size: 1.2rem;
    margin: 0 0 1rem 0;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
`;

const CharacterInfo = styled.div`
  .info-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    padding: 0.25rem 0;
    border-bottom: 1px solid rgba(212, 175, 55, 0.2);

    .label {
      color: #d4af37;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .value {
      color: #f0f0f0;
      font-size: 0.9rem;
    }
  }
`;

const Section = styled.div`
  margin-bottom: 1.5rem;

  .section-title {
    color: #d4af37;
    font-family: 'Cinzel', serif;
    font-size: 1rem;
    margin-bottom: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .section-content {
    color: #ccc;
    font-size: 0.85rem;
    line-height: 1.4;
  }

  .list-item {
    background: rgba(26, 26, 26, 0.4);
    border: 1px solid #444;
    border-radius: 4px;
    padding: 0.5rem;
    margin: 0.25rem 0;
    font-size: 0.8rem;
  }
`;

const ProficienciesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
  margin-top: 0.5rem;
`;

const ProficiencyCard = styled.div`
  background: rgba(26, 26, 26, 0.6);
  border: 1px solid #444;
  border-radius: 6px;
  padding: 0.75rem;

  .prof-title {
    color: #d4af37;
    font-weight: 600;
    font-size: 0.8rem;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
  }

  .prof-list {
    color: #ccc;
    font-size: 0.75rem;
    line-height: 1.3;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(212, 175, 55, 0.3);

  button {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    min-width: 150px;

    &.btn-back {
      background: linear-gradient(145deg, #4a4a4a, #3a3a3a);
      color: #f0f0f0;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
      }
    }

    &.btn-create {
      background: linear-gradient(145deg, #d4af37, #b8941f);
      color: #1a1a1a;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(212, 175, 55, 0.4);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }
    }
  }
`;

const StatusMessage = styled.div<{ type: 'success' | 'error' | 'info' }>`
  background: ${props =>
    props.type === 'success' ? 'rgba(76, 175, 80, 0.1)' :
    props.type === 'error' ? 'rgba(244, 67, 54, 0.1)' :
    'rgba(33, 150, 243, 0.1)'};
  border: 1px solid ${props =>
    props.type === 'success' ? 'rgba(76, 175, 80, 0.3)' :
    props.type === 'error' ? 'rgba(244, 67, 54, 0.3)' :
    'rgba(33, 150, 243, 0.3)'};
  color: ${props =>
    props.type === 'success' ? '#4caf50' :
    props.type === 'error' ? '#f44336' :
    '#2196f3'};
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  text-align: center;
  font-weight: 600;
`;

export const Step5ReviewCreate: React.FC<Step5ReviewCreateProps> = ({
  data,
  onComplete
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [createStatus, setCreateStatus] = useState<'success' | 'error' | null>(null);

  // Calculate final ability scores including background bonuses (unused in this component - handled by AbilityScoresHeader)
  // const calculateFinalAbilityScores = () => {
  //   const baseScores = data.abilityScores;
  //   const backgroundBonuses = data.backgroundAbilityScoreAllocations || {};

  //   return {
  //     strength: baseScores.strength + (backgroundBonuses.strength || backgroundBonuses.str || 0),
  //     dexterity: baseScores.dexterity + (backgroundBonuses.dexterity || backgroundBonuses.dex || 0),
  //     constitution: baseScores.constitution + (backgroundBonuses.constitution || backgroundBonuses.con || 0),
  //     intelligence: baseScores.intelligence + (backgroundBonuses.intelligence || backgroundBonuses.int || 0),
  //     wisdom: baseScores.wisdom + (backgroundBonuses.wisdom || backgroundBonuses.wis || 0),
  //     charisma: baseScores.charisma + (backgroundBonuses.charisma || backgroundBonuses.cha || 0),
  //   };
  // };

  // Calculate ability modifier (currently unused but may be needed for future features)
  // const calculateModifier = (score: number): number => {
  //   return Math.floor((score - 10) / 2);
  // };

  // const finalScores = calculateFinalAbilityScores();

  const handleCreateCharacter = async () => {
    setIsCreating(true);
    setCreateStatus(null);

    try {
      // Convert generator data to character sheet format
      const characterSheetData = mapGeneratorDataToCharacterSheet(data);

      // Log the converted data for debugging
      console.log('Generated Character Sheet Data:', characterSheetData);
      console.log('Structured Features:', characterSheetData.features);

      // Create character using the API
      const response = await characterService.create({
        userId: 1, // TODO: Get actual user ID from auth context
        name: characterSheetData.name,
        level: characterSheetData.level,
        characterData: characterSheetData,
        isPublic: false,
      });

      if (response.error) {
        console.error('❌ API Error:', response.error);
        setCreateStatus('error');
        return;
      }

      if (!response.data) {
        console.error('❌ No character data returned from server');
        setCreateStatus('error');
        return;
      }

      console.log('✅ Character created successfully:', response.data);
      setCreateStatus('success');

      // Wait a moment to show success message, then complete
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (error) {
      console.error('❌ Error creating character:', error);
      setCreateStatus('error');
    } finally {
      setIsCreating(false);
    }
  };

  const formatList = (items: string[] | undefined): string => {
    if (!items || items.length === 0) return 'None';
    return items.join(', ');
  };

  const getAllSkillProficiencies = (): string[] => {
    const skills: string[] = [];
    if (data.selectedClassSkills) skills.push(...data.selectedClassSkills);
    if (data.backgroundSkillProficiencies) skills.push(...data.backgroundSkillProficiencies);
    return [...new Set(skills)]; // Remove duplicates
  };

  const getAllEquipment = (): string[] => {
    const equipment: string[] = [];

    // Helper function to extract string from object or return string directly
    const extractEquipmentName = (item: any): string => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item?.item) return item.item;
      if (typeof item === 'object' && item?.name) return item.name;
      return String(item || '');
    };

    if (data.classStartingEquipment) {
      equipment.push(...data.classStartingEquipment.map(extractEquipmentName));
    }
    if (data.backgroundStartingEquipment) {
      equipment.push(...data.backgroundStartingEquipment.map(extractEquipmentName));
    }
    if (data.selectedEquipment.weapons) {
      equipment.push(...data.selectedEquipment.weapons.map(extractEquipmentName));
    }
    if (data.selectedEquipment.equipment) {
      equipment.push(...data.selectedEquipment.equipment.map(extractEquipmentName));
    }
    if (data.selectedEquipment.armor) {
      equipment.push(extractEquipmentName(data.selectedEquipment.armor));
    }
    if (data.selectedEquipment.shield) {
      equipment.push(extractEquipmentName(data.selectedEquipment.shield));
    }

    return equipment.filter(Boolean); // Remove empty values
  };

  const getAllSpells = (): { cantrips: string[], spells: string[] } => {
    const cantrips: string[] = [];
    const spells: string[] = [];

    // Species spells
    if (data.speciesSpells?.cantrips) cantrips.push(...data.speciesSpells.cantrips);
    if (data.speciesSpells?.level1) spells.push(...data.speciesSpells.level1);

    // Feat spells
    if (data.featSpells) {
      Object.values(data.featSpells).forEach(featSpells => {
        if (featSpells) spells.push(...featSpells);
      });
    }

    return {
      cantrips: [...new Set(cantrips)],
      spells: [...new Set(spells)]
    };
  };

  return (
    <StepContainer>
      <div className="step-title">Review & Create Character</div>
      <div className="step-description">
        Review your character details and create your D&D 2024 character sheet.
      </div>

      <AbilityScoresHeader data={data} />

      <ReviewContainer>
        {/* Left Column - Character Overview */}
        <CharacterCard>
          <h3>Character Overview</h3>
          <CharacterInfo>
            <div className="info-row">
              <span className="label">Character Name:</span>
              <span className="value">{data.characterName || 'Unnamed Character'}</span>
            </div>
            <div className="info-row">
              <span className="label">Player Name:</span>
              <span className="value">{data.playerName || 'Unknown Player'}</span>
            </div>
            <div className="info-row">
              <span className="label">Class:</span>
              <span className="value">{data.selectedClass}</span>
            </div>
            <div className="info-row">
              <span className="label">Background:</span>
              <span className="value">{data.selectedBackground}</span>
            </div>
            <div className="info-row">
              <span className="label">Species:</span>
              <span className="value">{data.selectedSpecies}</span>
            </div>
            <div className="info-row">
              <span className="label">Size:</span>
              <span className="value">{data.speciesSize || 'Medium'}</span>
            </div>
            <div className="info-row">
              <span className="label">Speed:</span>
              <span className="value">{data.speciesSpeed || 30} ft</span>
            </div>
            <div className="info-row">
              <span className="label">Hit Dice:</span>
              <span className="value">{data.hitDice}</span>
            </div>
            {data.spellcaster && (
              <div className="info-row">
                <span className="label">Spellcasting:</span>
                <span className="value">{data.spellcastingAbility}</span>
              </div>
            )}
          </CharacterInfo>
        </CharacterCard>

        {/* Right Column - Proficiencies */}
        <CharacterCard>
          <h3>Proficiencies</h3>
          <ProficienciesGrid>
            <ProficiencyCard>
              <div className="prof-title">Skills</div>
              <div className="prof-list">{formatList(getAllSkillProficiencies())}</div>
            </ProficiencyCard>

            <ProficiencyCard>
              <div className="prof-title">Saving Throws</div>
              <div className="prof-list">{formatList(data.classProficiencies?.savingThrows)}</div>
            </ProficiencyCard>

            <ProficiencyCard>
              <div className="prof-title">Armor</div>
              <div className="prof-list">{formatList(data.classProficiencies?.armor)}</div>
            </ProficiencyCard>

            <ProficiencyCard>
              <div className="prof-title">Weapons</div>
              <div className="prof-list">{formatList(data.classProficiencies?.weapons)}</div>
            </ProficiencyCard>

            <ProficiencyCard>
              <div className="prof-title">Languages</div>
              <div className="prof-list">{formatList(data.selectedLanguages)}</div>
            </ProficiencyCard>

            <ProficiencyCard>
              <div className="prof-title">Tools</div>
              <div className="prof-list">{formatList(data.classProficiencies?.tools)}</div>
            </ProficiencyCard>
          </ProficienciesGrid>
        </CharacterCard>
      </ReviewContainer>

      {/* Features & Abilities - New Structured Display */}
      <ReviewContainer>
        <CharacterCard style={{ gridColumn: '1 / -1' }}>
          <h3>Features & Abilities</h3>
          <StructuredFeaturesDisplay
            features={mapGeneratorDataToCharacterSheet(data).features}
            compactMode={true}
            showFilters={false}
          />
        </CharacterCard>

        <CharacterCard>
          <h3>Equipment & Spells</h3>

          <Section>
            <div className="section-title">Starting Equipment</div>
            <div className="section-content">
              {getAllEquipment().length > 0 ? (
                getAllEquipment().map((item, index) => (
                  <div key={index} className="list-item">{item}</div>
                ))
              ) : (
                <div>No equipment recorded</div>
              )}
            </div>
          </Section>

          {data.spellcaster && (
            <>
              <Section>
                <div className="section-title">Cantrips</div>
                <div className="section-content">
                  {getAllSpells().cantrips.length > 0 ? (
                    getAllSpells().cantrips.map((cantrip, index) => (
                      <div key={index} className="list-item">{cantrip}</div>
                    ))
                  ) : (
                    <div>No cantrips known</div>
                  )}
                </div>
              </Section>

              <Section>
                <div className="section-title">1st Level Spells</div>
                <div className="section-content">
                  {getAllSpells().spells.length > 0 ? (
                    getAllSpells().spells.map((spell, index) => (
                      <div key={index} className="list-item">{spell}</div>
                    ))
                  ) : (
                    <div>No spells known</div>
                  )}
                </div>
              </Section>
            </>
          )}

          {data.speciesDarkvision && data.speciesDarkvision > 0 && (
            <Section>
              <div className="section-title">Special Senses</div>
              <div className="section-content">
                <div className="list-item">Darkvision {data.speciesDarkvision} ft</div>
              </div>
            </Section>
          )}

          {data.speciesResistances && data.speciesResistances.length > 0 && (
            <Section>
              <div className="section-title">Damage Resistances</div>
              <div className="section-content">
                {data.speciesResistances.map((resistance, index) => (
                  <div key={index} className="list-item">{resistance}</div>
                ))}
              </div>
            </Section>
          )}
        </CharacterCard>
      </ReviewContainer>

      {createStatus && (
        <StatusMessage type={createStatus}>
          {createStatus === 'success' ? (
            '🎉 Character created successfully! Redirecting to character sheet...'
          ) : (
            '❌ Error creating character. Please try again.'
          )}
        </StatusMessage>
      )}

      <ActionButtons>
        <button
          className="btn-back"
          onClick={() => window.history.back()}
          disabled={isCreating}
        >
          Back to Review
        </button>
        <button
          className="btn-create"
          onClick={handleCreateCharacter}
          disabled={isCreating || !data.characterName || !data.selectedClass}
        >
          {isCreating ? 'Creating Character...' : 'Create Character'}
        </button>
      </ActionButtons>
    </StepContainer>
  );
};