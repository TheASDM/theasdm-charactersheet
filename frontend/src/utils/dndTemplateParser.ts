// Parse complex D&D data structures (tables, lists, etc.)
export const parseComplexDnDEntry = (entry: any): string => {
  if (typeof entry === 'string') {
    return parseDnDTemplateTag(entry);
  }

  if (typeof entry !== 'object' || entry === null) {
    return String(entry);
  }

  // Handle arrays - recursively parse each element and join
  if (Array.isArray(entry)) {
    const result = entry
      .map((item: any) => parseComplexDnDEntry(item))
      .filter((text: string) => text.trim().length > 0) // Filter out empty strings from options/refs
      .join(' ');
    return result;
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
      const formatted = keys.map(key => `${key}: ${entry[key]}`).join(', ');
      return formatted;
    }
  }

  return '[Complex content - see source material]';
};

// Universal D&D template tag parser for cleaning D&D reference tags
// Handles tags like {@spell Fireball|XPHB}, {@skill Stealth|XPHB}, etc.

export const parseDnDTemplateTag = (text: string): string => {
  if (!text) return '';

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

      // Handle pipe-separated content (name|source)
      const [name] = tagContent.includes('|')
        ? tagContent.split('|')
        : [tagContent, null];


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
          console.warn('❓ Unknown tag type:', { tagType, content });
          return name || '';
      }
    });

  return result.replace(/\s+/g, ' ').trim();
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
