import { useCallback, useMemo, useState, Fragment, useEffect } from 'react';
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
import { getCharacterResources, type ResourceTracker } from '../utils/resourceDetection';
import { itemService, isWeapon, isArmor, isShield, getWeaponAttackBonus, getWeaponDamageString, calculateArmorClass } from '../services/itemService';
import { speciesService } from '../services/speciesService';
import { classService, CLASS_SKILLS, CLASS_SKILL_CHOICES } from '../services/classService';
import { Item } from '../types/api';

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

  @media (max-width: 768px) {
    padding: 0.5rem;
    max-width: 100%;
    overflow-x: hidden;
  }

  @media (max-width: 480px) {
    padding: 0.25rem;
  }
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

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
    min-height: auto;
  }

  @media (max-width: 480px) {
    gap: 0.25rem;
  }
`;

// Character Name and Info Section
const CharacterNameSection = styled.div`
  text-align: center;
  padding: 1rem 0;
  border-bottom: 2px solid #8b6914;
  margin-bottom: 1rem;
  position: relative;
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

  @media (max-width: 768px) {
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
  }

  @media (max-width: 480px) {
    font-size: 1rem;
    letter-spacing: 0.5px;
  }
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

  select {
    background: rgba(139, 105, 20, 0.2);
    border: 1px solid #8b6914;
    border-radius: 3px;
    color: #d4af37;
    font-family: inherit;
    font-size: 0.95rem;
    font-weight: 700;
    padding: 0.25rem;
    width: 100%;
    text-align: center;

    &:focus {
      outline: none;
      border-color: #d4af37;
      background: rgba(212, 175, 55, 0.1);
    }

    option {
      background: #2a2520;
      color: #d4af37;
    }
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

  @media (max-width: 768px) {
    font-size: 0.9rem;
    margin-bottom: 0.4rem;
  }

  @media (max-width: 480px) {
    font-size: 0.8rem;
    letter-spacing: 0.3px;
  }
`;

const AbilityScoresGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  flex: 1;

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.25rem;
  }
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

  .stat-value input {
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

      .hp-value input {
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

// HP-specific arrows that need more space to avoid text overlap
const HPArrows = styled.div`
  position: absolute;
  right: -20px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const HPArrow = styled.button<{ direction: 'up' | 'down' }>`
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

// Mana Section
const ManaSection = styled.div`
  border: 2px solid #6d4c8a;
  border-radius: 6px;
  padding: 0.75rem;
  background: rgba(109, 76, 138, 0.1);
  position: relative;
  width: 100%;
  margin-top: 1rem;
`;

const ManaContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
`;

const ManaDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  border: 2px solid #6d4c8a;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.2);

  .mana-current {
    font-size: 2rem;
    font-weight: 700;
    color: #b19cd9;
    min-width: 3rem;
    text-align: center;
  }

  .mana-current input {
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
      border-bottom: 1px solid #b19cd9;
      background: rgba(177, 156, 217, 0.1);
    }
  }

  .mana-separator {
    color: #6d4c8a;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .mana-max {
    font-size: 1.5rem;
    color: #6d4c8a;
    font-weight: 600;
    min-width: 2rem;
    text-align: center;
  }

  .mana-max input {
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
      border-bottom: 1px solid #6d4c8a;
      background: rgba(109, 76, 138, 0.1);
    }
  }

  .mana-controls {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-left: 0.5rem;
  }

  .mana-control-btn {
    background: linear-gradient(145deg, #6d4c8a, #5a3f73);
    color: white;
    border: none;
    width: 20px;
    height: 16px;
    border-radius: 3px;
    cursor: pointer;
    font-size: 0.7rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    line-height: 1;

    &:hover {
      background: linear-gradient(145deg, #5a3f73, #4a3560);
    }

    &:active {
      transform: translateY(1px);
    }
  }
`;

const ManaTitle = styled.div`
  font-size: 1rem;
  font-weight: 700;
  color: #b19cd9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
  margin-bottom: 0.5rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid #6d4c8a;
`;

// Resource Tracking Section
const ResourceSection = styled.div`
  border: 2px solid #8b6914;
  border-radius: 6px;
  padding: 0.75rem;
  background: rgba(139, 105, 20, 0.1);
  position: relative;
  width: 100%;
  margin-top: 1rem;
`;

const ResourceContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  flex-wrap: wrap;
`;

const ResourceTracker = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
`;

const ResourceName = styled.div`
  font-size: 0.7rem;
  color: #8b6914;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  font-weight: 600;
  text-align: center;
`;

const ResourceBoxes = styled.div`
  display: flex;
  gap: 0.25rem;
  align-items: center;
`;

const ResourceBox = styled.div<{ filled?: boolean; isWounds?: boolean }>`
  position: relative;

  input[type="checkbox"] {
    width: ${props => props.isWounds ? '28px' : '20px'};
    height: ${props => props.isWounds ? '28px' : '20px'};
    cursor: pointer;
    appearance: none;
    border: 2px solid #8b6914;
    border-radius: ${props => props.isWounds ? '50%' : '3px'};
    background: ${props => props.filled ? '#d4af37' : 'transparent'};
    transition: all 0.3s ease;

    &:hover {
      background: ${props => props.filled ? '#b8941f' : 'rgba(212, 175, 55, 0.3)'};
    }

    &:checked {
      background: #d4af37;
      box-shadow: 0 0 8px rgba(212, 175, 55, 0.5);
    }
  }
`;

const SkullOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1rem;
  pointer-events: none;
  z-index: 1;
`;

const PoolCounter = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  border: 2px solid #8b6914;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.2);

  .current {
    font-size: 1rem;
    font-weight: 700;
    color: #d4af37;
    min-width: 1.5rem;
    text-align: center;
  }

  .separator {
    color: #8b6914;
    font-weight: 600;
  }

  .max {
    font-size: 0.9rem;
    color: #8b6914;
    font-weight: 600;
  }

  .controls {
    display: flex;
    flex-direction: column;
    gap: 1px;
    margin-left: 0.25rem;
  }

  .control-btn {
    background: linear-gradient(145deg, #8b6914, #6d5411);
    color: white;
    border: none;
    width: 16px;
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
    }
  }
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

// Two-column layout for Resources/Mana
const TwoColumnLayout = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
  }

  @media (max-width: 480px) {
    gap: 0.25rem;
  }
`;

// Inventory Styles
const InventorySection = styled.div`
  background: linear-gradient(
    145deg,
    rgba(32, 32, 32, 0.95),
    rgba(45, 45, 45, 0.9)
  );
  border: 2px solid #8b6914;
  border-radius: 10px;
  padding: 1rem;
  margin-top: 1rem;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.5);
  position: relative;
  display: flex;
  flex-direction: column;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><filter id="paper"><feTurbulence baseFrequency="0.02" numOctaves="3" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="0.8"/></filter></defs><rect width="100" height="100" fill="rgba(101,67,33,0.05)" filter="url(%23paper)"/></svg>')
      repeat;
    opacity: 0.6;
    pointer-events: none;
    z-index: 1;
  }

  @media (max-width: 768px) {
    margin-top: 0.5rem;
    padding: 0.75rem;
  }

  @media (max-width: 480px) {
    margin-top: 0.25rem;
    padding: 0.5rem;
  }
`;

const InventoryTitle = styled.h3`
  color: #d4af37;
  font-family: 'Cinzel', serif;
  font-size: 1.2rem;
  font-weight: 700;
  text-align: center;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  position: relative;
  z-index: 2;
`;

const InventoryList = styled.div`
  position: relative;
  z-index: 2;
  background: rgba(20, 20, 20, 0.8);
  border: 2px solid #8b6914;
  border-radius: 5px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
`;

const InventoryItem = styled.div`
  color: #f4e7d1;
  font-family: 'Crimson Text', serif;
  font-size: 0.9rem;
  padding: 0.4rem 0;
  border-bottom: 1px solid rgba(139, 105, 20, 0.3);
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 2rem;

  &:last-child {
    border-bottom: none;
  }

  input {
    background: transparent;
    border: none;
    color: #f4e7d1;
    font-family: 'Crimson Text', serif;
    font-size: 0.9rem;
    flex: 1;

    &::placeholder {
      color: rgba(244, 231, 209, 0.5);
    }

    &:focus {
      outline: none;
      background: rgba(139, 105, 20, 0.2);
    }
  }
`;

const InventoryItemContent = styled.div<{ clickable?: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  cursor: ${props => props.clickable ? 'pointer' : 'default'};
  padding: 2px 4px;
  border-radius: 3px;
  transition: background-color 0.2s ease;

  ${props => props.clickable && `
    &:hover {
      background-color: rgba(139, 105, 20, 0.2);
      color: #d4af37;
    }
  `}
`;

const DeleteButton = styled.button`
  background: linear-gradient(145deg, #dc3545, #c82333);
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  opacity: 0.7;
  margin-left: 8px;

  &:hover {
    opacity: 1;
    transform: scale(1.1);
    box-shadow: 0 2px 6px rgba(220, 53, 69, 0.4);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const QuantityContainer = styled.div`
  display: flex;
  align-items: center;
  margin-left: 8px;
  gap: 4px;
`;

const QuantityLabel = styled.span`
  font-size: 0.8rem;
  color: #8b6914;
  font-weight: 600;
`;

const QuantityInput = styled.input`
  background: rgba(139, 105, 20, 0.2);
  border: 1px solid #8b6914;
  border-radius: 3px;
  color: #d4af37;
  font-size: 0.8rem;
  font-weight: 600;
  width: 30px;
  height: 20px;
  text-align: center;
  padding: 0;

  &:focus {
    outline: none;
    border-color: #d4af37;
    background: rgba(212, 175, 55, 0.2);
  }

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &[type=number] {
    -moz-appearance: textfield;
  }
`;

const SaveInventoryButton = styled.button`
  background: linear-gradient(145deg, #4CAF50, #388E3C);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  margin-top: 8px;

  &:hover {
    background: linear-gradient(145deg, #388E3C, #2E7D32);
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(76, 175, 80, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: linear-gradient(145deg, #6c757d, #5a6268);
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const InventoryButtonContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  position: relative;
  z-index: 2;
`;

const InventoryActionButton = styled.button`
  background: linear-gradient(145deg, #8b6914, #6d5411);
  color: #f4e7d1;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  font-family: 'Cinzel', serif;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex: 1;

  &:hover {
    background: linear-gradient(145deg, #6d5411, #5a450e);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(139, 105, 20, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

// Actions Table Styles
const ActionsSection = styled.div`
  border: 2px solid #8b6914;
  border-radius: 6px;
  padding: 0.75rem;
  background: rgba(139, 105, 20, 0.1);
  position: relative;
`;

const ActionsTitle = styled.h3`
  color: #d4af37;
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-align: center;
  border-bottom: 2px solid #d4af37;
  padding-bottom: 0.5rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
`;

const ActionsTable = styled.div`
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 0;
  border: 2px solid #8b6914;
  border-radius: 5px;
  overflow: hidden;
  background: rgba(20, 20, 20, 0.8);

  @media (max-width: 768px) {
    grid-template-columns: 1fr 0.8fr 0.8fr;
    font-size: 0.8rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 1px;
  }
`;

const ActionsTableHeader = styled.div<{ column: number }>`
  background: linear-gradient(145deg, #8b6914, #6d5411);
  color: #f4e7d1;
  padding: 0.5rem;
  font-family: 'Cinzel', serif;
  font-weight: 600;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
  border-right: ${props => props.column < 3 ? '1px solid #6d5411' : 'none'};
`;

const ActionsTableCell = styled.div<{ column: number; editable?: boolean }>`
  padding: 0.4rem;
  border-right: ${props => props.column < 3 ? '1px solid #8b6914' : 'none'};
  border-bottom: 1px solid #8b6914;
  font-family: 'Crimson Text', serif;
  font-size: 0.8rem;
  color: #f4e7d1;
  min-height: 1.5rem;
  display: flex;
  align-items: center;
  background: rgba(30, 30, 30, 0.7);

  ${props => props.column === 1 && `
    font-weight: 600;
    color: #d4af37;
  `}

  ${props => props.column === 2 && `
    text-align: center;
    justify-content: center;
    font-weight: 600;
  `}

  ${props => props.column === 3 && `
    text-align: center;
    justify-content: center;
    font-weight: 600;
  `}

  input {
    background: rgba(20, 20, 20, 0.6);
    border: 1px solid transparent;
    color: inherit;
    font-family: inherit;
    font-size: inherit;
    font-weight: inherit;
    width: 100%;
    padding: 0.2rem;
    border-radius: 3px;

    &:focus {
      outline: none;
      border: 1px solid #d4af37;
      background: rgba(139, 105, 20, 0.3);
      box-shadow: 0 0 5px rgba(212, 175, 55, 0.3);
    }
  }

  textarea {
    background: rgba(20, 20, 20, 0.6);
    border: 1px solid transparent;
    color: inherit;
    font-family: inherit;
    font-size: inherit;
    width: 100%;
    padding: 0.2rem;
    resize: vertical;
    min-height: 1.2rem;
    border-radius: 3px;

    &:focus {
      outline: none;
      border: 1px solid #d4af37;
      background: rgba(139, 105, 20, 0.3);
      box-shadow: 0 0 5px rgba(212, 175, 55, 0.3);
    }
  }
`;

const AddActionButton = styled.button`
  background: linear-gradient(145deg, #d4af37, #b8941f);
  color: #2c1810;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Cinzel', serif;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  margin-top: 0.5rem;

  &:hover {
    background: linear-gradient(145deg, #b8941f, #a0801b);
    transform: translateY(-1px);
    box-shadow: 0 3px 12px rgba(212, 175, 55, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

const RemoveActionButton = styled.button`
  background: linear-gradient(145deg, #dc3545, #c82333);
  color: white;
  border: none;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-size: 0.6rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Cinzel', serif;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  margin-left: 0.25rem;

  &:hover {
    background: linear-gradient(145deg, #c82333, #a71e2a);
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(220, 53, 69, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
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

// Dropdown options
const speciesOptions = [
  'Aasimar', 'Dragonborn', 'Dwarf', 'Elf', 'Gnome', 'Goliath',
  'Halfling', 'Human', 'Orc', 'Tiefling'
];

// Comprehensive species choices structure based on D&D 2024
interface SpeciesChoice {
  category: string;
  options: { name: string; description: string }[];
  multiple?: boolean; // For choices that allow multiple selections
}

interface SpeciesData {
  name: string;
  description: string;
  choices?: SpeciesChoice[];
}

const speciesChoices: { [key: string]: SpeciesData } = {
  'Aasimar': {
    name: 'Aasimar',
    description: 'Born with celestial heritage, Aasimar are blessed with divine powers.',
    choices: [
      {
        category: 'Celestial Revelation',
        options: [
          { name: 'Heavenly Wings', description: 'Sprout spectral wings, granting flight speed equal to walking speed' },
          { name: 'Inner Radiance', description: 'Shed bright light and deal radiant damage to nearby enemies' },
          { name: 'Necrotic Shroud', description: 'Unleash divine energy causing fear and necrotic damage' },
        ]
      }
    ]
  },
  'Dragonborn': {
    name: 'Dragonborn',
    description: 'Descendants of dragons, Dragonborn inherit draconic powers.',
    choices: [
      {
        category: 'Draconic Ancestry',
        options: [
          { name: 'Black Dragon', description: 'Acid damage breath weapon and resistance' },
          { name: 'Blue Dragon', description: 'Lightning damage breath weapon and resistance' },
          { name: 'Brass Dragon', description: 'Fire damage breath weapon and resistance' },
          { name: 'Bronze Dragon', description: 'Lightning damage breath weapon and resistance' },
          { name: 'Copper Dragon', description: 'Acid damage breath weapon and resistance' },
          { name: 'Gold Dragon', description: 'Fire damage breath weapon and resistance' },
          { name: 'Green Dragon', description: 'Poison damage breath weapon and resistance' },
          { name: 'Red Dragon', description: 'Fire damage breath weapon and resistance' },
          { name: 'Silver Dragon', description: 'Cold damage breath weapon and resistance' },
          { name: 'White Dragon', description: 'Cold damage breath weapon and resistance' },
        ]
      }
    ]
  },
  'Elf': {
    name: 'Elf',
    description: 'Graceful and long-lived, elves possess keen senses and magical affinity.',
    choices: [
      {
        category: 'Elven Lineage',
        options: [
          { name: 'Drow', description: 'Dark elf with superior darkvision and innate spellcasting' },
          { name: 'High Elf', description: 'Classically trained elf with bonus cantrip and weapon proficiencies' },
          { name: 'Wood Elf', description: 'Forest dweller with enhanced speed and natural stealth' },
        ]
      },
      {
        category: 'Keen Senses',
        options: [
          { name: 'Insight', description: 'Proficiency in Insight skill' },
          { name: 'Perception', description: 'Proficiency in Perception skill' },
          { name: 'Survival', description: 'Proficiency in Survival skill' },
        ]
      },
      {
        category: 'Spellcasting Ability',
        options: [
          { name: 'Intelligence', description: 'Use Intelligence for your lineage spells' },
          { name: 'Wisdom', description: 'Use Wisdom for your lineage spells' },
          { name: 'Charisma', description: 'Use Charisma for your lineage spells' },
        ]
      }
    ]
  },
  'Gnome': {
    name: 'Gnome',
    description: 'Small and clever, gnomes have a natural affinity for magic and invention.',
    choices: [
      {
        category: 'Gnomish Lineage',
        options: [
          { name: 'Forest Gnome', description: 'Nature-attuned with minor illusion cantrip and speak with small beasts' },
          { name: 'Rock Gnome', description: 'Inventive tinker with artificer\'s lore and clockwork toys' },
        ]
      },
      {
        category: 'Spellcasting Ability',
        options: [
          { name: 'Intelligence', description: 'Use Intelligence for your gnome magic' },
          { name: 'Wisdom', description: 'Use Wisdom for your gnome magic' },
          { name: 'Charisma', description: 'Use Charisma for your gnome magic' },
        ]
      }
    ]
  },
  'Goliath': {
    name: 'Goliath',
    description: 'Mountain-dwelling giants with incredible strength and endurance.',
    choices: [
      {
        category: 'Giant Ancestry',
        options: [
          { name: "Cloud's Jaunt", description: 'Teleport up to 30 feet to an unoccupied space you can see' },
          { name: "Fire's Burn", description: 'Deal extra fire damage with your attacks' },
          { name: "Frost's Chill", description: 'Deal extra cold damage and reduce enemy speed' },
          { name: "Hill's Tumble", description: 'Knock enemies prone when you hit them' },
          { name: "Stone's Endurance", description: 'Reduce damage taken using your reaction' },
          { name: "Storm's Thunder", description: 'Deal extra thunder damage and push enemies' },
        ]
      }
    ]
  },
  'Human': {
    name: 'Human',
    description: 'Versatile and ambitious, humans excel at adapting to any situation.',
    choices: [
      {
        category: 'Skillful',
        options: [
          { name: 'Choose Any Skill', description: 'Select proficiency in any one skill of your choice' },
        ]
      },
      {
        category: 'Versatile',
        options: [
          { name: 'Choose Origin Feat', description: 'Select any feat with the Origin tag' },
        ]
      }
    ]
  },
  'Tiefling': {
    name: 'Tiefling',
    description: 'Bearing infernal heritage, tieflings possess fiendish powers.',
    choices: [
      {
        category: 'Fiendish Legacy',
        options: [
          { name: 'Abyssal', description: 'Chaotic magic and resistance, with random spell effects' },
          { name: 'Chthonic', description: 'Death and necromancy magic from the lower planes' },
          { name: 'Infernal', description: 'Classic devil heritage with fire magic and charm abilities' },
        ]
      },
      {
        category: 'Spellcasting Ability',
        options: [
          { name: 'Intelligence', description: 'Use Intelligence for your legacy spells' },
          { name: 'Wisdom', description: 'Use Wisdom for your legacy spells' },
          { name: 'Charisma', description: 'Use Charisma for your legacy spells' },
        ]
      }
    ]
  },
  // Species without choices
  'Dwarf': {
    name: 'Dwarf',
    description: 'Hardy and resilient, dwarves are master craftsmen with unbreakable determination.',
  },
  'Halfling': {
    name: 'Halfling',
    description: 'Small but brave, halflings are naturally lucky and remarkably nimble.',
  },
  'Orc': {
    name: 'Orc',
    description: 'Strong and relentless, orcs possess primal power and fierce determination.',
  },
};

const classOptions = [
  'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk',
  'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'
];

const backgroundOptions = [
  'Acolyte', 'Artisan', 'Charlatan', 'Criminal', 'Entertainer', 'Folk Hero',
  'Hermit', 'Noble', 'Sage', 'Sailor', 'Soldier', 'Wayfarer',
  'Merchant', 'Guard', 'Scholar', 'Scribe'
];


// Item Modal Styles
const ModalOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 1000;
  display: ${(props) => (props.isOpen ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, #2a2520 0%, #1a1a1a 100%);
  border: 3px solid #8b6914;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  max-width: 600px;
  max-height: 80vh;
  overflow: auto;
  position: relative;
  color: #d4af37;
  font-family: 'Cinzel', serif;
`;

const ModalHeader = styled.div`
  padding: 20px;
  border-bottom: 2px solid #8b6914;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h2`
  margin: 0;
  color: #d4af37;
  font-size: 1.5rem;
`;

const CloseButton = styled.button`
  background: #d4af37;
  color: #2c1810;
  border: none;
  border-radius: 50%;
  width: 35px;
  height: 35px;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #b8941f;
    transform: scale(1.1);
  }
`;

const ModalBody = styled.div`
  padding: 20px;
`;

// Confirmation Modal Styles
const ConfirmationModal = styled.div`
  background: linear-gradient(135deg, #2a2520 0%, #1a1a1a 100%);
  border: 3px solid #dc3545;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
  max-width: 400px;
  padding: 20px;
  color: #f4e7d1;
  font-family: 'Cinzel', serif;
  text-align: center;
`;

const ConfirmationTitle = styled.h3`
  color: #dc3545;
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
`;

const ConfirmationText = styled.p`
  margin: 0 0 1.5rem 0;
  font-size: 1rem;
  line-height: 1.4;
`;

const ConfirmationButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
`;

const ConfirmButton = styled.button`
  background: linear-gradient(145deg, #dc3545, #c82333);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(145deg, #c82333, #a71e2a);
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(220, 53, 69, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

const CancelButton = styled.button`
  background: linear-gradient(145deg, #6c757d, #5a6268);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(145deg, #5a6268, #4e555b);
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(108, 117, 125, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

// Species Selection Popup Styles
const SpeciesPopupModal = styled.div`
  background: linear-gradient(135deg, #2a2520 0%, #1a1a1a 100%);
  border: 3px solid #d4af37;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
  max-width: 800px;
  width: 85%;
  padding: 20px;
  color: #f4e7d1;
  font-family: 'Cinzel', serif;
`;

const SpeciesPopupTitle = styled.h3`
  color: #d4af37;
  margin: 0 0 10px 0;
  font-size: 1.2rem;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const SpeciesDescription = styled.p`
  color: #f4e7d1;
  margin: 8px 0;
  line-height: 1.4;
  text-align: center;
  font-size: 0.85rem;
`;

const SpeciesChoicesContainer = styled.div`
  margin: 12px 0;
`;

const SpeciesChoicesTitle = styled.h4`
  color: #d4af37;
  margin: 0 0 8px 0;
  font-size: 1rem;
  text-align: center;
`;

const SpeciesChoicesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin: 10px 0;
`;

const SpeciesChoice = styled.div<{ selected?: boolean }>`
  background: ${props => props.selected ? 'rgba(212, 175, 55, 0.2)' : 'rgba(42, 37, 32, 0.5)'};
  border: 2px solid ${props => props.selected ? '#d4af37' : 'rgba(139, 105, 20, 0.3)'};
  border-radius: 6px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(212, 175, 55, 0.15);
    border-color: #d4af37;
    transform: translateY(-1px);
  }
`;

const SpeciesChoiceName = styled.div`
  font-weight: 600;
  color: #d4af37;
  margin-bottom: 3px;
  font-size: 0.9rem;
`;

const SpeciesChoiceDescription = styled.div`
  font-size: 0.75rem;
  color: #f4e7d1;
  opacity: 0.9;
  line-height: 1.3;
`;

const SpeciesButtonsContainer = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 15px;
`;

// Class Selection Popup Styles
const ClassPopupModal = styled.div`
  background: linear-gradient(135deg, #2a2520 0%, #1a1a1a 100%);
  border: 3px solid #d4af37;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
  max-width: 800px;
  width: 85%;
  padding: 20px;
  color: #f4e7d1;
  font-family: 'Cinzel', serif;
`;

const ClassPopupTitle = styled.h3`
  color: #d4af37;
  margin: 0 0 15px 0;
  font-size: 1.5rem;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 2px;
`;

const ClassSkillsContainer = styled.div`
  margin: 15px 0;
`;

const ClassSkillsTitle = styled.h4`
  color: #d4af37;
  margin: 0 0 15px 0;
  font-size: 1.1rem;
  text-align: center;
`;

const ClassSkillsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
  margin: 15px 0;
`;

const ClassSkillChoice = styled.div<{ selected: boolean }>`
  background: ${props => props.selected ? 'rgba(212, 175, 55, 0.2)' : 'rgba(139, 105, 20, 0.1)'};
  border: 2px solid ${props => props.selected ? '#d4af37' : 'rgba(139, 105, 20, 0.3)'};
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  font-weight: 600;
  color: ${props => props.selected ? '#d4af37' : '#f4e7d1'};

  &:hover {
    background: rgba(212, 175, 55, 0.15);
    border-color: #d4af37;
    transform: translateY(-1px);
  }
`;

const ClassButtonsContainer = styled.div`
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 25px;
`;

// Traits and Abilities Section Styles
const TraitsSection = styled.section`
  border: 2px solid #8b6914;
  border-radius: 6px;
  padding: 0.75rem;
  background: rgba(139, 105, 20, 0.1);
  position: relative;
  width: 100%;
`;

const TraitsTitle = styled.h2`
  color: #d4af37;
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #8b6914;
  padding-bottom: 0.25rem;
`;

const TraitsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const TraitCard = styled.div`
  background: rgba(139, 105, 20, 0.1);
  border: 1px solid rgba(139, 105, 20, 0.3);
  border-radius: 4px;
  padding: 0.5rem;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(139, 105, 20, 0.15);
    border-color: rgba(139, 105, 20, 0.5);
  }
`;

const TraitName = styled.h3`
  color: #d4af37;
  font-family: 'Cinzel', serif;
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  text-transform: capitalize;
  line-height: 1.2;
`;

const TraitDescription = styled.p`
  color: #f4e7d1;
  font-size: 0.75rem;
  line-height: 1.3;
  margin: 0;
`;

const EmptyTraitsMessage = styled.div`
  text-align: center;
  color: #8b6914;
  font-style: italic;
  padding: 2rem;
  font-size: 1.1rem;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px;
  background: rgba(42, 37, 32, 0.8);
  border: 2px solid #8b6914;
  border-radius: 8px;
  color: #d4af37;
  font-size: 1rem;
  margin-bottom: 1rem;

  &:focus {
    outline: none;
    border-color: #d4af37;
    box-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
  }

  &::placeholder {
    color: #8b6914;
  }
`;

const ItemList = styled.div`
  max-height: 300px;
  overflow-y: auto;
  border: 2px solid #8b6914;
  border-radius: 8px;
  background: rgba(42, 37, 32, 0.5);
`;


const ItemName = styled.div`
  font-weight: 600;
  color: #d4af37;
  margin-bottom: 4px;
`;

const ItemDetails = styled.div`
  font-size: 0.9rem;
  color: #b8941f;
`;

const CustomItemInput = styled.input`
  width: 100%;
  padding: 12px;
  background: rgba(42, 37, 32, 0.8);
  border: 2px solid #8b6914;
  border-radius: 8px;
  color: #d4af37;
  font-size: 1rem;
  margin-bottom: 1rem;

  &:focus {
    outline: none;
    border-color: #d4af37;
    box-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
  }
`;

const AddButton = styled.button`
  background: linear-gradient(145deg, #d4af37, #b8941f);
  color: #2c1810;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Cinzel', serif;
  text-transform: uppercase;
  letter-spacing: 1px;
  width: 100%;

  &:hover {
    background: linear-gradient(145deg, #b8941f, #a0801b);
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ItemOptionContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid #8b6914;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(212, 175, 55, 0.1);
  }

  &:last-child {
    border-bottom: none;
  }
`;

const ItemInfo = styled.div`
  flex: 1;
  cursor: pointer;
`;

const InfoButton = styled.button`
  background: linear-gradient(145deg, #4a90e2, #357abd);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-left: 12px;

  &:hover {
    background: linear-gradient(145deg, #357abd, #2968a3);
    transform: translateY(-1px);
  }
`;

// Item Details Modal Styles
const ItemDetailsModal = styled.div`
  background: linear-gradient(135deg, #2a2520 0%, #1a1a1a 100%);
  border: 3px solid #8b6914;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  max-width: 500px;
  max-height: 80vh;
  overflow: auto;
  position: relative;
  color: #d4af37;
  font-family: 'Cinzel', serif;
`;

const ItemDetailsHeader = styled.div`
  padding: 20px;
  border-bottom: 2px solid #8b6914;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ItemDetailsTitle = styled.h2`
  margin: 0;
  color: #d4af37;
  font-size: 1.5rem;
`;

const ItemDetailsBody = styled.div`
  padding: 20px;
`;

const ItemProperty = styled.div`
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PropertyLabel = styled.span`
  font-weight: 600;
  color: #b8941f;
  min-width: 100px;
`;

const PropertyValue = styled.span`
  color: #d4af37;
  flex: 1;
  text-align: right;
`;

const ItemDescription = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #8b6914;
  color: #b8941f;
  line-height: 1.5;
`;

const AddItemButton = styled.button<{ inInventory?: boolean }>`
  background: ${props => props.inInventory
    ? 'linear-gradient(145deg, #6c757d, #5a6268)'
    : 'linear-gradient(145deg, #d4af37, #b8941f)'};
  color: ${props => props.inInventory ? '#e9ecef' : '#2c1810'};
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: ${props => props.inInventory ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  font-family: 'Cinzel', serif;
  text-transform: uppercase;
  letter-spacing: 1px;
  width: 100%;
  margin-top: 20px;
  opacity: ${props => props.inInventory ? 0.7 : 1};

  &:hover {
    ${props => !props.inInventory && `
      background: linear-gradient(145deg, #b8941f, #a0801b);
      transform: translateY(-2px);
    `}
  }
`;

// Helper function to migrate old string inventory to new object format
const migrateInventory = (inventory: any): Array<{name: string, quantity: number}> => {
  if (!Array.isArray(inventory)) return [];

  return inventory.map(item => {
    if (typeof item === 'string') {
      // Old format: convert string to object
      return { name: item, quantity: 1 };
    } else if (typeof item === 'object' && item && 'name' in item) {
      // New format: ensure it has quantity
      return {
        name: item.name || '',
        quantity: typeof item.quantity === 'number' ? item.quantity : 1
      };
    } else {
      // Invalid format: create empty entry
      return { name: '', quantity: 1 };
    }
  });
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
    mana: boolean;
    characterInfo: boolean;
    actions: boolean;
    inventory: boolean;
  }>({
    abilities: false,
    stats: false,
    skills: false,
    spells: false,
    mana: false,
    characterInfo: false,
    actions: false,
    inventory: false,
  });

  // Store original values for cancel functionality
  const [originalValues, setOriginalValues] = useState<{
    [K in keyof typeof editingSections]?: Partial<CharacterSheetData>;
  }>({});

  // Item modal state
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemModalType, setItemModalType] = useState<'official' | 'custom'>('official');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Item[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Item details modal state
  const [showItemDetails, setShowItemDetails] = useState(false);
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<Item | null>(null);

  // Delete confirmation modal state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{index: number, itemName: string} | null>(null);

  // Inventory management state
  const [pendingInventoryChanges, setPendingInventoryChanges] = useState(false);
  const [localInventory, setLocalInventory] = useState(() => migrateInventory(character.inventory));

  // Species selection popup state
  const [showSpeciesPopup, setShowSpeciesPopup] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [selectedSpeciesChoices, setSelectedSpeciesChoices] = useState<{ [category: string]: string }>({});

  // Class selection popup state
  const [showClassPopup, setShowClassPopup] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedClassSkills, setSelectedClassSkills] = useState<string[]>([]);
  const [classChoicesStep, setClassChoicesStep] = useState(1); // 1: skills, 2: additional choices
  const [selectedClassChoices, setSelectedClassChoices] = useState<{ [category: string]: string[] }>({});
  const [currentClassData, setCurrentClassData] = useState<any>(null);

  // Sync local inventory when character changes
  useEffect(() => {
    const migratedInventory = migrateInventory(character.inventory);
    setLocalInventory(migratedInventory);
    setPendingInventoryChanges(false);
  }, [character.inventory]);

  // Get dynamic resources based on character
  const characterResources = useMemo(() => getCharacterResources(character), [
    character.class,
    character.subclass,
    character.species,
    character.level,
    character.abilityScores,
    character.feats,
    character.resources,
    character.wounds,
  ]);

  const toggleSectionEdit = (section: keyof typeof editingSections) => {
    const isCurrentlyEditing = editingSections[section];

    if (isCurrentlyEditing) {
      // Exiting edit mode - auto-save
      if (onSave) {
        onSave(character);
      }
      // Clear stored original values for this section
      setOriginalValues(prev => ({
        ...prev,
        [section]: undefined
      }));
    } else {
      // Entering edit mode - store original values
      const originalData = getOriginalDataForSection(section);
      setOriginalValues(prev => ({
        ...prev,
        [section]: originalData
      }));
    }

    setEditingSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const cancelSectionEdit = (section: keyof typeof editingSections) => {
    // Revert to original values
    const originalData = originalValues[section];
    if (originalData) {
      onUpdate({ ...character, ...originalData });
    }

    // Clear stored original values
    setOriginalValues(prev => ({
      ...prev,
      [section]: undefined
    }));

    // Exit edit mode
    setEditingSections(prev => ({
      ...prev,
      [section]: false
    }));
  };

  const getOriginalDataForSection = (section: keyof typeof editingSections): Partial<CharacterSheetData> => {
    switch (section) {
      case 'characterInfo':
        return {
          name: character.name,
          species: character.species,
          class: character.class,
          background: character.background,
          level: character.level,
        };
      case 'abilities':
        return {
          abilityScores: { ...character.abilityScores }
        };
      case 'stats':
        return {
          hitPoints: { ...character.hitPoints },
          armorClass: character.armorClass,
          initiative: character.initiative,
        };
      case 'mana':
        return {
          mana: { ...character.mana }
        };
      case 'actions':
        return {
          actions: [...character.actions]
        };
      case 'skills':
        return {
          skills: { ...character.skills }
        };
      case 'inventory':
        return {
          inventory: [...character.inventory]
        };
      default:
        return {};
    }
  };

  const adjustStat = (stat: 'currentHP' | 'maxHP' | 'armorClass', direction: 'up' | 'down') => {
    let updatedCharacter;

    if (stat === 'currentHP') {
      const currentValue = character.hitPoints.current;
      const newValue = direction === 'up' ? currentValue + 1 : Math.max(0, currentValue - 1);
      updatedCharacter = {
        ...character,
        hitPoints: {
          ...character.hitPoints,
          current: newValue
        }
      };
      onUpdate(updatedCharacter);
    } else if (stat === 'maxHP') {
      const currentValue = character.hitPoints.max;
      const newValue = direction === 'up' ? currentValue + 1 : Math.max(1, currentValue - 1);
      updatedCharacter = {
        ...character,
        hitPoints: {
          ...character.hitPoints,
          max: newValue
        }
      };
      onUpdate(updatedCharacter);
    } else if (stat === 'armorClass') {
      const currentValue = character.armorClass;
      const newValue = direction === 'up' ? Math.min(30, currentValue + 1) : Math.max(1, currentValue - 1);
      updatedCharacter = {
        ...character,
        armorClass: newValue
      };
      onUpdate(updatedCharacter);
    }

    // Silent auto-save the changes (no notification)
    if (onSave && updatedCharacter) {
      // Use a short delay to ensure the state update has been applied
      setTimeout(() => {
        // Pass a flag to indicate this should be a silent save
        onSave(updatedCharacter, { silent: true });
      }, 100);
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

  // Check if character needs mana tracking
  const needsManaTracking = useMemo(() => {
    const spellcastingClasses = ['bard', 'cleric', 'druid', 'paladin', 'ranger', 'sorcerer', 'warlock', 'wizard'];
    const className = character.class.toLowerCase().replace(/\s+/g, '');
    return spellcastingClasses.includes(className);
  }, [character.class]);

  // Item handling functions
  const handleAddOfficialItem = useCallback(() => {
    setItemModalType('official');
    setShowItemModal(true);
    setSearchTerm('');
    setSearchResults([]);
  }, []);

  const handleAddCustomItem = useCallback(() => {
    setItemModalType('custom');
    setShowItemModal(true);
  }, []);

  const handleItemSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await itemService.search(term, 20);
      if (response.data) {
        setSearchResults(response.data.items || []);
      }
    } catch (error) {
      console.error('Error searching items:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleItemSelect = useCallback((item: Item) => {
    // Add item to inventory with quantity support
    const migratedInventory = migrateInventory(character.inventory);
    const updatedInventory = [...migratedInventory];

    // Check if item already exists, increment quantity
    const existingIndex = updatedInventory.findIndex(invItem =>
      invItem.name && invItem.name.toLowerCase() === item.name.toLowerCase()
    );

    if (existingIndex !== -1) {
      updatedInventory[existingIndex] = {
        ...updatedInventory[existingIndex],
        quantity: updatedInventory[existingIndex].quantity + 1
      };
    } else {
      // Find empty slot or add new item
      const emptyIndex = updatedInventory.findIndex(slot => !slot.name || slot.name.trim() === '');

      if (emptyIndex !== -1) {
        updatedInventory[emptyIndex] = { name: item.name, quantity: 1 };
      } else if (updatedInventory.length < 20) { // Allow up to 20 items
        updatedInventory.push({ name: item.name, quantity: 1 });
      } else {
        alert('Inventory is full! Remove items to make space.');
        return;
      }
    }

    let updatedCharacter = {
      ...character,
      inventory: updatedInventory,
    };

    // Auto-populate weapon attacks
    if (isWeapon(item)) {
      const atkBonus = getWeaponAttackBonus(item);
      const damage = getWeaponDamageString(item);

      // Find an empty weapon slot
      const updatedWeapons = [...character.weapons];
      const emptyWeaponIndex = updatedWeapons.findIndex(w => !w.name || w.name.trim() === '');

      if (emptyWeaponIndex !== -1) {
        updatedWeapons[emptyWeaponIndex] = {
          name: item.name,
          atkBonus,
          damage,
          notes: '',
        };
        updatedCharacter.weapons = updatedWeapons;
      }

      // Also add to actions
      const updatedActions = [...character.actions];
      const emptyActionIndex = updatedActions.findIndex(a => !a.name || a.name.trim() === '');

      if (emptyActionIndex !== -1) {
        updatedActions[emptyActionIndex] = {
          name: item.name,
          atkBonus,
          damage,
        };
        updatedCharacter.actions = updatedActions;
      }
    }

    // Auto-calculate armor AC
    const dexMod = calculateModifier(character.abilityScores.dexterity);

    // Check shields first (shields take priority over armor detection)
    if (isShield(item)) {
      // This is a shield - check if we already have one
      const hasExistingShield = character.inventory.some(item =>
        item && item.name && item.name.toLowerCase().includes('shield')
      );

      if (!hasExistingShield) {
        // Add shield bonus (+2) to current AC
        updatedCharacter.armorClass = character.armorClass + 2;
      } else {
        // Already have a shield, don't add this one to inventory
        alert('You can only equip one shield at a time!');
        return;
      }
    } else if (isArmor(item)) {
      // This is armor (not a shield) - recalculate AC with new armor
      const willHaveShield = updatedInventory.some(item =>
        item && item.name && item.name.toLowerCase().includes('shield')
      );
      const newAC = calculateArmorClass(dexMod, item, willHaveShield);
      updatedCharacter.armorClass = newAC;
    }

    onUpdate(updatedCharacter);
    setShowItemModal(false);
  }, [character, onUpdate]);

  const handleShowItemDetails = useCallback((item: Item) => {
    setSelectedItemForDetails(item);
    setShowItemDetails(true);
  }, []);

  const handleCustomItemAdd = useCallback((customItemName: string) => {
    if (!customItemName.trim()) return;

    const itemName = customItemName.trim();
    const migratedInventory = migrateInventory(character.inventory);

    // Check if it's a shield and we already have one
    if (itemName.toLowerCase().includes('shield')) {
      const hasExistingShield = migratedInventory.some(item =>
        item.name && item.name.toLowerCase().includes('shield')
      );

      if (hasExistingShield) {
        alert('You can only equip one shield at a time!');
        return;
      }
    }

    const updatedInventory = [...migratedInventory];

    // Check if item already exists, increment quantity
    const existingIndex = updatedInventory.findIndex(invItem =>
      invItem.name && invItem.name.toLowerCase() === itemName.toLowerCase()
    );

    if (existingIndex !== -1) {
      updatedInventory[existingIndex] = {
        ...updatedInventory[existingIndex],
        quantity: updatedInventory[existingIndex].quantity + 1
      };
    } else {
      // Find empty slot or add new item
      const emptyIndex = updatedInventory.findIndex(slot => !slot.name || slot.name.trim() === '');

      if (emptyIndex !== -1) {
        updatedInventory[emptyIndex] = { name: itemName, quantity: 1 };
      } else if (updatedInventory.length < 20) {
        updatedInventory.push({ name: itemName, quantity: 1 });
      } else {
        alert('Inventory is full! Remove items to make space.');
        return;
      }
    }

    let updatedCharacter = {
      ...character,
      inventory: updatedInventory,
    };

    // If it's a shield, add AC bonus
    if (itemName.toLowerCase().includes('shield')) {
      updatedCharacter.armorClass = character.armorClass + 2;
    }

    onUpdate(updatedCharacter);
    setShowItemModal(false);
  }, [character, onUpdate]);

  // Helper function to recalculate AC based on current inventory
  const recalculateArmorClass = useCallback((updatedCharacter: CharacterSheetData) => {
    const dexMod = calculateModifier(updatedCharacter.abilityScores.dexterity);
    const migratedInventory = migrateInventory(updatedCharacter.inventory);
    const hasShieldInInventory = migratedInventory.some(item =>
      item.name && item.name.toLowerCase().includes('shield')
    );

    // For now, start with base AC 10 + Dex mod and add shield if present
    // In the future, we could enhance this to detect armor items in inventory too
    let newAC = 10 + dexMod;

    if (hasShieldInInventory) {
      newAC += 2;
    }

    return {
      ...updatedCharacter,
      armorClass: newAC,
    };
  }, []);

  // Item deletion functions
  const handleDeleteItemClick = useCallback((index: number) => {
    const inventoryItem = localInventory[index];
    if (inventoryItem && inventoryItem.name && inventoryItem.name.trim()) {
      setItemToDelete({ index, itemName: inventoryItem.name });
      setShowDeleteConfirmation(true);
    }
  }, [localInventory]);

  const handleConfirmDelete = useCallback(() => {
    if (!itemToDelete) return;

    const { index, itemName } = itemToDelete;

    // Remove item from local inventory
    const updatedLocalInventory = [...localInventory];
    updatedLocalInventory[index] = { name: '', quantity: 1 };
    setLocalInventory(updatedLocalInventory);

    // Create character with updated inventory for AC calculation
    const cleanedInventory = updatedLocalInventory.filter(item => item.name && item.name.trim());
    let updatedCharacter = {
      ...character,
      inventory: cleanedInventory,
    };

    // Check if the deleted item was a shield or armor and recalculate AC
    if (itemName && (itemName.toLowerCase().includes('shield') || itemName.toLowerCase().includes('armor'))) {
      updatedCharacter = recalculateArmorClass(updatedCharacter);
    }

    // Remove any weapon entries that match this item name from both weapons and actions
    const updatedWeapons = character.weapons.map(weapon =>
      weapon.name === itemName ? { name: '', atkBonus: '', damage: '', notes: '' } : weapon
    );
    updatedCharacter.weapons = updatedWeapons;

    // Also remove from actions array
    const updatedActions = character.actions.map(action =>
      action.name === itemName ? { name: '', atkBonus: '', damage: '' } : action
    );
    updatedCharacter.actions = updatedActions;

    // Update character immediately
    onUpdate(updatedCharacter);

    // Close modal and reset state
    setShowDeleteConfirmation(false);
    setItemToDelete(null);
  }, [itemToDelete, localInventory, character, onUpdate, recalculateArmorClass]);

  const handleCancelDelete = useCallback(() => {
    setShowDeleteConfirmation(false);
    setItemToDelete(null);
  }, []);

  // Function to look up item details by name and show details modal
  const handleInventoryItemClick = useCallback(async (itemName: string) => {
    if (!itemName || !itemName.trim()) return;

    try {
      // Search for the item by exact name first
      const response = await itemService.search(itemName, 10);
      if (response.data && response.data.items) {
        // Try to find exact match first
        let foundItem = response.data.items.find(item =>
          item.name.toLowerCase() === itemName.toLowerCase()
        );

        // If no exact match, try partial match
        if (!foundItem) {
          foundItem = response.data.items.find(item =>
            item.name.toLowerCase().includes(itemName.toLowerCase()) ||
            itemName.toLowerCase().includes(item.name.toLowerCase())
          );
        }

        // If still no match, just take the first result
        if (!foundItem && response.data.items.length > 0) {
          foundItem = response.data.items[0];
        }

        if (foundItem) {
          setSelectedItemForDetails(foundItem);
          setShowItemDetails(true);
        }
      }
    } catch (error) {
      console.error('Error looking up item details:', error);
      // Could show a toast notification here in the future
    }
  }, []);

  // Helper function to check if item is already in inventory
  const isItemInInventory = useCallback((itemName: string) => {
    const migratedInventory = migrateInventory(character.inventory);
    return migratedInventory.some(inventoryItem =>
      inventoryItem.name && inventoryItem.name.toLowerCase() === itemName.toLowerCase()
    );
  }, [character.inventory]);

  // Inventory quantity management functions
  const handleQuantityChange = useCallback((index: number, newQuantity: number) => {
    // Allow 0 temporarily during editing, but not negative
    if (newQuantity < 0) return;

    const updatedInventory = [...localInventory];
    if (updatedInventory[index]) {
      updatedInventory[index] = { ...updatedInventory[index], quantity: newQuantity };
      setLocalInventory(updatedInventory);
      setPendingInventoryChanges(true);
    }
  }, [localInventory]);

  const handleSaveInventory = useCallback(async () => {
    // Filter out empty items and update character
    const cleanedInventory = localInventory.filter(item => item.name && item.name.trim());
    const updatedCharacter = { ...character, inventory: cleanedInventory };

    // Recalculate AC based on new inventory
    const updatedWithAC = recalculateArmorClass(updatedCharacter);

    onUpdate(updatedWithAC);
    setPendingInventoryChanges(false);

    // Save to database
    if (onSave) {
      await onSave(updatedWithAC, { silent: true });
    }
  }, [localInventory, character, onUpdate, recalculateArmorClass, onSave]);

  const handleResourceUpdate = (resourceId: string, newValue: number) => {
    let updatedCharacter;

    // Handle wounds specially since it's stored directly on character
    if (resourceId === 'core-wounds') {
      updatedCharacter = { ...character, wounds: newValue };
      updateCharacter({ wounds: newValue });
    } else {
      // Update the resources object for other resources
      const newResources = {
        ...character.resources,
        [resourceId]: Math.max(0, newValue),
      };
      updatedCharacter = { ...character, resources: newResources };
      updateCharacter({
        resources: newResources,
      });
    }

    // Silent auto-save the changes (no notification)
    if (onSave) {
      // Use a short delay to ensure the state update has been applied
      setTimeout(() => {
        // Pass a flag to indicate this should be a silent save
        onSave(updatedCharacter, { silent: true });
      }, 100);
    }
  };

  const handleManaUpdate = (type: 'current' | 'max', delta: number) => {
    const newValue = Math.max(0, character.mana[type] + delta);
    const newMana = {
      ...character.mana,
      [type]: newValue,
    };
    const updatedCharacter = { ...character, mana: newMana };

    updateCharacter({
      mana: newMana,
    });

    // Silent auto-save the changes (no notification)
    if (onSave) {
      // Use a short delay to ensure the state update has been applied
      setTimeout(() => {
        // Pass a flag to indicate this should be a silent save
        onSave(updatedCharacter, { silent: true });
      }, 100);
    }
  };

  // Action handlers
  const handleActionUpdate = (
    index: number,
    field: 'name' | 'atkBonus' | 'damage',
    value: string
  ) => {
    const updatedActions = [...character.actions];
    updatedActions[index] = {
      ...updatedActions[index],
      [field]: value,
    };
    updateCharacter({ actions: updatedActions });
  };

  const handleAddAction = () => {
    const newAction = { name: '', atkBonus: '', damage: '' };
    updateCharacter({ actions: [...character.actions, newAction] });
  };

  const handleRemoveAction = (index: number) => {
    const updatedActions = character.actions.filter((_, i) => i !== index);
    updateCharacter({ actions: updatedActions });
  };

  // Species selection handlers
  const handleSpeciesSelect = (species: string) => {
    setSelectedSpecies(species);
    setSelectedSpeciesChoices({});
    setShowSpeciesPopup(true);
  };

  const handleSpeciesChoiceSelect = (category: string, choice: string) => {
    setSelectedSpeciesChoices(prev => ({
      ...prev,
      [category]: choice
    }));
  };

  const handleSpeciesConfirm = async () => {
    // Get the species data from the predefined choices
    const speciesChoiceData = speciesChoices[selectedSpecies];

    if (!speciesChoiceData) return;

    // Build the final species name and traits
    let finalSpeciesName = selectedSpecies;
    let traits: string[] = [speciesChoiceData.description];

    // If this species has choices, validate that all required choices are made
    if (speciesChoiceData.choices && speciesChoiceData.choices.length > 0) {
      const allChoicesMade = speciesChoiceData.choices.every(choice =>
        selectedSpeciesChoices[choice.category]
      );

      if (!allChoicesMade) {
        // Don't confirm if not all choices are made
        return;
      }

      // Build traits from all selected choices
      speciesChoiceData.choices.forEach(choiceCategory => {
        const selectedOption = selectedSpeciesChoices[choiceCategory.category];
        if (selectedOption) {
          const optionData = choiceCategory.options.find(opt => opt.name === selectedOption);
          if (optionData) {
            traits.push(`${choiceCategory.category}: ${optionData.name} - ${optionData.description}`);
          }
        }
      });
    }

    // Apply skill proficiencies from species choices
    const updatedSkills = { ...character.skills };

    // Apply skill proficiencies from selected species choices
    if (speciesChoiceData.choices && speciesChoiceData.choices.length > 0) {
      speciesChoiceData.choices.forEach(choiceCategory => {
        const selectedOption = selectedSpeciesChoices[choiceCategory.category];
        if (selectedOption && choiceCategory.category === 'Keen Senses') {
          // Apply the skill proficiency
          const skillName = selectedOption;
          if (updatedSkills[skillName]) {
            updatedSkills[skillName] = {
              ...updatedSkills[skillName],
              proficient: true
            };
          }
        }
      });
    }

    // Fetch actual species data from database to get all traits and skill proficiencies
    try {
      const response = await speciesService.getByName(selectedSpecies);
      if (response.data) {
        // Add database traits
        if (response.data.traits) {
          // Parse traits from database (they're stored as JSONB)
          const databaseTraits = Array.isArray(response.data.traits)
            ? response.data.traits
            : Object.values(response.data.traits || {});

          // Add database traits to our traits array
          databaseTraits.forEach((trait: any) => {
            if (typeof trait === 'string') {
              traits.push(trait);
            } else if (trait && typeof trait === 'object') {
              // Handle structured trait objects
              if (trait.name && trait.description) {
                traits.push(`${trait.name}: ${trait.description}`);
              } else if (trait.name) {
                traits.push(trait.name);
              }
            }
          });
        }

        // Add basic species information
        if (response.data.size && response.data.size.length > 0) {
          traits.push(`Size: ${response.data.size.join(', ')}`);
        }

        if (response.data.speed) {
          const speedText = typeof response.data.speed === 'object'
            ? `Speed: ${response.data.speed.walk || 30} feet`
            : `Speed: ${response.data.speed} feet`;
          traits.push(speedText);
        }

        if (response.data.languages && response.data.languages.length > 0) {
          traits.push(`Languages: ${response.data.languages.join(', ')}`);
        }

        // Apply skill proficiencies from database species data
        if (response.data.skillProficiencies) {
          let dbSkillProfs = response.data.skillProficiencies;

          // Handle different formats of skill proficiencies
          if (Array.isArray(dbSkillProfs)) {
            dbSkillProfs.forEach((skill: string) => {
              if (updatedSkills[skill]) {
                updatedSkills[skill] = {
                  ...updatedSkills[skill],
                  proficient: true
                };
              }
            });
          } else if (typeof dbSkillProfs === 'object') {
            Object.keys(dbSkillProfs).forEach(skill => {
              if (updatedSkills[skill]) {
                updatedSkills[skill] = {
                  ...updatedSkills[skill],
                  proficient: true
                };
              }
            });
          }
        }
      }
    } catch (error) {
      console.warn('Could not fetch species data from database:', error);
      // Continue with just the predefined traits and choices
    }

    // Update character with new species, traits, and skill proficiencies
    const updatedCharacter = {
      ...character,
      species: finalSpeciesName,
      speciesTraits: traits,
      skills: updatedSkills
    };

    updateCharacter({
      species: finalSpeciesName,
      speciesTraits: traits,
      skills: updatedSkills
    });

    // Auto-save the changes
    if (onSave) {
      setTimeout(() => {
        onSave(updatedCharacter, { silent: true });
      }, 300);
    }

    setShowSpeciesPopup(false);
    setSelectedSpecies('');
    setSelectedSpeciesChoices({});
  };

  const handleSpeciesCancel = () => {
    setShowSpeciesPopup(false);
    setSelectedSpecies('');
    setSelectedSpeciesChoices({});
  };

  // Class selection handlers
  // Helper function to parse class level 1 choices from features
  const parseClassChoices = (classFeatures: any[]) => {
    const choices: { [category: string]: { options: string[], count: number } } = {};

    classFeatures.forEach(feature => {
      // Check for Eldritch Invocations (Warlock)
      if (feature.name === 'Eldritch Invocations') {
        const invocationOptions = feature.entries?.find((entry: any) => entry.type === 'options');
        if (invocationOptions) {
          choices['Eldritch Invocations'] = {
            options: invocationOptions.entries.map((entry: any) =>
              entry.optionalfeature?.split('|')[0] || 'Unknown Option'
            ),
            count: invocationOptions.count || 1
          };
        }
      }

      // Check for Fighting Style (Fighter, Paladin, Ranger)
      if (feature.name === 'Fighting Style') {
        // This would need a feats API call, for now we'll add common ones
        choices['Fighting Style'] = {
          options: [
            'Archery', 'Defense', 'Dueling', 'Great Weapon Fighting',
            'Protection', 'Two-Weapon Fighting', 'Blessed Warrior',
            'Blind Fighting', 'Druidcraft', 'Interception', 'Superior Technique', 'Thrown Weapon Fighting'
          ],
          count: 1
        };
      }

      // Check for Weapon Mastery choices
      if (feature.name === 'Weapon Mastery' && feature.entries) {
        const entry = feature.entries[0];
        if (typeof entry === 'string' && entry.includes('three kinds')) {
          choices['Weapon Mastery'] = {
            options: [
              'Club', 'Dagger', 'Dart', 'Handaxe', 'Javelin', 'Light Hammer', 'Mace', 'Quarterstaff', 'Sickle', 'Spear',
              'Battleaxe', 'Flail', 'Glaive', 'Greataxe', 'Greatsword', 'Halberd', 'Lance', 'Longsword', 'Maul', 'Morningstar',
              'Pike', 'Rapier', 'Scimitar', 'Shortsword', 'Trident', 'War Pick', 'Warhammer', 'Whip'
            ],
            count: 3
          };
        }
      }

      // Check for Pact Magic spell choices (Warlock cantrips/spells)
      if (feature.name === 'Pact Magic') {
        const cantripEntry = feature.entries?.find((entry: any) =>
          entry.entries?.some((subEntry: any) => subEntry.name === 'Cantrips')
        );
        if (cantripEntry) {
          choices['Warlock Cantrips'] = {
            options: [
              'Blade Ward', 'Chill Touch', 'Eldritch Blast', 'Mage Hand', 'Minor Illusion',
              'Poison Spray', 'Prestidigitation', 'Thaumaturgy', 'True Strike'
            ],
            count: 2
          };
        }

        const spellEntry = feature.entries?.find((entry: any) =>
          entry.entries?.some((subEntry: any) => subEntry.name === 'Prepared Spells of Level 1+')
        );
        if (spellEntry) {
          choices['Warlock Spells'] = {
            options: [
              'Armor of Agathys', 'Arms of Hadar', 'Charm Person', 'Comprehend Languages',
              'Expeditious Retreat', 'Hex', 'Protection from Evil and Good', 'Witch Bolt'
            ],
            count: 2
          };
        }
      }
    });

    return choices;
  };

  const handleClassSelect = async (className: string) => {
    setSelectedClass(className);
    setSelectedClassSkills([]);
    setSelectedClassChoices({});
    setClassChoicesStep(1);
    setCurrentClassData(null);

    // Fetch class data from API
    try {
      const response = await classService.getByName(className);
      if (response.data) {
        setCurrentClassData(response.data);
      }
    } catch (error) {
      console.error('Error fetching class data:', error);
    }

    setShowClassPopup(true);
  };

  const handleClassSkillToggle = (skill: string) => {
    setSelectedClassSkills(prev => {
      if (prev.includes(skill)) {
        return prev.filter(s => s !== skill);
      } else {
        const maxSkills = CLASS_SKILL_CHOICES[selectedClass as keyof typeof CLASS_SKILL_CHOICES] || 2;
        if (prev.length < maxSkills) {
          return [...prev, skill];
        }
        return prev;
      }
    });
  };

  const handleClassChoiceToggle = (category: string, choice: string, maxCount: number) => {
    setSelectedClassChoices(prev => {
      const categoryChoices = prev[category] || [];
      const updated = { ...prev };

      if (categoryChoices.includes(choice)) {
        // Remove the choice
        updated[category] = categoryChoices.filter(c => c !== choice);
      } else {
        // Add the choice if we haven't reached the max count
        if (categoryChoices.length < maxCount) {
          updated[category] = [...categoryChoices, choice];
        }
      }

      return updated;
    });
  };

  const handleClassNextStep = () => {
    setClassChoicesStep(2);
  };

  const handleClassPrevStep = () => {
    setClassChoicesStep(1);
  };

  const handleClassConfirm = async () => {
    if (!selectedClass) return;

    const requiredSkillCount = CLASS_SKILL_CHOICES[selectedClass as keyof typeof CLASS_SKILL_CHOICES] || 2;
    if (selectedClassSkills.length !== requiredSkillCount) {
      return; // Not enough skills selected
    }

    // Apply skill proficiencies from class selection
    const updatedSkills = { ...character.skills };

    // Add class skill proficiencies
    selectedClassSkills.forEach(skill => {
      if (updatedSkills[skill]) {
        updatedSkills[skill] = {
          ...updatedSkills[skill],
          proficient: true
        };
      }
    });

    // Fetch class data from database for additional features
    try {
      const response = await classService.getByName(selectedClass);
      if (response.data) {
        const classData = response.data;

        // Apply saving throw proficiencies
        const updatedSavingThrows = { ...character.savingThrows };
        classData.savingThrowProficiencies.forEach(save => {
          const saveKey = save.toLowerCase();
          if (updatedSavingThrows[saveKey]) {
            updatedSavingThrows[saveKey] = {
              ...updatedSavingThrows[saveKey],
              proficient: true
            };
          }
        });

        // Add level 1 class features to Features and Traits
        const level1Features = classData.classFeatures['1'] || [];
        const classFeatures = level1Features.map((feature: any) => feature.name);

        // Add selected class choices as traits (for choices like Eldritch Invocations, Fighting Style, etc.)
        const additionalChoiceTraits: string[] = [];
        Object.entries(selectedClassChoices).forEach(([category, choices]) => {
          choices.forEach(choice => {
            additionalChoiceTraits.push(`${category}: ${choice}`);
          });
        });

        const updatedClassFeatures = [...character.classFeatures, ...classFeatures, ...additionalChoiceTraits];

        // Update character with class data
        const updatedCharacter = {
          ...character,
          class: selectedClass,
          skills: updatedSkills,
          savingThrows: updatedSavingThrows,
          classFeatures: updatedClassFeatures
        };

        updateCharacter({
          class: selectedClass,
          skills: updatedSkills,
          savingThrows: updatedSavingThrows,
          classFeatures: updatedClassFeatures
        });

        // Auto-save changes
        if (onSave) {
          setTimeout(() => {
            onSave(updatedCharacter, { silent: true });
          }, 300);
        }

        // Close popup and reset state
        setShowClassPopup(false);
        setSelectedClass('');
        setSelectedClassSkills([]);
      }
    } catch (error) {
      console.warn('Could not fetch class data from database:', error);

      // Still update with basic class selection
      const updatedCharacter = {
        ...character,
        class: selectedClass,
        skills: updatedSkills
      };

      updateCharacter({
        class: selectedClass,
        skills: updatedSkills
      });

      if (onSave) {
        setTimeout(() => {
          onSave(updatedCharacter, { silent: true });
        }, 300);
      }
    }

    setShowClassPopup(false);
    setSelectedClass('');
    setSelectedClassSkills([]);
  };

  const handleClassCancel = () => {
    setShowClassPopup(false);
    setSelectedClass('');
    setSelectedClassSkills([]);
  };

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
                {editingSections.characterInfo ? (
                  <select
                    value={character.species}
                    onChange={(e) => handleSpeciesSelect(e.target.value)}
                  >
                    <option value="">Select Species</option>
                    {speciesOptions.map((species) => (
                      <option key={species} value={species}>
                        {species}
                      </option>
                    ))}
                  </select>
                ) : (
                  character.species || 'Select Species'
                )}
              </div>
            </InfoBox>
            <InfoBox>
              <div className="label">Class</div>
              <div className="value">
                {editingSections.characterInfo ? (
                  <select
                    value={character.class}
                    onChange={(e) => {
                      if (e.target.value) {
                        handleClassSelect(e.target.value);
                      } else {
                        updateCharacter({ class: '' });
                      }
                    }}
                  >
                    <option value="">Select Class</option>
                    {classOptions.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                ) : (
                  character.class || 'Select Class'
                )}
              </div>
            </InfoBox>
            <InfoBox>
              <div className="label">Background</div>
              <div className="value">
                {editingSections.characterInfo ? (
                  <select
                    value={character.background}
                    onChange={(e) => updateCharacter({ background: e.target.value })}
                  >
                    <option value="">Select Background</option>
                    {backgroundOptions.map((background) => (
                      <option key={background} value={background}>
                        {background}
                      </option>
                    ))}
                  </select>
                ) : (
                  character.background || 'Select Background'
                )}
              </div>
            </InfoBox>
            <InfoBox>
              <div className="label">Level</div>
              <div className="value">
                <EditableInput
                  type="number"
                  value={character.level}
                  onChange={(e) => {
                    const newLevel = parseInt(e.target.value) || 1;
                    const updatedCharacter = { ...character, level: newLevel };
                    updateCharacter({ level: newLevel });

                    // Auto-save level changes
                    if (onSave) {
                      setTimeout(() => {
                        onSave(updatedCharacter, { silent: true });
                      }, 300);
                    }
                  }}
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

          <SectionEditControls>
            {editingSections.characterInfo ? (
              <>
                <SectionEditButton
                  variant="save"
                  onClick={() => toggleSectionEdit('characterInfo')}
                >
                  ✓
                </SectionEditButton>
                <SectionEditButton
                  onClick={() => cancelSectionEdit('characterInfo')}
                  style={{ background: 'linear-gradient(145deg, #dc3545, #c82333)' }}
                >
                  ✕
                </SectionEditButton>
              </>
            ) : (
              <SectionEditButton
                onClick={() => toggleSectionEdit('characterInfo')}
              >
                ✎
              </SectionEditButton>
            )}
          </SectionEditControls>
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
                    <>
                      <SectionEditButton
                        variant="save"
                        onClick={() => toggleSectionEdit('abilities')}
                      >
                        ✓
                      </SectionEditButton>
                      <SectionEditButton
                        onClick={() => cancelSectionEdit('abilities')}
                        style={{ background: 'linear-gradient(145deg, #dc3545, #c82333)' }}
                      >
                        ✕
                      </SectionEditButton>
                    </>
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
                          <div className="hp-value">
                            <input
                              type="number"
                              value={character.hitPoints.current}
                              min="0"
                              onChange={(e) => updateCharacter({
                                hitPoints: {
                                  ...character.hitPoints,
                                  current: Math.max(0, parseInt(e.target.value) || 0)
                                }
                              })}
                            />
                          </div>
                          <HPArrows>
                            <HPArrow
                              direction="up"
                              onClick={() => adjustStat('currentHP', 'up')}
                            >
                              ▲
                            </HPArrow>
                            <HPArrow
                              direction="down"
                              onClick={() => adjustStat('currentHP', 'down')}
                            >
                              ▼
                            </HPArrow>
                          </HPArrows>
                        </div>
                        <div className="hp-slash">/</div>
                        <div className="hp-part">
                          <div className="hp-value">
                            <input
                              type="number"
                              value={character.hitPoints.max}
                              min="1"
                              onChange={(e) => updateCharacter({
                                hitPoints: {
                                  ...character.hitPoints,
                                  max: Math.max(1, parseInt(e.target.value) || 1)
                                }
                              })}
                            />
                          </div>
                          <HPArrows>
                            <HPArrow
                              direction="up"
                              onClick={() => adjustStat('maxHP', 'up')}
                            >
                              ▲
                            </HPArrow>
                            <HPArrow
                              direction="down"
                              onClick={() => adjustStat('maxHP', 'down')}
                            >
                              ▼
                            </HPArrow>
                          </HPArrows>
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
                        <div className="stat-value">
                          <input
                            type="number"
                            value={character.armorClass}
                            min="1"
                            max="30"
                            onChange={(e) => updateCharacter({
                              armorClass: Math.max(1, Math.min(30, parseInt(e.target.value) || 10))
                            })}
                          />
                        </div>
                        <StatArrows style={{ right: '-2px' }}>
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
                    <>
                      <SectionEditButton
                        variant="save"
                        onClick={() => toggleSectionEdit('stats')}
                      >
                        ✓
                      </SectionEditButton>
                      <SectionEditButton
                        onClick={() => cancelSectionEdit('stats')}
                        style={{ background: 'linear-gradient(145deg, #dc3545, #c82333)' }}
                      >
                        ✕
                      </SectionEditButton>
                    </>
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
                    <>
                      <SectionEditButton
                        variant="save"
                        onClick={() => toggleSectionEdit('skills')}
                      >
                        ✓
                      </SectionEditButton>
                      <SectionEditButton
                        onClick={() => cancelSectionEdit('skills')}
                        style={{ background: 'linear-gradient(145deg, #dc3545, #c82333)' }}
                      >
                        ✕
                      </SectionEditButton>
                    </>
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

            {/* Two-column layout for Character Resources and Mana */}
            <TwoColumnLayout>
              {/* Dynamic Resource Tracking Section */}
              <ResourceSection style={{ flex: needsManaTracking ? '2' : '1', marginTop: '0' }}>
                <SectionTitle>Character Resources</SectionTitle>
              <ResourceContent>
                {characterResources.map((resource) => (
                  <ResourceTracker key={resource.id}>
                    <ResourceName>{resource.name}</ResourceName>

                    {resource.type === 'checkbox' && (
                      <ResourceBoxes>
                        <ResourceBox filled={resource.current > 0}>
                          <input
                            type="checkbox"
                            checked={resource.current > 0}
                            onChange={() => handleResourceUpdate(resource.id, resource.current > 0 ? 0 : 1)}
                          />
                        </ResourceBox>
                      </ResourceBoxes>
                    )}

                    {resource.type === 'counter' && resource.name === 'Wounds' && (
                      <ResourceBoxes>
                        {Array.from({ length: resource.max }, (_, index) => {
                          const woundLevel = index + 1;
                          return (
                            <ResourceBox key={index} filled={resource.current >= woundLevel} isWounds>
                              <input
                                type="checkbox"
                                checked={resource.current >= woundLevel}
                                onChange={() => {
                                  // If clicking the current max wound level, clear all
                                  if (resource.current === woundLevel) {
                                    handleResourceUpdate(resource.id, 0);
                                  } else {
                                    // Otherwise set wounds to this level
                                    handleResourceUpdate(resource.id, woundLevel);
                                  }
                                }}
                              />
                              {woundLevel === 6 && <SkullOverlay>💀</SkullOverlay>}
                            </ResourceBox>
                          );
                        })}
                      </ResourceBoxes>
                    )}

                    {resource.type === 'counter' && resource.name !== 'Wounds' && (
                      <ResourceBoxes>
                        {Array.from({ length: Math.min(resource.max, 8) }, (_, index) => (
                          <ResourceBox key={index} filled={resource.current > index}>
                            <input
                              type="checkbox"
                              checked={resource.current > index}
                              onChange={() => {
                                // If clicking on a filled box at the current max level, reduce by 1
                                if (resource.current === index + 1) {
                                  handleResourceUpdate(resource.id, index);
                                } else {
                                  // Otherwise set to this level
                                  handleResourceUpdate(resource.id, index + 1);
                                }
                              }}
                            />
                          </ResourceBox>
                        ))}
                        {resource.max > 8 && (
                          <div style={{ fontSize: '0.7rem', color: '#8b6914', marginLeft: '0.25rem' }}>
                            +{resource.max - 8}
                          </div>
                        )}
                      </ResourceBoxes>
                    )}

                    {resource.type === 'pool' && (
                      <PoolCounter>
                        <div className="current">{resource.current}</div>
                        <div className="separator">/</div>
                        <div className="max">{resource.max}</div>
                        <div className="controls">
                          <button
                            className="control-btn"
                            onClick={() => handleResourceUpdate(resource.id, resource.current + 1)}
                          >
                            ▲
                          </button>
                          <button
                            className="control-btn"
                            onClick={() => handleResourceUpdate(resource.id, resource.current - 1)}
                          >
                            ▼
                          </button>
                        </div>
                      </PoolCounter>
                    )}
                  </ResourceTracker>
                ))}
              </ResourceContent>
              </ResourceSection>

              {/* Mana Section - Only for spellcasting classes */}
              {needsManaTracking && (
                <ManaSection style={{ flex: '1', marginTop: '0' }}>
                  <ManaTitle>Mana</ManaTitle>
                  <ManaContent>
                    <ManaDisplay>
                      <div className="mana-current">
                        <input
                          type="number"
                          value={character.mana.current}
                          min="0"
                          onChange={(e) => updateCharacter({
                            mana: {
                              ...character.mana,
                              current: Math.max(0, parseInt(e.target.value) || 0)
                            }
                          })}
                        />
                      </div>
                      <div className="mana-separator">/</div>
                      <div className="mana-max">
                        {editingSections.mana ? (
                          <input
                            type="number"
                            value={character.mana.max}
                            min="0"
                            onChange={(e) => updateCharacter({
                              mana: {
                                ...character.mana,
                                max: Math.max(0, parseInt(e.target.value) || 0)
                              }
                            })}
                          />
                        ) : (
                          character.mana.max
                        )}
                      </div>
                      <div className="mana-controls">
                        <button
                          className="mana-control-btn"
                          onClick={() => handleManaUpdate('current', 1)}
                          title="Increase Current Mana"
                        >
                          ▲
                        </button>
                        <button
                          className="mana-control-btn"
                          onClick={() => handleManaUpdate('current', -1)}
                          title="Decrease Current Mana"
                        >
                          ▼
                        </button>
                      </div>
                      {editingSections.mana && (
                        <div className="mana-controls">
                          <button
                            className="mana-control-btn"
                            onClick={() => handleManaUpdate('max', 1)}
                            title="Increase Max Mana"
                          >
                            ▲
                          </button>
                          <button
                            className="mana-control-btn"
                            onClick={() => handleManaUpdate('max', -1)}
                            title="Decrease Max Mana"
                          >
                            ▼
                          </button>
                        </div>
                      )}
                    </ManaDisplay>
                  </ManaContent>

                  <SectionEditControls>
                    {editingSections.mana ? (
                      <>
                        <SectionEditButton
                          variant="save"
                          onClick={() => toggleSectionEdit('mana')}
                        >
                          ✓
                        </SectionEditButton>
                        <SectionEditButton
                          onClick={() => cancelSectionEdit('mana')}
                          style={{ background: 'linear-gradient(145deg, #dc3545, #c82333)' }}
                        >
                          ✕
                        </SectionEditButton>
                      </>
                    ) : (
                      <SectionEditButton
                        onClick={() => toggleSectionEdit('mana')}
                      >
                        ✎
                      </SectionEditButton>
                    )}
                  </SectionEditControls>
                </ManaSection>
              )}
            </TwoColumnLayout>

            {/* Actions and Inventory Layout */}
            <TwoColumnLayout>
              {/* Actions Section */}
              <ActionsSection style={{ flex: '2', marginTop: '0' }}>
              <ActionsTitle>Actions & Combat Options</ActionsTitle>
              <ActionsTable>
                {/* Table Headers */}
                <ActionsTableHeader column={1}>Name</ActionsTableHeader>
                <ActionsTableHeader column={2}>Atk Bonus / DC</ActionsTableHeader>
                <ActionsTableHeader column={3}>Damage & Type</ActionsTableHeader>

                {/* Table Rows */}
                {character.actions.map((action, index) => (
                  <Fragment key={index}>
                    <ActionsTableCell column={1}>
                      {editingSections.actions ? (
                        <input
                          type="text"
                          value={action.name}
                          onChange={(e) => handleActionUpdate(index, 'name', e.target.value)}
                          placeholder="Action name"
                        />
                      ) : (
                        action.name
                      )}
                      {editingSections.actions && (
                        <RemoveActionButton
                          onClick={() => handleRemoveAction(index)}
                          title="Remove action"
                        >
                          ×
                        </RemoveActionButton>
                      )}
                    </ActionsTableCell>
                    <ActionsTableCell column={2}>
                      {editingSections.actions ? (
                        <input
                          type="text"
                          value={action.atkBonus}
                          onChange={(e) => handleActionUpdate(index, 'atkBonus', e.target.value)}
                          placeholder="—"
                        />
                      ) : (
                        action.atkBonus
                      )}
                    </ActionsTableCell>
                    <ActionsTableCell column={3}>
                      {editingSections.actions ? (
                        <input
                          type="text"
                          value={action.damage}
                          onChange={(e) => handleActionUpdate(index, 'damage', e.target.value)}
                          placeholder="—"
                        />
                      ) : (
                        action.damage
                      )}
                    </ActionsTableCell>
                  </Fragment>
                ))}
              </ActionsTable>

              {editingSections.actions && (
                <AddActionButton onClick={handleAddAction}>
                  + Add Action
                </AddActionButton>
              )}

              <SectionEditControls>
                {editingSections.actions ? (
                  <>
                    <SectionEditButton
                      variant="save"
                      onClick={() => toggleSectionEdit('actions')}
                    >
                      ✓
                    </SectionEditButton>
                    <SectionEditButton
                      onClick={() => cancelSectionEdit('actions')}
                      style={{ background: 'linear-gradient(145deg, #dc3545, #c82333)' }}
                    >
                      ✕
                    </SectionEditButton>
                  </>
                ) : (
                  <SectionEditButton
                    onClick={() => toggleSectionEdit('actions')}
                  >
                    ✎
                  </SectionEditButton>
                )}
              </SectionEditControls>
              </ActionsSection>

              {/* Inventory Section */}
              <InventorySection style={{ flex: '1', marginTop: '0' }}>
                <InventoryTitle>Inventory</InventoryTitle>
                <InventoryList>
                  {Array.from({ length: 8 }, (_, index) => {
                    const inventoryItem = localInventory[index];
                    const hasItem = inventoryItem && inventoryItem.name && inventoryItem.name.trim();

                    return (
                      <InventoryItem key={index}>
                        <InventoryItemContent
                          clickable={!!hasItem}
                          onClick={() => hasItem && handleInventoryItemClick(inventoryItem.name)}
                          title={hasItem ? `Click to view details for ${inventoryItem.name}` : undefined}
                        >
                          {hasItem ? inventoryItem.name : ''}
                        </InventoryItemContent>
                        {hasItem && (
                          <>
                            <QuantityContainer>
                              <QuantityLabel>×</QuantityLabel>
                              <QuantityInput
                                type="number"
                                min="1"
                                value={inventoryItem.quantity === 0 ? '' : inventoryItem.quantity}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  // Allow empty string during editing
                                  if (value === '') {
                                    // Store as 0 temporarily to allow clearing
                                    handleQuantityChange(index, 0);
                                  } else {
                                    const newQuantity = parseInt(value) || 0;
                                    handleQuantityChange(index, newQuantity);
                                  }
                                }}
                                onBlur={(e) => {
                                  // Ensure minimum quantity of 1 when focus is lost
                                  const value = parseInt(e.target.value);
                                  if (!value || value < 1) {
                                    handleQuantityChange(index, 1);
                                  }
                                }}
                                onFocus={(e) => {
                                  // Select all text when focused for easy replacement
                                  e.target.select();
                                }}
                              />
                            </QuantityContainer>
                            <DeleteButton
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent triggering the item click
                                handleDeleteItemClick(index);
                              }}
                              title={`Delete ${inventoryItem.name}`}
                            >
                              ×
                            </DeleteButton>
                          </>
                        )}
                      </InventoryItem>
                    );
                  })}
                </InventoryList>

                <InventoryButtonContainer>
                  <InventoryActionButton onClick={() => handleAddOfficialItem()}>
                    📦 Add Official Item
                  </InventoryActionButton>
                  <InventoryActionButton onClick={() => handleAddCustomItem()}>
                    ✏️ Add Custom Item
                  </InventoryActionButton>
                </InventoryButtonContainer>

                {pendingInventoryChanges && (
                  <SaveInventoryButton onClick={handleSaveInventory}>
                    💾 Save Inventory Changes
                  </SaveInventoryButton>
                )}

              </InventorySection>
            </TwoColumnLayout>
          </LeftColumn>
        </MainLayout>


        {/* Traits and Abilities Section */}
        <TraitsSection>
          <TraitsTitle>Features & Traits</TraitsTitle>
          {(character.speciesTraits && character.speciesTraits.length > 0) || (character.classFeatures && character.classFeatures.length > 0) ? (
            <TraitsGrid>
              {/* Render Species Traits */}
              {character.speciesTraits && character.speciesTraits.map((trait, index) => {
                // Try to parse trait as "Name: Description" format
                const colonIndex = trait.indexOf(':');
                const hasName = colonIndex > 0 && colonIndex < trait.length - 1;

                return (
                  <TraitCard key={`species-${index}`}>
                    {hasName ? (
                      <>
                        <TraitName>{trait.substring(0, colonIndex).trim()}</TraitName>
                        <TraitDescription>{trait.substring(colonIndex + 1).trim()}</TraitDescription>
                      </>
                    ) : (
                      <>
                        <TraitName>{character.species} Trait</TraitName>
                        <TraitDescription>{trait}</TraitDescription>
                      </>
                    )}
                  </TraitCard>
                );
              })}

              {/* Render Class Features */}
              {character.classFeatures && character.classFeatures.map((feature, index) => (
                <TraitCard key={`class-${index}`}>
                  <TraitName>{feature}</TraitName>
                  <TraitDescription>Level 1 {character.class} feature</TraitDescription>
                </TraitCard>
              ))}
            </TraitsGrid>
          ) : (
            <EmptyTraitsMessage>
              No features or traits yet. Choose a species and class to see your abilities!
            </EmptyTraitsMessage>
          )}
        </TraitsSection>

        {/* Item Modal */}
        <ModalOverlay isOpen={showItemModal} onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowItemModal(false);
          }
        }}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>
                {itemModalType === 'official' ? 'Add Official Item' : 'Add Custom Item'}
              </ModalTitle>
              <CloseButton onClick={() => setShowItemModal(false)}>
                ×
              </CloseButton>
            </ModalHeader>
            <ModalBody>
              {itemModalType === 'official' ? (
                <>
                  <SearchInput
                    type="text"
                    placeholder="Search for items..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      handleItemSearch(e.target.value);
                    }}
                  />
                  {isSearching && (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      Searching...
                    </div>
                  )}
                  {searchResults.length > 0 && (
                    <ItemList>
                      {searchResults.map((item) => (
                        <ItemOptionContainer key={item.id}>
                          <ItemInfo onClick={() => handleItemSelect(item)}>
                            <ItemName>{item.name}</ItemName>
                            <ItemDetails>
                              {item.type}
                              {item.dmg1 && ` • ${item.dmg1} ${item.dmgType || ''}`}
                              {item.ac && ` • AC ${item.ac}`}
                              {item.weight && ` • ${item.weight} lbs`}
                            </ItemDetails>
                          </ItemInfo>
                          <InfoButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShowItemDetails(item);
                            }}
                          >
                            Info
                          </InfoButton>
                        </ItemOptionContainer>
                      ))}
                    </ItemList>
                  )}
                  {searchTerm && !isSearching && searchResults.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#8b6914' }}>
                      No items found. Try a different search term.
                    </div>
                  )}
                </>
              ) : (
                <>
                  <CustomItemInput
                    type="text"
                    placeholder="Enter custom item name..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCustomItemAdd((e.target as HTMLInputElement).value);
                      }
                    }}
                  />
                  <AddButton
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="Enter custom item name..."]') as HTMLInputElement;
                      if (input) {
                        handleCustomItemAdd(input.value);
                      }
                    }}
                  >
                    Add Item
                  </AddButton>
                </>
              )}
            </ModalBody>
          </ModalContent>
        </ModalOverlay>

        {/* Item Details Modal */}
        <ModalOverlay isOpen={showItemDetails} onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowItemDetails(false);
          }
        }}>
          <ItemDetailsModal>
            <ItemDetailsHeader>
              <ItemDetailsTitle>
                {selectedItemForDetails?.name || 'Item Details'}
              </ItemDetailsTitle>
              <CloseButton onClick={() => setShowItemDetails(false)}>
                ×
              </CloseButton>
            </ItemDetailsHeader>
            <ItemDetailsBody>
              {selectedItemForDetails && (
                <>
                  <ItemProperty>
                    <PropertyLabel>Type:</PropertyLabel>
                    <PropertyValue>{selectedItemForDetails.type}</PropertyValue>
                  </ItemProperty>

                  {selectedItemForDetails.rarity && (
                    <ItemProperty>
                      <PropertyLabel>Rarity:</PropertyLabel>
                      <PropertyValue>{selectedItemForDetails.rarity}</PropertyValue>
                    </ItemProperty>
                  )}

                  {selectedItemForDetails.weight && (
                    <ItemProperty>
                      <PropertyLabel>Weight:</PropertyLabel>
                      <PropertyValue>{selectedItemForDetails.weight} lbs</PropertyValue>
                    </ItemProperty>
                  )}

                  {selectedItemForDetails.value && (
                    <ItemProperty>
                      <PropertyLabel>Cost:</PropertyLabel>
                      <PropertyValue>
                        {selectedItemForDetails.value} {selectedItemForDetails.valueCurrency || 'gp'}
                      </PropertyValue>
                    </ItemProperty>
                  )}

                  {/* Weapon Properties */}
                  {isWeapon(selectedItemForDetails) && (
                    <>
                      {selectedItemForDetails.dmg1 && (
                        <ItemProperty>
                          <PropertyLabel>Damage:</PropertyLabel>
                          <PropertyValue>
                            {selectedItemForDetails.dmg1}
                            {selectedItemForDetails.dmg2 && ` (${selectedItemForDetails.dmg2} versatile)`}
                            {selectedItemForDetails.dmgType && ` ${selectedItemForDetails.dmgType}`}
                          </PropertyValue>
                        </ItemProperty>
                      )}

                      {selectedItemForDetails.weaponCategory && (
                        <ItemProperty>
                          <PropertyLabel>Category:</PropertyLabel>
                          <PropertyValue>{selectedItemForDetails.weaponCategory}</PropertyValue>
                        </ItemProperty>
                      )}

                      {selectedItemForDetails.range && (
                        <ItemProperty>
                          <PropertyLabel>Range:</PropertyLabel>
                          <PropertyValue>{selectedItemForDetails.range}</PropertyValue>
                        </ItemProperty>
                      )}

                      {selectedItemForDetails.property && selectedItemForDetails.property.length > 0 && (
                        <ItemProperty>
                          <PropertyLabel>Properties:</PropertyLabel>
                          <PropertyValue>{selectedItemForDetails.property.join(', ')}</PropertyValue>
                        </ItemProperty>
                      )}
                    </>
                  )}

                  {/* Armor Properties */}
                  {isArmor(selectedItemForDetails) && (
                    <>
                      {selectedItemForDetails.ac && (
                        <ItemProperty>
                          <PropertyLabel>Armor Class:</PropertyLabel>
                          <PropertyValue>{selectedItemForDetails.ac}</PropertyValue>
                        </ItemProperty>
                      )}

                      {selectedItemForDetails.armorType && (
                        <ItemProperty>
                          <PropertyLabel>Armor Type:</PropertyLabel>
                          <PropertyValue>{selectedItemForDetails.armorType}</PropertyValue>
                        </ItemProperty>
                      )}

                      {selectedItemForDetails.strength && (
                        <ItemProperty>
                          <PropertyLabel>Strength Req:</PropertyLabel>
                          <PropertyValue>{selectedItemForDetails.strength}</PropertyValue>
                        </ItemProperty>
                      )}

                      {selectedItemForDetails.stealth && (
                        <ItemProperty>
                          <PropertyLabel>Stealth:</PropertyLabel>
                          <PropertyValue>Disadvantage</PropertyValue>
                        </ItemProperty>
                      )}
                    </>
                  )}

                  {/* Shield Properties */}
                  {isShield(selectedItemForDetails) && (
                    <ItemProperty>
                      <PropertyLabel>AC Bonus:</PropertyLabel>
                      <PropertyValue>+2</PropertyValue>
                    </ItemProperty>
                  )}

                  {/* Magic Properties */}
                  {selectedItemForDetails.reqAttune && (
                    <ItemProperty>
                      <PropertyLabel>Attunement:</PropertyLabel>
                      <PropertyValue>{selectedItemForDetails.reqAttune}</PropertyValue>
                    </ItemProperty>
                  )}

                  {selectedItemForDetails.charges && (
                    <ItemProperty>
                      <PropertyLabel>Charges:</PropertyLabel>
                      <PropertyValue>{selectedItemForDetails.charges}</PropertyValue>
                    </ItemProperty>
                  )}

                  {/* Source Information */}
                  {selectedItemForDetails.source && (
                    <ItemProperty>
                      <PropertyLabel>Source:</PropertyLabel>
                      <PropertyValue>
                        {selectedItemForDetails.source}
                        {selectedItemForDetails.page && ` p. ${selectedItemForDetails.page}`}
                      </PropertyValue>
                    </ItemProperty>
                  )}

                  {/* Description */}
                  {selectedItemForDetails.entries && selectedItemForDetails.entries.length > 0 && (
                    <ItemDescription>
                      <strong>Description:</strong>
                      <div style={{ marginTop: '8px' }}>
                        {selectedItemForDetails.entries.map((entry: any, index: number) => (
                          <div key={index} style={{ marginBottom: '8px' }}>
                            {typeof entry === 'string' ? entry : JSON.stringify(entry)}
                          </div>
                        ))}
                      </div>
                    </ItemDescription>
                  )}

                  <AddItemButton
                    inInventory={selectedItemForDetails ? isItemInInventory(selectedItemForDetails.name) : false}
                    onClick={() => {
                      if (selectedItemForDetails && !isItemInInventory(selectedItemForDetails.name)) {
                        handleItemSelect(selectedItemForDetails);
                        setShowItemDetails(false);
                      }
                    }}
                  >
                    {selectedItemForDetails && isItemInInventory(selectedItemForDetails.name)
                      ? 'In Inventory'
                      : 'Add to Inventory'
                    }
                  </AddItemButton>
                </>
              )}
            </ItemDetailsBody>
          </ItemDetailsModal>
        </ModalOverlay>

        {/* Delete Confirmation Modal */}
        <ModalOverlay isOpen={showDeleteConfirmation} onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleCancelDelete();
          }
        }}>
          <ConfirmationModal>
            <ConfirmationTitle>Delete Item</ConfirmationTitle>
            <ConfirmationText>
              Are you sure you want to delete "{itemToDelete?.itemName}"?
              <br />
              This will remove the item from your inventory and any effects it was providing.
            </ConfirmationText>
            <ConfirmationButtons>
              <ConfirmButton onClick={handleConfirmDelete}>
                Delete
              </ConfirmButton>
              <CancelButton onClick={handleCancelDelete}>
                Cancel
              </CancelButton>
            </ConfirmationButtons>
          </ConfirmationModal>
        </ModalOverlay>

        {/* Species Selection Popup */}
        <ModalOverlay isOpen={showSpeciesPopup} onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleSpeciesCancel();
          }
        }}>
          <SpeciesPopupModal>
            <SpeciesPopupTitle>
              Select {selectedSpecies}
            </SpeciesPopupTitle>

            {selectedSpecies && speciesChoices[selectedSpecies] && (
              <>
                <SpeciesDescription>
                  {speciesChoices[selectedSpecies].description}
                </SpeciesDescription>

                {speciesChoices[selectedSpecies].choices ? (
                  speciesChoices[selectedSpecies].choices!.map((choiceCategory) => (
                    <SpeciesChoicesContainer key={choiceCategory.category}>
                      <SpeciesChoicesTitle>
                        {choiceCategory.category}:
                      </SpeciesChoicesTitle>
                      <SpeciesChoicesGrid>
                        {choiceCategory.options.map((option) => (
                          <SpeciesChoice
                            key={option.name}
                            selected={selectedSpeciesChoices[choiceCategory.category] === option.name}
                            onClick={() => handleSpeciesChoiceSelect(choiceCategory.category, option.name)}
                          >
                            <SpeciesChoiceName>{option.name}</SpeciesChoiceName>
                            <SpeciesChoiceDescription>{option.description}</SpeciesChoiceDescription>
                          </SpeciesChoice>
                        ))}
                      </SpeciesChoicesGrid>
                    </SpeciesChoicesContainer>
                  ))
                ) : null}

                <SpeciesButtonsContainer>
                  <CancelButton onClick={handleSpeciesCancel}>
                    Cancel
                  </CancelButton>
                  <ConfirmButton
                    onClick={handleSpeciesConfirm}
                    disabled={
                      speciesChoices[selectedSpecies].choices &&
                      speciesChoices[selectedSpecies].choices!.some(
                        choice => !selectedSpeciesChoices[choice.category]
                      )
                    }
                  >
                    Confirm Selection
                  </ConfirmButton>
                </SpeciesButtonsContainer>
              </>
            )}
          </SpeciesPopupModal>
        </ModalOverlay>

        {/* Class Selection Popup */}
        <ModalOverlay isOpen={showClassPopup} onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleClassCancel();
          }
        }}>
          <ClassPopupModal>
            <ClassPopupTitle>
              Select {selectedClass} - Step {classChoicesStep}
              {classChoicesStep === 1 && ' (Skills)'}
              {classChoicesStep === 2 && ' (Class Features)'}
            </ClassPopupTitle>

            {selectedClass && CLASS_SKILLS[selectedClass as keyof typeof CLASS_SKILLS] && (
              <>
                {/* Step 1: Skill Selection */}
                {classChoicesStep === 1 && (
                  <ClassSkillsContainer>
                    <ClassSkillsTitle>
                      Choose {CLASS_SKILL_CHOICES[selectedClass as keyof typeof CLASS_SKILL_CHOICES]} Skills:
                    </ClassSkillsTitle>
                    <ClassSkillsGrid>
                      {(CLASS_SKILLS[selectedClass as keyof typeof CLASS_SKILLS] as readonly string[]).includes('any')
                        ? Object.keys(character.skills).map((skill) => (
                            <ClassSkillChoice
                              key={skill}
                              selected={selectedClassSkills.includes(skill)}
                              onClick={() => handleClassSkillToggle(skill)}
                            >
                              {skill}
                            </ClassSkillChoice>
                          ))
                        : (CLASS_SKILLS[selectedClass as keyof typeof CLASS_SKILLS] as readonly string[]).map((skill) => (
                            <ClassSkillChoice
                              key={skill}
                              selected={selectedClassSkills.includes(skill)}
                              onClick={() => handleClassSkillToggle(skill)}
                            >
                              {skill}
                            </ClassSkillChoice>
                          ))
                      }
                    </ClassSkillsGrid>
                    <div style={{ textAlign: 'center', marginTop: '15px', color: '#8b6914' }}>
                      Selected: {selectedClassSkills.length} / {CLASS_SKILL_CHOICES[selectedClass as keyof typeof CLASS_SKILL_CHOICES]}
                    </div>
                  </ClassSkillsContainer>
                )}

                {/* Step 2: Additional Class Choices */}
                {classChoicesStep === 2 && currentClassData && (
                  <ClassSkillsContainer>
                    {Object.entries(parseClassChoices(currentClassData.classFeatures?.filter((f: any) => f.level === 1) || [])).map(([category, choiceData]) => (
                      <div key={category} style={{ marginBottom: '20px' }}>
                        <ClassSkillsTitle>
                          Choose {choiceData.count} {category}:
                        </ClassSkillsTitle>
                        <ClassSkillsGrid>
                          {choiceData.options.map((option) => (
                            <ClassSkillChoice
                              key={option}
                              selected={selectedClassChoices[category]?.includes(option) || false}
                              onClick={() => handleClassChoiceToggle(category, option, choiceData.count)}
                            >
                              {option}
                            </ClassSkillChoice>
                          ))}
                        </ClassSkillsGrid>
                        <div style={{ textAlign: 'center', marginTop: '10px', color: '#8b6914' }}>
                          Selected: {selectedClassChoices[category]?.length || 0} / {choiceData.count}
                        </div>
                      </div>
                    ))}
                    {Object.keys(parseClassChoices(currentClassData.classFeatures?.filter((f: any) => f.level === 1) || [])).length === 0 && (
                      <div style={{ textAlign: 'center', color: '#8b6914', fontStyle: 'italic', padding: '20px' }}>
                        No additional level 1 choices for {selectedClass}
                      </div>
                    )}
                  </ClassSkillsContainer>
                )}

                <ClassButtonsContainer>
                  <CancelButton onClick={handleClassCancel}>
                    Cancel
                  </CancelButton>

                  {classChoicesStep === 1 && (
                    <ConfirmButton
                      onClick={handleClassNextStep}
                      disabled={selectedClassSkills.length !== CLASS_SKILL_CHOICES[selectedClass as keyof typeof CLASS_SKILL_CHOICES]}
                    >
                      Next: Class Features
                    </ConfirmButton>
                  )}

                  {classChoicesStep === 2 && (
                    <>
                      <CancelButton onClick={handleClassPrevStep}>
                        Back to Skills
                      </CancelButton>
                      <ConfirmButton
                        onClick={handleClassConfirm}
                        disabled={currentClassData && Object.entries(parseClassChoices(currentClassData.classFeatures?.filter((f: any) => f.level === 1) || [])).some(([category, choiceData]) =>
                          (selectedClassChoices[category]?.length || 0) !== choiceData.count
                        )}
                      >
                        Confirm Selection
                      </ConfirmButton>
                    </>
                  )}
                </ClassButtonsContainer>
              </>
            )}
          </ClassPopupModal>
        </ModalOverlay>
      </SheetContainer>
    </>
  );
}