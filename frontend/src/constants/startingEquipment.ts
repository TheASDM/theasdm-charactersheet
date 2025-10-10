/**
 * Starting Equipment by Class - D&D 2024 Rules
 *
 * This file defines the starting equipment for each class at level 1.
 * Equipment choices are represented as objects with 'A' and 'B' properties
 * to show the player what options they would have had.
 */

export interface EquipmentChoice {
  A: string[];
  B: string[];
  C?: string[];
}

export type ClassStartingEquipment = (string | EquipmentChoice)[];

export const CLASS_STARTING_EQUIPMENT: Record<string, ClassStartingEquipment> = {
  Barbarian: [
    'Greataxe',
    'Handaxe (4)',
    'Explorer\'s Pack',
    '15 gp'
  ],

  Bard: [
    'Rapier',
    'Lute',
    'Leather Armor',
    'Dagger (2)',
    'Entertainer\'s Pack',
    '11 gp'
  ],

  Cleric: [
    'Mace',
    'Scale Mail',
    'Light Crossbow',
    'Crossbow Bolts (20)',
    'Shield',
    'Holy Symbol',
    'Priest\'s Pack',
    '7 gp'
  ],

  Druid: [
    'Scimitar',
    'Leather Armor',
    'Wooden Shield',
    'Druidic Focus',
    'Explorer\'s Pack',
    '9 gp'
  ],

  Fighter: [
    'Chain Mail',
    'Greatsword',
    'Light Crossbow',
    'Crossbow Bolts (20)',
    'Dungeoneer\'s Pack',
    '4 gp'
  ],

  Monk: [
    'Shortsword',
    'Dart (10)',
    'Explorer\'s Pack',
    '11 gp'
  ],

  Paladin: [
    'Longsword',
    'Shield',
    'Javelin (5)',
    'Chain Mail',
    'Holy Symbol',
    'Priest\'s Pack',
    '9 gp'
  ],

  Ranger: [
    'Scale Mail',
    'Shortsword (2)',
    'Longbow',
    'Quiver',
    'Arrow (20)',
    'Dungeoneer\'s Pack',
    '11 gp'
  ],

  Rogue: [
    'Rapier',
    'Shortbow',
    'Quiver',
    'Arrow (20)',
    'Leather Armor',
    'Dagger (2)',
    'Thieves\' Tools',
    'Burglar\'s Pack',
    '8 gp'
  ],

  Sorcerer: [
    'Light Crossbow',
    'Crossbow Bolts (20)',
    'Arcane Focus',
    'Dagger (2)',
    'Dungeoneer\'s Pack',
    '15 gp'
  ],

  Warlock: [
    'Light Crossbow',
    'Crossbow Bolts (20)',
    'Arcane Focus',
    'Dagger (2)',
    'Leather Armor',
    'Scholar\'s Pack',
    '9 gp'
  ],

  Wizard: [
    'Quarterstaff',
    'Arcane Focus',
    'Spellbook',
    'Robe',
    'Scholar\'s Pack',
    '5 gp'
  ]
};

/**
 * Get starting equipment for a given class
 * @param className - Name of the class
 * @returns Array of equipment items (strings) or equipment choices (objects with A/B/C options)
 */
export function getClassStartingEquipment(className: string): ClassStartingEquipment {
  return CLASS_STARTING_EQUIPMENT[className] || [];
}

/**
 * Flatten equipment choices into a display-friendly format
 * Shows "Option A: X / Option B: Y" for choices
 * @param equipment - Equipment array from CLASS_STARTING_EQUIPMENT
 * @returns Array of strings for display
 */
export function flattenEquipmentForDisplay(equipment: ClassStartingEquipment): string[] {
  return equipment.map((item) => {
    if (typeof item === 'string') {
      return item;
    } else {
      // It's a choice object with A/B/C options
      const options = Object.entries(item)
        .map(([key, value]) => `Option ${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
        .join(' / ');
      return `(Choose one) ${options}`;
    }
  });
}
