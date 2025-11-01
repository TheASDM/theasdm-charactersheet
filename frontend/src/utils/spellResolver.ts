/**
 * Utility functions for resolving D&D spell references to database IDs
 * Handles 5etools format like "mending|xphb#c" → spell ID "623"
 */

export interface SpellReference {
  slug: string;
  source: string;
  level: number; // 0 for cantrips
}

/**
 * Parse a 5etools spell reference string into components
 * @param ref Format: "mending|xphb#c" or "fireball|xphb" or "cure wounds|xphb#1"
 * @returns {slug, source, level} or null if invalid format
 */
export function extractSpellSlugFromReference(ref: string): SpellReference | null {
  if (!ref || typeof ref !== 'string') return null;

  // Match pattern: spellname|source#level or spellname|source
  const match = ref.match(/^([^|]+)\|([^#]+)(#([0-9c]))?$/i);

  if (!match) {
    console.warn(`Invalid spell reference format: ${ref}`);
    return null;
  }

  const slug = match[1].toLowerCase().trim();
  const source = match[2].toUpperCase().trim();
  const levelIndicator = match[4]; // "c" or "1", "2", etc.

  let level = 0; // Default to cantrip
  if (levelIndicator) {
    if (levelIndicator.toLowerCase() === 'c') {
      level = 0; // Cantrip
    } else {
      level = parseInt(levelIndicator, 10);
    }
  }

  return { slug, source, level };
}

/**
 * Resolve an array of spell references to database IDs
 * @param refs Array of 5etools spell references like ["mending|xphb#c", "prestidigitation|xphb#c"]
 * @returns Array of spell ID strings like ["623", "662"]
 */
export async function resolveSpellSlugsToIds(refs: string[]): Promise<string[]> {
  if (!refs || refs.length === 0) return [];

  const ids: string[] = [];
  const errors: string[] = [];

  for (const ref of refs) {
    const parsed = extractSpellSlugFromReference(ref);

    if (!parsed) {
      errors.push(ref);
      continue;
    }

    try {
      // Query backend API by slug
      const response = await fetch(
        `/api/spells/slug/${parsed.slug}?source=${parsed.source}`
      );

      if (response.ok) {
        const spell = await response.json();

        // Verify level matches (safety check)
        if (spell.level !== parsed.level) {
          console.warn(
            `Level mismatch for ${parsed.slug}: expected ${parsed.level}, got ${spell.level}`
          );
        }

        ids.push(String(spell.id));
      } else {
        errors.push(ref);
        console.warn(
          `Spell not found in database: ${parsed.slug} (${parsed.source})`
        );
      }
    } catch (error) {
      errors.push(ref);
      console.error(`Failed to resolve spell: ${ref}`, error);
    }
  }

  if (errors.length > 0) {
    console.warn(
      `Failed to resolve ${errors.length} spell reference(s):`,
      errors
    );
  }

  return ids;
}

/**
 * Resolve a single spell reference to database ID
 * @param ref Single 5etools spell reference like "mending|xphb#c"
 * @returns Spell ID string or null if not found
 */
export async function resolveSpellSlugToId(ref: string): Promise<string | null> {
  const ids = await resolveSpellSlugsToIds([ref]);
  return ids.length > 0 ? ids[0] : null;
}

/**
 * Batch resolve multiple spell references with deduplication
 * @param refs Array of spell references (can include duplicates)
 * @returns Unique array of spell ID strings
 */
export async function resolveAndDeduplicateSpells(refs: string[]): Promise<string[]> {
  // Remove duplicates from input
  const uniqueRefs = Array.from(new Set(refs));

  const ids = await resolveSpellSlugsToIds(uniqueRefs);

  // Remove duplicates from output (in case different refs resolve to same spell)
  return Array.from(new Set(ids));
}
