/**
 * Constants for spell filtering and display
 */

export type LevelFilter = 'all' | 0 | 1 | 2 | 3 | 4 | 5;
export type RitualFilter = 'any' | 'ritual' | 'non';
export type ConcentrationFilter = 'any' | 'conc' | 'non';

/**
 * D&D 2024: Spell flow modes
 * @deprecated - Use CasterType from types/spells.ts instead
 */
export type SpellFlowMode = 'known' | 'prepared' | 'scribe' | 'none';

export const SCHOOL_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'Any School', value: 'all' },
  { label: 'Abjuration', value: 'A' },
  { label: 'Conjuration', value: 'C' },
  { label: 'Divination', value: 'D' },
  { label: 'Enchantment', value: 'E' },
  { label: 'Evocation', value: 'V' },
  { label: 'Illusion', value: 'I' },
  { label: 'Necromancy', value: 'N' },
  { label: 'Transmutation', value: 'T' },
];

export const LEVEL_OPTIONS: Array<{ label: string; value: LevelFilter }> = [
  { label: 'All Levels', value: 'all' },
  { label: 'Cantrips', value: 0 },
  { label: '1st Level', value: 1 },
  { label: '2nd Level', value: 2 },
  { label: '3rd Level', value: 3 },
  { label: '4th Level', value: 4 },
  { label: '5th Level', value: 5 },
];

/**
 * @deprecated - Old flow class categorization
 * Use CLASS_CONFIG from helpers/spellcastingConfig.ts instead
 */
export const KNOWN_FLOW_CLASSES = new Set(['bard', 'paladin', 'sorcerer', 'warlock', 'ranger']);
export const PREPARED_FLOW_CLASSES = new Set(['cleric', 'druid']);
export const SCRIBE_FLOW_CLASSES = new Set(['wizard']);
export const CANTRIP_ELIGIBLE_CLASSES = new Set(['bard', 'cleric', 'druid', 'sorcerer', 'warlock', 'wizard']);
