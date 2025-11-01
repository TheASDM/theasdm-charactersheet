/**
 * Utility for extracting granted spells from species/race mechanics data
 * Handles 5etools format with _versions array for lineages
 */

export interface SpeciesSpellGrant {
  spellRefs: string[]; // Raw 5etools references like "mending|xphb#c"
  ability?: string | string[] | undefined; // Spellcasting ability (e.g., "int" or ["int", "wis", "cha"])
  requiresLevel?: number | undefined; // For spells granted at higher levels (e.g., Elf Drow at level 3)
}

/**
 * Extract granted spells from species mechanics data
 * @param mechanics Full species mechanics object (from API response)
 * @param lineageChoice Specific lineage name (e.g., "Rock Gnome", "Drow", "High Elf")
 * @returns Array of spell grants with references and metadata
 */
export function extractSpeciesGrantedSpells(
  mechanics: any,
  lineageChoice?: string
): SpeciesSpellGrant[] {
  if (!mechanics) return [];

  const grants: SpeciesSpellGrant[] = [];

  // Check for _versions array (used for lineages like Gnome, Elf, etc.)
  if (mechanics._versions && Array.isArray(mechanics._versions)) {
    for (const version of mechanics._versions) {
      // If lineageChoice specified, only process matching version
      if (lineageChoice && version.name) {
        const versionName = String(version.name).toLowerCase();
        const choiceName = lineageChoice.toLowerCase();

        // Match if version name contains the lineage choice
        // e.g., "Gnome; Rock Gnome Lineage" matches "Rock Gnome"
        if (!versionName.includes(choiceName)) {
          continue;
        }
      }

      // Extract additionalSpells from this version
      const versionGrants = extractFromAdditionalSpells(version.additionalSpells);
      grants.push(...versionGrants);
    }
  }

  // Also check direct additionalSpells field (for non-lineage species)
  if (mechanics.additionalSpells) {
    const directGrants = extractFromAdditionalSpells(mechanics.additionalSpells);
    grants.push(...directGrants);
  }

  // Check innateSpells field (legacy format)
  if (mechanics.innateSpells) {
    const innateGrants = extractFromInnateSpells(mechanics.innateSpells);
    grants.push(...innateGrants);
  }

  return grants;
}

/**
 * Extract spells from additionalSpells field
 * Format: [{ known: { "1": ["spell|source#c"], ... }, ability: {...} }]
 */
function extractFromAdditionalSpells(additionalSpells: any): SpeciesSpellGrant[] {
  if (!additionalSpells || !Array.isArray(additionalSpells)) return [];

  const grants: SpeciesSpellGrant[] = [];

  for (const spellData of additionalSpells) {
    if (!spellData) continue;

    // Extract spells from "known" object (organized by character level)
    if (spellData.known) {
      for (const [level, spells] of Object.entries(spellData.known)) {
        if (!Array.isArray(spells)) continue;

        const requiresLevel = parseInt(level, 10);

        grants.push({
          spellRefs: spells.filter((s) => typeof s === 'string'),
          ability: extractAbility(spellData.ability),
          requiresLevel: requiresLevel > 1 ? requiresLevel : undefined,
        });
      }
    }

    // Extract from "expanded" object (for expanded spell lists like Cleric domains)
    if (spellData.expanded) {
      for (const [level, data] of Object.entries(spellData.expanded)) {
        const spells = (data as any)?.s;
        if (!Array.isArray(spells)) continue;

        const requiresLevel = parseInt(level, 10);

        grants.push({
          spellRefs: spells.filter((s) => typeof s === 'string'),
          ability: extractAbility(spellData.ability),
          requiresLevel: requiresLevel > 1 ? requiresLevel : undefined,
        });
      }
    }

    // Extract from "prepared" object (always prepared spells)
    if (spellData.prepared) {
      for (const [level, spells] of Object.entries(spellData.prepared)) {
        if (!Array.isArray(spells)) continue;

        const requiresLevel = parseInt(level, 10);

        grants.push({
          spellRefs: spells.filter((s) => typeof s === 'string'),
          ability: extractAbility(spellData.ability),
          requiresLevel: requiresLevel > 1 ? requiresLevel : undefined,
        });
      }
    }
  }

  return grants;
}

/**
 * Extract spells from innateSpells field (legacy format)
 */
function extractFromInnateSpells(innateSpells: any): SpeciesSpellGrant[] {
  if (!innateSpells) return [];

  const grants: SpeciesSpellGrant[] = [];

  // Handle different innateSpells formats
  if (Array.isArray(innateSpells)) {
    // Array format
    for (const entry of innateSpells) {
      if (typeof entry === 'string') {
        grants.push({ spellRefs: [entry] });
      } else if (entry.spells) {
        const spells = Array.isArray(entry.spells) ? entry.spells : [entry.spells];
        grants.push({
          spellRefs: spells.filter((s: any) => typeof s === 'string'),
          ability: extractAbility(entry.ability),
        });
      }
    }
  } else if (typeof innateSpells === 'object') {
    // Object format with levels
    for (const [, data] of Object.entries(innateSpells)) {
      const spells = (data as any)?.spells;
      if (!Array.isArray(spells)) continue;

      grants.push({
        spellRefs: spells.filter((s: any) => typeof s === 'string'),
        ability: extractAbility((data as any)?.ability),
      });
    }
  }

  return grants;
}

/**
 * Extract spellcasting ability from ability field
 * Handles formats: "int", ["int", "wis", "cha"], { choose: ["int", "wis", "cha"] }
 */
function extractAbility(ability: any): string | string[] | undefined {
  if (!ability) return undefined;

  if (typeof ability === 'string') {
    return ability;
  }

  if (Array.isArray(ability)) {
    return ability;
  }

  if (typeof ability === 'object') {
    // Handle { choose: ["int", "wis", "cha"] } format
    if (ability.choose && Array.isArray(ability.choose)) {
      return ability.choose;
    }
  }

  return undefined;
}

/**
 * Filter granted spells by character level
 * @param grants All spell grants from species
 * @param characterLevel Current character level
 * @returns Only spell grants available at this level
 */
export function filterSpellGrantsByLevel(
  grants: SpeciesSpellGrant[],
  characterLevel: number
): SpeciesSpellGrant[] {
  return grants.filter(
    (grant) => !grant.requiresLevel || grant.requiresLevel <= characterLevel
  );
}

/**
 * Flatten all spell references from grants into a single array
 * @param grants Array of spell grants
 * @returns Flat array of spell references
 */
export function flattenSpellReferences(grants: SpeciesSpellGrant[]): string[] {
  const refs: string[] = [];

  for (const grant of grants) {
    refs.push(...grant.spellRefs);
  }

  return refs;
}
