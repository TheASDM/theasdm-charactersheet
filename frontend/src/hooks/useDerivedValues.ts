import { useMemo } from 'react';
import { CharacterSheetData } from '../types/characterSheet';
import {
  calculateDerivedValues,
  getSkillModifiers
} from '../services/characterCalculations';

export function useDerivedValues(character: CharacterSheetData) {
  const derivedValues = useMemo(() => {
    return calculateDerivedValues(character);
  }, [character]);

  const skillModifiers = useMemo(() => {
    return getSkillModifiers(character, derivedValues.proficiencyBonus);
  }, [character, derivedValues.proficiencyBonus]);

  const skillsData = useMemo(() => {
    const data: Record<string, { proficient: boolean; modifier: number }> = {};
    Object.entries(skillModifiers).forEach(([skill, modifier]) => {
      const isProficient = character.skills[skill]?.proficient || false;
      data[skill] = { proficient: isProficient, modifier: modifier };
    });
    return data;
  }, [skillModifiers, character.skills]);

  return {
    derivedValues,
    skillModifiers,
    skillsData,
  };
}