import { CharacterSheetData, InventoryItem } from '../types/characterSheet';
import {
  calculateModifier,
  calculateProficiencyBonus,
  calculateSkillModifier,
  skillToAbility
} from '../types/characterSheet';
import { getCharacterResources } from '../utils/resourceDetection';
import { EquipmentValidator } from '../utils/equipmentValidator';

type ArmorWeightClass = 'light' | 'medium' | 'heavy';
type WeaponCategory = 'simple' | 'martial';

export const EQUIPPED_ITEM_CAP = 25;

type ArmorDefinition = {
  pattern: string;
  weightClass: ArmorWeightClass;
};

const ARMOR_DEFINITIONS: ArmorDefinition[] = [
  { pattern: 'padded armor', weightClass: 'light' },
  { pattern: 'leather armor', weightClass: 'light' },
  { pattern: 'studded leather', weightClass: 'light' },
  { pattern: 'hide armor', weightClass: 'medium' },
  { pattern: 'chain shirt', weightClass: 'medium' },
  { pattern: 'scale mail', weightClass: 'medium' },
  { pattern: 'breastplate', weightClass: 'medium' },
  { pattern: 'half plate', weightClass: 'medium' },
  { pattern: 'ring mail', weightClass: 'heavy' },
  { pattern: 'chain mail', weightClass: 'heavy' },
  { pattern: 'splint', weightClass: 'heavy' },
  { pattern: 'plate', weightClass: 'heavy' },
];

type WeaponProfile = {
  damage: string;
  ability: 'strength' | 'dexterity';
  category: WeaponCategory;
};

const WEAPON_PROFILES: Record<string, WeaponProfile> = {
  'club': { damage: '1d4', ability: 'strength', category: 'simple' },
  'dagger': { damage: '1d4', ability: 'dexterity', category: 'simple' },
  'greatclub': { damage: '1d8', ability: 'strength', category: 'simple' },
  'handaxe': { damage: '1d6', ability: 'strength', category: 'simple' },
  'javelin': { damage: '1d6', ability: 'strength', category: 'simple' },
  'light hammer': { damage: '1d4', ability: 'strength', category: 'simple' },
  'mace': { damage: '1d6', ability: 'strength', category: 'simple' },
  'quarterstaff': { damage: '1d6', ability: 'strength', category: 'simple' },
  'sickle': { damage: '1d4', ability: 'strength', category: 'simple' },
  'spear': { damage: '1d6', ability: 'strength', category: 'simple' },
  'light crossbow': { damage: '1d8', ability: 'dexterity', category: 'simple' },
  'dart': { damage: '1d4', ability: 'dexterity', category: 'simple' },
  'shortbow': { damage: '1d6', ability: 'dexterity', category: 'simple' },
  'sling': { damage: '1d4', ability: 'dexterity', category: 'simple' },
  'battleaxe': { damage: '1d8', ability: 'strength', category: 'martial' },
  'flail': { damage: '1d8', ability: 'strength', category: 'martial' },
  'glaive': { damage: '1d10', ability: 'strength', category: 'martial' },
  'greataxe': { damage: '1d12', ability: 'strength', category: 'martial' },
  'greatsword': { damage: '2d6', ability: 'strength', category: 'martial' },
  'halberd': { damage: '1d10', ability: 'strength', category: 'martial' },
  'lance': { damage: '1d12', ability: 'strength', category: 'martial' },
  'longsword': { damage: '1d8', ability: 'strength', category: 'martial' },
  'maul': { damage: '2d6', ability: 'strength', category: 'martial' },
  'morningstar': { damage: '1d8', ability: 'strength', category: 'martial' },
  'pike': { damage: '1d10', ability: 'strength', category: 'martial' },
  'rapier': { damage: '1d8', ability: 'dexterity', category: 'martial' },
  'scimitar': { damage: '1d6', ability: 'dexterity', category: 'martial' },
  'shortsword': { damage: '1d6', ability: 'dexterity', category: 'martial' },
  'trident': { damage: '1d6', ability: 'strength', category: 'martial' },
  'war pick': { damage: '1d8', ability: 'strength', category: 'martial' },
  'warhammer': { damage: '1d8', ability: 'strength', category: 'martial' },
  'whip': { damage: '1d4', ability: 'dexterity', category: 'martial' },
  'blowgun': { damage: '1', ability: 'dexterity', category: 'martial' },
  'hand crossbow': { damage: '1d6', ability: 'dexterity', category: 'martial' },
  'heavy crossbow': { damage: '1d10', ability: 'dexterity', category: 'martial' },
  'longbow': { damage: '1d8', ability: 'dexterity', category: 'martial' },
  'net': { damage: '0', ability: 'strength', category: 'martial' },
  'sling bullet': { damage: '1d4', ability: 'dexterity', category: 'simple' },
};

const normaliseString = (value?: string): string =>
  (value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normaliseItemLabel = (value: string): string => normaliseString((value ?? '').split('|')[0]);

// Helper to remove quantity markers from item names (e.g., "Handaxe (4)" -> "Handaxe")
const stripQuantityFromName = (name: string): string => {
  return name.replace(/\s*\(\d+\)\s*$/, '').trim();
};

// Comprehensive normalization that handles D&D source tags like "|XPHB"
const norm = (s?: string): string =>
  (s ?? '')
    .toLowerCase()
    .replace(/[-|()_,.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const hasAny = (values: string[] | undefined, predicate: (value: string) => boolean): boolean =>
  !!values?.some((value) => predicate(normaliseString(value)));

const getArmorWeightClass = (itemName: string): ArmorWeightClass | null => {
  const normalised = normaliseItemLabel(itemName);
  const match = ARMOR_DEFINITIONS.find((definition) => normalised.includes(definition.pattern));
  return match ? match.weightClass : null;
};

const isShieldName = (itemName: string): boolean => normaliseItemLabel(itemName).includes('shield');

const findWeaponProfile = (itemName: string): { key: string; profile: WeaponProfile } | null => {
  const normalised = normaliseItemLabel(itemName);
  for (const [key, profile] of Object.entries(WEAPON_PROFILES)) {
    if (normalised.includes(key)) {
      return { key, profile };
    }
  }
  return null;
};

const cloneInventoryItem = (item: InventoryItem): InventoryItem => {
  const cloned: InventoryItem = {
    id: item.id,
    name: item.name,
    quantity: item.quantity,
  };

  if (item.equipped !== undefined) cloned.equipped = item.equipped;
  if (item.attuned !== undefined) cloned.attuned = item.attuned;
  if (item.itemId !== undefined) cloned.itemId = item.itemId;
  if (item.customProperties) cloned.customProperties = { ...item.customProperties };

  return cloned;
};

export type EquipmentCategory = 'armor' | 'shield' | 'weapon' | 'other';

export interface EquipmentMetadata {
  category: EquipmentCategory;
  armorType?: ArmorWeightClass;
  weaponCategory?: WeaponCategory;
}

export const getEquipmentMetadata = (itemName: string): EquipmentMetadata => {
  if (!itemName) return { category: 'other' };

  const cleanName = stripQuantityFromName(itemName);
  const declared = normaliseItemLabel(cleanName);

  if (declared.includes('shield') || isShieldName(cleanName)) {
    return { category: 'shield', armorType: 'light' };
  }

  const armorType = getArmorWeightClass(cleanName);
  if (armorType) return { category: 'armor', armorType };

  const weaponProfile = findWeaponProfile(cleanName);
  if (weaponProfile) {
    return {
      category: 'weapon',
      weaponCategory: weaponProfile.profile.category,
    };
  }

  return { category: 'other' };
};

const enforceItemCap = (equippedItemIds: string[]): string[] => {
  if (equippedItemIds.length <= EQUIPPED_ITEM_CAP) {
    return equippedItemIds;
  }
  return equippedItemIds.slice(0, EQUIPPED_ITEM_CAP);
};

const buildEquippedWeapons = (
  inventory: InventoryItem[],
  equippedSet: Set<string>
): InventoryItem[] =>
  inventory
    .filter((item) => equippedSet.has(item.id) && getEquipmentMetadata(item.name).category === 'weapon')
    .map((item) => cloneInventoryItem({ ...item, equipped: true }));

export const applyEquippedItems = (
  character: CharacterSheetData,
  equippedItemIdsInput: string[]
): CharacterSheetData => {
  const equippedItemIds = enforceItemCap(equippedItemIdsInput.filter(Boolean));
  const equippedSet = new Set(equippedItemIds);

  const updatedInventory = (character.inventory ?? []).map((item) => ({
    ...item,
    equipped: equippedSet.has(item.id),
  }));

  let equippedArmor: InventoryItem | undefined;
  let equippedShield: InventoryItem | undefined;

  updatedInventory.forEach((item) => {
    if (!equippedSet.has(item.id)) {
      return;
    }

    const metadata = getEquipmentMetadata(item.name);

    if (metadata.category === 'armor' && !equippedArmor) {
      equippedArmor = cloneInventoryItem({ ...item, equipped: true });
    }

    if (metadata.category === 'shield' && !equippedShield) {
      equippedShield = cloneInventoryItem({ ...item, equipped: true });
    }
  });

  const equippedWeapons = buildEquippedWeapons(updatedInventory, equippedSet);

  const {
    equippedArmor: _prevArmor,
    equippedShield: _prevShield,
    equippedWeapons: _prevWeapons,
    ...rest
  } = character;

  const nextCharacter: CharacterSheetData = {
    ...rest,
    inventory: updatedInventory,
    equippedItemIds,
    equippedWeapons,
  };

  if (equippedArmor) {
    nextCharacter.equippedArmor = equippedArmor;
  } else {
    delete (nextCharacter as Partial<CharacterSheetData>).equippedArmor;
  }

  if (equippedShield) {
    nextCharacter.equippedShield = equippedShield;
  } else {
    delete (nextCharacter as Partial<CharacterSheetData>).equippedShield;
  }

  nextCharacter.armorClass = EquipmentValidator.calculateArmorClass(nextCharacter);

  return nextCharacter;
};

type EquipCheck = { ok: boolean; reason?: string };

const SIMPLE_WEAPON_NAMES = [
  'club', 'dagger', 'greatclub', 'handaxe', 'javelin', 'light hammer', 'mace',
  'quarterstaff', 'sickle', 'spear', 'sling', 'shortbow', 'light crossbow', 'dart'
].map(norm);

const MARTIAL_WEAPON_NAMES = [
  'battleaxe', 'flail', 'glaive', 'greataxe', 'greatsword', 'halberd', 'lance', 'longsword',
  'maul', 'morningstar', 'pike', 'rapier', 'scimitar', 'shortsword', 'trident', 'war pick',
  'warhammer', 'whip', 'hand crossbow', 'heavy crossbow', 'longbow', 'net', 'blowgun'
].map(norm);

const normalizeWeaponCategory = (item: InventoryItem): WeaponCategory | 'other' => {
  const cleanName = stripQuantityFromName(item.name);

  // Check explicit fields first
  const raw = norm(item.weaponCategory ?? item.type ?? '');
  if (/(^| )simple( |$)/.test(raw)) return 'simple';
  if (/(^| )martial( |$)/.test(raw)) return 'martial';

  // Fall back to name inference
  const n = norm(cleanName);
  if (SIMPLE_WEAPON_NAMES.includes(n)) return 'simple';
  if (MARTIAL_WEAPON_NAMES.includes(n)) return 'martial';

  // If it looks like a weapon but we don't recognize it, assume martial (more restrictive)
  if (raw.includes('weapon')) return 'martial';

  return 'other';
};

const normalizeArmorCategory = (item: InventoryItem): ArmorWeightClass | 'shield' | 'other' => {
  const cleanName = stripQuantityFromName(item.name);
  const composite = normaliseString(item.armorCategory ?? item.type ?? cleanName);
  if (composite.includes('shield')) return 'shield';
  if (/(padded|leather|studded)/.test(composite)) return 'light';
  if (/(hide|chain shirt|scale mail|breastplate|half plate)/.test(composite)) return 'medium';
  if (/(ring mail|chain mail|splint|plate)/.test(composite)) return 'heavy';
  return 'other';
};

export const canEquipVerbose = (
  character: CharacterSheetData,
  item: InventoryItem
): EquipCheck => {
  const metadata = getEquipmentMetadata(item.name);

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log('[canEquipVerbose] Checking item:', {
      itemName: item.name,
      metadata,
      characterProficiencies: character.proficiencies
    });
  }

  if (metadata.category === 'other') {
    return { ok: true };
  }

  const profArmor = character.proficiencies?.armor?.map(normaliseString) ?? [];
  const profWeapons = character.proficiencies?.weapons?.map(normaliseString) ?? [];

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log('[canEquipVerbose] Proficiencies:', {
      profArmor,
      profWeapons
    });
  }

  if (metadata.category === 'weapon') {
    const cleanName = stripQuantityFromName(item.name);

    // Check exact name match
    const exact = profWeapons.some(prof => norm(prof) === norm(cleanName));

    // Get weapon category (simple/martial)
    const weaponCat = normalizeWeaponCategory(item);

    // Check for category proficiency - strip "weapon(s)" suffix and compare
    // Handles: "simple", "Simple", "simple weapons", "Simple Weapons", etc.
    const catTokens = profWeapons.map(prof => norm(prof).replace(/\s*weapons?\s*$/, '').trim());
    const hasCategory = weaponCat !== 'other' && catTokens.some(token =>
      token === weaponCat || token.includes(weaponCat)
    );

    const isProficient = exact || hasCategory;

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('[canEquipVerbose] Weapon check:', {
        exact,
        weaponCat,
        hasCategory,
        originalName: item.name,
        cleanedName: cleanName,
        normalizedName: norm(cleanName),
        isProficient,
        itemFields: {
          weaponCategory: item.weaponCategory,
          type: item.type
        },
        profWeaponsDetailed: profWeapons.map(p => ({
          original: p,
          normalized: norm(p),
          stripped: norm(p).replace(/\s*weapons?\s*$/, '').trim(),
          matchesExact: norm(p) === norm(cleanName),
          matchesCategory: norm(p).replace(/\s*weapons?\s*$/, '').trim() === weaponCat
        }))
      });
    }

    if (!isProficient) {
      return { ok: false, reason: `Not proficient with ${weaponCat === 'other' ? 'this' : weaponCat} weapon` };
    }

    return { ok: true };
  }

  if (metadata.category === 'shield') {
    const hasShield = hasAny(profArmor, (prof) => prof.includes('shield'));
    if (!hasShield) {
      return { ok: false, reason: 'Not proficient with shields' };
    }
    return { ok: true };
  }

  if (metadata.category === 'armor') {
    const armorCat = metadata.armorType ?? normalizeArmorCategory(item);
    if (armorCat === 'other') {
      return { ok: false, reason: 'Unknown armor category' };
    }

    // Check for armor proficiency - strip "armor/armour" suffix and compare
    // Handles: "light", "Light", "light armor", "Light Armor", etc.
    const catTokens = profArmor.map(prof => norm(prof).replace(/\s*armou?rs?\s*$/, '').trim());
    const hasArmor = catTokens.some(token =>
      token === armorCat || token.includes(armorCat)
    );

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('[canEquipVerbose] Armor check:', {
        armorCat,
        hasArmor,
        itemName: norm(item.name),
        profArmorDetailed: profArmor.map(p => ({
          original: p,
          normalized: norm(p),
          stripped: norm(p).replace(/\s*armou?rs?\s*$/, '').trim(),
          matchesCategory: norm(p).replace(/\s*armou?rs?\s*$/, '').trim() === armorCat
        }))
      });
    }

    if (!hasArmor) {
      return { ok: false, reason: `Not proficient with ${armorCat} armor` };
    }
    return { ok: true };
  }

  return { ok: true };
};


/**
 * Calculate all derived character values
 */
export function calculateDerivedValues(character: CharacterSheetData) {
  const proficiencyBonus = calculateProficiencyBonus(character.level);

  const abilityModifiers = {
    strength: calculateModifier(character.abilityScores.strength),
    dexterity: calculateModifier(character.abilityScores.dexterity),
    constitution: calculateModifier(character.abilityScores.constitution),
    intelligence: calculateModifier(character.abilityScores.intelligence),
    wisdom: calculateModifier(character.abilityScores.wisdom),
    charisma: calculateModifier(character.abilityScores.charisma),
  };

  const savingThrows = {
    strength: abilityModifiers.strength +
      (character.proficiencies?.savingThrows?.includes('Strength') ? proficiencyBonus : 0),
    dexterity: abilityModifiers.dexterity +
      (character.proficiencies?.savingThrows?.includes('Dexterity') ? proficiencyBonus : 0),
    constitution: abilityModifiers.constitution +
      (character.proficiencies?.savingThrows?.includes('Constitution') ? proficiencyBonus : 0),
    intelligence: abilityModifiers.intelligence +
      (character.proficiencies?.savingThrows?.includes('Intelligence') ? proficiencyBonus : 0),
    wisdom: abilityModifiers.wisdom +
      (character.proficiencies?.savingThrows?.includes('Wisdom') ? proficiencyBonus : 0),
    charisma: abilityModifiers.charisma +
      (character.proficiencies?.savingThrows?.includes('Charisma') ? proficiencyBonus : 0),
  };

  // Calculate AC using equipped items (this ensures AC is always recalculated when derived values are computed)
  const armorClass = EquipmentValidator.calculateArmorClass(character);

  const initiative = abilityModifiers.dexterity;
  const isPerceptionProficient = character.proficiencies?.skills?.includes('Perception') || false;
  const passivePerception = 10 + calculateSkillModifier(
    character.abilityScores.wisdom,
    proficiencyBonus,
    isPerceptionProficient
  );

  return {
    proficiencyBonus,
    abilityModifiers,
    savingThrows,
    armorClass,
    initiative,
    passivePerception
  };
}

/**
 * Get skill modifiers for all skills
 */
export function getSkillModifiers(
  character: CharacterSheetData,
  proficiencyBonus: number
) {
  const skills = [
    'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception',
    'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine',
    'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion',
    'Sleight of Hand', 'Stealth', 'Survival'
  ];

  return skills.reduce((acc, skill) => {
    const abilityKey = skillToAbility[skill];
    const abilityScore = character.abilityScores[abilityKey];
    const isProficient = character.proficiencies?.skills?.includes(skill) || false;

    acc[skill] = calculateSkillModifier(
      abilityScore,
      proficiencyBonus,
      isProficient
    );
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Calculate max HP based on class and constitution
 */
export function calculateMaxHP(
  character: CharacterSheetData,
  constitutionModifier: number
): number {
  // Base HP calculation (simplified - should use class hit dice)
  const classHitDice: Record<string, number> = {
    'Barbarian': 12,
    'Fighter': 10,
    'Paladin': 10,
    'Ranger': 10,
    'Bard': 8,
    'Cleric': 8,
    'Druid': 8,
    'Monk': 8,
    'Rogue': 8,
    'Warlock': 8,
    'Sorcerer': 6,
    'Wizard': 6,
  };

  const hitDie = classHitDice[character.class] || 8;
  const level1HP = hitDie + constitutionModifier;
  const additionalHP = (character.level - 1) * (Math.floor(hitDie / 2) + 1 + constitutionModifier);

  return level1HP + additionalHP;
}

/**
 * Get spell save DC and spell attack bonus
 */
export function getSpellcastingStats(
  character: CharacterSheetData,
  proficiencyBonus: number,
  abilityModifiers: Record<string, number>
) {
  // Determine spellcasting ability based on class
  const spellcastingAbility: Record<string, keyof typeof abilityModifiers> = {
    'Bard': 'charisma',
    'Cleric': 'wisdom',
    'Druid': 'wisdom',
    'Paladin': 'charisma',
    'Ranger': 'wisdom',
    'Sorcerer': 'charisma',
    'Warlock': 'charisma',
    'Wizard': 'intelligence',
  };

  const ability = spellcastingAbility[character.class];

  if (!ability) {
    return { spellSaveDC: 8, spellAttackBonus: 0 };
  }

  const abilityMod = abilityModifiers[ability];
  return {
    spellSaveDC: 8 + proficiencyBonus + abilityMod,
    spellAttackBonus: proficiencyBonus + abilityMod
  };
}

/**
 * Format a modifier for display (e.g., "+2" or "-1")
 */
export function formatModifierDisplay(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

/**
 * Get proficiency bonus display
 */
export function getProficiencyBonusDisplay(level: number): string {
  return `+${calculateProficiencyBonus(level)}`;
}

/**
 * Calculate spell slots based on class and level
 */
export function calculateSpellSlots(character: CharacterSheetData): Record<string, number> {
  // Simplified spell slot calculation
  // In a real implementation, this would use the full spell slot progression tables
  const fullCasters = ['Bard', 'Cleric', 'Druid', 'Sorcerer', 'Wizard'];
  const halfCasters = ['Paladin', 'Ranger'];

  if (fullCasters.includes(character.class)) {
    // Full caster progression (simplified)
    const slots: Record<string, number> = {};
    if (character.level >= 1) slots['1st'] = Math.min(4, 1 + Math.floor(character.level / 2));
    if (character.level >= 3) slots['2nd'] = Math.min(3, Math.floor((character.level - 2) / 2));
    if (character.level >= 5) slots['3rd'] = Math.min(3, Math.floor((character.level - 4) / 2));
    if (character.level >= 7) slots['4th'] = Math.min(3, Math.floor((character.level - 6) / 3));
    if (character.level >= 9) slots['5th'] = Math.min(2, Math.floor((character.level - 8) / 4));
    if (character.level >= 11) slots['6th'] = 1;
    if (character.level >= 13) slots['7th'] = 1;
    if (character.level >= 15) slots['8th'] = 1;
    if (character.level >= 17) slots['9th'] = 1;
    return slots;
  } else if (halfCasters.includes(character.class)) {
    // Half caster progression (simplified)
    const slots: Record<string, number> = {};
    if (character.level >= 2) slots['1st'] = Math.min(4, Math.floor(character.level / 2));
    if (character.level >= 5) slots['2nd'] = Math.min(3, Math.floor((character.level - 4) / 3));
    if (character.level >= 9) slots['3rd'] = Math.min(3, Math.floor((character.level - 8) / 4));
    if (character.level >= 13) slots['4th'] = Math.min(3, Math.floor((character.level - 12) / 5));
    if (character.level >= 17) slots['5th'] = Math.min(2, Math.floor((character.level - 16) / 6));
    return slots;
  }

  return {};
}

/**
 * Calculate movement speed based on species and other factors
 */
export function calculateSpeed(character: CharacterSheetData): number {
  // Base speeds by species (in feet)
  const baseSpeed: Record<string, number> = {
    'Dwarf': 25,
    'Elf': 30,
    'Halfling': 25,
    'Human': 30,
    'Dragonborn': 30,
    'Gnome': 25,
    'Half-Elf': 30,
    'Half-Orc': 30,
    'Tiefling': 30,
    'Aasimar': 30,
    'Goliath': 30,
    'Orc': 30,
  };

  return baseSpeed[character.species] || 30;
}

/**
 * Get hit dice string (e.g., "5d10")
 */
export function getHitDiceString(character: CharacterSheetData): string {
  const classHitDice: Record<string, number> = {
    'Barbarian': 12,
    'Fighter': 10,
    'Paladin': 10,
    'Ranger': 10,
    'Bard': 8,
    'Cleric': 8,
    'Druid': 8,
    'Monk': 8,
    'Rogue': 8,
    'Warlock': 8,
    'Sorcerer': 6,
    'Wizard': 6,
  };

  const hitDie = classHitDice[character.class] || 8;
  return `${character.level}d${hitDie}`;
}

/**
 * Check if a character has a specific proficiency
 */
export function hasProficiency(
  character: CharacterSheetData,
  type: 'armor' | 'weapons' | 'tools' | 'skills' | 'savingThrows',
  item: string
): boolean {
  const proficiencies = character.proficiencies?.[type] || [];
  return proficiencies.includes(item);
}

/**
 * Get all active resources for the character
 */
export function getActiveResources(character: CharacterSheetData) {
  return getCharacterResources(character);
}
