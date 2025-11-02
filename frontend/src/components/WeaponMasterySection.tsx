import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { CharacterSheetData, InventoryItem } from '../types/characterSheet';
import { WEAPON_MASTERY_PROPERTIES } from '../utils/simpleFeatureGenerator';
import WeaponMasteryModal from './WeaponMasteryModal';

const MasterySection = styled.div`
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 0.5rem;
  border: 1px solid #333;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  width: 100%;
`;

const MasteryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  padding-bottom: 0.35rem;
  border-bottom: 1px solid #333;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.4rem;
    align-items: flex-start;
  }
`;

const MasteryTitle = styled.h3`
  color: #ce9016;
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

const MasteryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 0.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const MasteryCard = styled.div`
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid #333;
  border-radius: 4px;
  padding: 0.5rem 0.6rem;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(206, 144, 22, 0.5);
    box-shadow: 0 2px 8px rgba(206, 144, 22, 0.15);
  }
`;

const WeaponName = styled.div`
  color: #ce9016;
  font-weight: 600;
  font-size: 0.8rem;
  margin-bottom: 0.1rem;
`;

const PropertyName = styled.div`
  color: #4ade80;
  font-size: 0.68rem;
  font-weight: 600;
  margin-bottom: 0.2rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const PropertyDescription = styled.div`
  color: #b0b0b0;
  font-size: 0.68rem;
  line-height: 1.25;
`;

const MasteryCount = styled.div`
  color: #888;
  font-size: 0.7rem;
  font-weight: 600;
`;

const ManageButton = styled.button`
  padding: 0.4rem 0.8rem;
  background: rgba(255, 255, 255, 0.03);
  color: #ce9016;
  border: 1px solid #333;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.75rem;
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

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const EmptyState = styled.div`
  color: #888;
  text-align: center;
  padding: 1rem;
  font-style: italic;
  font-size: 0.85rem;
  background: rgba(26, 26, 26, 0.5);
  border-radius: 6px;
  border: 1px dashed #333;
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
        <MasteryHeader>
          <MasteryTitle>
            ⚔️ Weapon Mastery
            <MasteryCount>({activeMasteries.length}/{masteryConfig.max})</MasteryCount>
          </MasteryTitle>
          <ManageButton onClick={() => setIsModalOpen(true)}>
            Manage Masteries
          </ManageButton>
        </MasteryHeader>

        {activeMasteries.length > 0 ? (
          <MasteryGrid>
            {activeMasteries.map((mastery, index) => (
              <MasteryCard key={index}>
                <WeaponName>{mastery.weapon}</WeaponName>
                <PropertyName>{mastery.property}</PropertyName>
                <PropertyDescription>
                  {WEAPON_MASTERY_PROPERTIES[mastery.property]}
                </PropertyDescription>
              </MasteryCard>
            ))}
          </MasteryGrid>
        ) : (
          <EmptyState>
            No weapon masteries selected. Click "Manage Masteries" to choose your weapons.
          </EmptyState>
        )}
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
