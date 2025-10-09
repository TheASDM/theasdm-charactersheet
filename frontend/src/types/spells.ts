/**
 * Type definitions for the D&D 2024 spell system
 */

export type AbilityId = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

/**
 * D&D 2024 Caster Types:
 * - flexiblePrepared: Can change entire prepared list after long rest (Cleric, Druid, Paladin, Ranger, Wizard)
 * - semiPrepared: Can only replace one spell at level up (Bard, Sorcerer, Warlock)
 * - none: No spellcasting
 * - futureSubclass: Reserved for subclass-granted spellcasting
 */
export type CasterType = 'flexiblePrepared' | 'semiPrepared' | 'none' | 'futureSubclass';

/**
 * Class-specific spellcasting configuration
 */
export interface ClassCastingConfig {
  casterType: CasterType;
  spellcastingAbility?: AbilityId;

  /** Number of cantrips at each level */
  cantripsAtLevel: Record<number, number>;

  /** Base number of prepared spells at each level (before ability modifier) */
  preparedAtLevel: Record<number, number>;

  /** Wizard-specific: uses spellbook */
  usesSpellbook?: boolean;

  /** Wizard-specific: uses table values instead of formula (true = use table, false/undefined = use level + mod) */
  usesPreparedTable?: boolean;

  /** Warlock-specific: Pact Magic (slots recover on short rest) */
  pactMagic?: boolean;

  /** Arcane Trickster-specific: must select Mage Hand at level 3 */
  requiresMageHandAtL3?: boolean;
}

/**
 * Subclass-specific spell configuration (future use)
 * For domain spells, oath spells, etc.
 */
export interface SubclassSpellConfig {
  classId: string;

  /** Spells that are always prepared at each level (don't count against limit) */
  alwaysPrepared?: Record<number, string[]>;

  /** Additional tags for special behavior */
  tags?: string[];
}
