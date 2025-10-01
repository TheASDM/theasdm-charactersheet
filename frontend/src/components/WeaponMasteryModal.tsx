import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { WEAPON_TO_MASTERY, WEAPON_MASTERY_PROPERTIES } from '../utils/simpleFeatureGenerator';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
  border-radius: 12px;
  padding: 2rem;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
  border: 2px solid #333;
`;

const ModalTitle = styled.h2`
  color: #d4af37;
  margin: 0 0 1.5rem 0;
  font-size: 1.8rem;
  text-align: center;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
`;

const SlotsInfo = styled.div`
  text-align: center;
  color: #b0b0b0;
  margin-bottom: 1.5rem;
  font-size: 1rem;
`;

const WeaponGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const WeaponCard = styled.div<{ selected: boolean; disabled: boolean }>`
  background: ${props => props.selected
    ? 'rgba(74, 222, 128, 0.15)'
    : 'rgba(255, 255, 255, 0.03)'};
  border: 2px solid ${props => props.selected ? '#4ade80' : props.disabled ? '#444' : '#333'};
  border-radius: 8px;
  padding: 1rem;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.5 : 1};
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);

  &:hover {
    ${props => !props.disabled && `
      transform: translateY(-2px);
      box-shadow: 0 4px 12px ${props.selected ? 'rgba(74, 222, 128, 0.3)' : 'rgba(212, 175, 55, 0.3)'};
      border-color: ${props.selected ? '#4ade80' : '#d4af37'};
      background: ${props.selected ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
    `}
  }
`;

const WeaponName = styled.div`
  color: #d4af37;
  font-weight: bold;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
`;

const MasteryProperty = styled.div`
  color: #4ade80;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
`;

const PropertyDescription = styled.div`
  color: #b0b0b0;
  font-size: 0.85rem;
  line-height: 1.4;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  ${props => props.variant === 'primary' ? `
    background: rgba(74, 222, 128, 0.15);
    color: #4ade80;
    border: 1px solid #4ade80;

    &:hover {
      background: rgba(74, 222, 128, 0.25);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(74, 222, 128, 0.3);
    }
  ` : `
    background: rgba(255, 255, 255, 0.05);
    color: #b0b0b0;
    border: 1px solid #333;

    &:hover {
      background: rgba(255, 255, 255, 0.08);
      transform: translateY(-2px);
      border-color: #555;
    }
  `}
`;

interface WeaponMasteryModalProps {
  isOpen: boolean;
  maxMasteries: number;
  currentMasteries: Array<{ weapon: string; property: string }>;
  onConfirm: (masteries: Array<{ weapon: string; property: string }>) => void;
  onCancel: () => void;
  classRestrictions?: 'finesse' | 'melee' | null; // Rogue needs finesse, Barbarian needs melee
}

const WeaponMasteryModal: React.FC<WeaponMasteryModalProps> = ({
  isOpen,
  maxMasteries,
  currentMasteries,
  onConfirm,
  onCancel,
  classRestrictions = null
}) => {
  const [selectedWeapons, setSelectedWeapons] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedWeapons(currentMasteries.map(m => m.weapon));
    }
  }, [isOpen, currentMasteries]);

  if (!isOpen) return null;

  // Define finesse weapons
  const finesseWeapons = ['Dagger', 'Dart', 'Rapier', 'Shortsword', 'Scimitar', 'Whip'];

  // Define melee weapons (exclude ranged)
  const rangedWeapons = ['Dart', 'Shortbow', 'Longbow', 'Light Crossbow', 'Heavy Crossbow', 'Hand Crossbow', 'Blowgun', 'Sling', 'Pistol', 'Musket'];

  // Filter weapons based on class restrictions
  const availableWeapons = Object.keys(WEAPON_TO_MASTERY).filter(weapon => {
    if (classRestrictions === 'finesse') {
      return finesseWeapons.includes(weapon);
    }
    if (classRestrictions === 'melee') {
      return !rangedWeapons.includes(weapon);
    }
    return true;
  });

  const handleWeaponToggle = (weapon: string) => {
    if (selectedWeapons.includes(weapon)) {
      setSelectedWeapons(selectedWeapons.filter(w => w !== weapon));
    } else if (selectedWeapons.length < maxMasteries) {
      setSelectedWeapons([...selectedWeapons, weapon]);
    }
  };

  const handleConfirm = () => {
    const masteries = selectedWeapons.map(weapon => ({
      weapon,
      property: WEAPON_TO_MASTERY[weapon]
    }));
    onConfirm(masteries);
  };

  return (
    <ModalOverlay onClick={onCancel}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalTitle>Choose Weapon Masteries</ModalTitle>

        <SlotsInfo>
          Selected: {selectedWeapons.length} / {maxMasteries}
          {classRestrictions === 'finesse' && <div style={{ marginTop: '0.5rem', color: '#fbbf24' }}>⚠ Rogues can only select weapons with the Finesse property</div>}
          {classRestrictions === 'melee' && <div style={{ marginTop: '0.5rem', color: '#fbbf24' }}>⚠ Barbarians can only select melee weapons</div>}
        </SlotsInfo>

        <WeaponGrid>
          {availableWeapons.map(weapon => {
            const property = WEAPON_TO_MASTERY[weapon];
            const description = WEAPON_MASTERY_PROPERTIES[property];
            const isSelected = selectedWeapons.includes(weapon);
            const isDisabled = !isSelected && selectedWeapons.length >= maxMasteries;

            return (
              <WeaponCard
                key={weapon}
                selected={isSelected}
                disabled={isDisabled}
                onClick={() => !isDisabled && handleWeaponToggle(weapon)}
              >
                <WeaponName>{weapon}</WeaponName>
                <MasteryProperty>{property}</MasteryProperty>
                <PropertyDescription>{description}</PropertyDescription>
              </WeaponCard>
            );
          })}
        </WeaponGrid>

        <ButtonGroup>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm}>
            Confirm Selection
          </Button>
        </ButtonGroup>
      </ModalContent>
    </ModalOverlay>
  );
};

export default WeaponMasteryModal;
