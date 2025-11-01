/**
 * Unified spell filtering hook
 * Eliminates duplicate filtering logic across spell selection components
 */

import { useMemo } from 'react';
import type { Spell } from '@/types/api';
import type { LevelFilter, RitualFilter, ConcentrationFilter } from '@/utils/spellConstants';
import { extractSpellClassNames } from '@/utils/spellUtils';

export interface SpellFilterOptions {
  /** Filter by class name (e.g., "Wizard", "Cleric") */
  classId?: string;

  /** Filter by spell level (0-5 or 'all') */
  level?: LevelFilter;

  /** Filter by spell school (e.g., "A" for Abjuration, "V" for Evocation) */
  school?: string;

  /** Filter by ritual status */
  ritual?: RitualFilter;

  /** Filter by concentration requirement */
  concentration?: ConcentrationFilter;

  /** Search by spell name */
  searchTerm?: string;

  /** Minimum spell level (inclusive) */
  minLevel?: number;

  /** Maximum spell level (inclusive) */
  maxLevel?: number;

  /** Exclude cantrips (level 0 spells) */
  excludeCantrips?: boolean;
}

/**
 * Filter a list of spells based on the provided options
 *
 * @param spells - Array of spells to filter
 * @param options - Filter options
 * @returns Filtered array of spells
 *
 * @example
 * ```typescript
 * const wizardSpells = useSpellFiltering(allSpells, {
 *   classId: 'Wizard',
 *   minLevel: 1,
 *   maxLevel: 1,
 *   excludeCantrips: true,
 * });
 * ```
 */
export function useSpellFiltering(
  spells: Spell[],
  options: SpellFilterOptions
): Spell[] {
  return useMemo(() => {
    return spells.filter((spell) => {
      // Class filter
      if (options.classId) {
        const classNames = extractSpellClassNames(spell as any);
        const normalizedClassId = options.classId.toLowerCase();
        if (!classNames.includes(normalizedClassId)) {
          return false;
        }
      }

      // Level filter (exact match)
      if (options.level !== undefined && options.level !== 'all') {
        if (spell.level !== options.level) {
          return false;
        }
      }

      // Minimum level filter
      if (options.minLevel !== undefined && spell.level < options.minLevel) {
        return false;
      }

      // Maximum level filter
      if (options.maxLevel !== undefined && spell.level > options.maxLevel) {
        return false;
      }

      // Exclude cantrips filter
      if (options.excludeCantrips && spell.level === 0) {
        return false;
      }

      // School filter
      if (options.school && options.school !== 'all') {
        // Handle both schoolCode (string) and school (object or string)
        const schoolCode = (spell as any).schoolCode ||
                          (typeof spell.school === 'object' ? (spell.school as any)?.code : spell.school);
        if (schoolCode?.toUpperCase() !== options.school.toUpperCase()) {
          return false;
        }
      }

      // Search filter (case-insensitive spell name)
      if (options.searchTerm) {
        const term = options.searchTerm.toLowerCase();
        if (!spell.name.toLowerCase().includes(term)) {
          return false;
        }
      }

      // Ritual filter
      if (options.ritual === 'ritual' && !spell.isRitual) {
        return false;
      }
      if (options.ritual === 'non' && spell.isRitual) {
        return false;
      }

      // Concentration filter
      const isConcentration = spell.miscTags?.includes('Concentration');
      if (options.concentration === 'conc' && !isConcentration) {
        return false;
      }
      if (options.concentration === 'non' && isConcentration) {
        return false;
      }

      return true;
    });
  }, [spells, options.classId, options.level, options.school, options.ritual, options.concentration, options.searchTerm, options.minLevel, options.maxLevel, options.excludeCantrips]);
}
