/**
 * Text processor for D&D Beyond markup tokens
 * Converts tokens like {@variantrule Resistance|XPHB} to readable text
 */

export interface TextProcessorOptions {
  removeSourceLinks?: boolean;
  simpleFormat?: boolean;
}

/**
 * Process D&D Beyond markup tokens and convert them to readable text
 */
export function processDbMarkup(text: string, _options?: TextProcessorOptions): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Future use for options
  // const { removeSourceLinks = true } = options;

  // Process different markup token types
  let processedText = text;

  // {@variantrule Name|Source} -> Name
  processedText = processedText.replace(/{@variantrule ([^|]+)\|[^}]+}/g, '$1');

  // {@sense Name|Source} -> Name
  processedText = processedText.replace(/{@sense ([^|]+)\|[^}]+}/g, '$1');

  // {@condition Name|Source} -> Name
  processedText = processedText.replace(/{@condition ([^|]+)\|[^}]+}/g, '$1');

  // {@spell Name|Source} -> Name
  processedText = processedText.replace(/{@spell ([^|]+)\|[^}]+}/g, '$1');

  // {@action Name|Source} -> Name
  processedText = processedText.replace(/{@action ([^|]+)\|[^}]+}/g, '$1');

  // {@skill Name|Source} -> Name
  processedText = processedText.replace(/{@skill ([^|]+)\|[^}]+}/g, '$1');

  // {@item Name|Source} -> Name
  processedText = processedText.replace(/{@item ([^|]+)\|[^}]+}/g, '$1');

  // {@damage dice} -> dice (e.g., {@damage 1d10} -> 1d10)
  processedText = processedText.replace(/{@damage ([^}]+)}/g, '$1');

  // {@dice expression} -> expression (e.g., {@dice 1d12} -> 1d12)
  processedText = processedText.replace(/{@dice ([^}]+)}/g, '$1');

  // {@dc value} -> DC value (e.g., {@dc 8} -> DC 8)
  processedText = processedText.replace(/{@dc ([^}]+)}/g, 'DC $1');

  // {@filter text|conditions} -> text (remove filter markup)
  processedText = processedText.replace(/{@filter ([^|]+)\|[^}]+}/g, '$1');

  // Handle any remaining {@...} tokens by extracting just the first part
  processedText = processedText.replace(/{@\w+ ([^|]+)(?:\|[^}]+)?}/g, '$1');

  return processedText;
}

/**
 * Process an array of description entries that may contain markup
 */
export function processDescriptionArray(description: any[]): string {
  if (!Array.isArray(description)) {
    return '';
  }

  return description
    .map(entry => {
      if (typeof entry === 'string') {
        return processDbMarkup(entry);
      } else if (typeof entry === 'object' && entry.entries) {
        // Handle nested entries
        return processDescriptionArray(entry.entries);
      } else if (typeof entry === 'object' && entry.type === 'list') {
        // Handle list items
        if (entry.items) {
          return entry.items
            .map((item: any) => {
              if (typeof item === 'string') {
                return `• ${processDbMarkup(item)}`;
              } else if (item.entries) {
                return `• ${processDescriptionArray(item.entries)}`;
              }
              return '';
            })
            .filter(Boolean)
            .join('\n');
        }
      } else if (typeof entry === 'object' && entry.type === 'table') {
        // Handle table - return a special marker that can be processed by components
        return `[[TABLE:${JSON.stringify(entry)}]]`;
      }
      return '';
    })
    .filter(Boolean)
    .join(' ');
}

/**
 * Extract tables from processed text and return both text and tables separately
 */
export function extractTablesFromText(text: string): { text: string; tables: any[] } {
  const tables: any[] = [];
  const tableRegex = /\[\[TABLE:(.*?)\]\]/gs; // Added 's' flag for multiline matching

  const cleanText = text.replace(tableRegex, (match, tableJson) => {
    try {
      const table = JSON.parse(tableJson);
      tables.push(table);
      return ''; // Remove table marker from text
    } catch (e) {
      console.warn('Failed to parse table JSON:', e, tableJson);
      return match; // Keep original if parsing fails
    }
  });

  return {
    text: cleanText.trim(),
    tables
  };
}

/**
 * Process trait description that may be a string, array, or object
 * Returns text, tables, and lists found
 */
export function processTraitDescriptionWithTables(description: any): { text: string; tables: any[]; lists: any[] } {
  const tables: any[] = [];
  const lists: any[] = [];
  const textParts: string[] = [];

  const processEntry = (entry: any): void => {
    if (typeof entry === 'string') {
      textParts.push(processDbMarkup(entry));
    } else if (typeof entry === 'object' && entry.type === 'table') {
      // Extract table directly
      tables.push(entry);
    } else if (typeof entry === 'object' && entry.type === 'list') {
      // Extract list directly for better formatting
      lists.push(entry);
    } else if (typeof entry === 'object' && entry.entries) {
      // Handle nested entries recursively
      if (Array.isArray(entry.entries)) {
        entry.entries.forEach(processEntry);
      }
    } else if (typeof entry === 'object') {
      // Handle other object types
      textParts.push(processDbMarkup(JSON.stringify(entry)));
    }
  };

  if (typeof description === 'string') {
    textParts.push(processDbMarkup(description));
  } else if (Array.isArray(description)) {
    description.forEach(processEntry);
  } else if (typeof description === 'object' && description) {
    // Handle object with entries
    if (description.entries) {
      if (Array.isArray(description.entries)) {
        description.entries.forEach(processEntry);
      }
    } else {
      // Fallback: stringify and process
      textParts.push(processDbMarkup(JSON.stringify(description)));
    }
  }

  return {
    text: textParts.filter(Boolean).join(' ').trim(),
    tables,
    lists
  };
}

/**
 * Process trait description that may be a string, array, or object
 */
export function processTraitDescription(description: any): string {
  if (typeof description === 'string') {
    return processDbMarkup(description);
  } else if (Array.isArray(description)) {
    return processDescriptionArray(description);
  } else if (typeof description === 'object' && description) {
    // Handle object with entries
    if (description.entries) {
      return processDescriptionArray(description.entries);
    }
    // Fallback: stringify and process
    return processDbMarkup(JSON.stringify(description));
  }
  return '';
}