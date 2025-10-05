import { describe, expect, it } from 'vitest';
import {
  abilityMod,
  canCastLeveledThisTurn,
  getCantripMax,
  getCasterProgressionMeta,
  getKnownMax,
  getPreparedMax,
  spellIsForClass,
  validateAddKnown,
  validateTogglePrepared,
  type SpellWithClasses,
} from '../spellRules';

describe('spellRules helpers', () => {
  const wizardSpell: SpellWithClasses = {
    id: 1,
    name: 'Magic Missile',
    level: 1,
    createdAt: '',
    updatedAt: '',
    classes: ['Wizard', 'Sorcerer'],
  };

  const clericSpell: SpellWithClasses = {
    id: 2,
    name: 'Guiding Bolt',
    level: 1,
    createdAt: '',
    updatedAt: '',
    classes: ['Cleric'],
  };

  it('computes ability modifiers with safe defaults', () => {
    expect(abilityMod()).toBe(0);
    expect(abilityMod(10)).toBe(0);
    expect(abilityMod(8)).toBe(-1);
    expect(abilityMod(18)).toBe(4);
  });

  it('returns expected known spell maxima', () => {
    expect(getKnownMax('Bard', 0)).toBe(0);
    expect(getKnownMax('Bard', 30)).toBe(22); // clamps to last progression entry
    expect(getKnownMax('Cleric', 5)).toBeNull();
    expect(getKnownMax('Paladin', 1)).toBe(0);
  });

  it('computes prepared spell maxima for prepared casters', () => {
    expect(getPreparedMax('Cleric', 5, 3)).toBeGreaterThanOrEqual(1);
    expect(getPreparedMax('Cleric', 1, -1)).toBe(1);
    expect(getPreparedMax('Ranger', 5, 2)).toBeNull();
  });

  it('computes cantrip limits per class', () => {
    expect(getCantripMax('Wizard', 1)).toBeGreaterThanOrEqual(3);
    expect(getCantripMax('Paladin', 5)).toBe(0);
    expect(getCantripMax('Barbarian', 3)).toBeNull();
  });

  it('identifies whether spells belong to a class', () => {
    expect(spellIsForClass(undefined, 'Wizard')).toBe(false);
    expect(spellIsForClass(wizardSpell, 'Wizard')).toBe(true);
    expect(spellIsForClass(clericSpell, 'Wizard')).toBe(false);
  });

  it('validates adding known spells against caps and eligibility', () => {
    expect(
      validateAddKnown({ classId: 'Wizard', level: 1, currentKnown: 5, spell: wizardSpell })
    ).toMatchObject({ ok: true });

    expect(
      validateAddKnown({ classId: 'Wizard', level: 1, currentKnown: 6, spell: wizardSpell }).ok
    ).toBe(false);

    expect(
      validateAddKnown({ classId: 'Cleric', level: 1, currentKnown: 0, spell: clericSpell }).ok
    ).toBe(false);
  });

  it('validates preparing spells against caps and eligibility', () => {
    expect(
      validateTogglePrepared({
        classId: 'Cleric',
        level: 3,
        abilityScore: 16,
        currentPrepared: 5,
        willPrepare: true,
        spell: clericSpell,
      })
    ).toMatchObject({ ok: true });

    expect(
      validateTogglePrepared({
        classId: 'Cleric',
        level: 3,
        abilityScore: 16,
        currentPrepared: 6,
        willPrepare: true,
        spell: clericSpell,
      }).ok
    ).toBe(false);

    expect(
      validateTogglePrepared({
        classId: 'Bard',
        level: 3,
        currentPrepared: 0,
        willPrepare: true,
        spell: wizardSpell,
      }).ok
    ).toBe(false);
  });

  it('returns stable caster progression meta data', () => {
    const wizardMeta = getCasterProgressionMeta({
      classId: 'Wizard',
      level: 1,
      spellcastingAbilityScore: 16,
    });

    expect(wizardMeta).toMatchObject({
      casterType: 'full',
      preparedCaster: true,
      abilityMod: 3,
    });
    expect(wizardMeta.knownMax).toBeGreaterThan(0);
    expect(wizardMeta.preparedMax).toBeGreaterThanOrEqual(1);
    expect(wizardMeta.cantripMax).toBeGreaterThan(0);

    const barbarianMeta = getCasterProgressionMeta({ classId: 'Barbarian', level: 5 });
    expect(barbarianMeta).toMatchObject({
      casterType: 'none',
      preparedCaster: false,
      abilityMod: 0,
      knownMax: null,
      preparedMax: null,
    });
  });

  it('exposes the leveled spell casting rule as a boolean helper', () => {
    expect(canCastLeveledThisTurn(false)).toBe(true);
    expect(canCastLeveledThisTurn(true)).toBe(false);
  });
});
