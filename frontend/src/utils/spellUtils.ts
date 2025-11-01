/**
 * Utility functions for spell handling
 */

import { SCHOOL_OPTIONS } from './spellConstants';

/**
 * Normalize a spell ID to a string
 */
export const normaliseSpellId = (value: string | number): string => String(value);

/**
 * Format a spell level for display (e.g., "Cantrip", "1st-level", "2nd-level")
 */
export const formatLevel = (level: number): string => {
  if (level === 0) {
    return 'Cantrip';
  }
  const suffix = level === 1 ? 'st' : level === 2 ? 'nd' : level === 3 ? 'rd' : 'th';
  return `${level}${suffix}-level`;
};

/**
 * Get the school name from a school code or school object
 */
export const getSchoolLabel = (schoolOrCode?: string | { code: string; name: string } | null): string => {
  // Extract the code from various formats
  let code: string | undefined;
  if (typeof schoolOrCode === 'string') {
    code = schoolOrCode;
  } else if (schoolOrCode && typeof schoolOrCode === 'object' && 'code' in schoolOrCode) {
    code = schoolOrCode.code;
  }

  const match = SCHOOL_OPTIONS.find((option) => option.value === code);
  return match?.label ?? 'Unknown';
};

/**
 * Normalize a class name to lowercase
 */
export const normalizeClassName = (name: string | undefined | null): string =>
  (name ?? '').trim().toLowerCase();

/**
 * Extract class names from a spell object
 */
export const extractSpellClassNames = (spell: Record<string, unknown>): string[] => {
  const names: string[] = [];

  if (Array.isArray((spell as { classes?: string[] }).classes)) {
    names.push(
      ...((spell as { classes?: string[] }).classes ?? [])
        .filter(Boolean)
        .map((cls) => normalizeClassName(String(cls)))
    );
  }

  const classSpells = (spell as { classSpells?: Array<{ class?: { name?: string } }> }).classSpells;
  if (Array.isArray(classSpells)) {
    names.push(
      ...classSpells
        .map((entry) => normalizeClassName(entry?.class?.name))
        .filter((cls) => cls.length > 0)
    );
  }

  return Array.from(new Set(names));
};
