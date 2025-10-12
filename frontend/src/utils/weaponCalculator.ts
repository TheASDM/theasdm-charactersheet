import { Item } from '../types/api';
import { CharacterSheetData, InventoryItem } from '../types/characterSheet';

interface WeaponStats {
  attackBonus: string;
  damage: string;
}

/**
 * Calculate weapon attack bonus and damage for a character
 */
export function calculateWeaponStats(
  weapon: Item | InventoryItem,
  character: CharacterSheetData
): WeaponStats {
  // Calculate proficiency bonus
  const proficiencyBonus = Math.ceil(character.level / 4) + 1;

  // Get ability modifiers
  const strMod = Math.floor((character.abilityScores.strength - 10) / 2);
  const dexMod = Math.floor((character.abilityScores.dexterity - 10) / 2);

  // Determine if weapon is finesse or ranged
  const isFinesse = isFinessWeapon(weapon);
  const isRanged = isRangedWeapon(weapon);

  // Choose ability modifier (finesse weapons can use STR or DEX, pick higher)
  let abilityMod = strMod;
  if (isRanged) {
    abilityMod = dexMod;
  } else if (isFinesse) {
    abilityMod = Math.max(strMod, dexMod);
  }

  // Check if character is proficient with this weapon
  const isProficient = isWeaponProficient(weapon, character);

  // Calculate attack bonus
  const attackBonus = abilityMod + (isProficient ? proficiencyBonus : 0);

  // Get weapon damage and add ability modifier
  const baseDamage = getWeaponDamage(weapon);
  const damageType = getWeaponDamageType(weapon);

  // Format results
  const attackBonusStr = attackBonus >= 0 ? `+${attackBonus}` : `${attackBonus}`;
  const abilityModStr = abilityMod >= 0 ? `+${abilityMod}` : `${abilityMod}`;
  const damageStr = baseDamage ? `${baseDamage}${abilityModStr} ${damageType}` : '—';

  return {
    attackBonus: attackBonusStr,
    damage: damageStr
  };
}

/**
 * Check if weapon has finesse property
 */
function isFinessWeapon(weapon: Item | InventoryItem): boolean {
  if ('property' in weapon && weapon.property) {
    return weapon.property.includes('finesse') || weapon.property.includes('F');
  }

  // Check by name for common finesse weapons
  const finessWeapons = ['rapier', 'shortsword', 'scimitar', 'dagger', 'dart'];
  return finessWeapons.some(fw => weapon.name.toLowerCase().includes(fw));
}

/**
 * Check if weapon is ranged
 */
function isRangedWeapon(weapon: Item | InventoryItem): boolean {
  if ('type' in weapon) {
    return weapon.type === 'R' || weapon.type === 'A'; // Ranged or Ammunition
  }

  // Check by name for common ranged weapons
  const rangedWeapons = ['bow', 'crossbow', 'dart', 'javelin', 'sling', 'blowgun'];
  return rangedWeapons.some(rw => weapon.name.toLowerCase().includes(rw));
}

/**
 * Get weapon base damage
 */
function getWeaponDamage(weapon: Item | InventoryItem): string {
  // If it's a custom item with damage property
  if ('customProperties' in weapon && weapon.customProperties?.damage) {
    return weapon.customProperties.damage as string;
  }

  // If it's an API item with damage data
  if ('dmg1' in weapon && weapon.dmg1) {
    return weapon.dmg1;
  }

  // Common weapon damage by name
  const weaponDamageMap: { [key: string]: string } = {
    'dagger': '1d4',
    'shortsword': '1d6',
    'rapier': '1d8',
    'longsword': '1d8',
    'greatsword': '2d6',
    'greataxe': '1d12',
    'handaxe': '1d6',
    'battleaxe': '1d8',
    'mace': '1d6',
    'warhammer': '1d8',
    'maul': '2d6',
    'club': '1d4',
    'quarterstaff': '1d6',
    'spear': '1d6',
    'pike': '1d10',
    'shortbow': '1d6',
    'longbow': '1d8',
    'light crossbow': '1d8',
    'heavy crossbow': '1d10',
    'dart': '1d4',
    'javelin': '1d6',
    'sling': '1d4',
  };

  const lowerName = weapon.name.toLowerCase();
  for (const [weaponName, damage] of Object.entries(weaponDamageMap)) {
    if (lowerName.includes(weaponName)) {
      return damage;
    }
  }

  return '1d6'; // Default damage
}

/**
 * Get weapon damage type
 */
function getWeaponDamageType(weapon: Item | InventoryItem): string {
  // If it's an API item with damage type
  if ('dmgType' in weapon && weapon.dmgType) {
    return weapon.dmgType;
  }

  // Common damage types by weapon name
  const weaponTypeMap: { [key: string]: string } = {
    'sword': 'slashing',
    'axe': 'slashing',
    'mace': 'bludgeoning',
    'hammer': 'bludgeoning',
    'club': 'bludgeoning',
    'maul': 'bludgeoning',
    'dagger': 'piercing',
    'spear': 'piercing',
    'pike': 'piercing',
    'rapier': 'piercing',
    'bow': 'piercing',
    'crossbow': 'piercing',
    'dart': 'piercing',
    'javelin': 'piercing',
    'sling': 'bludgeoning',
  };

  const lowerName = weapon.name.toLowerCase();
  for (const [weaponType, damageType] of Object.entries(weaponTypeMap)) {
    if (lowerName.includes(weaponType)) {
      return damageType;
    }
  }

  return 'slashing'; // Default damage type
}

/**
 * Check if character is proficient with weapon
 */
function isWeaponProficient(weapon: Item | InventoryItem, character: CharacterSheetData): boolean {
  // Check explicit weapon proficiencies
  const weaponProfs = character.proficiencies?.weapons || [];
  if (weaponProfs.some(prof => weapon.name.toLowerCase().includes(prof.toLowerCase()))) {
    return true;
  }

  // Class-based proficiencies (simplified)
  const classProficiencies: { [key: string]: string[] } = {
    'fighter': ['simple', 'martial'],
    'paladin': ['simple', 'martial'],
    'ranger': ['simple', 'martial'],
    'barbarian': ['simple', 'martial'],
    'rogue': ['simple', 'hand crossbow', 'longsword', 'rapier', 'shortsword'],
    'monk': ['simple', 'shortsword'],
    'cleric': ['simple'],
    'druid': ['simple'],
    'wizard': ['dagger', 'dart', 'sling', 'quarterstaff', 'light crossbow'],
    'sorcerer': ['dagger', 'dart', 'sling', 'quarterstaff', 'light crossbow'],
    'warlock': ['simple'],
    'bard': ['simple', 'hand crossbow', 'longsword', 'rapier', 'shortsword'],
  };

  const classProfs = classProficiencies[character.class.toLowerCase()] || [];

  // Check if proficient with weapon category
  if (classProfs.includes('simple') && isSimpleWeapon(weapon)) {
    return true;
  }

  if (classProfs.includes('martial') && isMartialWeapon(weapon)) {
    return true;
  }

  // Check specific weapon proficiencies
  return classProfs.some(prof => weapon.name.toLowerCase().includes(prof));
}

/**
 * Check if weapon is a simple weapon
 */
function isSimpleWeapon(weapon: Item | InventoryItem): boolean {
  if ('weaponCategory' in weapon) {
    return weapon.weaponCategory === 'simple';
  }

  const simpleWeapons = [
    'club', 'dagger', 'dart', 'javelin', 'mace', 'quarterstaff', 'sickle', 'spear',
    'light crossbow', 'shortbow', 'sling'
  ];

  return simpleWeapons.some(sw => weapon.name.toLowerCase().includes(sw));
}

/**
 * Check if weapon is a martial weapon
 */
function isMartialWeapon(weapon: Item | InventoryItem): boolean {
  if ('weaponCategory' in weapon) {
    return weapon.weaponCategory === 'martial';
  }

  const martialWeapons = [
    'battleaxe', 'flail', 'glaive', 'greataxe', 'greatsword', 'halberd', 'lance',
    'longsword', 'maul', 'morningstar', 'pike', 'rapier', 'scimitar', 'shortsword',
    'trident', 'war pick', 'warhammer', 'whip', 'blowgun', 'hand crossbow',
    'heavy crossbow', 'longbow', 'net'
  ];

  return martialWeapons.some(mw => weapon.name.toLowerCase().includes(mw));
}