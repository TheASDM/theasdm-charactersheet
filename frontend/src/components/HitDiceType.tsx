import React from 'react';
import styled from 'styled-components';

const HitDiceTypeContainer = styled.div`
  font-size: 0.5rem;
  font-weight: 500;
  color: #666;
  letter-spacing: 0.2px;
  text-align: center;
  margin-top: 0.3rem;
`;

const getClassHitDie = (className: string): string => {
  const hitDiceMap: { [key: string]: string } = {
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

  return hitDiceMap[className] || 'd8';
};

interface HitDiceTypeProps {
  className: string;
}

export const HitDiceType: React.FC<HitDiceTypeProps> = ({ className }) => {
  const hitDieType = getClassHitDie(className);
  return <HitDiceTypeContainer>{hitDieType}</HitDiceTypeContainer>;
};
