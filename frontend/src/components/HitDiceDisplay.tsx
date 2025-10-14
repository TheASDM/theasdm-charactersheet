import React from 'react';
import styled from 'styled-components';
import { CharacterSheetData } from '../types/characterSheet';

interface HitDiceDisplayProps {
  character: CharacterSheetData;
  isEditing: boolean;
  onUpdateCharacter: (updates: Partial<CharacterSheetData>) => void;
}

const HitDiceContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.3rem 0.5rem;
  background: transparent;
  border-bottom: 1px solid rgba(51, 51, 51, 0.5);
  gap: 0.6rem;
  margin-bottom: 0.3rem;
`;

const HitDiceLabel = styled.div`
  font-size: 0.65rem;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
`;

const HitDiceInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
`;

const HitDiceCount = styled.div`
  font-size: 0.85rem;
  font-weight: 700;
  color: #ce9016;
  white-space: nowrap;
  letter-spacing: 0.3px;
`;

const HitDiceTypeBelow = styled.div`
  font-size: 0.5rem;
  font-weight: 500;
  color: #666;
  letter-spacing: 0.2px;
  text-align: center;
  margin-top: 0.3rem;
  padding-top: 0.2rem;
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

export const HitDiceDisplay: React.FC<HitDiceDisplayProps> = ({
  character,
  isEditing,
  onUpdateCharacter,
}) => {
  const hitDieType = getClassHitDie(character.class);
  const { current, max } = character.hitDice;

  const handleCountClick = () => {
    if (!isEditing) return;

    // Cycle through: full -> half -> empty -> full
    if (current === max) {
      onUpdateCharacter({
        hitDice: {
          ...character.hitDice,
          current: Math.floor(max / 2),
        },
      });
    } else if (current > 0) {
      onUpdateCharacter({
        hitDice: {
          ...character.hitDice,
          current: 0,
        },
      });
    } else {
      onUpdateCharacter({
        hitDice: {
          ...character.hitDice,
          current: max,
        },
      });
    }
  };

  return (
    <HitDiceContainer>
      <HitDiceLabel>Hit Dice</HitDiceLabel>
      <HitDiceInfo>
        <HitDiceCount
          onClick={handleCountClick}
          style={{ cursor: isEditing ? 'pointer' : 'default' }}
          title={isEditing ? 'Click to adjust hit dice' : undefined}
        >
          {current}/{max}
        </HitDiceCount>
        <HitDiceTypeBelow>{hitDieType}</HitDiceTypeBelow>
      </HitDiceInfo>
    </HitDiceContainer>
  );
};
