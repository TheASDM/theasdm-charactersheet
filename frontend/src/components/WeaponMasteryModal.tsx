import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { WEAPON_TO_MASTERY, WEAPON_MASTERY_PROPERTIES } from '../utils/simpleFeatureGenerator';

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  z-index: 1000;
  padding: clamp(2.5rem, 8vh, 4.5rem) 1.5rem 2rem;
  overflow-y: auto;
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, #1c1c1c 0%, #111111 100%);
  border-radius: 14px;
  padding: 1.75rem 1.6rem 1.25rem;
  max-width: 780px;
  width: 100%;
  max-height: calc(100vh - clamp(5rem, 12vh, 7rem));
  overflow-y: auto;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.8);
  border: 2px solid #3a3a3a;
  position: relative;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const CloseButton = styled.button`
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: #f5f5f5;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-1px);
  }
`;

const ModalTitle = styled.h2`
  color: #ce9016;
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

const WeaponListContainer = styled.div`
  margin-bottom: 2rem;
  border-radius: 12px;
  border: 1px solid rgba(55, 65, 81, 0.6);
  background: linear-gradient(180deg, rgba(17, 17, 17, 0.95) 0%, rgba(12, 12, 12, 0.92) 100%);
  box-shadow: inset 0 0 0 1px rgba(12, 12, 12, 0.6), 0 12px 24px rgba(0, 0, 0, 0.35);
  overflow: hidden;
`;

const WeaponListHeader = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: center;
  padding: 0.85rem 1.25rem;
  border-bottom: 1px solid rgba(55, 65, 81, 0.55);
  font-family: 'Cinzel', serif;
  font-size: 0.8rem;
  letter-spacing: 1.6px;
  color: #facc15;
  background: rgba(24, 24, 24, 0.9);
  text-transform: uppercase;

  span:last-child {
    text-align: right;
    color: rgba(248, 250, 252, 0.72);
    letter-spacing: 1.2px;
  }
`;

const WeaponList = styled.div`
  display: flex;
  flex-direction: column;
`;

const WeaponRow = styled.button<{ selected: boolean; disabled: boolean }>`
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1.25fr);
  align-items: center;
  column-gap: 1.25rem;
  width: 100%;
  padding: 0.85rem 1.25rem;
  border: none;
  border-bottom: 1px solid rgba(55, 65, 81, 0.55);
  background: ${({ selected, disabled }) =>
    disabled
      ? 'rgba(17, 17, 17, 0.65)'
      : selected
        ? 'linear-gradient(135deg, rgba(34,197,94,0.18) 0%, rgba(21,128,61,0.25) 100%)'
        : 'rgba(24, 24, 24, 0.92)'};
  color: ${({ disabled }) => (disabled ? 'rgba(148, 163, 184, 0.5)' : '#f9fafb')};
  cursor: ${({ disabled }) => (disabled ? 'default' : 'pointer')};
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  text-align: left;

  &:hover {
    ${({ disabled }) =>
      !disabled && `
        transform: translateY(-1px);
        box-shadow: 0 8px 18px rgba(67, 56, 202, 0.18);
      `}
  }

  &:last-child {
    border-bottom: none;
  }
`;

const WeaponAccent = styled.span<{ selected: boolean; disabled: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: ${({ selected, disabled }) => {
    if (disabled) return 'rgba(55, 65, 81, 0.18)';
    return selected ? 'rgba(34, 197, 94, 0.25)' : 'rgba(55, 65, 81, 0.35)';
  }};
  color: ${({ selected, disabled }) => {
    if (disabled) return 'rgba(148, 163, 184, 0.6)';
    return selected ? '#4ade80' : '#9ca3af';
  }};
  font-size: 1rem;
`;

const WeaponInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.85rem;
`;

const WeaponMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`;

const WeaponName = styled.span`
  font-family: 'Cinzel', serif;
  letter-spacing: 0.8px;
  font-size: 1rem;
  color: inherit;
`;

const WeaponStatus = styled.span<{ selected: boolean; disabled: boolean }>`
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.8px;
  color: ${({ selected, disabled }) => {
    if (selected) return '#4ade80';
    if (disabled) return 'rgba(100, 116, 139, 0.8)';
    return 'rgba(156, 163, 175, 0.85)';
  }};
`;

const WeaponDescription = styled.span`
  font-size: 0.78rem;
  color: rgba(203, 213, 225, 0.85);
  line-height: 1.4;
  letter-spacing: 0.3px;
`;

const getShortDescription = (text?: string): string => {
  if (!text) return '—';
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '—';

  const sentenceMatch = cleaned.match(/[^.!?]+[.!?]/);
  if (sentenceMatch) {
    return sentenceMatch[0].trim();
  }

  return cleaned.length > 120 ? `${cleaned.slice(0, 117).trim()}…` : cleaned;
}; 

const normalizeWeaponName = (value: string): string =>
  value
    .toLowerCase()
    .replace(/\(.*?\)/g, '') // drop parenthetical notes
    .replace(/^\s*\d+x?\s*/, '') // remove quantity prefixes like "2x"
    .replace(/[+-]/g, '') // strip enhancement symbols
    .replace(/\d+/g, '') // drop remaining digits
    .replace(/[^a-z]/g, '') // keep letters only
    .trim();

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
  position: sticky;
  bottom: -0.75rem;
  padding: 1rem 0 0.25rem;
  background: linear-gradient(180deg, rgba(17, 17, 17, 0) 0%, rgba(17, 17, 17, 0.95) 45%, rgba(17, 17, 17, 1) 100%);
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  ${props => props.$variant === 'primary' ? `
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
  ownedWeapons?: string[];
}

const WeaponMasteryModal: React.FC<WeaponMasteryModalProps> = ({
  isOpen,
  maxMasteries,
  currentMasteries,
  onConfirm,
  onCancel,
  classRestrictions = null,
  ownedWeapons = []
}) => {
  const [selectedWeapons, setSelectedWeapons] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedWeapons(currentMasteries.map(m => m.weapon));
    }
  }, [isOpen, currentMasteries]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  const ownedWeaponSet = useMemo(() => {
    return new Set(
      (ownedWeapons ?? [])
        .filter((name): name is string => typeof name === 'string' && name.trim().length > 0)
        .map(name => normalizeWeaponName(name))
    );
  }, [ownedWeapons]);

  if (!isOpen) return null;

  // Define finesse weapons
  const finesseWeapons = ['Dagger', 'Dart', 'Rapier', 'Shortsword', 'Scimitar', 'Whip'];

  // Define melee weapons (exclude ranged)
  const rangedWeapons = ['Dart', 'Shortbow', 'Longbow', 'Light Crossbow', 'Heavy Crossbow', 'Hand Crossbow', 'Blowgun', 'Sling', 'Pistol', 'Musket'];

  // Filter weapons based on class restrictions
  const masteryWeapons = Object.keys(WEAPON_TO_MASTERY)
    .filter(weapon => {
      if (classRestrictions === 'finesse') {
        return finesseWeapons.includes(weapon);
      }
      if (classRestrictions === 'melee') {
        return !rangedWeapons.includes(weapon);
      }
      return true;
    })
    .sort((a, b) => a.localeCompare(b));

  const hasWeapon = (weapon: string) => {
    const normalized = normalizeWeaponName(weapon);
    if (!normalized) return false;
    if (ownedWeaponSet.has(normalized)) return true;

    // Allow partial matches for items with descriptors, e.g. "Longsword (Masterwork)"
    for (const owned of ownedWeaponSet) {
      if (owned.includes(normalized) || normalized.includes(owned)) {
        return true;
      }
    }
    return false;
  };

  const handleWeaponToggle = (weapon: string) => {
    setSelectedWeapons(prev => {
      if (prev.includes(weapon)) {
        return prev.filter(w => w !== weapon);
      }

      if (prev.length >= maxMasteries) {
        return prev;
      }

      return [...prev, weapon];
    });
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
      <ModalContent
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="weapon-mastery-modal-title"
      >
        <ModalHeader>
          <ModalTitle id="weapon-mastery-modal-title">Choose Weapon Masteries</ModalTitle>
          <CloseButton onClick={onCancel} aria-label="Close weapon mastery selection">
            ×
          </CloseButton>
        </ModalHeader>

        <SlotsInfo>
          Selected: {selectedWeapons.length} / {maxMasteries}
          {classRestrictions === 'finesse' && <div style={{ marginTop: '0.5rem', color: '#fbbf24' }}>⚠ Rogues can only select weapons with the Finesse property</div>}
          {classRestrictions === 'melee' && <div style={{ marginTop: '0.5rem', color: '#fbbf24' }}>⚠ Barbarians can only select melee weapons</div>}
        </SlotsInfo>

        <WeaponListContainer>
          <WeaponListHeader>
            <span>Weapon</span>
            <span>Effect</span>
          </WeaponListHeader>
          <WeaponList>
            {masteryWeapons.map(weapon => {
              const property = WEAPON_TO_MASTERY[weapon];
              const isSelected = selectedWeapons.includes(weapon);
              const ownsWeapon = hasWeapon(weapon);
              const isUnavailable = !ownsWeapon;
              const isCapacityLocked = !isSelected && selectedWeapons.length >= maxMasteries;
              const isDisabled = (isUnavailable && !isSelected) || isCapacityLocked;

              return (
                <WeaponRow
                  key={weapon}
                  type="button"
                  selected={isSelected}
                  disabled={isDisabled}
                  onClick={() => !isDisabled && handleWeaponToggle(weapon)}
                >
                  <WeaponInfo>
                    <WeaponAccent selected={isSelected} disabled={isUnavailable}>
                      ⚔️
                    </WeaponAccent>
                    <WeaponMeta>
                      <WeaponName>{weapon}</WeaponName>
                      <WeaponStatus selected={isSelected} disabled={isUnavailable}>
                        {ownsWeapon ? (isSelected ? 'Equipped' : property) : 'Not Owned'}
                      </WeaponStatus>
                    </WeaponMeta>
                  </WeaponInfo>
                  <WeaponDescription style={{ opacity: isUnavailable ? 0.45 : 1 }}>
                    {getShortDescription(WEAPON_MASTERY_PROPERTIES[property])}
                  </WeaponDescription>
                </WeaponRow>
              );
            })}
          </WeaponList>
        </WeaponListContainer>

        <ButtonGroup>
          <Button $variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button $variant="primary" onClick={handleConfirm}>
            Confirm Selection
          </Button>
        </ButtonGroup>
      </ModalContent>
    </ModalOverlay>
  );
};

export default WeaponMasteryModal;
