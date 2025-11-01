/**
 * Utility for extracting narrative flavor text from D&D 5etools mechanics data
 * Skips mechanical entries like lists, ability scores, feat grants, etc.
 */

/**
 * Check if an entry is a mechanical entry (not narrative flavor)
 */
const isMechanicalEntry = (entry: any): boolean => {
  if (typeof entry !== 'object' || !entry) return false;

  // Skip list-type entries (equipment, skills, etc.)
  if (entry.type === 'list') return true;

  // Skip entries with mechanical names
  const mechanicalNames = [
    'ability scores',
    'feat',
    'skill proficiencies',
    'tool proficiencies',
    'equipment',
    'languages',
    'starting equipment',
    'proficiencies',
    'traits',
    'features',
  ];

  if (entry.name && typeof entry.name === 'string') {
    const nameLower = entry.name.toLowerCase();
    if (mechanicalNames.some(mech => nameLower.includes(mech))) {
      return true;
    }
  }

  return false;
};

/**
 * Extract text from an entry, recursively if needed
 */
const extractTextFromEntry = (entry: any): string => {
  // Plain string
  if (typeof entry === 'string') {
    return entry;
  }

  // Object with entries
  if (entry && typeof entry === 'object') {
    // Skip mechanical entries
    if (isMechanicalEntry(entry)) {
      return '';
    }

    // Extract from entries array
    if (Array.isArray(entry.entries)) {
      const texts = entry.entries
        .map((e: any) => extractTextFromEntry(e))
        .filter(Boolean);
      return texts.join(' ');
    }

    // Check for direct text property
    if (entry.text && typeof entry.text === 'string') {
      return entry.text;
    }
  }

  return '';
};

/**
 * Extract narrative flavor text from mechanics object
 * Used for background and species descriptions
 */
export const extractFlavorText = (mechanics: any, maxLength: number = 200): string => {
  if (!mechanics) return '';

  // Check for dedicated flavor fields first (from fluff-*.json files)
  if (mechanics.fluff) {
    if (typeof mechanics.fluff === 'string') return mechanics.fluff;
    if (Array.isArray(mechanics.fluff)) {
      const text = extractTextFromEntry(mechanics.fluff[0]);
      if (text) return text.substring(0, maxLength);
    }
    if (mechanics.fluff.entries && Array.isArray(mechanics.fluff.entries)) {
      const text = extractTextFromEntry(mechanics.fluff.entries[0]);
      if (text) return text.substring(0, maxLength);
    }
  }

  if (mechanics._fluff) {
    if (typeof mechanics._fluff === 'string') return mechanics._fluff;
  }

  // Look through entries array for narrative text
  if (mechanics.entries && Array.isArray(mechanics.entries)) {
    for (const entry of mechanics.entries) {
      // Plain string entry (most common for flavor)
      if (typeof entry === 'string') {
        // Skip short strings that look like headers
        if (entry.length > 30) {
          return entry.substring(0, maxLength);
        }
      }

      // Entry object with narrative content
      if (entry && typeof entry === 'object') {
        // Skip mechanical entries
        if (isMechanicalEntry(entry)) {
          continue;
        }

        // Entry with type "entries" and narrative content
        if (entry.type === 'entries' && entry.entries) {
          const text = extractTextFromEntry(entry.entries[0]);
          if (text && text.length > 30) {
            return text.substring(0, maxLength);
          }
        }

        // Entry with type "section" (used in some species)
        if (entry.type === 'section' && entry.entries) {
          const text = extractTextFromEntry(entry.entries[0]);
          if (text && text.length > 30) {
            return text.substring(0, maxLength);
          }
        }
      }
    }
  }

  // Fallback to first string in entries if nothing found
  if (mechanics.entries && Array.isArray(mechanics.entries)) {
    for (const entry of mechanics.entries) {
      if (typeof entry === 'string' && entry.length > 10) {
        return entry.substring(0, maxLength);
      }
    }
  }

  return '';
};

/**
 * Extract flavor text specifically for backgrounds
 * Backgrounds have a specific structure with narrative first, then mechanics
 */
export const extractBackgroundFlavorText = (mechanics: any): string => {
  if (!mechanics) return '';

  // Check for dedicated fluff field first (from fluff-backgrounds.json)
  if (mechanics.fluff) {
    if (typeof mechanics.fluff === 'string') return mechanics.fluff;
    if (Array.isArray(mechanics.fluff)) {
      const text = extractTextFromEntry(mechanics.fluff[0]);
      if (text) return text;
    }
    if (mechanics.fluff.entries && Array.isArray(mechanics.fluff.entries)) {
      const text = extractTextFromEntry(mechanics.fluff.entries[0]);
      if (text) return text;
    }
  }

  if (!mechanics.entries || !Array.isArray(mechanics.entries)) return '';

  // Background structure typically:
  // 1. First entry: Narrative flavor text (string or type: "entries")
  // 2. Subsequent entries: Mechanical lists (Ability Scores, Feat, Skills, etc.)

  // Look for first substantial narrative entry
  for (const entry of mechanics.entries) {
    // Plain string that's long enough to be narrative
    if (typeof entry === 'string' && entry.length > 50) {
      return entry;
    }

    // Entry object that's not mechanical
    if (entry && typeof entry === 'object' && !isMechanicalEntry(entry)) {
      // Has narrative entries
      if (entry.entries && Array.isArray(entry.entries)) {
        const firstText = entry.entries.find((e: any) => typeof e === 'string' && e.length > 50);
        if (firstText) return firstText;
      }
    }
  }

  return '';
};

/**
 * Extract flavor text specifically for species
 * Species often have lore text before traits
 */
export const extractSpeciesFlavorText = (mechanics: any): string => {
  if (!mechanics) return '';

  // Check for dedicated fluff field first (from fluff-races.json)
  if (mechanics.fluff) {
    if (typeof mechanics.fluff === 'string') return mechanics.fluff;
    if (Array.isArray(mechanics.fluff)) {
      const text = extractTextFromEntry(mechanics.fluff[0]);
      if (text) return text;
    }
    if (mechanics.fluff.entries && Array.isArray(mechanics.fluff.entries)) {
      const text = extractTextFromEntry(mechanics.fluff.entries[0]);
      if (text) return text;
    }
  }

  // Check dedicated lore fields
  if (mechanics.lore && typeof mechanics.lore === 'string') {
    return mechanics.lore;
  }

  // Look for first narrative paragraph in entries
  if (mechanics.entries && Array.isArray(mechanics.entries)) {
    for (const entry of mechanics.entries) {
      // First substantial string is usually lore
      if (typeof entry === 'string' && entry.length > 50) {
        // Make sure it's not a trait header
        if (!entry.match(/^(Darkvision|Speed|Size|Languages|Traits)/i)) {
          return entry;
        }
      }

      // Check nested entries for lore
      if (entry && typeof entry === 'object') {
        if (entry.type === 'section' && entry.name && entry.entries) {
          // Skip trait sections
          if (!entry.name.match(/trait|ability|feature/i)) {
            const text = extractTextFromEntry(entry.entries[0]);
            if (text && text.length > 50) return text;
          }
        }
      }
    }
  }

  return '';
};
