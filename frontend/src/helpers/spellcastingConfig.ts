import type {
  AbilityId,
  ClassCastingConfig,
  SubclassSpellConfig,
} from '../types/spells';

/**
 * D&D 2024 Class Spellcasting Configuration
 *
 * This defines spellcasting behavior for all classes at each level.
 * - Flexible Prepared Casters: Can change entire prepared list after long rest
 * - Semi-Prepared Casters: Can only replace one spell at level up
 */
export const CLASS_CONFIG: Record<string, ClassCastingConfig> = {
  // ===== FLEXIBLE PREPARED CASTERS =====
  // Can change entire prepared list after long rest

  Cleric: {
    casterType: 'flexiblePrepared',
    spellcastingAbility: 'wis',
    cantripsAtLevel: { 1: 3, 4: 4, 10: 5 }, // 3 at L1, 4 at L4, 5 at L10
    preparedAtLevel: {
      1: 4,
      2: 5,
      3: 6,
      4: 7,
      5: 9,
      6: 10,
      7: 11,
      8: 12,
      9: 14,
      10: 15,
      11: 16,
      13: 17,
      15: 18,
      17: 19,
      18: 20,
      19: 21,
      20: 22,
    },
    usesSpellbook: false,
    usesPreparedTable: true,
  },

  Druid: {
    casterType: 'flexiblePrepared',
    spellcastingAbility: 'wis',
    cantripsAtLevel: { 1: 2, 4: 3, 10: 4 }, // 2 at L1, 3 at L4, 4 at L10
    preparedAtLevel: {
      1: 4,
      2: 5,
      3: 6,
      4: 7,
      5: 9,
      6: 10,
      7: 11,
      8: 12,
      9: 14,
      10: 15,
      11: 16,
      13: 17,
      15: 18,
      17: 19,
      18: 20,
      19: 21,
      20: 22,
    },
    usesSpellbook: false,
    usesPreparedTable: true,
  },

  Paladin: {
    casterType: 'flexiblePrepared',
    spellcastingAbility: 'cha',
    cantripsAtLevel: {}, // No cantrips
    preparedAtLevel: {
      1: 2,
      2: 3,
      3: 4,
      4: 5,
      5: 6,
      7: 7,
      9: 9,
      11: 10,
      13: 11,
      15: 12,
      17: 14,
      19: 15,
    },
    usesSpellbook: false,
    usesPreparedTable: true,
  },

  Ranger: {
    casterType: 'flexiblePrepared',
    spellcastingAbility: 'wis',
    cantripsAtLevel: {}, // No cantrips (unless subclass grants)
    preparedAtLevel: {
      1: 2,
      2: 3,
      3: 4,
      4: 5,
      5: 6,
      7: 7,
      9: 9,
      11: 10,
      13: 11,
      15: 12,
      17: 14,
      19: 15,
    },
    usesSpellbook: false,
    usesPreparedTable: true,
  },

  Wizard: {
    casterType: 'flexiblePrepared',
    spellcastingAbility: 'int',
    cantripsAtLevel: { 1: 3, 4: 4, 10: 5 }, // 3 at L1, 4 at L4, 5 at L10
    preparedAtLevel: {
      1: 4,
      2: 5,
      3: 6,
      4: 7,
      5: 9,
      6: 10,
      7: 11,
      8: 12,
      9: 14,
      10: 15,
      11: 16,
      12: 16,
      13: 17,
      14: 18,
      15: 19,
      16: 21,
      17: 22,
      18: 23,
      19: 24,
      20: 25,
    },
    usesSpellbook: true,
    usesPreparedTable: true,
  },

  // ===== SEMI-PREPARED CASTERS =====
  // Can only replace one spell when gaining a level

  Bard: {
    casterType: 'semiPrepared',
    spellcastingAbility: 'cha',
    cantripsAtLevel: { 1: 2, 4: 3, 10: 4 }, // 2 at L1, 3 at L4, 4 at L10
    preparedAtLevel: {
      1: 4,
      2: 5,
      3: 6,
      4: 7,
      5: 8,
      6: 9,
      7: 10,
      8: 11,
      9: 12,
      10: 14,
      11: 15,
      14: 16,
      17: 18,
      18: 19,
      20: 22,
    },
    usesSpellbook: false,
  },

  Sorcerer: {
    casterType: 'semiPrepared',
    spellcastingAbility: 'cha',
    cantripsAtLevel: { 1: 4, 4: 5, 10: 6 }, // 4 at L1, 5 at L4, 6 at L10)
    preparedAtLevel: {
      1: 2,
      2: 3,
      3: 4,
      4: 5,
      5: 6,
      6: 7,
      7: 8,
      8: 9,
      9: 10,
      10: 11,
      11: 12,
      13: 13,
      15: 14,
      17: 15,
    },
    usesSpellbook: false,
  },

  Warlock: {
    casterType: 'semiPrepared',
    spellcastingAbility: 'cha',
    cantripsAtLevel: { 1: 2, 4: 3, 10: 4 }, // 2 at L1, 3 at L4, 4 at L10
    preparedAtLevel: {
      1: 2,
      2: 3,
      3: 4,
      4: 5,
      5: 6,
      6: 7,
      7: 8,
      8: 9,
      9: 10,
      11: 11,
      13: 12,
      15: 13,
      17: 14,
      19: 15,
    },
    pactMagic: true,
    usesSpellbook: false,
  },

  // ===== THIRD-CASTERS =====
  // No spellcasting until level 3

  Fighter: {
    casterType: 'none', // Until level 3 (Eldritch Knight)
    spellcastingAbility: 'int',
    cantripsAtLevel: {},
    preparedAtLevel: {},
  },

  Rogue: {
    casterType: 'none', // Until level 3 (Arcane Trickster)
    spellcastingAbility: 'int',
    cantripsAtLevel: {},
    preparedAtLevel: {},
    requiresMageHandAtL3: true,
  },

  // ===== NON-CASTERS =====

  Barbarian: {
    casterType: 'none',
    cantripsAtLevel: {},
    preparedAtLevel: {},
  },

  Monk: {
    casterType: 'none',
    cantripsAtLevel: {},
    preparedAtLevel: {},
  },
};

/**
 * Future: Subclass-specific spell configuration
 * For domain spells (Cleric), oath spells (Paladin), etc.
 * Currently empty - will be populated in future sprints.
 */
export const SUBCLASS_CONFIG: Record<string, SubclassSpellConfig> = {};

/**
 * DEPRECATED: Old configuration structure - kept for backward compatibility
 * TODO: Remove once all code is migrated to CLASS_CONFIG
 */
export type OldCasterType = 'none' | 'full' | 'half' | 'third';

export interface PreparedFormulaConfig {
  type: 'level-plus-mod' | 'half-level-plus-mod';
  min?: number;
}

export interface SpellcastingClassConfig {
  casterType: OldCasterType;
  spellcastingAbility?: AbilityId;
  preparedFormula?: PreparedFormulaConfig;
  knownProgression?: number[];
}

const WIZARD_SPELLBOOK_COUNTS = Array.from(
  { length: 20 },
  (_, index) => 6 + index * 2
);

export const SPELLCASTING_CONFIG: Record<string, SpellcastingClassConfig> = {
  Barbarian: { casterType: 'none' },
  Bard: {
    casterType: 'full',
    spellcastingAbility: 'cha',
    knownProgression: [
      4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 15, 16, 18, 19, 19, 20, 22, 22, 22,
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
      0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11,
    ],
  },
  Rogue: { casterType: 'third', spellcastingAbility: 'int' },
  Sorcerer: {
    casterType: 'full',
    spellcastingAbility: 'cha',
    knownProgression: [
      2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15,
    ],
  },
  Warlock: {
    casterType: 'full',
    spellcastingAbility: 'cha',
    knownProgression: [
      2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15,
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
