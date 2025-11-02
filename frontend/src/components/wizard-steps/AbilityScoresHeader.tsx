import React from 'react';
import styled from 'styled-components';
import { CharacterBuilderData } from '../CharacterGeneratorWizard';

interface AbilityScoresHeaderProps {
  data: CharacterBuilderData;
}

const HeaderContainer = styled.div`
  background: linear-gradient(135deg, rgba(206, 144, 22, 0.15) 0%, rgba(26, 26, 26, 0.8) 100%);
  border: 1px solid rgba(206, 144, 22, 0.3);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
`;

const AbilityGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }
`;

const AbilityCard = styled.div`
  background: rgba(26, 26, 26, 0.7);
  border: 2px solid #444;
  border-radius: 8px;
  padding: 0.75rem 0.5rem;
  text-align: center;
  transition: all 0.3s ease;

  &:hover {
    border-color: #ce9016;
    box-shadow: 0 2px 8px rgba(206, 144, 22, 0.2);
  }
`;

const AbilityName = styled.div`
  color: #ce9016;
  font-family: 'Cinzel', serif;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 0.15rem;
  letter-spacing: 0.5px;
`;

const RawScore = styled.div`
  color: rgba(240, 240, 240, 0.4);
  font-size: 0.65rem;
  font-weight: 400;
  margin-bottom: 0.25rem;
  font-family: 'Inter', sans-serif;
`;

const AbilityScore = styled.div`
  color: #f0f0f0;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const AbilityModifier = styled.div`
  color: #4caf50;
  font-size: 1.4rem;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  margin-bottom: 0.5rem;
`;

const SavingThrowContainer = styled.div`
  border-top: 1px solid rgba(206, 144, 22, 0.2);
  padding-top: 0.4rem;
  margin-top: 0.4rem;
`;

const SavingThrowLabel = styled.div`
  color: rgba(206, 144, 22, 0.6);
  font-size: 0.6rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 0.15rem;
  font-family: 'Inter', sans-serif;
`;

const SavingThrowValue = styled.div<{ $isProficient: boolean }>`
  color: ${props => props.$isProficient ? '#4caf50' : '#999'};
  font-size: 0.9rem;
  font-weight: ${props => props.$isProficient ? '700' : '600'};
  font-family: 'Inter', sans-serif;
`;

const HeaderTitle = styled.h3`
  color: #ce9016;
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  margin: 0 0 1rem 0;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

// Calculate ability modifier
const calculateModifier = (score: number): number => {
  return Math.floor((score - 10) / 2);
};

// Format modifier with + or - sign
const formatModifier = (modifier: number): string => {
  if (modifier >= 0) {
    return `+${modifier}`;
  }
  return `${modifier}`;
};

// Calculate final ability scores including background bonuses
const ABILITY_KEY_MAP: Record<string, keyof CharacterBuilderData['abilityScores']> = {
  str: 'strength',
  strength: 'strength',
  dex: 'dexterity',
  dexterity: 'dexterity',
  con: 'constitution',
  constitution: 'constitution',
  int: 'intelligence',
  intelligence: 'intelligence',
  wis: 'wisdom',
  wisdom: 'wisdom',
  cha: 'charisma',
  charisma: 'charisma',
};

const extractNumericValue = (value: unknown): number => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if ('amount' in record) {
      return extractNumericValue(record.amount);
    }
    if ('value' in record) {
      return extractNumericValue(record.value);
    }
    if ('score' in record) {
      return extractNumericValue(record.score);
    }
  }
  return 0;
};

const applyAbilityBonuses = (
  totals: Record<keyof CharacterBuilderData['abilityScores'], number>,
  source?: Record<string, unknown>
) => {
  if (!source) return;

  Object.entries(source).forEach(([key, value]) => {
    const abilityKey = ABILITY_KEY_MAP[key.toLowerCase() as keyof typeof ABILITY_KEY_MAP];
    if (!abilityKey) return;

    const numeric = extractNumericValue(value);
    if (numeric !== 0) {
      totals[abilityKey] += numeric;
    }
  });
};

const calculateFinalAbilityScores = (data: CharacterBuilderData) => {
  const baseScores = data.abilityScores;
  const totals: Record<keyof CharacterBuilderData['abilityScores'], number> = {
    strength: baseScores.strength,
    dexterity: baseScores.dexterity,
    constitution: baseScores.constitution,
    intelligence: baseScores.intelligence,
    wisdom: baseScores.wisdom,
    charisma: baseScores.charisma,
  };

  applyAbilityBonuses(totals, data.backgroundAbilityScoreAllocations);
  applyAbilityBonuses(totals, data.speciesAbilityScoreAllocations);

  if (data.featChoices) {
    Object.values(data.featChoices).forEach((choice) => {
      if (choice && typeof choice === 'object' && 'abilityScores' in choice) {
        applyAbilityBonuses(
          totals,
          (choice as { abilityScores?: Record<string, unknown> }).abilityScores
        );
      }
    });
  }

  return totals;
};

export const AbilityScoresHeader: React.FC<AbilityScoresHeaderProps> = ({ data }) => {
  const finalScores = calculateFinalAbilityScores(data);
  const baseScores = data.abilityScores;

  // Get saving throw proficiencies from class
  const savingThrowProficiencies = data.classProficiencies?.savingThrows || [];
  const proficiencyBonus = 2; // Level 1 characters always have +2 proficiency bonus

  // Map ability keys to full names for comparison with saving throw proficiencies
  const abilityNameMap: Record<keyof typeof finalScores, string> = {
    strength: 'Strength',
    dexterity: 'Dexterity',
    constitution: 'Constitution',
    intelligence: 'Intelligence',
    wisdom: 'Wisdom',
    charisma: 'Charisma',
  };

  const abilities = [
    { name: 'STR', key: 'strength' as keyof typeof finalScores },
    { name: 'DEX', key: 'dexterity' as keyof typeof finalScores },
    { name: 'CON', key: 'constitution' as keyof typeof finalScores },
    { name: 'INT', key: 'intelligence' as keyof typeof finalScores },
    { name: 'WIS', key: 'wisdom' as keyof typeof finalScores },
    { name: 'CHA', key: 'charisma' as keyof typeof finalScores },
  ];

  // Don't show if no ability scores are set yet
  const hasAbilityScores = Object.values(finalScores).some(score => score > 0);
  if (!hasAbilityScores) {
    return null;
  }

  return (
    <HeaderContainer>
      <HeaderTitle>Ability Scores</HeaderTitle>
      <AbilityGrid>
        {abilities.map(({ name, key }) => {
          const rawScore = baseScores[key];
          const finalScore = finalScores[key];
          const modifier = calculateModifier(finalScore);

          // Check if this ability has saving throw proficiency
          const isProficient = savingThrowProficiencies.some(
            prof => prof.toLowerCase() === abilityNameMap[key].toLowerCase()
          );

          // Calculate saving throw (modifier + proficiency bonus if proficient)
          const savingThrow = modifier + (isProficient ? proficiencyBonus : 0);

          return (
            <AbilityCard key={key}>
              <AbilityName>{name}</AbilityName>
              <RawScore>({rawScore})</RawScore>
              <AbilityScore>{finalScore}</AbilityScore>
              <AbilityModifier>{formatModifier(modifier)}</AbilityModifier>
              <SavingThrowContainer>
                <SavingThrowLabel>Save</SavingThrowLabel>
                <SavingThrowValue $isProficient={isProficient}>
                  {formatModifier(savingThrow)}
                </SavingThrowValue>
              </SavingThrowContainer>
            </AbilityCard>
          );
        })}
      </AbilityGrid>
    </HeaderContainer>
  );
};
