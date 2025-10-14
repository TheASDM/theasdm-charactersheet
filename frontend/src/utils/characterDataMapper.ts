import { CharacterBuilderData } from '../components/CharacterGeneratorWizard';
import { CharacterSheetData, calculateProficiencyBonus, calculateModifier, InventoryItem } from '../types/characterSheet';
import { CharacterFeatures, CharacterFeature } from '../types/features';
import { logger } from './logger';
import {
  parseClassFeatures,
  parseSpeciesTraits,
  parseFeatFeatures,
  parseBackgroundFeatures
} from './featureParser';
import { parseDnDTemplateTag } from './dndTemplateParser';
import { getAllQualifiedFeatureVariants } from '../services/featureVariantsService';
import { renderFeature, createCharacterContext } from './featureTemplateRenderer';
import { deriveGrantedSpells } from '../helpers/deriveGrantedSpells';

/**
 * Parse item name and quantity from strings like "Handaxes (4)" or "Rope"
 * @returns { name: string, quantity: number }
 */
function parseItemNameAndQuantity(itemString: string): { name: string; quantity: number } {
  // Match pattern: "Item Name (number)" where number is in parentheses at the end
  const match = itemString.match(/^(.+?)\s*\((\d+)\)$/);

  if (match) {
    return {
      name: match[1].trim(),
      quantity: parseInt(match[2], 10)
    };
  }

  // No quantity found, default to 1
  return {
    name: itemString.trim(),
    quantity: 1
  };
}

type ArmorDefinition = {
  pattern: string;
  baseAC: number;
  maxDexBonus: number | null;
};

const ARMOR_DEFINITIONS: ArmorDefinition[] = [
  { pattern: 'padded armor', baseAC: 11, maxDexBonus: null },
  { pattern: 'leather armor', baseAC: 11, maxDexBonus: null },
  { pattern: 'studded leather', baseAC: 12, maxDexBonus: null },
  { pattern: 'hide armor', baseAC: 12, maxDexBonus: 2 },
  { pattern: 'chain shirt', baseAC: 13, maxDexBonus: 2 },
  { pattern: 'scale mail', baseAC: 14, maxDexBonus: 2 },
  { pattern: 'breastplate', baseAC: 14, maxDexBonus: 2 },
  { pattern: 'half plate', baseAC: 15, maxDexBonus: 2 },
  { pattern: 'ring mail', baseAC: 14, maxDexBonus: 0 },
  { pattern: 'chain mail', baseAC: 16, maxDexBonus: 0 },
  { pattern: 'splint', baseAC: 17, maxDexBonus: 0 },
  { pattern: 'plate', baseAC: 18, maxDexBonus: 0 },
];

type WeaponDefinition = {
  damage: string;
  properties: string[];
  ability: 'strength' | 'dexterity';
  category: 'simple' | 'martial';
};

const WEAPON_DATA: Record<string, WeaponDefinition> = {
  'Dagger': { damage: '1d4', properties: ['finesse', 'light', 'thrown'], ability: 'dexterity', category: 'simple' },
  'Shortsword': { damage: '1d6', properties: ['finesse', 'light'], ability: 'dexterity', category: 'martial' },
  'Longsword': { damage: '1d8', properties: ['versatile'], ability: 'strength', category: 'martial' },
  'Rapier': { damage: '1d8', properties: ['finesse'], ability: 'dexterity', category: 'martial' },
  'Scimitar': { damage: '1d6', properties: ['finesse', 'light'], ability: 'dexterity', category: 'martial' },
  'Handaxe': { damage: '1d6', properties: ['light', 'thrown'], ability: 'strength', category: 'simple' },
  'Handaxes': { damage: '1d6', properties: ['light', 'thrown'], ability: 'strength', category: 'simple' }, // plural fallback
  'Javelin': { damage: '1d6', properties: ['thrown'], ability: 'strength', category: 'simple' },
  'Spear': { damage: '1d6', properties: ['thrown', 'versatile'], ability: 'strength', category: 'simple' },
  'Mace': { damage: '1d6', properties: [], ability: 'strength', category: 'simple' },
  'Club': { damage: '1d4', properties: ['light'], ability: 'strength', category: 'simple' },
  'Greatclub': { damage: '1d8', properties: ['two-handed'], ability: 'strength', category: 'simple' },
  'Greataxe': { damage: '1d12', properties: ['heavy', 'two-handed'], ability: 'strength', category: 'martial' },
  'Greatsword': { damage: '2d6', properties: ['heavy', 'two-handed'], ability: 'strength', category: 'martial' },
  'Maul': { damage: '2d6', properties: ['heavy', 'two-handed'], ability: 'strength', category: 'martial' },
  'Quarterstaff': { damage: '1d6', properties: ['versatile'], ability: 'strength', category: 'simple' },
  'Light Crossbow': { damage: '1d8', properties: ['ammunition', 'loading', 'two-handed'], ability: 'dexterity', category: 'simple' },
  'Heavy Crossbow': { damage: '1d10', properties: ['ammunition', 'heavy', 'loading', 'two-handed'], ability: 'dexterity', category: 'martial' },
  'Shortbow': { damage: '1d6', properties: ['ammunition', 'two-handed'], ability: 'dexterity', category: 'simple' },
  'Longbow': { damage: '1d8', properties: ['ammunition', 'heavy', 'two-handed'], ability: 'dexterity', category: 'martial' },
};

const shieldPatterns = ['shield'];

const ABILITY_KEY_MAP: Record<string, keyof CharacterBuilderData['abilityScores']> = {
  str: 'strength',
  strength: 'strength',
  dex: 'dexterity',
  dexterity: 'dexterity',
  con: 'constitution',
  constitution: 'constitution',
  int: 'intelligence',
  intelligence: 'intelligence',
  wis: 'wisdom',
  wisdom: 'wisdom',
  cha: 'charisma',
  charisma: 'charisma',
};

const normaliseAbilityKeyForTotals = (value: string): keyof CharacterBuilderData['abilityScores'] | null => {
  return ABILITY_KEY_MAP[value.toLowerCase()] ?? null;
};

const normaliseItemLabel = (value: string): string =>
  value.replace(/\|.*/g, '') // drop source suffix like "|xphb"
    .replace(/[^a-z0-9]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const findArmorDefinition = (itemName: string): ArmorDefinition | undefined => {
  const label = normaliseItemLabel(itemName);
  return ARMOR_DEFINITIONS.find((definition) => label.includes(definition.pattern));
};

const looksLikeShield = (itemName: string): boolean => {
  const label = normaliseItemLabel(itemName);
  return shieldPatterns.some((pattern) => label.includes(pattern));
};

const findWeaponDefinition = (
  itemName: string
): { key: string; definition: WeaponDefinition } | null => {
  const label = normaliseItemLabel(itemName);
  for (const [key, definition] of Object.entries(WEAPON_DATA)) {
    if (label.includes(key.toLowerCase())) {
      return { key, definition };
    }
  }
  return null;
};

function calculateArmorClassFromEquipment(
  abilityScores: CharacterSheetData['abilityScores'],
  equippedArmor?: InventoryItem,
  equippedShield?: InventoryItem
): number {
  const dexModifier = calculateModifier(abilityScores.dexterity);
  let baseAC = 10 + dexModifier;

  if (equippedArmor) {
    const definition = findArmorDefinition(equippedArmor.name);
    if (definition) {
      const dexContribution =
        definition.maxDexBonus === null
          ? dexModifier
          : Math.min(dexModifier, definition.maxDexBonus);
      baseAC = definition.baseAC + dexContribution;
    }
  }

  if (equippedShield && looksLikeShield(equippedShield.name)) {
    baseAC += 2;
  }

  return baseAC;
}

const formatItemName = (raw: string): string => {
  const cleaned = raw.replace(/_/g, ' ').trim();
  if (/^\d/.test(cleaned)) {
    return cleaned;
  }
  return titleCase(cleaned);
};


/**
 * Maps CharacterBuilderData from the generator to CharacterSheetData for the character sheet
 */
export function mapGeneratorDataToCharacterSheet(builderData: CharacterBuilderData): CharacterSheetData {
  const finalAbilityScores = calculateFinalAbilityScores(builderData);

  const characterLevel = deriveCharacterLevel(builderData);
  const proficiencyBonus = calculateProficiencyBonus(characterLevel);
  const constitutionModifier = calculateModifier(finalAbilityScores.constitution);
  const dexterityModifier = calculateModifier(finalAbilityScores.dexterity);
  const wisdomModifier = calculateModifier(finalAbilityScores.wisdom);

  const classHitDie = getClassHitDie(builderData.selectedClass);
  const structuredFeatures = extractStructuredFeatures(builderData);
  const hitPointAdjustment = calculateHitPointBonuses(builderData, structuredFeatures, characterLevel);
  const baseHitPoints = classHitDie + constitutionModifier;
  const totalHitPoints = Math.max(1, baseHitPoints + hitPointAdjustment);

  const skills = mapSkillProficiencies(builderData, finalAbilityScores, proficiencyBonus);
  const savingThrows = mapSavingThrows(builderData, finalAbilityScores, proficiencyBonus);

  const equipment = combineEquipment(builderData);
  const inventory = buildInventoryFromEquipment(equipment);
  const equippedItemIds: string[] = [];

  const weapons = mapInventoryToWeapons(inventory, finalAbilityScores, proficiencyBonus, builderData);
  const weaponActions = mapWeaponsToActions(weapons);

  const equippedLookup = new Set(equippedItemIds);
  inventory.forEach((item) => {
    item.equipped = equippedLookup.has(item.id);
  });

  const equipmentDerived = deriveEquipmentValues(finalAbilityScores, inventory, equippedItemIds);
  const armorClass = equipmentDerived.armorClass;

  const characterContext = createCharacterContext({
    ...builderData,
    level: characterLevel,
    abilityScores: finalAbilityScores,
    species: builderData.selectedSpecies,
    class: builderData.selectedClass,
    background: builderData.selectedBackground
  });

  // Resolve all template features before saving to character sheet
  if (structuredFeatures.speciesTraits) {
    structuredFeatures.speciesTraits = structuredFeatures.speciesTraits.map(feature => {
      if (feature.variables) {
        const resolved = renderFeature(feature, characterContext);
        // Save resolved values back to the feature
        return {
          ...feature,
          name: resolved.resolvedName || feature.name,
          description: resolved.resolvedDescription || feature.description,
          shortDescription: resolved.resolvedShortDescription || feature.shortDescription || undefined
        } as CharacterFeature;
      }
      return feature;
    });
  }

  // Legacy features for backward compatibility
  const legacyClassFeatures = extractClassFeatures(builderData);
  const legacySpeciesTraits = extractSpeciesTraits(builderData);
  const legacyFeats = builderData.selectedOriginFeats || [];

  const proficiencies = {
    armor: builderData.classProficiencies?.armor || [],
    weapons: builderData.classProficiencies?.weapons || [],
    tools: [
      ...(builderData.classProficiencies?.tools || []),
      ...(builderData.backgroundToolProficiencies || []),
      ...(builderData.speciesToolProficiencies || []),
      ...(builderData.featToolProficiencies || [])
    ],
    skills: Array.from(new Set([
      ...(builderData.selectedClassSkills || []),
      ...(builderData.backgroundSkillProficiencies || []),
      ...(builderData.speciesSkillProficiencies || []),
      ...(builderData.featSkillProficiencies || []),
    ])),
    savingThrows: builderData.classProficiencies?.savingThrows || []
  };

  const initiative = dexterityModifier;
  const perceptionModifier = skills['Perception']?.modifier ?? wisdomModifier;
  const passivePerception = 10 + perceptionModifier;

  const size = builderData.speciesSize || 'Medium';
  const speed = builderData.speciesSpeed || 30;

  const spellbook = {
    known: [...(builderData.spellbook?.known ?? [])],
    ...(builderData.spellbook?.prepared ? { prepared: [...builderData.spellbook.prepared] } : {}),
    ...(builderData.spellbook?.cantrips ? { cantrips: [...builderData.spellbook.cantrips] } : {}),
    ...(builderData.spellbook?.wizardSpellbook ? { wizardSpellbook: [...builderData.spellbook.wizardSpellbook] } : {}),
  };

  const characterData: CharacterSheetData = {
    name: builderData.characterName || 'Unnamed Character',
    background: builderData.selectedBackground || '',
    class: builderData.selectedClass || '',
    species: builderData.selectedSpecies || '',
    speciesChoices: builderData.speciesChoices || {},
    speciesAdditionalSpeeds: builderData.speciesAdditionalSpeeds ?? {},
    speciesResistances: builderData.speciesResistances || [],
    speciesImmunities: builderData.speciesImmunities || [],

    backgroundFeatures: builderData.backgroundFeatures || [],
    backgroundEquipment: builderData.backgroundStartingEquipment || [],
    selectedLanguages: builderData.selectedLanguages || [],

    selectedOriginFeats: builderData.selectedOriginFeats || [],
    featFeatures: builderData.featFeatures || {},
    featSpells: builderData.featSpells || {},
    featChoices: builderData.featChoices || {},

    classChoices: {
      fightingStyle: builderData.selectedClassChoices?.['fighting-style-1']?.[0] ||
                     builderData.selectedClassChoices?.['fighting-style-2']?.[0] ||
                     undefined,
    },

    selectedClassChoices: builderData.selectedClassChoices || {},

    subclass: '',
    level: characterLevel,
    xp: 0,
    abilityScores: finalAbilityScores,
    proficiencyBonus,
    armorClass,
    initiative,
    speed,
    size,
    passivePerception,
    darkvision: builderData.speciesDarkvision || 0,
    hitPoints: {
      current: totalHitPoints,
      max: totalHitPoints,
      temp: 0,
    },
    hitDice: {
      current: characterLevel,
      max: characterLevel,
      spent: 0,
    },
    deathSaves: {
      successes: 0,
      failures: 0,
    },
    heroicInspiration: false,
    wounds: 0,
    spellbook,
    mana: {
      current: builderData.resources?.manaCurrent ?? 0,
      max: builderData.resources?.manaMax ?? 0,
    },
    resources: builderData.resources ? { ...builderData.resources } : {},
    inventory,
    equipment,

    equipmentConstraints: {
      maxArmor: 1,
      maxShields: 1,
      maxAttunedItems: 3,
    },

    ...(equipmentDerived.equippedArmor ? { equippedArmor: equipmentDerived.equippedArmor } : {}),
    ...(equipmentDerived.equippedShield ? { equippedShield: equipmentDerived.equippedShield } : {}),
    equippedWeapons: equipmentDerived.equippedWeapons,
    attunedItems: [],
    skills,
    savingThrows,

    features: structuredFeatures,

    classFeatures: legacyClassFeatures,
    speciesTraits: legacySpeciesTraits,
    feats: legacyFeats,

    weapons,
    actions: weaponActions,
    proficiencies,
    equippedItemIds,
  };

  const grantedSpells = deriveGrantedSpells({ characterData } as any);
  if (grantedSpells.length > 0) {
    characterData.spellbook = {
      known: characterData.spellbook?.known ?? [],
      ...(characterData.spellbook?.prepared ? { prepared: characterData.spellbook.prepared } : {}),
      ...(characterData.spellbook?.cantrips ? { cantrips: characterData.spellbook.cantrips } : {}),
      ...(characterData.spellbook?.wizardSpellbook ? { wizardSpellbook: characterData.spellbook.wizardSpellbook } : {}),
      grantedSpells: Array.from(new Set(grantedSpells.map((id) => String(id)))),
    };
  }

  return characterData;
}

/**
 * Extract structured features from builder data
 */
function extractStructuredFeatures(builderData: CharacterBuilderData): CharacterFeatures {
  const features: CharacterFeatures = {
    classFeatures: [],
    subclassFeatures: [],
    speciesTraits: [],
    backgroundFeatures: [],
    feats: [],
    magicItemFeatures: [],
    customFeatures: [],
  };

  try {
    // Parse class features
    if (builderData.classFeatures && builderData.selectedClass) {
      features.classFeatures = parseClassFeatures(
        { classFeatures: builderData.classFeatures },
        builderData.selectedClass,
        1 // Level 1 for character creation
      );
    }

    // Get feature variants for species traits (replaces generic parsing)
    const speciesFeatureVariants = getAllQualifiedFeatureVariants(builderData, 'species');
    if (speciesFeatureVariants.length > 0) {
      features.speciesTraits = speciesFeatureVariants;
    } else if (builderData.speciesTraits && builderData.selectedSpecies) {
      // Fallback to traditional parsing for species without variants
      features.speciesTraits = parseSpeciesTraits(
        { traits: builderData.speciesTraits },
        builderData.selectedSpecies
      );
    }

    // Parse background features
    if (builderData.backgroundFeatures && builderData.selectedBackground) {
      features.backgroundFeatures = parseBackgroundFeatures(
        { features: builderData.backgroundFeatures },
        builderData.selectedBackground
      );
    }

    // Parse feat features
    if (builderData.featFeatures && builderData.selectedOriginFeats) {
      builderData.selectedOriginFeats.forEach(featName => {
        if (builderData.featFeatures?.[featName]) {
          const featFeatures = parseFeatFeatures(
            builderData.featFeatures[featName],
            featName
          );
          features.feats.push(...featFeatures);
        }
      });
    }

  } catch (error) {
    logger.error('❌ Error extracting structured features:', error);
  }

  return features;
}

/**
 * Calculate final ability scores including background bonuses
 */
type AbilityScoreTotals = Record<keyof CharacterBuilderData['abilityScores'], number>;

const createAbilityTotals = (): AbilityScoreTotals => ({
  strength: 0,
  dexterity: 0,
  constitution: 0,
  intelligence: 0,
  wisdom: 0,
  charisma: 0,
});

const extractNumericValue = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  if (value && typeof value === 'object' && 'amount' in (value as Record<string, unknown>)) {
    const amount = (value as Record<string, unknown>).amount;
    return extractNumericValue(amount);
  }

  return null;
};

const applyAbilityScoreAllocations = (
  totals: AbilityScoreTotals,
  allocations?: Record<string, unknown>
) => {
  if (!allocations) {
    return;
  }

  Object.entries(allocations).forEach(([key, value]) => {
    const abilityKey = normaliseAbilityKeyForTotals(key);
    if (!abilityKey) {
      return;
    }

    const numericValue = extractNumericValue(value);
    if (numericValue && !Number.isNaN(numericValue)) {
      totals[abilityKey] += numericValue;
    }
  });
};

function calculateFinalAbilityScores(builderData: CharacterBuilderData) {
  const base = builderData.abilityScores;
  const bonusTotals = createAbilityTotals();

  applyAbilityScoreAllocations(bonusTotals, builderData.backgroundAbilityScoreAllocations);
  applyAbilityScoreAllocations(bonusTotals, builderData.speciesAbilityScoreAllocations);

  if (builderData.featChoices) {
    Object.values(builderData.featChoices).forEach((choice) => {
      if (choice && typeof choice === 'object' && 'abilityScores' in choice) {
        applyAbilityScoreAllocations(bonusTotals, (choice as { abilityScores?: Record<string, unknown> }).abilityScores);
      }
    });
  }

  return {
    strength: base.strength + bonusTotals.strength,
    dexterity: base.dexterity + bonusTotals.dexterity,
    constitution: base.constitution + bonusTotals.constitution,
    intelligence: base.intelligence + bonusTotals.intelligence,
    wisdom: base.wisdom + bonusTotals.wisdom,
    charisma: base.charisma + bonusTotals.charisma,
  };
}

/**
 * Get class hit die value
 */
function getClassHitDie(className: string): number {
  const hitDiceMap: { [key: string]: number } = {
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

  return hitDiceMap[className] || 8; // Default to d8
}

/**
 * Map skill proficiencies and calculate modifiers
 */
function mapSkillProficiencies(builderData: CharacterBuilderData, abilityScores: any, proficiencyBonus: number) {
  const skillToAbility: { [key: string]: keyof typeof abilityScores } = {
    'Acrobatics': 'dexterity',
    'Animal Handling': 'wisdom',
    'Arcana': 'intelligence',
    'Athletics': 'strength',
    'Deception': 'charisma',
    'History': 'intelligence',
    'Insight': 'wisdom',
    'Intimidation': 'charisma',
    'Investigation': 'intelligence',
    'Medicine': 'wisdom',
    'Nature': 'intelligence',
    'Perception': 'wisdom',
    'Performance': 'charisma',
    'Persuasion': 'charisma',
    'Religion': 'intelligence',
    'Sleight of Hand': 'dexterity',
    'Stealth': 'dexterity',
    'Survival': 'wisdom',
  };

  const allProficientSkills = Array.from(new Set([
    ...(builderData.selectedClassSkills || []),
    ...(builderData.backgroundSkillProficiencies || []),
    ...(builderData.speciesSkillProficiencies || []),
    ...(builderData.featSkillProficiencies || []),
  ]));

  const skills: { [key: string]: { proficient: boolean; modifier: number } } = {};

  Object.entries(skillToAbility).forEach(([skill, ability]) => {
    const isProficient = allProficientSkills.includes(skill);
    const abilityModifier = calculateModifier(abilityScores[ability]);
    const modifier = isProficient ? abilityModifier + proficiencyBonus : abilityModifier;

    skills[skill] = {
      proficient: isProficient,
      modifier: modifier,
    };
  });

  return skills;
}

/**
 * Map saving throw proficiencies and calculate modifiers
 */
function mapSavingThrows(builderData: CharacterBuilderData, abilityScores: any, proficiencyBonus: number) {
  const savingThrows: { [key: string]: { proficient: boolean; modifier: number } } = {};
  const proficientSaves = builderData.classProficiencies?.savingThrows || [];
  const normalizedSaves = proficientSaves.map((save) => save.toLowerCase());

  Object.entries(abilityScores).forEach(([ability, score]) => {
    const isProficient = normalizedSaves.includes(ability.toLowerCase());
    const abilityModifier = calculateModifier(score as number);
    const modifier = isProficient ? abilityModifier + proficiencyBonus : abilityModifier;

    savingThrows[ability] = {
      proficient: isProficient,
      modifier: modifier,
    };
  });

  return savingThrows;
}

/**
 * Capitalize first letter of each word in a string
 */
function titleCase(str: string): string {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Extract equipment items from mixed background/class data.
 */
function extractEquipmentItems(source: any): string[] {
  const items: string[] = [];

  const processEntry = (entry: any) => {
    if (!entry) return;

    if (typeof entry === 'string') {
      items.push(formatItemName(entry));
      return;
    }

    if (Array.isArray(entry)) {
      entry.forEach(processEntry);
      return;
    }

    if (typeof entry !== 'object') {
      return;
    }

    const record = entry as Record<string, unknown>;

    if (record.A && Array.isArray(record.A) && !record.type) {
      processEntry(record.A);
      return;
    }

    if (record.type === 'direct' && record.item && typeof record.item === 'object') {
      const choices = record.item as Record<string, unknown>;
      if (Array.isArray(choices.A)) {
        choices.A.forEach((subItem) => {
          if (typeof subItem === 'string') {
            items.push(formatItemName(subItem));
          } else if (subItem && typeof subItem === 'object' && 'item' in subItem) {
            const itemValue = (subItem as { item?: string }).item;
            if (typeof itemValue === 'string') {
              items.push(formatItemName(itemValue));
            }
          }
        });
      }
      return;
    }

    Object.entries(record).forEach(([key, value]) => {
      if (key === 'choose') {
        return;
      }

      if (typeof value === 'number') {
        if (key.toLowerCase().includes('gold')) {
          items.push(`${value} gp`);
        } else {
          const formatted = formatItemName(key);
          items.push(value > 1 ? `${formatted} (${value})` : formatted);
        }
        return;
      }

      if (typeof value === 'string') {
        items.push(formatItemName(value));
        return;
      }

      processEntry(value);
    });
  };

  processEntry(source);

  return items;
}

/**
 * Combine equipment from all sources
 */
function combineEquipment(builderData: CharacterBuilderData): string[] {
  const equipment: string[] = [];

  if (builderData.classStartingEquipment) {
    const classEquipment = extractEquipmentItems(builderData.classStartingEquipment);
    equipment.push(...classEquipment);
  }

  if (builderData.backgroundStartingEquipment) {
    const backgroundEquipment = extractEquipmentItems(builderData.backgroundStartingEquipment);
    equipment.push(...backgroundEquipment);
  }

  if (builderData.selectedEquipment) {
    if (builderData.selectedEquipment.armor) {
      equipment.push(formatItemName(builderData.selectedEquipment.armor));
    }
    if (builderData.selectedEquipment.weapons && Array.isArray(builderData.selectedEquipment.weapons)) {
      builderData.selectedEquipment.weapons
        .filter(Boolean)
        .forEach((weapon) => equipment.push(formatItemName(weapon)));
    }
    if (builderData.selectedEquipment.shield) {
      equipment.push(formatItemName(builderData.selectedEquipment.shield));
    }
    if (builderData.selectedEquipment.equipment && Array.isArray(builderData.selectedEquipment.equipment)) {
      builderData.selectedEquipment.equipment
        .filter(Boolean)
        .forEach((item) => equipment.push(formatItemName(item)));
    }
  }

  return equipment.filter(Boolean); // Remove any undefined/null values
}

function buildInventoryFromEquipment(equipment: string[]): InventoryItem[] {
  return equipment.map((item, index) => {
    const { name, quantity } = parseItemNameAndQuantity(item);
    const formattedName = formatItemName(name);
    return {
      id: `char-gen-${index}`,
      name: formattedName,
      quantity,
      equipped: false,
      attuned: false,
    };
  });
}

function deriveEquipmentValues(
  abilityScores: CharacterSheetData['abilityScores'],
  inventory: InventoryItem[],
  equippedItemIds: string[]
): {
  armorClass: number;
  equippedArmor?: InventoryItem;
  equippedShield?: InventoryItem;
  equippedWeapons: InventoryItem[];
} {
  if (!equippedItemIds || equippedItemIds.length === 0) {
    return {
      armorClass: calculateArmorClassFromEquipment(abilityScores),
      equippedWeapons: [],
    };
  }

  const itemsById = new Map(inventory.map((item) => [item.id, item]));
  let equippedArmor: InventoryItem | undefined;
  let equippedShield: InventoryItem | undefined;
  const equippedWeapons: InventoryItem[] = [];

  equippedItemIds.forEach((id) => {
    const item = itemsById.get(id);
    if (!item) {
      return;
    }

    if (!equippedArmor && findArmorDefinition(item.name)) {
      equippedArmor = item;
      return;
    }

    if (!equippedShield && looksLikeShield(item.name)) {
      equippedShield = item;
      return;
    }

    const weaponMatch = findWeaponDefinition(item.name);
    if (weaponMatch) {
      equippedWeapons.push(item);
    }
  });

  const armorClass = calculateArmorClassFromEquipment(abilityScores, equippedArmor, equippedShield);

  return {
    armorClass,
    ...(equippedArmor ? { equippedArmor } : {}),
    ...(equippedShield ? { equippedShield } : {}),
    equippedWeapons,
  };
}

type HitPointFeatureCandidate = {
  name?: string;
  description: string;
};

function deriveCharacterLevel(builderData: CharacterBuilderData): number {
  const looseBuilder = builderData as unknown as Record<string, unknown>;
  const candidates = [
    looseBuilder.level,
    looseBuilder.characterLevel,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate) && candidate > 0) {
      return Math.floor(candidate);
    }
  }

  return 1;
}

function calculateHitPointBonuses(
  builderData: CharacterBuilderData,
  structuredFeatures: CharacterFeatures,
  level: number
): number {
  const candidates = gatherHitPointFeatureCandidates(builderData, structuredFeatures);
  let totalAdjustment = 0;
  const seen = new Set<string>();

  candidates.forEach((candidate) => {
    const description = candidate.description?.trim();
    if (!description) {
      return;
    }

    const key = `${(candidate.name || '').trim().toLowerCase()}|${description.toLowerCase()}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);

    totalAdjustment += extractHitPointAdjustmentFromText(description, level);
  });

  return totalAdjustment;
}

function gatherHitPointFeatureCandidates(
  builderData: CharacterBuilderData,
  structuredFeatures: CharacterFeatures
): HitPointFeatureCandidate[] {
  const candidates: HitPointFeatureCandidate[] = [];

  const addCandidate = (name: string | undefined, description: string | undefined) => {
    if (!description) {
      return;
    }
    const trimmed = description.trim();
    if (!trimmed) {
      return;
    }
    const trimmedName = name?.trim();
    const candidate: HitPointFeatureCandidate = { description: trimmed };
    if (trimmedName) {
      candidate.name = trimmedName;
    }
    candidates.push(candidate);
  };

  const structuredCollections: Array<CharacterFeature[] | undefined> = [
    structuredFeatures.classFeatures,
    structuredFeatures.subclassFeatures,
    structuredFeatures.speciesTraits,
    structuredFeatures.backgroundFeatures,
    structuredFeatures.feats,
    structuredFeatures.magicItemFeatures,
    structuredFeatures.customFeatures,
  ];

  structuredCollections.forEach((collection) => {
    collection?.forEach((feature) => addCandidate(feature.name, feature.description));
  });

  const rawSources: unknown[] = [];

  if (builderData.classFeatures) {
    rawSources.push(...builderData.classFeatures);
  }
  if (builderData.speciesTraits) {
    rawSources.push(...builderData.speciesTraits);
  }
  if (builderData.backgroundFeatures) {
    rawSources.push(...builderData.backgroundFeatures);
  }
  if (builderData.featFeatures) {
    Object.values(builderData.featFeatures).forEach((value) => {
      if (Array.isArray(value)) {
        rawSources.push(...value);
      } else if (value) {
        rawSources.push(value);
      }
    });
  }

  rawSources.forEach((raw) => {
    const parsed = normaliseRawFeature(raw);
    if (parsed) {
      addCandidate(parsed.name, parsed.description);
    }
  });

  return candidates;
}

function normaliseRawFeature(raw: unknown): HitPointFeatureCandidate | null {
  if (raw == null) {
    return null;
  }

  if (typeof raw === 'string') {
    const cleaned = parseDnDTemplateTag(raw).trim();
    if (!cleaned) {
      return null;
    }

    const colonIndex = cleaned.indexOf(':');
    if (colonIndex > 0 && colonIndex < cleaned.length - 1) {
      const name = cleaned.slice(0, colonIndex).trim();
      const description = cleaned.slice(colonIndex + 1).trim();
      const finalDescription = description || name;
      if (!finalDescription) {
        return null;
      }
      const candidate: HitPointFeatureCandidate = { description: finalDescription };
      if (name) {
        candidate.name = name;
      }
      return candidate;
    }

    return cleaned
      ? { description: cleaned }
      : null;
  }

  if (Array.isArray(raw)) {
    const description = raw
      .map((entry) => {
        const parsed = normaliseRawFeature(entry);
        if (parsed?.description) {
          return parsed.description;
        }
        if (typeof entry === 'string') {
          return parseDnDTemplateTag(entry);
        }
        return '';
      })
      .filter((value) => value && value.trim().length > 0)
      .join(' ');

    return description ? { description } : null;
  }

  if (typeof raw === 'object') {
    const record = raw as Record<string, unknown>;
    const rawName = typeof record.name === 'string'
      ? record.name
      : typeof record.title === 'string'
        ? record.title
        : undefined;

    const descriptionCandidates = [
      record.description,
      record.desc,
      record.entries,
      record.text,
    ];

    for (const candidate of descriptionCandidates) {
      const flattened = flattenDescription(candidate);
      if (flattened) {
        const description = flattened.trim();
        if (!description) {
          continue;
        }
        const trimmedName = rawName?.trim();
        const candidate: HitPointFeatureCandidate = { description };
        if (trimmedName) {
          candidate.name = trimmedName;
        }
        return candidate;
      }
    }
  }

  return null;
}

function flattenDescription(value: unknown): string {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return parseDnDTemplateTag(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => flattenDescription(entry))
      .filter((text) => text && text.trim().length > 0)
      .join(' ');
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;

    if (record.entries) {
      return flattenDescription(record.entries);
    }
    if (record.description) {
      return flattenDescription(record.description);
    }
    if (record.text) {
      return flattenDescription(record.text);
    }
    if (record.value) {
      return flattenDescription(record.value);
    }
  }

  return '';
}

function extractHitPointAdjustmentFromText(description: string, level: number): number {
  const lower = description.toLowerCase();

  if (!lower.includes('hit point')) {
    return 0;
  }

  const immediateValues: number[] = [];
  const perLevelValues: number[] = [];
  let perLevelMultiplier: number | null = null;

  collectNumericMatches(
    lower,
    /hit point(?:s)? maximum increases by ([+-]?\d+)(?!\s*(?:each|every|per)\s*level)/g,
    immediateValues
  );

  const perLevelRegexes = [
    /\bincreases by (?:an additional\s+)?([+-]?\d+)\s*(?:each|every|per)\s*level(?:\s*(?:of|in)\s*this\s*class)?\b/g,
    /\bincreases by (?:an additional\s+)?([+-]?\d+)\s*(?:whenever|when)\s*you gain (?:a|another)?\s*level(?:\s*(?:of|in)\s*this\s*class)?\b/g,
    /\byou gain (?:an additional\s+)?([+-]?\d+)\s+hit point(?:s)?\s*(?:each|every|per)\s*level\b/g,
    /\byou gain (?:an additional\s+)?([+-]?\d+)\s+hit point(?:s)?\s*(?:whenever|when)\s*you gain (?:a|another)?\s*level\b/g,
  ];

  perLevelRegexes.forEach((regex) => collectNumericMatches(lower, regex, perLevelValues));

  const perLevelMultiplierPatterns = [
    { regex: /hit point(?:s)? maximum increases by (?:an amount equal to|equal to|by)\s+(?:your\s+)?(?:[a-z]+\s+){0,2}level\b/g, multiplier: 1 },
    { regex: /hit point(?:s)? maximum increases by (?:twice|double)\s+(?:your\s+)?(?:[a-z]+\s+){0,2}level\b/g, multiplier: 2 },
    { regex: /hit point(?:s)? maximum increases by (?:three times|thrice)\s+(?:your\s+)?(?:[a-z]+\s+){0,2}level\b/g, multiplier: 3 },
  ];

  perLevelMultiplierPatterns.forEach(({ regex, multiplier }) => {
    let match: RegExpExecArray | null;
    regex.lastIndex = 0;
    while ((match = regex.exec(lower)) !== null) {
      const matchIndex = match.index ?? 0;
      if (isTemporaryHitPointContext(lower, matchIndex, match[0].length)) {
        continue;
      }
      perLevelMultiplier = Math.max(perLevelMultiplier ?? 0, multiplier);
    }
  });

  if (immediateValues.length === 0 && perLevelValues.length === 0 && perLevelMultiplier === null) {
    return 0;
  }

  const immediateCounts = new Map<number, number>();
  immediateValues.forEach((value) => {
    if (value > 0) {
      immediateCounts.set(value, (immediateCounts.get(value) ?? 0) + 1);
    }
  });

  if (perLevelValues.length > 0) {
    perLevelValues.forEach((value) => {
      if (value <= 0) {
        return;
      }
      const existing = immediateCounts.get(value);
      if (existing && existing > 0) {
        immediateCounts.set(value, existing - 1);
      }
    });
  }

  let flatBonus = 0;
  immediateCounts.forEach((count, value) => {
    if (count > 0) {
      flatBonus += value * count;
    }
  });

  let perLevelTotal = perLevelMultiplier ?? 0;
  if (perLevelMultiplier === null) {
    perLevelTotal += perLevelValues.reduce((sum, value) => (value > 0 ? sum + value : sum), 0);
  } else {
    perLevelTotal += perLevelValues
      .filter((value) => value > 0 && value !== perLevelMultiplier)
      .reduce((sum, value) => sum + value, 0);
  }

  if (flatBonus === 0 && perLevelTotal === 0) {
    return 0;
  }

  const effectiveLevel = Math.max(1, Math.floor(level) || 1);
  return flatBonus + perLevelTotal * effectiveLevel;
}

function collectNumericMatches(
  text: string,
  regex: RegExp,
  bucket: number[]
): void {
  regex.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const rawValue = match[1];
    const numeric = parseInt(rawValue, 10);
    if (!Number.isFinite(numeric)) {
      continue;
    }

    const matchIndex = match.index ?? 0;
    if (isTemporaryHitPointContext(text, matchIndex, match[0].length)) {
      continue;
    }

    bucket.push(numeric);
  }
}

function isTemporaryHitPointContext(text: string, start: number, length: number): boolean {
  const windowStart = Math.max(0, start - 20);
  const windowEnd = Math.min(text.length, start + length + 20);
  const snippet = text.slice(windowStart, windowEnd);
  return snippet.includes('temporary');
}

function mapInventoryToWeapons(
  inventory: InventoryItem[],
  abilityScores: CharacterSheetData['abilityScores'],
  proficiencyBonus: number,
  builderData: CharacterBuilderData
) {
  const weaponProficiencies = (builderData.classProficiencies?.weapons || []).map((prof) => prof.toLowerCase());
  const summaries = new Map<string, { name: string; atkBonus: string; damage: string; notes: string }>();

  inventory.forEach((item) => {
    const match = findWeaponDefinition(item.name);
    if (!match) {
      return;
    }

    const abilityModifier = calculateModifier(abilityScores[match.definition.ability]);
    const weaponName = match.key;
    const weaponNameLower = weaponName.toLowerCase();

    const isProficient = weaponProficiencies.some((prof) =>
      prof.includes(weaponNameLower) ||
      (prof.includes('simple') && match.definition.category === 'simple') ||
      (prof.includes('martial') && match.definition.category === 'martial')
    );

    const attackBonus = abilityModifier + (isProficient ? proficiencyBonus : 0);
    const damageBonus = abilityModifier;
    const damageExpression = `${match.definition.damage}${damageBonus >= 0 ? `+${damageBonus}` : damageBonus}`;
    const notes = match.definition.properties.join(', ');

    if (!summaries.has(weaponName)) {
      summaries.set(weaponName, {
        name: weaponName,
        atkBonus: attackBonus >= 0 ? `+${attackBonus}` : `${attackBonus}`,
        damage: damageExpression,
        notes,
      });
    }
  });

  return Array.from(summaries.values());
}

function mapWeaponsToActions(weapons: Array<{ name: string; atkBonus: string; damage: string }>) {
  return weapons
    .filter((weapon) => weapon.name)
    .map((weapon) => ({
      name: weapon.name,
      atkBonus: weapon.atkBonus,
      damage: weapon.damage,
    }));
}

/**
 * Extract class features as string array with "Name: Description" format
 */
function extractClassFeatures(builderData: CharacterBuilderData): string[] {
  const features: string[] = [];

  if (builderData.classFeatures) {
    builderData.classFeatures.forEach((feature: any) => {
      if (typeof feature === 'string') {
        features.push(parseDnDTemplateTag(feature));
      } else if (feature.name) {
        // Safely extract description, handling complex objects
        let description = feature.description || `Level 1 ${builderData.selectedClass} feature`;

        // Handle complex description objects
        if (typeof description === 'object') {
          if (Array.isArray(description)) {
            description = description.map(item => {
              if (typeof item === 'string') return item;
              if (typeof item === 'object' && item.type === 'table') {
                return `[Table: ${item.caption || 'Data table'}]`;
              }
              return item.text || item.entry || '';
            }).filter(Boolean).join(' ');
          } else if (description.type === 'table') {
            description = `[Table: ${description.caption || 'Data table'}]`;
          } else {
            description = description.text || description.entry || 'Complex feature data';
          }
        }

        // Parse the description and format as "Name: Description" for proper display
        const parsedDescription = parseDnDTemplateTag(description);
        features.push(`${feature.name}: ${parsedDescription}`);
      }
    });
  }

  return features;
}

/**
 * Extract species traits as string array with "Name: Description" format
 */
function extractSpeciesTraits(builderData: CharacterBuilderData): string[] {
  const traits: string[] = [];

  if (builderData.speciesTraits) {
    builderData.speciesTraits.forEach((trait: any) => {
      if (typeof trait === 'string') {
        traits.push(parseDnDTemplateTag(trait));
      } else if (trait.name) {
        // Safely extract description, handling complex objects
        let description = trait.description || 'Species trait benefit applies';

        // Handle complex description objects
        if (typeof description === 'object') {
          if (Array.isArray(description)) {
            description = description.map(item => {
              if (typeof item === 'string') return item;
              if (typeof item === 'object' && item.type === 'table') {
                return `[Table: ${item.caption || 'Data table'}]`;
              }
              return item.text || item.entry || '';
            }).filter(Boolean).join(' ');
          } else if (description.type === 'table') {
            description = `[Table: ${description.caption || 'Data table'}]`;
          } else {
            description = description.text || description.entry || 'Complex trait data';
          }
        }

        // Parse the description and format as "Name: Description" for proper display
        const parsedDescription = parseDnDTemplateTag(description);
        traits.push(`${trait.name}: ${parsedDescription}`);
      }
    });
  }

  return traits;
}
