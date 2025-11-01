import { logger } from './logger';
// Parse complex D&D data structures (tables, lists, etc.)
export const parseComplexDnDEntry = (entry: any): string => {
  if (typeof entry === 'string') {
    return parseDnDTemplateTag(entry);
  }

  if (typeof entry !== 'object' || entry === null) {
    return String(entry);
  }

  // Handle arrays - recursively parse each element and join with paragraph breaks
  if (Array.isArray(entry)) {
    console.log('🔵 Parsing array with', entry.length, 'items');
    const result = entry
      .map((item: any) => parseComplexDnDEntry(item))
      .filter((text: string) => text.trim().length > 0) // Filter out empty strings from options/refs
      .join('\n\n'); // Use double newlines for paragraph spacing
    console.log('🔵 Array result length:', result.length, 'chars');
    // Convert newlines to <br> tags since the joined result contains newlines
    return result
      .replace(/\n\n+/g, '<br><br>')  // Paragraph breaks
      .replace(/\n/g, '<br>');         // Line breaks
  }

  // Handle table structures
  if (entry.type === 'table') {
    let result = '';

    if (entry.caption) {
      result += `${entry.caption}\n\n`;
    }

    // Format as a simple list instead of a table
    if (entry.rows && Array.isArray(entry.rows)) {
      entry.rows.forEach((row: any[]) => {
        if (Array.isArray(row) && row.length >= 2) {
          const cleanedRow = row.map((cell) =>
            typeof cell === 'string' ? parseDnDTemplateTag(cell) : String(cell)
          );
          // Format as "Label: Value" pairs
          result += `${cleanedRow[0]}: ${cleanedRow.slice(1).join(', ')}\n`;
        }
      });
    }

    return result;
  }

  // Handle named entry sections (like "Damage Resistance" in Rage)
  if (entry.type === 'entries' && entry.name) {
    let result = `<strong>${entry.name}:</strong> `;

    if (entry.entries && Array.isArray(entry.entries)) {
      const entryText = entry.entries
        .map((subEntry: any) => parseComplexDnDEntry(subEntry))
        .filter((text: string) => text.trim().length > 0)
        .join(' ');
      result += entryText;
    }

    return result;
  }

  // Handle list structures
  if (entry.type === 'list') {
    let result = '';

    if (entry.items && Array.isArray(entry.items)) {
      entry.items.forEach((item: any, index: number) => {
        if (item.name) {
          result += `• ${item.name}: `;
        }

        if (item.entries && Array.isArray(item.entries)) {
          const entries = item.entries
            .map((subEntry: any) => parseComplexDnDEntry(subEntry))
            .join(' ');
          result += entries;
        }

        if (index < entry.items.length - 1) {
          result += '\n\n';
        }
      });
    }

    return result;
  }

  // Handle options structures (choice prompts - skip these as they're for interactive choices)
  if (entry.type === 'options') {
    // Options are handled by the character generator UI, not displayed as text
    return '';
  }

  // Handle refClassFeature (references to other features - skip as they're pointers)
  if (entry.type === 'refClassFeature') {
    // These are references that get resolved elsewhere
    return '';
  }

  // Handle nested entry objects
  if (entry.entries && Array.isArray(entry.entries)) {
    const result = entry.entries
      .map((subEntry: any) => parseComplexDnDEntry(subEntry))
      .join(' ');
    return result;
  }

  // Handle benefits/description structure (common in feats)
  if (entry.benefits || entry.description) {
    let result = '';

    if (entry.description) {
      const desc = Array.isArray(entry.description)
        ? entry.description.map((d: any) => parseComplexDnDEntry(d)).join(' ')
        : parseComplexDnDEntry(entry.description);
      result += desc + '\n\n';
    }

    if (entry.benefits) {
      const benefits = Array.isArray(entry.benefits)
        ? entry.benefits.map((b: any) => '• ' + parseComplexDnDEntry(b)).join('\n')
        : '• ' + parseComplexDnDEntry(entry.benefits);
      result += benefits;
    }

    return result;
  }

  // Fallback for unknown object types

  // Check if it's a simple object with specific properties we can extract
  if (entry.text) {
    return parseDnDTemplateTag(entry.text);
  }

  if (entry.name && entry.description) {
    return `${entry.name}: ${parseDnDTemplateTag(entry.description)}`;
  }

  // If it looks like an object with limited keys, try to format it
  if (typeof entry === 'object' && entry !== null) {
    const keys = Object.keys(entry);
    if (keys.length <= 3) {
      const formatted = keys.map(key => `${key}: ${parseComplexDnDEntry(entry[key])}`).join(', ');
      return formatted;
    }
  }

  return '[Complex content - see source material]';
};

// Universal D&D template tag parser for cleaning D&D reference tags
// Handles tags like {@spell Fireball|XPHB}, {@skill Stealth|XPHB}, etc.

export const parseDnDTemplateTag = (text: string): string => {
  if (!text || typeof text !== 'string') return '';

  const result = text
    // Handle parenthetical references like (@sense Darkvision|XPHB)
    .replace(/\(@([^)]+)\)/g, (_fullMatch, content) => {

      const parts = content.split(' ');
      const tagType = parts[0];
      const tagContent = parts.slice(1).join(' ');

      // Handle pipe-separated content (name|source)
      const [name] = tagContent.includes('|')
        ? tagContent.split('|')
        : [tagContent, null];


      // Handle common parenthetical tags
      switch (tagType) {
        case 'sense':
          return name;
        case 'spell':
          return name;
        case 'item':
          return name;
        default:
          return name || '';
      }
    })
    .replace(/\{@([^}]+)\}/g, (_fullMatch, content) => {
      // Split on first space to get tag type and content
      const parts = content.split(' ');
      const tagType = parts[0];
      const tagContent = parts.slice(1).join(' ');

      const segments = tagContent.split('|').filter((segment: string) => segment.length > 0);
      const fallback = segments[0] ?? '';
      // For most tags, use the last segment if there are 3+ parts (for display text overrides)
      // But for filter tags, always use the first segment (the display text)
      const altDisplay = segments.length > 2 && tagType !== 'filter' ? segments[segments.length - 1] : fallback;
      const name = altDisplay || fallback;

      switch (tagType) {
        // Formatting
        case 'b':
          return name;
        case 'i':
          return name;
        case 'u':
          return name;

        // Game mechanics
        case 'dice':
          return name;
        case 'damage':
          return `${name} damage`;
        case 'hit':
          return `+${name} to hit`;
        case 'dc':
          return `DC ${name}`;
        case 'h':
          return 'hit';
        case 'm':
          return 'miss';

        // Game elements
        case 'spell':
          return name;
        case 'item':
          return name;
        case 'feat':
          return name;
        case 'condition':
          return name;
        case 'creature':
          return name;
        case 'class':
          return name;
        case 'background':
          return name;
        case 'race':
          return name;
        case 'skill':
          return name;
        case 'action':
          return name;
        case 'filter':
          return name;
        case 'variantrule':
          return name;
        case 'sense':
          return name;

        // Time and rest
        case 'rest':
          if (name === 'long') return 'Long Rest';
          if (name === 'short') return 'Short Rest';
          return name;
        case 'recharge':
          return `Recharge ${name}`;

        // Combat
        case 'atk':
          return `${name} attack`;

        // Fallback - return the content without the tag
        default:
          logger.warn('❓ Unknown tag type:', { tagType, content });
          return name || '';
      }
    });

  // Convert markdown formatting to HTML
  // First do bold (must come before italic to avoid conflicts)
  let withMarkdown = result.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
  // Then do italic - simple single asterisks that aren't adjacent to other asterisks
  withMarkdown = withMarkdown.replace(/\*([^\*]+)\*/g, '<em>$1</em>');

  // Convert newlines to HTML breaks
  // Double newlines become double <br> (paragraph-like spacing)
  // Single newlines become single <br>
  return withMarkdown
    .replace(/\n\n+/g, '<br><br>')  // Paragraph breaks
    .replace(/\n/g, '<br>')         // Line breaks
    .trim();
};

const shouldPreserveWord = (word: string) => {
  if (!word) return true;
  if (word.length <= 2 && word === word.toUpperCase()) return true; // Abbreviations like DC
  if (/^[A-Z]/.test(word)) return true; // Already capitalised
  return false;
};

const titleiseWords = (text: string): string => {
  const parts = text.split(/([\s-/]+)/);
  return parts
    .map((part) => {
      if (/^[\s-/]+$/.test(part)) {
        return part;
      }
      if (shouldPreserveWord(part)) {
        return part;
      }
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join('');
};

export const normaliseDisplayString = (
  value: string,
  options: { titleCase?: boolean } = {}
): string => {
  const parsed = parseDnDTemplateTag(value);
  const cleaned = parsed.replace(/\s+/g, ' ').trim();
  if (!options.titleCase) {
    return cleaned;
  }
  return titleiseWords(cleaned);
};

// Clean text by removing D&D template tags (simpler version for basic cleaning)
export const cleanDnDText = (text: string): string => {
  if (!text) return '';

  return text
    .replace(/\{@item ([^|]+)\|[^}]+\}/g, '$1')
    .replace(/\{@filter ([^|]+)\|[^}]+\}/g, '$1')
    .replace(/\{@skill ([^|]+)\|[^}]+\}/g, '$1')
    .replace(/\{@spell ([^|]+)\|[^}]+\}/g, '$1')
    .replace(/\{@condition ([^|]+)\|[^}]+\}/g, '$1')
    .replace(/\{@action ([^|]+)\|[^}]+\}/g, '$1')
    .replace(/\{@variantrule ([^|]+)\|[^}]+\}/g, '$1')
    .replace(/\{@sense ([^|]+)\|[^}]+\}/g, '$1')
    .replace(/\{@b ([^}]+)\}/g, '$1')
    .replace(/\{@i ([^}]+)\}/g, '$1')
    .replace(/\{@dice ([^}]+)\}/g, '$1')
    .replace(/\{@[^}]+\}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};
