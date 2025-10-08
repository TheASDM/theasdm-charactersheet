import { Spell } from '../types/api';

/**
 * Union of supported caster progression categories.
 */
export type CasterType = 'none' | 'full' | 'half' | 'third';

/** Normalise a class identifier to a canonical casing. */
function normalizeClassId(classId: string): string {
  const key = classId.trim().toLowerCase();
  return CLASS_NAME_ALIASES[key] ?? classId;
}

const CLASS_NAME_ALIASES: Record<string, string> = {
  artificer: 'Artificer',
  barbarian: 'Barbarian',
  bard: 'Bard',
  cleric: 'Cleric',
  druid: 'Druid',
  fighter: 'Fighter',
  monk: 'Monk',
  paladin: 'Paladin',
  ranger: 'Ranger',
  rogue: 'Rogue',
  sorcerer: 'Sorcerer',
  warlock: 'Warlock',
  wizard: 'Wizard',
};

const FULL_CASTER_CLASSES = new Set(['Bard', 'Cleric', 'Druid', 'Sorcerer', 'Warlock', 'Wizard']);
const HALF_CASTER_CLASSES = new Set(['Artificer', 'Paladin', 'Ranger']);
const THIRD_CASTER_CLASSES = new Set(['Fighter', 'Rogue']);
const PREPARED_CASTER_CLASSES = new Set(['Artificer', 'Cleric', 'Druid', 'Wizard']);

const KNOWN_SPELLS_PROGRESSIONS: Record<string, number[]> = {
  Bard: [4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 15, 16, 18, 19, 19, 20, 22, 22, 22],
  Paladin: [0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11],
  Ranger: [0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11],
  Sorcerer: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15],
  Warlock: [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
};

const CANTRIP_PROGRESSIONS: Record<string, number[]> = {
  Artificer: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  Bard: [2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4],
  Cleric: [3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  Druid: [2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  Sorcerer: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  Warlock: [2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  Wizard: [3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5],
};

/** Spell shape that includes optional class metadata. */
export interface SpellWithClasses extends Spell {
  classes?: string[];
}

/** Result of a simple validation check. */
export interface ValidationResult {
  ok: boolean;
  reason?: string;
}

export interface ValidateAddKnownParams {
  classId: string;
  level: number;
  currentKnown: number;
  spell?: SpellWithClasses | null;
}

export interface ValidateTogglePreparedParams {
  classId: string;
  level: number;
  abilityScore?: number;
  currentPrepared: number;
  willPrepare: boolean;
  spell?: SpellWithClasses | null;
}

/**
 * Return the casting progression bucket for a given class identifier.
 */
export function getCasterType(classId: string): CasterType {
  const id = normalizeClassId(classId);
  if (FULL_CASTER_CLASSES.has(id)) {
    return 'full';
  }
  if (HALF_CASTER_CLASSES.has(id)) {
    return 'half';
  }
  if (THIRD_CASTER_CLASSES.has(id)) {
    return 'third';
  }
  return 'none';
}

/**
 * True when the class prepares spells each day rather than maintaining a fixed known list.
 */
export function isPreparedCaster(classId: string): boolean {
  const id = normalizeClassId(classId);
  return PREPARED_CASTER_CLASSES.has(id);
}

/**
 * Compute the ability modifier from an ability score. Defaults to 0 when the score is missing.
 */
export function abilityMod(score?: number): number {
  if (typeof score !== 'number' || Number.isNaN(score)) {
    return 0;
  }
  return Math.floor((score - 10) / 2);
}

/**
 * Maximum number of spells known for a class/level combination, or null when the class prepares spells instead.
 */
export function getKnownMax(classId: string, level: number): number | null {
  const id = normalizeClassId(classId);
  const effectiveLevel = Math.floor(level);

  if (isPreparedCaster(id) && id !== 'Wizard') {
    return null;
  }

  if (effectiveLevel <= 0) {
    return 0;
  }

  if (id === 'Wizard') {
    const wizardLevel = Math.max(1, effectiveLevel);
    return 4 + wizardLevel * 2;
  }

  const table = KNOWN_SPELLS_PROGRESSIONS[id];
  if (!table) {
    return null;
  }

  const index = Math.min(table.length - 1, Math.max(0, effectiveLevel - 1));
  return table[index];
}

/**
 * Maximum number of cantrips a class can know at a given level. Returns 0 when the class lacks cantrip progression.
 */
export function getCantripMax(classId: string, level: number): number | null {
  const id = normalizeClassId(classId);
  const table = CANTRIP_PROGRESSIONS[id];

  if (!table) {
    return ['Paladin', 'Ranger'].includes(id) ? 0 : null;
  }

  const effectiveLevel = Math.max(1, Math.floor(level));
  const index = Math.min(table.length - 1, effectiveLevel - 1);
  return table[index];
}

/**
 * Maximum number of spells that can be prepared, for prepared casters.
 */
export function getPreparedMax(classId: string, level: number, mod: number): number | null {
  const id = normalizeClassId(classId);
  if (!isPreparedCaster(id)) {
    return null;
  }
  if (level <= 0) {
    return 0;
  }
  const abilityModifier = Number.isFinite(mod) ? mod : 0;
  return Math.max(1, Math.floor(level) + abilityModifier);
}

/**
 * Whether a spell belongs to the provided class list.
 */
export function spellIsForClass(spell: SpellWithClasses | undefined | null, classId: string): boolean {
  if (!spell || !Array.isArray(spell.classes)) {
    return false;
  }
  const id = normalizeClassId(classId);
  return spell.classes.some((spellClass: string) => normalizeClassId(spellClass) === id);
}

/**
 * Check if the next known spell slot can be used.
 */
export function validateAddKnown(params: ValidateAddKnownParams): ValidationResult {
  const { classId, level, currentKnown, spell } = params;
  if (!spellIsForClass(spell as any, classId)) {
    return { ok: false, reason: 'Spell is not available for this class.' };
  }

  const meta = getCasterProgressionMeta({ classId, level });
  if (meta.knownMax === null) {
    return { ok: false, reason: 'Class prepares spells instead of learning them.' };
  }

  if (currentKnown + 1 > meta.knownMax) {
    return { ok: false, reason: 'Cannot learn more spells at this level.' };
  }

  return { ok: true };
}

/**
 * Ensure preparing or un-preparing a spell stays within the class limits.
 */
export function validateTogglePrepared(params: ValidateTogglePreparedParams): ValidationResult {
  const { classId, level, abilityScore, currentPrepared, willPrepare, spell } = params;

  if (!willPrepare) {
    return { ok: true };
  }

  if (!spellIsForClass(spell as any, classId)) {
    return { ok: false, reason: 'Spell is not available for this class.' };
  }

  const meta = abilityScore === undefined
    ? getCasterProgressionMeta({ classId, level })
    : getCasterProgressionMeta({ classId, level, spellcastingAbilityScore: abilityScore });
  if (meta.preparedMax === null) {
    return { ok: false, reason: 'Class does not prepare spells.' };
  }

  if (currentPrepared + 1 > meta.preparedMax) {
    return { ok: false, reason: 'Cannot prepare additional spells at this level.' };
  }

  return { ok: true };
}

/**
 * Wrapper around the combat rule for casting leveled spells after another leveled spell.
 */
export function canCastLeveledThisTurn(alreadyCastLeveled: boolean): boolean {
  return !alreadyCastLeveled;
}

/**
 * Aggregate lookups so UI layers can call one function per render.
 */
export function getCasterProgressionMeta(params: {
  classId: string;
  level: number;
  spellcastingAbilityScore?: number;
}) {
  const casterType = getCasterType(params.classId);
  const preparedCaster = isPreparedCaster(params.classId);
  const mod = abilityMod(params.spellcastingAbilityScore);
  return {
    casterType,
    preparedCaster,
    knownMax: getKnownMax(params.classId, params.level),
    preparedMax: getPreparedMax(params.classId, params.level, mod),
    cantripMax: getCantripMax(params.classId, params.level),
    abilityMod: mod,
  };
}

/**
 * NEW D&D 2024 HELPERS
 * These work with the new CLASS_CONFIG structure
 */

import { CLASS_CONFIG } from './spellcastingConfig';
import type { CasterType as NewCasterType } from '../types/spells';

/**
 * Get the number of cantrips for a class at a given level (D&D 2024).
 */
export function getCantripCount(classId: string, level: number): number {
  const config = CLASS_CONFIG[classId];
  if (!config) return 0;

  const cantripsAtLevel = config.cantripsAtLevel;
  if (!cantripsAtLevel || Object.keys(cantripsAtLevel).length === 0) return 0;

  // Find the highest level threshold <= current level
  const levels = Object.keys(cantripsAtLevel).map(Number).sort((a, b) => a - b);
  let result = 0;
  for (const threshold of levels) {
    if (threshold <= level) {
      result = cantripsAtLevel[threshold];
    } else {
      break;
    }
  }
  return result;
}

/**
 * Get the base number of prepared spells for a class at a given level (D&D 2024).
 * This is BEFORE adding the ability modifier.
 */
export function getPreparedCount(classId: string, level: number, abilityMod: number = 0): number {
  const config = CLASS_CONFIG[classId];
  if (!config) return 0;

  const preparedAtLevel = config.preparedAtLevel;
  if (!preparedAtLevel || Object.keys(preparedAtLevel).length === 0) return 0;

  // Find the highest level threshold <= current level
  const levels = Object.keys(preparedAtLevel).map(Number).sort((a, b) => a - b);
  let base = 0;
  for (const threshold of levels) {
    if (threshold <= level) {
      base = preparedAtLevel[threshold];
    } else {
      break;
    }
  }

  // For flexible prepared casters, add ability modifier
  if (config.casterType === 'flexiblePrepared') {
    return Math.max(1, base + abilityMod);
  }

  // For semi-prepared casters, the table value is the total
  return base;
}

/**
 * Get the new caster type (D&D 2024).
 */
export function getNewCasterType(classId: string): NewCasterType {
  const config = CLASS_CONFIG[classId];
  return config?.casterType ?? 'none';
}

/**
 * Check if this class uses a spellbook (Wizard).
 */
export function usesSpellbook(classId: string): boolean {
  return CLASS_CONFIG[classId]?.usesSpellbook ?? false;
}

/**
 * Check if this class uses Pact Magic (Warlock).
 */
export function hasPactMagic(classId: string): boolean {
  return CLASS_CONFIG[classId]?.pactMagic ?? false;
}

/**
 * Get spellcasting ability for a class.
 */
export function getSpellcastingAbility(classId: string): string | undefined {
  return CLASS_CONFIG[classId]?.spellcastingAbility;
}
