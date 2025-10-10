import { logger } from './logger';
/**
 * Text processor for D&D Beyond markup tokens
 * Converts tokens like {@variantrule Resistance|XPHB} to readable text
 */

export interface TextProcessorOptions {
  removeSourceLinks?: boolean;
  simpleFormat?: boolean;
}

/**
 * Process D&D Beyond markup tokens and convert them to styled HTML
 */
export function processDbMarkup(text: string, _options?: TextProcessorOptions): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Process different markup token types with enhanced styling
  let processedText = text;

  // {@variantrule Name|Source} -> <strong>Name</strong>
  processedText = processedText.replace(/{@variantrule ([^|]+)\|[^}]+}/g, '<strong>$1</strong>');

  // {@sense Name|Source} -> <strong>Name</strong>
  processedText = processedText.replace(/{@sense ([^|]+)\|[^}]+}/g, '<strong>$1</strong>');

  // {@condition Name|Source} -> <em style="color: #ff6b6b;">Name</em>
  processedText = processedText.replace(/{@condition ([^|]+)\|[^}]+}/g, '<em style="color: #ff6b6b;">$1</em>');

  // {@spell Name|Source} -> <em style="color: #a855f7;">Name</em> (purple for spells)
  processedText = processedText.replace(/{@spell ([^|]+)\|[^}]+}/g, '<em style="color: #a855f7;">$1</em>');

  // {@action Name|Source} -> <strong style="color: #ce9016;">Name</strong> (gold for actions)
  processedText = processedText.replace(/{@action ([^|]+)\|[^}]+}/g, '<strong style="color: #ce9016;">$1</strong>');

  // {@skill Name|Source} -> <strong>Name</strong>
  processedText = processedText.replace(/{@skill ([^|]+)\|[^}]+}/g, '<strong>$1</strong>');

  // {@item Name|Source} -> <em style="color: #3b82f6;">Name</em> (blue for items)
  processedText = processedText.replace(/{@item ([^|]+)\|[^}]+}/g, '<em style="color: #3b82f6;">$1</em>');

  // {@damage dice} -> <strong style="color: #ef4444;">dice</strong> (red for damage)
  processedText = processedText.replace(/{@damage ([^}]+)}/g, '<strong style="color: #ef4444;">$1</strong>');

  // {@dice expression} -> <strong style="color: #10b981;">expression</strong> (green for dice)
  processedText = processedText.replace(/{@dice ([^}]+)}/g, '<strong style="color: #10b981;">$1</strong>');

  // {@dc value} -> <strong style="color: #ce9016;">DC value</strong> (gold for DCs)
  processedText = processedText.replace(/{@dc ([^}]+)}/g, '<strong style="color: #ce9016;">DC $1</strong>');

  // {@hit bonus} -> <strong style="color: #ef4444;">+bonus</strong> (red for attack bonuses)
  processedText = processedText.replace(/{@hit ([^}]+)}/g, '<strong style="color: #ef4444;">+$1</strong>');

  // {@recharge dice} -> <strong style="color: #8b5cf6;">(Recharge dice)</strong> (purple for recharge)
  processedText = processedText.replace(/{@recharge ([^}]+)}/g, '<strong style="color: #8b5cf6;">(Recharge $1)</strong>');

  // {@filter text|conditions} -> text (remove filter markup)
  processedText = processedText.replace(/{@filter ([^|]+)\|[^}]+}/g, '$1');

  // Handle any remaining {@...} tokens by extracting just the first part and making it bold
  processedText = processedText.replace(/{@\w+ ([^|]+)(?:\|[^}]+)?}/g, '<strong>$1</strong>');

  // Style common game terms even without markup
  processedText = processedText.replace(/\b(charges?|action|bonus action|reaction|long rest|short rest|saving throw)\b/gi, '<strong>$1</strong>');

  // Style currency
  processedText = processedText.replace(/\b(\d+)\s*(gp|sp|cp|pp)\b/g, '<span style="color: #ce9016; font-weight: 600;">$1 $2</span>');

  // Style dice notation that wasn't caught by markup
  processedText = processedText.replace(/\b(\d+d\d+(?:\s*[+-]\s*\d+)?)\b/g, '<strong style="color: #10b981;">$1</strong>');

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
      } else if (typeof entry === 'object' && entry.name && entry.entries) {
        // Handle D&D-style named sections with bold headers (like "Components")
        const headerText = `<strong style="color: #ce9016; font-size: 1.1em; display: block; margin-top: 0.75em; margin-bottom: 0.5em;">${entry.name}</strong>`;
        const contentText = processDescriptionArray(entry.entries);
        return `${headerText}${contentText}`;
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
      logger.warn('Failed to parse table JSON:', e, tableJson);
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
    } else if (typeof entry === 'object' && entry.name && entry.entries) {
      // Handle D&D-style named sections with bold headers
      const headerText = `<strong style="color: #ce9016; font-size: 1.1em; display: block; margin-top: 0.75em; margin-bottom: 0.5em;">${entry.name}</strong>`;
      textParts.push(headerText);
      if (Array.isArray(entry.entries)) {
        entry.entries.forEach(processEntry);
      }
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