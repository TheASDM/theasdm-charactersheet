import { getCasterType } from './spellRules';

export type ClassLevel = { classId: string; level: number };

/**
 * Compute total mana pool from spell slots and class progression.
 */
export function computeManaPool(
  classes: ClassLevel[],
  proficiencyBonus: number,
  totalSlots: number
): number {
  // TODO(multiclass): combine progression across all classes instead of primary only.
  if (!classes.length) {
    return 0;
  }

  const primary = classes[0];
  const casterType = getCasterType(primary.classId);
  const level = Math.max(0, Math.floor(primary.level));

  switch (casterType) {
    case 'full':
      return totalSlots + level;
    case 'half':
      return level + proficiencyBonus;
    case 'third':
      return totalSlots + proficiencyBonus;
    default:
      return 0;
  }
}

/** Lowest-level spells cost no mana. */
export function spellManaCost(spellLevel: number): number {
  return Math.max(0, spellLevel);
}

/** Rounds up half the wizard level. */
export function arcaneRecoveryMana(wizardLevel: number): number {
  return Math.ceil(Math.max(0, wizardLevel) / 2);
}

/** 1:1 conversion for sorcery points. */
export function sorceryPointsToMana(points: number): number {
  return points;
}
