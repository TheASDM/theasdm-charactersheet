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
  margin-bottom: 0.25rem;
  letter-spacing: 0.5px;
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
const calculateFinalAbilityScores = (data: CharacterBuilderData) => {
  const baseScores = data.abilityScores;
  const backgroundBonuses = data.backgroundAbilityScoreAllocations || {};

  // Helper function to safely extract number from value
  const getScoreValue = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseInt(value) || 0;
    if (typeof value === 'object' && value !== null) {
      // Handle cases where scores might be stored as objects
      return parseInt(value.value || value.score || 0) || 0;
    }
    return 0;
  };

  return {
    strength: getScoreValue(baseScores.strength) + (backgroundBonuses.strength || backgroundBonuses.str || 0),
    dexterity: getScoreValue(baseScores.dexterity) + (backgroundBonuses.dexterity || backgroundBonuses.dex || 0),
    constitution: getScoreValue(baseScores.constitution) + (backgroundBonuses.constitution || backgroundBonuses.con || 0),
    intelligence: getScoreValue(baseScores.intelligence) + (backgroundBonuses.intelligence || backgroundBonuses.int || 0),
    wisdom: getScoreValue(baseScores.wisdom) + (backgroundBonuses.wisdom || backgroundBonuses.wis || 0),
    charisma: getScoreValue(baseScores.charisma) + (backgroundBonuses.charisma || backgroundBonuses.cha || 0),
  };
};

export const AbilityScoresHeader: React.FC<AbilityScoresHeaderProps> = ({ data }) => {
  const finalScores = calculateFinalAbilityScores(data);

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
          const score = finalScores[key];
          const modifier = calculateModifier(score);

          return (
            <AbilityCard key={key}>
              <AbilityName>{name}</AbilityName>
              <AbilityScore>{score}</AbilityScore>
              <AbilityModifier>{formatModifier(modifier)}</AbilityModifier>
            </AbilityCard>
          );
        })}
      </AbilityGrid>
    </HeaderContainer>
  );
};