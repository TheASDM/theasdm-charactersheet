export type AbilityId = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
export type CasterType = 'none' | 'full' | 'half' | 'third';

export interface PreparedFormulaConfig {
  type: 'level-plus-mod' | 'half-level-plus-mod';
  /** Minimum prepared spells allowed after applying the formula. */
  min?: number;
}

export interface SpellcastingClassConfig {
  casterType: CasterType;
  spellcastingAbility?: AbilityId;
  preparedFormula?: PreparedFormulaConfig;
  knownProgression?: number[];
}

const WIZARD_SPELLBOOK_COUNTS = Array.from({ length: 20 }, (_, index) => 6 + index * 2);

export const SPELLCASTING_CONFIG: Record<string, SpellcastingClassConfig> = {
  Barbarian: { casterType: 'none' },
  Bard: {
    casterType: 'full',
    spellcastingAbility: 'cha',
    knownProgression: [
      4, 5, 6, 7, 8, 9, 10, 11, 12, 14,
      15, 15, 16, 18, 19, 19, 20, 22, 22, 22,
    ],
  },
  Cleric: {
    casterType: 'full',
    spellcastingAbility: 'wis',
    preparedFormula: { type: 'level-plus-mod', min: 1 },
  },
  Druid: {
    casterType: 'full',
    spellcastingAbility: 'wis',
    preparedFormula: { type: 'level-plus-mod', min: 1 },
  },
  Fighter: { casterType: 'third', spellcastingAbility: 'int' },
  Monk: { casterType: 'none' },
  Paladin: {
    casterType: 'half',
    spellcastingAbility: 'cha',
    preparedFormula: { type: 'half-level-plus-mod', min: 1 },
  },
  Ranger: {
    casterType: 'half',
    spellcastingAbility: 'wis',
    knownProgression: [
      0, 2, 3, 3, 4, 4, 5, 5, 6, 6,
      7, 7, 8, 8, 9, 9, 10, 10, 11, 11,
    ],
  },
  Rogue: { casterType: 'third', spellcastingAbility: 'int' },
  Sorcerer: {
    casterType: 'full',
    spellcastingAbility: 'cha',
    knownProgression: [
      2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
      12, 12, 13, 13, 14, 14, 15, 15, 15, 15,
    ],
  },
  Warlock: {
    casterType: 'full',
    spellcastingAbility: 'cha',
    knownProgression: [
      2, 3, 4, 5, 6, 7, 8, 9, 10, 10,
      11, 11, 12, 12, 13, 13, 14, 14, 15, 15,
    ],
  },
  Wizard: {
    casterType: 'full',
    spellcastingAbility: 'int',
    preparedFormula: { type: 'level-plus-mod', min: 1 },
    knownProgression: WIZARD_SPELLBOOK_COUNTS,
  },
};

export function normalizeClassId(classId: string): string {
  const trimmed = classId.trim();
  if (!trimmed) {
    return classId;
  }
  const lower = trimmed.toLowerCase();
  const alias = CLASS_NAME_ALIASES[lower];
  if (alias) {
    return alias;
  }
  const [base] = trimmed.split(':');
  const canonical = base.trim();
  return canonical in SPELLCASTING_CONFIG ? canonical : trimmed;
}

const CLASS_NAME_ALIASES: Record<string, string> = {
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
  'fighter: eldritch knight': 'Fighter',
  'rogue: arcane trickster': 'Rogue',
};
