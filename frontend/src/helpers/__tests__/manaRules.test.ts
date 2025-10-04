import { describe, expect, it } from 'vitest';
import {
  arcaneRecoveryMana,
  computeManaPool,
  sorceryPointsToMana,
  spellManaCost,
} from '../manaRules';

describe('manaRules helpers', () => {
  const baseSlots = 5;

  it('computes mana pools for single-class casters by progression type', () => {
    expect(computeManaPool([{ classId: 'Wizard', level: 5 }], 3, baseSlots)).toBe(baseSlots + 5);
    expect(computeManaPool([{ classId: 'Paladin', level: 6 }], 3, baseSlots)).toBe(6 + 3);
    expect(computeManaPool([{ classId: 'Fighter', level: 7 }], 3, baseSlots)).toBe(baseSlots + 3);
    expect(computeManaPool([{ classId: 'Barbarian', level: 5 }], 3, baseSlots)).toBe(0);
  });

  it('returns zero mana when no classes are provided', () => {
    expect(computeManaPool([], 3, baseSlots)).toBe(0);
  });

  it('calculates spell mana costs using non-negative levels', () => {
    expect(spellManaCost(-1)).toBe(0);
    expect(spellManaCost(0)).toBe(0);
    expect(spellManaCost(5)).toBe(5);
  });

  it('rounds arcane recovery mana up', () => {
    expect(arcaneRecoveryMana(1)).toBe(1);
    expect(arcaneRecoveryMana(2)).toBe(1);
    expect(arcaneRecoveryMana(5)).toBe(3);
  });

  it('converts sorcery points to mana 1:1', () => {
    expect(sorceryPointsToMana(0)).toBe(0);
    expect(sorceryPointsToMana(7)).toBe(7);
  });
});
