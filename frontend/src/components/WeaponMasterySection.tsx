import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { CharacterSheetData, InventoryItem } from '../types/characterSheet';
import { WEAPON_MASTERY_PROPERTIES } from '../utils/simpleFeatureGenerator';
import WeaponMasteryModal from './WeaponMasteryModal';

const MasterySection = styled.div`
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 0.75rem;
  border: 1px solid #333;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  height: fit-content;
`;

const MasteryTitle = styled.h3`
  color: #ce9016;
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  text-align: center;
  border-bottom: 1px solid #333;
  padding-bottom: 0.4rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const MasteryCard = styled.div`
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid #333;
  border-radius: 6px;
  padding: 0.5rem;
  margin-bottom: 0.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const WeaponName = styled.div`
  color: #ce9016;
  font-weight: 600;
  font-size: 0.8rem;
  margin-bottom: 0.15rem;
`;

const PropertyName = styled.div`
  color: #4ade80;
  font-size: 0.7rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const PropertyDescription = styled.div`
  color: #b0b0b0;
  font-size: 0.7rem;
  line-height: 1.3;
`;

const ManageButton = styled.button`
  width: 100%;
  padding: 0.5rem 0.75rem;
  margin-top: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  color: #ce9016;
  border: 1px solid #333;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: #ce9016;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(206, 144, 22, 0.2);
  }
`;

const EmptyState = styled.div`
  color: #888;
  text-align: center;
  padding: 0.75rem;
  font-style: italic;
  font-size: 0.75rem;
`;

interface WeaponMasterySectionProps {
  character: CharacterSheetData;
  onUpdateCharacter: (updates: Partial<CharacterSheetData>) => void;
}

const WeaponMasterySection: React.FC<WeaponMasterySectionProps> = ({
  character,
  onUpdateCharacter
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Determine max masteries and restrictions based on class
  const masteryConfig = useMemo(() => {
    const characterClass = character.class?.toLowerCase() || '';

    if (characterClass.includes('fighter')) {
      return { max: 3, restriction: null };
    } else if (characterClass.includes('barbarian')) {
      return { max: 2, restriction: 'melee' as const };
    } else if (characterClass.includes('rogue')) {
      return { max: 2, restriction: 'finesse' as const };
    } else if (characterClass.includes('paladin') || characterClass.includes('ranger')) {
      return { max: 2, restriction: null };
    }
    return { max: 0, restriction: null };
  }, [character.class]);

  const activeMasteries = character.weaponMasteries?.active || [];

  const ownedWeaponNames = useMemo(() => {
    if (!Array.isArray(character.inventory)) return [] as string[];
    return character.inventory
      .map((item: InventoryItem) => item?.name?.trim())
      .filter((name): name is string => Boolean(name));
  }, [character.inventory]);

  const handleConfirm = (masteries: Array<{ weapon: string; property: string }>) => {
    onUpdateCharacter({
      weaponMasteries: {
        max: masteryConfig.max,
        active: masteries
      }
    });
    setIsModalOpen(false);
  };

  if (masteryConfig.max === 0) {
    return null; // Don't render for classes without weapon mastery
  }

  return (
    <>
      <MasterySection>
        <MasteryTitle>⚔️ Weapon Mastery</MasteryTitle>

        {activeMasteries.length > 0 ? (
          <>
            {activeMasteries.map((mastery, index) => (
              <MasteryCard key={index}>
                <WeaponName>{mastery.weapon}</WeaponName>
                <PropertyName>{mastery.property}</PropertyName>
                <PropertyDescription>
                  {WEAPON_MASTERY_PROPERTIES[mastery.property]}
                </PropertyDescription>
              </MasteryCard>
            ))}
          </>
        ) : (
          <EmptyState>
            No weapon masteries selected
          </EmptyState>
        )}

        <ManageButton onClick={() => setIsModalOpen(true)}>
          Manage Masteries ({activeMasteries.length}/{masteryConfig.max})
        </ManageButton>
      </MasterySection>

      <WeaponMasteryModal
        isOpen={isModalOpen}
        maxMasteries={masteryConfig.max}
        currentMasteries={activeMasteries}
        onConfirm={handleConfirm}
        onCancel={() => setIsModalOpen(false)}
        classRestrictions={masteryConfig.restriction}
        ownedWeapons={ownedWeaponNames}
      />
    </>
  );
};

export default WeaponMasterySection;
