import { Item } from '../types/api';
import {
  CharacterSheetData,
  InventoryItem,
  CharacterAction,
  AbilityScoreName,
  ActionDamageDefinition,
} from '../types/characterSheet';
import { calculateModifier } from '../types/characterSheet';

type WeaponCategory = 'simple' | 'martial';

interface WeaponProfile {
  name: string;
  baseDice: string;
  damageType: string;
  category: WeaponCategory;
  properties?: string[];
  versatileDice?: string;
  finesse?: boolean;
  ranged?: boolean;
}

const WEAPON_PROFILES: WeaponProfile[] = [
  { name: 'club', baseDice: '1d4', damageType: 'bludgeoning', category: 'simple', properties: ['light'] },
  { name: 'dagger', baseDice: '1d4', damageType: 'piercing', category: 'simple', properties: ['finesse', 'light', 'thrown'], finesse: true, ranged: false },
  { name: 'dart', baseDice: '1d4', damageType: 'piercing', category: 'simple', ranged: true, properties: ['finesse', 'thrown'], finesse: true },
  { name: 'greatclub', baseDice: '1d8', damageType: 'bludgeoning', category: 'simple', properties: ['two-handed'] },
  { name: 'handaxe', baseDice: '1d6', damageType: 'slashing', category: 'simple', properties: ['light', 'thrown'] },
  { name: 'javelin', baseDice: '1d6', damageType: 'piercing', category: 'simple', properties: ['thrown'], ranged: true },
  { name: 'light hammer', baseDice: '1d4', damageType: 'bludgeoning', category: 'simple', properties: ['light', 'thrown'] },
  { name: 'mace', baseDice: '1d6', damageType: 'bludgeoning', category: 'simple', properties: [] },
  { name: 'quarterstaff', baseDice: '1d6', damageType: 'bludgeoning', category: 'simple', versatileDice: '1d8', properties: ['versatile'] },
  { name: 'sickle', baseDice: '1d4', damageType: 'slashing', category: 'simple', properties: ['light'] },
  { name: 'spear', baseDice: '1d6', damageType: 'piercing', category: 'simple', versatileDice: '1d8', properties: ['thrown', 'versatile'] },
  { name: 'light crossbow', baseDice: '1d8', damageType: 'piercing', category: 'simple', ranged: true, properties: ['loading', 'two-handed'] },
  { name: 'shortbow', baseDice: '1d6', damageType: 'piercing', category: 'simple', ranged: true, properties: ['two-handed'] },
  { name: 'sling', baseDice: '1d4', damageType: 'bludgeoning', category: 'simple', ranged: true, properties: ['ammunition'] },

  { name: 'battleaxe', baseDice: '1d8', damageType: 'slashing', category: 'martial', versatileDice: '1d10', properties: ['versatile'] },
  { name: 'flail', baseDice: '1d8', damageType: 'bludgeoning', category: 'martial', properties: [] },
  { name: 'glaive', baseDice: '1d10', damageType: 'slashing', category: 'martial', properties: ['reach', 'heavy', 'two-handed'] },
  { name: 'greataxe', baseDice: '1d12', damageType: 'slashing', category: 'martial', properties: ['heavy', 'two-handed'] },
  { name: 'greatsword', baseDice: '2d6', damageType: 'slashing', category: 'martial', properties: ['heavy', 'two-handed'] },
  { name: 'halberd', baseDice: '1d10', damageType: 'slashing', category: 'martial', properties: ['reach', 'heavy', 'two-handed'] },
  { name: 'lance', baseDice: '1d12', damageType: 'piercing', category: 'martial', properties: ['reach', 'special'] },
  { name: 'longsword', baseDice: '1d8', damageType: 'slashing', category: 'martial', versatileDice: '1d10', properties: ['versatile'] },
  { name: 'maul', baseDice: '2d6', damageType: 'bludgeoning', category: 'martial', properties: ['heavy', 'two-handed'] },
  { name: 'morningstar', baseDice: '1d8', damageType: 'piercing', category: 'martial', properties: [] },
  { name: 'pike', baseDice: '1d10', damageType: 'piercing', category: 'martial', properties: ['reach', 'heavy', 'two-handed'] },
  { name: 'rapier', baseDice: '1d8', damageType: 'piercing', category: 'martial', properties: ['finesse'], finesse: true },
  { name: 'scimitar', baseDice: '1d6', damageType: 'slashing', category: 'martial', properties: ['finesse', 'light'], finesse: true },
  { name: 'shortsword', baseDice: '1d6', damageType: 'piercing', category: 'martial', properties: ['finesse', 'light'], finesse: true },
  { name: 'trident', baseDice: '1d6', damageType: 'piercing', category: 'martial', versatileDice: '1d8', properties: ['thrown', 'versatile'] },
  { name: 'war pick', baseDice: '1d8', damageType: 'piercing', category: 'martial', properties: [] },
  { name: 'warhammer', baseDice: '1d8', damageType: 'bludgeoning', category: 'martial', versatileDice: '1d10', properties: ['versatile'] },
  { name: 'whip', baseDice: '1d4', damageType: 'slashing', category: 'martial', properties: ['finesse', 'reach'], finesse: true },
  { name: 'blowgun', baseDice: '1', damageType: 'piercing', category: 'martial', ranged: true, properties: ['loading'] },
  { name: 'hand crossbow', baseDice: '1d6', damageType: 'piercing', category: 'martial', ranged: true, properties: ['light', 'loading'] },
  { name: 'heavy crossbow', baseDice: '1d10', damageType: 'piercing', category: 'martial', ranged: true, properties: ['heavy', 'loading', 'two-handed'] },
  { name: 'longbow', baseDice: '1d8', damageType: 'piercing', category: 'martial', ranged: true, properties: ['heavy', 'two-handed'] },
  { name: 'net', baseDice: '0', damageType: 'bludgeoning', category: 'martial', properties: ['special'] },
];

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const normaliseLabel = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s*\(\d+\)\s*/g, '')
    .replace(/\|.*$/, '')
    .trim();

const findProfile = (weaponName: string): WeaponProfile | undefined => {
  const label = normaliseLabel(weaponName);
  return WEAPON_PROFILES.find((profile) => label.includes(profile.name));
};

const getAbilityForWeapon = (
  profile: WeaponProfile | undefined,
  character: CharacterSheetData
): AbilityScoreName => {
  if (profile?.ranged) {
    return 'dexterity';
  }

  if (profile?.finesse) {
    const str = calculateModifier(character.abilityScores.strength);
    const dex = calculateModifier(character.abilityScores.dexterity);
    return dex >= str ? 'dexterity' : 'strength';
  }

  return 'strength';
};

const extractNumericProperty = (weapon: Item | InventoryItem, key: string): number => {
  if ('customProperties' in weapon && weapon.customProperties) {
    const value = weapon.customProperties[key as keyof typeof weapon.customProperties];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const numeric = parseInt(value, 10);
      if (!Number.isNaN(numeric)) {
        return numeric;
      }
    }
  }
  return 0;
};

const extractMagicBonus = (weapon: Item | InventoryItem): number => {
  const nameMatch = weapon.name.match(/^\s*\+(\d+)/);
  if (nameMatch) {
    const parsed = parseInt(nameMatch[1], 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  const customBonus = extractNumericProperty(weapon, 'attackBonus');
  if (customBonus) {
    return customBonus;
  }

  const genericBonus = extractNumericProperty(weapon, 'bonus');
  return genericBonus;
};

const extractDamageBonus = (weapon: Item | InventoryItem): number => {
  const customDamage = extractNumericProperty(weapon, 'damageBonus');
  if (customDamage) {
    return customDamage;
  }
  return extractMagicBonus(weapon);
};

const determineProficiency = (
  weapon: Item | InventoryItem,
  character: CharacterSheetData,
  profile: WeaponProfile | undefined
): boolean => {
  const proficiencies = character.proficiencies?.weapons ?? [];
  const label = weapon.name.toLowerCase();

  if (proficiencies.some((prof) => label.includes(prof.toLowerCase()))) {
    return true;
  }

  const className = character.class.toLowerCase();
  const classProficiencies: Record<string, Array<string | WeaponCategory>> = {
    fighter: ['simple', 'martial'],
    paladin: ['simple', 'martial'],
    ranger: ['simple', 'martial'],
    barbarian: ['simple', 'martial'],
    rogue: ['simple', 'hand crossbow', 'longsword', 'rapier', 'shortsword'],
    monk: ['simple', 'shortsword'],
    cleric: ['simple'],
    druid: ['simple'],
    wizard: ['dagger', 'dart', 'sling', 'quarterstaff', 'light crossbow'],
    sorcerer: ['dagger', 'dart', 'sling', 'quarterstaff', 'light crossbow'],
    warlock: ['simple'],
    bard: ['simple', 'hand crossbow', 'longsword', 'rapier', 'shortsword'],
    artificer: ['simple', 'martial'],
  };

  const classList = classProficiencies[className] ?? [];
  if (profile) {
    if (classList.includes(profile.category)) {
      return true;
    }
  }

  return classList.some((entry) => {
    if (entry === 'simple' || entry === 'martial') {
      return profile?.category === entry;
    }
    return label.includes(entry.toString());
  });
};

const buildDamageComponent = (
  baseDice: string,
  damageType: string,
  ability: AbilityScoreName,
  damageBonus: number,
  profile: WeaponProfile | undefined
): ActionDamageDefinition => {
  const noteParts: string[] = [];
  if (profile?.versatileDice) {
    noteParts.push(`Versatile ${profile.versatileDice}`);
  }
  // Note: Weapon properties are added to action.notes in buildWeaponAction, not here
  // to avoid duplication when deriveActionDisplay combines notes
  const component: ActionDamageDefinition = {
    dice: baseDice,
    damageType,
    abilityMod: baseDice !== '0',
    ability,
  };

  if (damageBonus) {
    component.bonus = damageBonus;
  }

  if (noteParts.length) {
    component.note = noteParts.join(' • ');
  }

  return component;
};

const inferDamageType = (weapon: Item | InventoryItem, profile: WeaponProfile | undefined): string => {
  if ('dmgType' in weapon && weapon.dmgType) {
    return weapon.dmgType.toLowerCase();
  }
  return profile?.damageType ?? 'slashing';
};

const inferBaseDice = (weapon: Item | InventoryItem, profile: WeaponProfile | undefined): string => {
  if ('customProperties' in weapon && weapon.customProperties?.damage) {
    return String(weapon.customProperties.damage);
  }

  if ('dmg1' in weapon && weapon.dmg1) {
    return weapon.dmg1;
  }

  return profile?.baseDice ?? '1d6';
};

export const buildWeaponAction = (
  weapon: Item | InventoryItem,
  character: CharacterSheetData
): CharacterAction => {
  const profile = findProfile(weapon.name);
  const ability = getAbilityForWeapon(profile, character);
  const proficient = determineProficiency(weapon, character, profile);
  const attackBonus = extractMagicBonus(weapon);
  const damageBonus = extractDamageBonus(weapon);

  const damageComponent = buildDamageComponent(
    inferBaseDice(weapon, profile),
    inferDamageType(weapon, profile),
    ability,
    damageBonus,
    profile
  );

  const inventoryId = 'id' in weapon ? (weapon as InventoryItem).id : undefined;
  const sourceId = inventoryId ? `inventory:${inventoryId}` : undefined;

  const action: CharacterAction = {
    name: weapon.name,
    type: 'weapon',
    attack: {
      kind: 'weapon',
      ability,
      proficient,
      ...(attackBonus ? { bonus: attackBonus } : {}),
    },
    damage: [damageComponent],
    healing: null,
    ...(profile?.properties?.length
      ? {
          notes: profile.properties.map((prop) => capitalize(prop)).join(', '),
        }
      : {}),
    tags: ['weapon'],
  };

  if (sourceId) {
    action.sourceId = sourceId;
  }

  return action;
};
