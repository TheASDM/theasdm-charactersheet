/**
 * Simple feature generator that creates features based on character data
 * No templates, no complex resolution - just direct data-to-feature conversion
 *
 * UPDATED: Now uses the new choice detection system for D&D 2024 class features
 */

import { CharacterSheetData } from '../types/characterSheet';
import { parseComplexDnDEntry } from './dndTemplateParser';
import { getDisplayableFeatures } from './classChoiceDetection';
import { ClassData } from '../types/classFeatures';

/**
 * Weapon Mastery property definitions
 */
export const WEAPON_MASTERY_PROPERTIES: { [key: string]: string } = {
  'Cleave': 'Whenever you hit a creature with a Melee Weapon Attack, you can make another Melee Attack Roll to hit a second creature you can see within 5ft of the first. On a hit, your second target takes damage equal to the weapon without any additional Ability Modifier damage (unless your modifier is negative).',
  'Graze': 'When your weapon misses an attack against a creature, you deal damage equal to the Ability Modifier used to make your Attack Roll.',
  'Nick': 'When you wield a light weapon in both your main and off-hand, you can make an additional attack as part of your attack action (this does not allow a third attack as a bonus action).',
  'Push': 'You can push a creature of large or smaller size up to 10 feet away in a straight line.',
  'Sap': 'Landing an attack on an enemy inflicts disadvantage on their next Attack Roll before the start of your next turn.',
  'Slow': 'You reduce a creature\'s Speed by 10 feet until the start of your next turn when you deal damage to that creature with your weapon.',
  'Topple': 'With a successful weapon attack, you force a creature to make a Constitution saving throw (DC 8 + your proficiency bonus + your Strength modifier) or fall prone.',
  'Vex': 'Whenever you hit a target with this weapon, you gain advantage on your next attack roll against that same target before the end of your next turn.'
};

/**
 * Map weapons to their mastery properties
 */
export const WEAPON_TO_MASTERY: { [key: string]: string } = {
  // Cleave weapons
  'Greataxe': 'Cleave',
  'Halberd': 'Cleave',
  // Graze weapons
  'Glaive': 'Graze',
  'Greatsword': 'Graze',
  // Nick weapons
  'Dagger': 'Nick',
  'Light Hammer': 'Nick',
  'Sickle': 'Nick',
  'Scimitar': 'Nick',
  // Push weapons
  'Greatclub': 'Push',
  'Pike': 'Push',
  'Warhammer': 'Push',
  'Heavy Crossbow': 'Push',
  // Sap weapons
  'Mace': 'Sap',
  'Spear': 'Sap',
  'Flail': 'Sap',
  'Longsword': 'Sap',
  'Morningstar': 'Sap',
  'War Pick': 'Sap',
  // Slow weapons
  'Club': 'Slow',
  'Javelin': 'Slow',
  'Light Crossbow': 'Slow',
  'Sling': 'Slow',
  'Whip': 'Slow',
  'Longbow': 'Slow',
  'Musket': 'Slow',
  // Topple weapons
  'Quarterstaff': 'Topple',
  'Battleaxe': 'Topple',
  'Lance': 'Topple',
  'Maul': 'Topple',
  'Trident': 'Topple',
  // Vex weapons
  'Handaxe': 'Vex',
  'Dart': 'Vex',
  'Shortbow': 'Vex',
  'Rapier': 'Vex',
  'Shortsword': 'Vex',
  'Blowgun': 'Vex',
  'Hand Crossbow': 'Vex',
  'Pistol': 'Vex'
};

export interface SimpleFeature {
  name: string;
  description: string;
  category: string;
}

/**
 * Generate all features for a character based on their data
 * Now async to support the new choice-based class feature system
 */
export async function generateFeaturesForCharacter(character: CharacterSheetData): Promise<SimpleFeature[]> {
  const features: SimpleFeature[] = [];

  // Add species features
  features.push(...generateSpeciesFeatures(character));

  // Add class features using new choice system
  try {
    // Dynamically import class data
    const className = character.class;
    if (className) {
      const { loadClassData } = await import('./classDataLoader');
      const classData = await loadClassData(className);
      const classFeatures = await generateClassFeaturesWithChoiceSystem(character, classData);
      features.push(...classFeatures);
    }
  } catch (error) {
    console.warn('Failed to load class data, falling back to old system:', error);
    features.push(...generateClassFeatures(character));
  }

  // Add background features
  features.push(...generateBackgroundFeatures(character));

  // Add feat features
  features.push(...generateFeatFeatures(character));

  // Add proficiencies (always last)
  features.push(...generateProficienciesFeature(character));

  return features;
}

/**
 * Generate species-specific features
 */
function generateSpeciesFeatures(character: CharacterSheetData): SimpleFeature[] {
  const features: SimpleFeature[] = [];
  const species = character.species?.toLowerCase();

  if (!species) return features;

  if (species.includes('dragonborn')) {
    features.push(...generateDragonbornFeatures(character));
  } else if (species.includes('elf')) {
    features.push(...generateElfFeatures(character));
  } else if (species.includes('human')) {
    features.push(...generateHumanFeatures(character));
  } else if (species.includes('tiefling')) {
    features.push(...generateTieflingFeatures(character));
  } else if (species.includes('dwarf')) {
    features.push(...generateDwarfFeatures(character));
  } else if (species.includes('halfling')) {
    features.push(...generateHalflingFeatures(character));
  } else if (species.includes('gnome')) {
    features.push(...generateGnomeFeatures(character));
  } else if (species.includes('half-orc') || species.includes('orc')) {
    features.push(...generateOrcFeatures(character));
  } else if (species.includes('goliath')) {
    features.push(...generateGoliathFeatures(character));
  } else if (species.includes('aasimar')) {
    features.push(...generateAasimarFeatures(character));
  }
  // Add more species as needed

  return features;
}

/**
 * Generate dragonborn-specific features
 */
function generateDragonbornFeatures(character: CharacterSheetData): SimpleFeature[] {
  const features: SimpleFeature[] = [];

  // Get draconic ancestry from speciesChoices
  const draconicAncestry = character.speciesChoices?.draconicAncestry || 'Red';

  // Map to damage types and areas
  const dragonData = getDragonData(draconicAncestry);

  features.push({
    name: 'Draconic Ancestry',
    description: `You have ${dragonData.fullName} ancestry, granting you ${dragonData.damageType} damage resistance and a ${dragonData.damageType} breath weapon that affects a ${dragonData.area}.`,
    category: 'Species Trait'
  });

  features.push({
    name: 'Breath Weapon',
    description: `**Action:** Exhale destructive energy in a **${dragonData.area}**.\n\nEach creature in the area must make a **DC ${8 + getProficiencyBonus(character.level || 1) + getConstitutionModifier(character)} ${dragonData.saveType}** saving throw, taking **${getBreathWeaponDamage(character.level || 1)} ${dragonData.damageType}** damage on failure, or half on success.\n\n*Recharge:* Short or Long Rest`,
    category: 'Species Trait'
  });

  features.push({
    name: 'Damage Resistance',
    description: `You have resistance to **${dragonData.damageType}** damage.`,
    category: 'Species Trait'
  });

  // Add Draconic Flight at level 5
  if ((character.level || 1) >= 5) {
    features.push({
      name: 'Draconic Flight',
      description: '**Bonus Action:** Sprout draconic wings that last for **1 minute**. You gain a **flying speed** equal to your walking speed.\n\n*Recharge:* Long Rest',
      category: 'Species Trait'
    });
  }

  return features;
}

/**
 * Generate elf-specific features
 */
function generateElfFeatures(character: CharacterSheetData): SimpleFeature[] {
  const features: SimpleFeature[] = [];

  features.push({
    name: 'Darkvision',
    description: 'You can see in dim light within **60 feet** as if it were bright light, and in darkness as if it were dim light.',
    category: 'Species Trait'
  });

  // Get the chosen skill from speciesChoices, default to Perception if not set
  const elfSkill = character.speciesChoices?.elfSkill || 'Perception';

  features.push({
    name: 'Keen Senses',
    description: `You have proficiency in the **${elfSkill}** skill.`,
    category: 'Species Trait'
  });

  features.push({
    name: 'Fey Ancestry',
    description: 'You have **advantage** on saving throws against being **charmed**, and magic can\'t put you to sleep.',
    category: 'Species Trait'
  });

  features.push({
    name: 'Trance',
    description: 'You don\'t need to sleep. To gain the benefits of a **Long Rest**, you can spend **4 hours** in a trance-like meditation.',
    category: 'Species Trait'
  });

  // Add lineage-specific features
  const elfLineage = character.speciesChoices?.elfLineage;
  const level = character.level || 1;

  if (elfLineage === 'High Elf') {
    let highElfMagicDesc = 'You know the **Prestidigitation** cantrip.';
    if (level >= 3) {
      highElfMagicDesc += ' You can cast **Detect Magic** once per long rest.';
    }
    if (level >= 5) {
      highElfMagicDesc += ' You can cast **Misty Step** once per long rest.';
    }
    highElfMagicDesc += '\n\n**Intelligence** is your spellcasting ability for these spells.';

    features.push({
      name: 'High Elf Magic',
      description: highElfMagicDesc,
      category: 'Species Trait'
    });
  } else if (elfLineage === 'Wood Elf') {
    let woodElfMagicDesc = 'You know the **Druidcraft** cantrip.';
    if (level >= 3) {
      woodElfMagicDesc += ' You can cast **Longstrider** once per long rest.';
    }
    if (level >= 5) {
      woodElfMagicDesc += ' You can cast **Pass without Trace** once per long rest.';
    }
    woodElfMagicDesc += '\n\n**Wisdom** is your spellcasting ability for these spells.';

    features.push({
      name: 'Wood Elf Magic',
      description: woodElfMagicDesc,
      category: 'Species Trait'
    });
  } else if (elfLineage === 'Drow') {
    features.push({
      name: 'Superior Darkvision',
      description: 'Your darkvision has a radius of **120 feet**.',
      category: 'Species Trait'
    });

    let drowMagicDesc = 'You know the Dancing Lights cantrip.';
    if (level >= 3) {
      drowMagicDesc += ' You can cast Faerie Fire once per long rest.';
    }
    if (level >= 5) {
      drowMagicDesc += ' You can cast Darkness once per long rest.';
    }
    drowMagicDesc += ' Charisma is your spellcasting ability for these spells.';

    features.push({
      name: 'Drow Magic',
      description: drowMagicDesc,
      category: 'Species Trait'
    });
  }

  return features;
}

/**
 * Generate human-specific features
 */
function generateHumanFeatures(character: CharacterSheetData): SimpleFeature[] {
  const features: SimpleFeature[] = [];

  features.push({
    name: 'Versatile',
    description: 'You gain an **additional Origin Feat** at 1st level.',
    category: 'Species Trait'
  });

  const humanSkill = character.speciesChoices?.humanSkill;
  if (humanSkill) {
    features.push({
      name: 'Skilled',
      description: `You gain proficiency in the ${humanSkill} skill.`,
      category: 'Species Trait'
    });
  }

  return features;
}

/**
 * Generate tiefling-specific features
 */
function generateTieflingFeatures(character: CharacterSheetData): SimpleFeature[] {
  const features: SimpleFeature[] = [];

  // Get fiendish legacy from speciesChoices
  const fiendishLegacy = character.speciesChoices?.fiendishLegacy || 'Infernal';

  const legacyData: { [key: string]: { damageType: string, cantrip: string, level3Spell: string, level5Spell: string } } = {
    'Abyssal': {
      damageType: 'poison',
      cantrip: 'Poison Spray',
      level3Spell: 'Ray of Sickness',
      level5Spell: 'Hold Person'
    },
    'Chthonic': {
      damageType: 'necrotic',
      cantrip: 'Chill Touch',
      level3Spell: 'False Life',
      level5Spell: 'Ray of Enfeeblement'
    },
    'Infernal': {
      damageType: 'fire',
      cantrip: 'Fire Bolt',
      level3Spell: 'Hellish Rebuke',
      level5Spell: 'Darkness'
    }
  };

  const legacy = legacyData[fiendishLegacy] || legacyData['Infernal'];

  features.push({
    name: 'Fiendish Legacy',
    description: `You have ${fiendishLegacy} fiendish legacy, granting you resistance to ${legacy.damageType} damage and magical abilities.`,
    category: 'Species Trait'
  });

  features.push({
    name: 'Damage Resistance',
    description: `You have resistance to **${legacy.damageType}** damage.`,
    category: 'Species Trait'
  });

  features.push({
    name: 'Darkvision',
    description: 'You can see in dim light within **60 feet** as if it were bright light, and in darkness as if it were dim light.',
    category: 'Species Trait'
  });

  const level = character.level || 1;
  let legacyMagicDesc = `You know the ${legacy.cantrip} cantrip.`;
  if (level >= 3) {
    legacyMagicDesc += ` You can cast ${legacy.level3Spell} once per long rest.`;
  }
  if (level >= 5) {
    legacyMagicDesc += ` You can cast ${legacy.level5Spell} once per long rest.`;
  }
  legacyMagicDesc += ' Charisma is your spellcasting ability for these spells.';

  features.push({
    name: `${fiendishLegacy} Magic`,
    description: legacyMagicDesc,
    category: 'Species Trait'
  });

  return features;
}

/**
 * Generate dwarf-specific features (D&D 2024)
 */
function generateDwarfFeatures(_character: CharacterSheetData): SimpleFeature[] {
  const features: SimpleFeature[] = [];

  features.push({
    name: 'Darkvision',
    description: 'You can see in dim light within **120 feet** as if it were bright light and in darkness as if it were dim light. You discern colors in that darkness only as shades of gray.',
    category: 'Species Trait'
  });

  features.push({
    name: 'Dwarven Resilience',
    description: 'You have **advantage** on saving throws against **poison**, and you have **resistance** to poison damage.',
    category: 'Species Trait'
  });

  features.push({
    name: 'Dwarven Toughness',
    description: 'Your hit point maximum increases by **1**, and it increases by **1 every level**.',
    category: 'Species Trait'
  });

  features.push({
    name: 'Stonecunning',
    description: '**Bonus Action:** Touch a stone object or surface and learn its history. You can use this feature a number of times equal to your **Proficiency Bonus**.\n\n*Recharge:* Long Rest',
    category: 'Species Trait'
  });

  return features;
}

/**
 * Generate halfling-specific features (D&D 2024)
 */
function generateHalflingFeatures(_character: CharacterSheetData): SimpleFeature[] {
  const features: SimpleFeature[] = [];

  features.push({
    name: 'Lucky',
    description: 'When you roll a **1** on the d20 for an attack roll, ability check, or saving throw, you can **reroll the die** and must use the new roll.',
    category: 'Species Trait'
  });

  features.push({
    name: 'Brave',
    description: 'You have **advantage** on saving throws against being **frightened**.',
    category: 'Species Trait'
  });

  features.push({
    name: 'Halfling Nimbleness',
    description: 'You can move through the space of any creature that is **larger than you**.',
    category: 'Species Trait'
  });

  features.push({
    name: 'Naturally Stealthy',
    description: 'You can attempt to **hide** even when obscured only by a creature that is **at least one size larger** than you.',
    category: 'Species Trait'
  });

  return features;
}

/**
 * Generate gnome-specific features
 */
function generateGnomeFeatures(character: CharacterSheetData): SimpleFeature[] {
  const features: SimpleFeature[] = [];

  features.push({
    name: 'Darkvision',
    description: 'You can see in dim light within **60 feet** as if it were bright light, and in darkness as if it were dim light.',
    category: 'Species Trait'
  });

  features.push({
    name: 'Gnome Cunning',
    description: 'You have **advantage** on **Intelligence**, **Wisdom**, and **Charisma** saving throws against magic.',
    category: 'Species Trait'
  });

  // Add lineage-specific features
  const gnomeLineage = character.speciesChoices?.gnomeLineage;
  const proficiencyBonus = getProficiencyBonus(character.level || 1);

  if (gnomeLineage === 'Forest Gnome') {
    features.push({
      name: 'Forest Gnome Magic',
      description: `You know the Minor Illusion cantrip. You also always have the Speak with Animals spell prepared. You can cast it without a spell slot a number of times equal to your Proficiency Bonus (${proficiencyBonus}), and you regain all expended uses when you finish a Long Rest. You can also use any spell slots you have to cast the spell. Intelligence is your spellcasting ability for these spells.`,
      category: 'Species Trait'
    });
  } else if (gnomeLineage === 'Rock Gnome') {
    features.push({
      name: 'Rock Gnome Magic',
      description: 'You know the Mending and Prestidigitation cantrips. In addition, you can spend 10 minutes casting Prestidigitation to create a Tiny clockwork device (AC 5, 1 HP), such as a toy, fire starter, or music box. When you create the device, you determine its function by choosing one effect from Prestidigitation; the device produces that effect whenever you or another creature takes a Bonus Action to activate it with a touch. You can have three such devices in existence at a time, and each falls apart 8 hours after its creation or when you dismantle it with a touch as a Utilize action. Intelligence is your spellcasting ability for these spells.',
      category: 'Species Trait'
    });
  }

  return features;
}

/**
 * Generate orc features (D&D 2024)
 */
function generateOrcFeatures(_character: CharacterSheetData): SimpleFeature[] {
  const features: SimpleFeature[] = [];

  features.push({
    name: 'Darkvision',
    description: 'You can see in dim light within **120 feet** as if it were bright light and in darkness as if it were dim light. You discern colors in that darkness only as shades of gray.',
    category: 'Species Trait'
  });

  features.push({
    name: 'Adrenaline Rush',
    description: '**Bonus Action:** Take the Dash action and gain **temporary HP** equal to your proficiency bonus. You can use this trait a number of times equal to your **proficiency bonus**.\n\n*Recharge:* Long Rest',
    category: 'Species Trait'
  });

  features.push({
    name: 'Relentless Endurance',
    description: 'When you are reduced to **0 hit points** but not killed outright, you can drop to **1 hit point** instead.\n\n*Recharge:* Long Rest',
    category: 'Species Trait'
  });

  return features;
}

/**
 * Generate goliath-specific features
 */
function generateGoliathFeatures(character: CharacterSheetData): SimpleFeature[] {
  const features: SimpleFeature[] = [];

  // Get giant ancestry from speciesChoices
  const giantAncestry = character.speciesChoices?.giantAncestry;

  const ancestryData: { [key: string]: { name: string, description: string } } = {
    "Cloud's Jaunt (Cloud Giant)": {
      name: "Cloud's Jaunt",
      description: 'As a Bonus Action, you magically teleport up to 30 feet to an unoccupied space you can see. You can use this trait a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.'
    },
    "Fire's Burn (Fire Giant)": {
      name: "Fire's Burn",
      description: 'When you hit a target with an attack roll and deal damage to it, you can also deal 1d10 Fire damage to that target. You can use this trait a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.'
    },
    "Frost's Chill (Frost Giant)": {
      name: "Frost's Chill",
      description: 'When you hit a target with an attack roll and deal damage to it, you can also deal 1d6 Cold damage to that target and reduce its Speed by 10 feet until the start of your next turn. You can use this trait a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.'
    },
    "Hill's Tumble (Hill Giant)": {
      name: "Hill's Tumble",
      description: 'When you hit a Large or smaller creature with an attack roll and deal damage to it, you can give that target the Prone condition. You can use this trait a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.'
    },
    "Stone's Endurance (Stone Giant)": {
      name: "Stone's Endurance",
      description: 'When you take damage, you can take a Reaction to roll 1d12. Add your Constitution modifier to the number rolled and reduce the damage by that total. You can use this trait a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.'
    },
    "Storm's Thunder (Storm Giant)": {
      name: "Storm's Thunder",
      description: 'When you take damage from a creature within 60 feet of you, you can take a Reaction to deal 1d8 Thunder damage to that creature. You can use this trait a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.'
    }
  };

  const ancestry = ancestryData[giantAncestry || "Stone's Endurance (Stone Giant)"];

  features.push({
    name: 'Giant Ancestry',
    description: `You have ${ancestry.name} ancestry, granting you supernatural abilities tied to your giant heritage.`,
    category: 'Species Trait'
  });

  features.push({
    name: ancestry.name,
    description: ancestry.description,
    category: 'Species Trait'
  });

  features.push({
    name: 'Large Form',
    description: '**Bonus Action:** For **10 minutes**, your size increases to **Large**, your reach increases by **5 feet**, and you have **advantage** on Strength checks and saves.\n\n*Recharge:* Long Rest',
    category: 'Species Trait'
  });

  features.push({
    name: 'Powerful Build',
    description: 'You count as **one size larger** when determining your carrying capacity and the weight you can push, drag, or lift.',
    category: 'Species Trait'
  });

  return features;
}

/**
 * Generate aasimar-specific features
 */
function generateAasimarFeatures(character: CharacterSheetData): SimpleFeature[] {
  const features: SimpleFeature[] = [];

  features.push({
    name: 'Celestial Resistance',
    description: 'You have resistance to **necrotic** and **radiant** damage.',
    category: 'Species Trait'
  });

  features.push({
    name: 'Darkvision',
    description: 'You can see in dim light within **60 feet** as if it were bright light, and in darkness as if it were dim light.',
    category: 'Species Trait'
  });

  features.push({
    name: 'Healing Hands',
    description: '**Action:** Touch a creature and heal it for hit points equal to your **Proficiency Bonus**.\n\n*Recharge:* Long Rest',
    category: 'Species Trait'
  });

  features.push({
    name: 'Light Bearer',
    description: 'You know the **Light** cantrip. **Charisma** is your spellcasting ability for it.',
    category: 'Species Trait'
  });

  const level = character.level || 1;
  if (level >= 3) {
    features.push({
      name: 'Celestial Revelation',
      description: 'At 3rd level, you can transform as a Bonus Action to unleash divine energy. Choose from Necrotic Shroud (frighten nearby creatures), Radiant Consumption (damage nearby enemies), or Radiant Soul (gain flying speed). This transformation lasts for 1 minute. Once you use this trait, you can\'t use it again until you finish a Long Rest.',
      category: 'Species Trait'
    });
  }

  return features;
}

/**
 * Helper to check if a feature is a "choice parent" (like Divine Order) that should be replaced by the actual choice
 */
function isChoiceParentFeature(featureName: string, character: CharacterSheetData): boolean {
  // Check if there's a choice made for this feature
  return !!(character.selectedClassChoices && Object.keys(character.selectedClassChoices).includes(featureName));
}

/**
 * Generate class features using the new choice detection system
 * This replaces the old logic and properly handles choices, granted options, and scaling
 *
 * @param character - Character data
 * @param classData - Complete class data from processed JSON (optional, will use stored features if not provided)
 * @returns Array of features to display
 */
export async function generateClassFeaturesWithChoiceSystem(
  character: CharacterSheetData,
  classData?: ClassData
): Promise<SimpleFeature[]> {
  const features: SimpleFeature[] = [];
  const level = character.level || 1;

  // If classData is provided, use the new system
  if (classData) {
    // Use the choice detection system to get displayable features
    const displayableFeatures = await getDisplayableFeatures(
      classData,
      level,
      character.selectedClassChoices || {},
      character.subclass
    );

    // Convert ClassFeature objects to SimpleFeature format
    displayableFeatures.forEach((feature) => {
      // Apply scaling if needed
      let description = feature.description;
      let mechanics = feature.mechanics;

      if (feature.scales && feature.scalingProgression) {
        // Find applicable scaling
        for (const progression of feature.scalingProgression) {
          if (level >= progression.level) {
            // Apply scaling changes to description
            if (progression.changes.damage) {
              description = description.replace(
                /\d+d\d+/,
                progression.changes.damage
              );
            }

            // Update mechanics
            if (progression.changes) {
              mechanics = { ...mechanics, ...progression.changes };
            }
          }
        }
      }

      // Parse template tags in description
      const parsedDescription = parseComplexDnDEntry(description);

      features.push({
        name: feature.name,
        description: parsedDescription,
        category: feature.featureType === 'subclass' ? 'Subclass Feature' : 'Class Feature'
      });
    });

    return features;
  }

  // Fallback to old system if no classData provided
  return generateClassFeaturesOld(character);
}

/**
 * Generate class features (synchronous wrapper for backwards compatibility)
 * Uses old system by default. For new choice system, call generateClassFeaturesWithChoiceSystem directly.
 */
function generateClassFeatures(character: CharacterSheetData): SimpleFeature[] {
  return generateClassFeaturesOld(character);
}

/**
 * Old class feature generation logic (kept for backwards compatibility)
 * This will be removed once all character creation flows use the new system
 */
function generateClassFeaturesOld(character: CharacterSheetData): SimpleFeature[] {
  const features: SimpleFeature[] = [];
  const characterClass = character.class?.toLowerCase();
  const level = character.level || 1;

  if (!characterClass) return features;

  // Use stored class features from character data (from API/database with 2024 data)
  // Note: character.classFeatures is the EXTRACTED level 1 features from the generator, not ALL features
  if (character.classFeatures && Array.isArray(character.classFeatures)) {
    // Get list of choice option names to exclude them
    const choiceOptionNames = new Set<string>();
    if (character.selectedClassChoices) {
      Object.values(character.selectedClassChoices).forEach(options => {
        options.forEach(opt => choiceOptionNames.add(opt));
      });
    }

    character.classFeatures.forEach((feature: any) => {
      // Only process level 1 features
      if (feature.level !== 1 && feature.level !== undefined) {
        return;
      }

      // Skip choice option features (like Protector, Thaumaturge) - they're not parent features
      if (choiceOptionNames.has(feature.name)) {
        return;
      }

      // Skip "choice parent" features (like Divine Order) if a choice has been made
      if (isChoiceParentFeature(feature.name, character)) {
        // Instead, add the chosen option(s)
        const chosenOptions = character.selectedClassChoices![feature.name];
        if (chosenOptions && Array.isArray(chosenOptions)) {
          chosenOptions.forEach(optionName => {
            // Find the option feature in classFeatures
            const optionFeature = character.classFeatures?.find((f: any) => f.name === optionName);
            if (optionFeature) {
              const description = parseComplexDnDEntry(optionFeature);
              features.push({
                name: optionName,
                description: description,
                category: 'Class Feature'
              });
            }
          });
        }
        return; // Skip the parent feature
      }

      // Parse the feature description through the template parser
      const description = parseComplexDnDEntry(feature);
      features.push({
        name: feature.name,
        description: description,
        category: 'Class Feature'
      });
    });
  } else {
    // Fallback to class-specific generators for classes without stored features
    if (characterClass.includes('barbarian')) {
      features.push(...generateBarbarianFeatures(character));
    } else if (characterClass.includes('bard')) {
      features.push(...generateBardFeatures(character));
    } else if (characterClass.includes('cleric')) {
      features.push(...generateClericFeatures(character));
    } else if (characterClass.includes('druid')) {
      features.push(...generateDruidFeatures(character));
    } else if (characterClass.includes('fighter')) {
      features.push(...generateFighterFeatures(character));
    } else if (characterClass.includes('monk')) {
      features.push(...generateMonkFeatures(character));
    } else if (characterClass.includes('paladin')) {
      features.push(...generatePaladinFeatures(character));
    } else if (characterClass.includes('ranger')) {
      features.push(...generateRangerFeatures(character));
    } else if (characterClass.includes('rogue')) {
      features.push(...generateRogueFeatures(character));
    } else if (characterClass.includes('sorcerer')) {
      features.push(...generateSorcererFeatures(character));
    } else if (characterClass.includes('warlock')) {
      features.push(...generateWarlockFeatures(character));
    } else if (characterClass.includes('wizard')) {
      features.push(...generateWizardFeatures(character));
    }
  }

  // Add Weapon Mastery if applicable and not already included
  const classesWithWeaponMastery = ['barbarian', 'fighter', 'paladin', 'ranger', 'rogue'];
  if (classesWithWeaponMastery.some(c => characterClass.includes(c))) {
    const hasWeaponMastery = features.some(f => f.name === 'Weapon Mastery');
    if (!hasWeaponMastery && level >= 1) {
      const masteryCount = characterClass.includes('fighter') ? 3 : 2;
      const activeMasteries = character.weaponMasteries?.active || [];

      let masteryDesc = `You can use the mastery properties of ${masteryCount} kinds of Simple or Martial weapons of your choice. You can change one of these choices when you finish a Long Rest.`;

      if (activeMasteries.length > 0) {
        masteryDesc += '\n\n**Active Masteries:**';
        activeMasteries.forEach(mastery => {
          const propertyDesc = WEAPON_MASTERY_PROPERTIES[mastery.property];
          masteryDesc += `\n\n**${mastery.weapon} (${mastery.property}):** ${propertyDesc}`;
        });
      } else {
        masteryDesc += '\n\n*No weapon masteries currently selected. Choose your mastery weapons!*';
      }

      features.push({
        name: 'Weapon Mastery',
        description: masteryDesc,
        category: 'Class Feature'
      });
    }
  }

  return features;
}

/**
 * Generate Barbarian class features
 */
function generateBarbarianFeatures(character: CharacterSheetData): SimpleFeature[] {
  const features: SimpleFeature[] = [];
  const level = character.level || 1;

  if (level >= 1) {
    features.push({
      name: 'Rage',
      description: '**Bonus Action:** Enter a rage.\n\n**While Raging:**\n• Resistance to **bludgeoning**, **piercing**, and **slashing** damage\n• Bonus damage on **Strength**-based attacks\n• **Advantage** on Strength checks and saves\n• Cannot concentrate on spells or cast spells\n\n*Duration:* Until the end of your next turn (can be extended)',
      category: 'Class Feature'
    });

    features.push({
      name: 'Unarmored Defense',
      description: 'While not wearing armor, your **AC = 10 + DEX + CON**. You can use a shield and still gain this benefit.',
      category: 'Class Feature'
    });

    // Weapon Mastery feature with tracking
    const masteryCount = 2; // Barbarians get 2 weapon masteries
    const activeMasteries = character.weaponMasteries?.active || [];

    let masteryDesc = `You can use the mastery properties of ${masteryCount} kinds of Simple or Martial Melee weapons of your choice. You can change one of these choices when you finish a Long Rest.`;

    if (activeMasteries.length > 0) {
      masteryDesc += '\n\n**Active Masteries:**';
      activeMasteries.forEach(mastery => {
        const propertyDesc = WEAPON_MASTERY_PROPERTIES[mastery.property];
        masteryDesc += `\n\n**${mastery.weapon} (${mastery.property}):** ${propertyDesc}`;
      });
    } else {
      masteryDesc += '\n\n*No weapon masteries currently selected. Choose your mastery weapons!*';
    }

    features.push({
      name: 'Weapon Mastery',
      description: masteryDesc,
      category: 'Class Feature'
    });
  }

  return features;
}

/**
 * Generate Fighter class features
 */
function generateFighterFeatures(character: CharacterSheetData): SimpleFeature[] {
  const features: SimpleFeature[] = [];
  const level = character.level || 1;

  if (level >= 1) {
    // Check if we have a specific fighting style choice stored anywhere
    // For now, we'll need to detect from classFeatures or implement choice storage
    const fightingStyleChoice = detectFightingStyleChoice(character);

    if (fightingStyleChoice) {
      features.push({
        name: `Fighting Style - ${fightingStyleChoice}`,
        description: getFightingStyleDescription(fightingStyleChoice),
        category: 'Class Feature'
      });
    } else {
      // Fallback: show all available fighting styles for selection
      features.push({
        name: 'Fighting Style',
        description: 'You adopt a particular style of fighting. You must choose one of the available fighting styles.',
        category: 'Class Feature'
      });

      // Add individual fighting style options
      const fightingStyles = [
        'Archery', 'Blind Fighting', 'Defense', 'Dueling', 'Great Weapon Fighting',
        'Interception', 'Protection', 'Thrown Weapon Fighting', 'Two-Weapon Fighting', 'Unarmed Fighting'
      ];

      fightingStyles.forEach(style => {
        features.push({
          name: `${style} Fighting Style`,
          description: getFightingStyleDescription(style),
          category: 'Class Feature'
        });
      });
    }

    features.push({
      name: 'Second Wind',
      description: '**Bonus Action:** Regain **1d10 + Fighter level** hit points.\n\n*Recharge:* Short or Long Rest',
      category: 'Class Feature'
    });

    // Weapon Mastery feature with tracking
    const masteryCount = 3; // Fighters get 3 weapon masteries
    const activeMasteries = character.weaponMasteries?.active || [];

    let masteryDesc = `You can use the mastery properties of ${masteryCount} kinds of Simple or Martial weapons of your choice. You can change one of these choices when you finish a Long Rest.`;

    if (activeMasteries.length > 0) {
      masteryDesc += '\n\n**Active Masteries:**';
      activeMasteries.forEach(mastery => {
        const propertyDesc = WEAPON_MASTERY_PROPERTIES[mastery.property];
        masteryDesc += `\n\n**${mastery.weapon} (${mastery.property}):** ${propertyDesc}`;
      });
    } else {
      masteryDesc += '\n\n*No weapon masteries currently selected. Choose your mastery weapons!*';
    }

    features.push({
      name: 'Weapon Mastery',
      description: masteryDesc,
      category: 'Class Feature'
    });
  }

  return features;
}

/**
 * Detect fighting style choice from character data
 */
function detectFightingStyleChoice(character: CharacterSheetData): string | null {
  // First check the new classChoices field
  if (character.classChoices?.fightingStyle) {
    return character.classChoices.fightingStyle;
  }

  // Check if fighting style is stored in classFeatures with specific choice
  if (character.classFeatures) {
    for (const feature of character.classFeatures) {
      if (typeof feature === 'string' && feature.toLowerCase().includes('fighting style')) {
        // Try to extract the specific style from the feature text
        const fightingStyles = [
          'Archery', 'Blind Fighting', 'Defense', 'Dueling', 'Great Weapon Fighting',
          'Interception', 'Protection', 'Thrown Weapon Fighting', 'Two-Weapon Fighting', 'Unarmed Fighting'
        ];
        const foundStyle = fightingStyles.find(style =>
          feature.toLowerCase().includes(style.toLowerCase())
        );
        if (foundStyle) return foundStyle;
      }
    }
  }

  // Check if it's stored as a feat choice (since fighting styles are feats in D&D 2024)
  if (character.featChoices) {
    for (const [featName, _choices] of Object.entries(character.featChoices)) {
      const fightingStyles = [
        'Archery', 'Blind Fighting', 'Defense', 'Dueling', 'Great Weapon Fighting',
        'Interception', 'Protection', 'Thrown Weapon Fighting', 'Two-Weapon Fighting', 'Unarmed Fighting'
      ];
      if (fightingStyles.includes(featName)) {
        return featName;
      }
    }
  }

  return null;
}

/**
 * Get detailed description for a fighting style
 */
function getFightingStyleDescription(style: string): string {
  const descriptions: { [key: string]: string } = {
    'Archery': 'You gain a **+2 bonus** to attack rolls you make with **ranged weapons**.',
    'Blind Fighting': 'You have **Blindsight** with a range of **10 feet**.',
    'Defense': 'While wearing armor, you gain a **+1 bonus to AC**.',
    'Dueling': 'When wielding a melee weapon in one hand and no other weapons, you gain a **+2 bonus** to damage rolls with that weapon.',
    'Great Weapon Fighting': 'When you roll a **1 or 2** on a damage die for an attack with a melee weapon wielded with **two hands**, you can **reroll the die** and must use the new roll. The weapon must have the **two-handed** or **versatile** property.',
    'Interception': '**Reaction:** When a creature you can see hits a target other than you within **5 feet** of you, reduce the damage by **1d10 + Proficiency Bonus**. You must be wielding a **shield** or a weapon.',
    'Protection': '**Reaction:** When a creature you can see attacks a target other than you within **5 feet** of you, impose **disadvantage** on the attack roll. You must be wielding a **shield**.',
    'Thrown Weapon Fighting': 'You can draw a weapon with the **Thrown** property as part of the attack. When you hit with a ranged attack using a thrown weapon, you gain a **+2 bonus** to the damage roll.',
    'Two-Weapon Fighting': 'When you engage in two-weapon fighting, you can add your **ability modifier** to the damage of the second attack.',
    'Unarmed Fighting': 'Your unarmed strikes deal **1d6 + STR** bludgeoning damage (or **1d8** with two free hands). When you start a grapple, you can deal **1d4** bludgeoning damage to the grappled creature.'
  };

  return descriptions[style] || `Details for ${style} fighting style.`;
}

/**
 * Get detailed description for a ranger fighting style (subset of fighter styles)
 */
function getRangerFightingStyleDescription(style: string): string {
  const descriptions: { [key: string]: string } = {
    'Archery': 'You gain a +2 bonus to attack rolls you make with ranged weapons.',
    'Defense': 'While you are wearing armor, you gain a +1 bonus to AC.',
    'Dueling': 'When you are wielding a melee weapon in one hand and no other weapons, you gain a +2 bonus to damage rolls with that weapon.',
    'Two-Weapon Fighting': 'When you engage in two-weapon fighting, you can add your ability modifier to the damage of the second attack.'
  };

  return descriptions[style] || `Details for ${style} fighting style.`;
}

/**
 * Get detailed description for a paladin fighting style
 */
function getPaladinFightingStyleDescription(style: string): string {
  const descriptions: { [key: string]: string } = {
    'Blessed Warrior': 'You learn two Cantrips of your choice from the Cleric spell list. They count as Paladin spells for you, and Charisma is your spellcasting ability for them. Whenever you gain a Paladin level, you can replace one of these cantrips with another Cantrip from the Cleric spell list.',
    'Defense': 'While you are wearing armor, you gain a +1 bonus to AC.',
    'Dueling': 'When you are wielding a melee weapon in one hand and no other weapons, you gain a +2 bonus to damage rolls with that weapon.',
    'Great Weapon Fighting': 'When you roll a 1 or 2 on a damage die for an attack you make with a melee weapon that you are wielding with two hands, you can reroll the die and must use the new roll, even if the new roll is a 1 or a 2. The weapon must have the two-handed or versatile property for you to gain this benefit.',
    'Protection': 'When a creature you can see attacks a target other than you that is within 5 feet of you, you can use your reaction to impose disadvantage on the attack roll. You must be wielding a shield.'
  };

  return descriptions[style] || `Details for ${style} fighting style.`;
}

/**
 * Generate Rogue class features
 */
function generateRogueFeatures(character: CharacterSheetData): SimpleFeature[] {
  const features: SimpleFeature[] = [];
  const level = character.level || 1;

  if (level >= 1) {
    features.push({
      name: 'Expertise',
      description: 'Choose **two skill proficiencies** or **one skill and thieves\' tools**. Your proficiency bonus is **doubled** for ability checks using these proficiencies.',
      category: 'Class Feature'
    });

    features.push({
      name: 'Sneak Attack',
      description: '**Once per turn**, deal an extra **1d6 damage** to one creature you hit if you have **advantage** on the attack roll. The attack must use a **finesse** or **ranged** weapon.',
      category: 'Class Feature'
    });

    features.push({
      name: 'Thieves\' Cant',
      description: 'You know thieves\' cant, a secret mix of dialect, jargon, and code that allows you to hide messages in seemingly normal conversation.',
      category: 'Class Feature'
    });

    // Weapon Mastery feature with tracking (Rogue has special restriction: Finesse weapons only)
    const masteryCount = 2; // Rogues get 2 weapon masteries
    const activeMasteries = character.weaponMasteries?.active || [];

    let masteryDesc = `You can use the mastery properties of ${masteryCount} kinds of Simple or Martial weapons that have the Finesse property. You can change one of these choices when you finish a Long Rest.`;

    if (activeMasteries.length > 0) {
      masteryDesc += '\n\n**Active Masteries:**';
      activeMasteries.forEach(mastery => {
        const propertyDesc = WEAPON_MASTERY_PROPERTIES[mastery.property];
        masteryDesc += `\n\n**${mastery.weapon} (${mastery.property}):** ${propertyDesc}`;
      });
    } else {
      masteryDesc += '\n\n*No weapon masteries currently selected. Choose your mastery weapons (must have Finesse property)!*';
    }

    features.push({
      name: 'Weapon Mastery',
      description: masteryDesc,
      category: 'Class Feature'
    });
  }

  return features;
}

/**
 * Generate placeholder features for other classes
 */
function generateBardFeatures(_character: CharacterSheetData): SimpleFeature[] {
  return [{
    name: 'Bardic Inspiration',
    description: '**Bonus Action:** Choose one creature within **60 feet** who can hear you. That creature gains one **Bardic Inspiration die (d6)**.',
    category: 'Class Feature'
  }, {
    name: 'Spellcasting',
    description: 'You can cast **bard spells**. **Charisma** is your spellcasting ability.',
    category: 'Class Feature'
  }];
}

function generateClericFeatures(_character: CharacterSheetData): SimpleFeature[] {
  return [{
    name: 'Spellcasting',
    description: 'You can cast **cleric spells**. **Wisdom** is your spellcasting ability.',
    category: 'Class Feature'
  }, {
    name: 'Divine Order',
    description: 'You have dedicated yourself to one of the following sacred roles: **Protector** or **Thaumaturge**.',
    category: 'Class Feature'
  }];
}

function generateDruidFeatures(_character: CharacterSheetData): SimpleFeature[] {
  return [{
    name: 'Druidcraft',
    description: 'You know the **Druidcraft** cantrip.',
    category: 'Class Feature'
  }, {
    name: 'Spellcasting',
    description: 'You can cast **druid spells**. **Wisdom** is your spellcasting ability.',
    category: 'Class Feature'
  }];
}

function generateMonkFeatures(_character: CharacterSheetData): SimpleFeature[] {
  return [{
    name: 'Martial Arts',
    description: 'You can use **Dexterity** instead of Strength for attack and damage rolls of **unarmed strikes** and **monk weapons**. You can roll a **d6** in place of the normal damage.',
    category: 'Class Feature'
  }, {
    name: 'Unarmored Defense',
    description: 'While not wearing armor or wielding a shield, your **AC = 10 + DEX + WIS**.',
    category: 'Class Feature'
  }];
}

function generatePaladinFeatures(character: CharacterSheetData): SimpleFeature[] {
  const features: SimpleFeature[] = [];
  const level = character.level || 1;

  if (level >= 1) {
    features.push({
      name: 'Lay on Hands',
      description: `You have a pool of healing power equal to **${(character.level || 1) * 5} HP**. Touch a creature to restore any amount of HP from the pool.\n\n*Recharge:* Long Rest`,
      category: 'Class Feature'
    });

    features.push({
      name: 'Spellcasting',
      description: 'You can cast **paladin spells**. **Charisma** is your spellcasting ability.',
      category: 'Class Feature'
    });

    // Weapon Mastery feature with tracking
    const masteryCount = 2; // Paladins get 2 weapon masteries
    const activeMasteries = character.weaponMasteries?.active || [];

    let masteryDesc = `You can use the mastery properties of ${masteryCount} kinds of Simple or Martial weapons of your choice. You can change one of these choices when you finish a Long Rest.`;

    if (activeMasteries.length > 0) {
      masteryDesc += '\n\n**Active Masteries:**';
      activeMasteries.forEach(mastery => {
        const propertyDesc = WEAPON_MASTERY_PROPERTIES[mastery.property];
        masteryDesc += `\n\n**${mastery.weapon} (${mastery.property}):** ${propertyDesc}`;
      });
    } else {
      masteryDesc += '\n\n*No weapon masteries currently selected. Choose your mastery weapons!*';
    }

    features.push({
      name: 'Weapon Mastery',
      description: masteryDesc,
      category: 'Class Feature'
    });
  }

  // Paladins get Fighting Style at level 2, but let's show it anyway for level 1 characters
  if (level >= 1) {
    const fightingStyleChoice = detectFightingStyleChoice(character);

    if (fightingStyleChoice) {
      features.push({
        name: `Fighting Style - ${fightingStyleChoice}`,
        description: getPaladinFightingStyleDescription(fightingStyleChoice),
        category: 'Class Feature'
      });
    } else {
      // Show available paladin fighting styles
      features.push({
        name: 'Fighting Style (Level 2)',
        description: 'At 2nd level, you adopt a particular style of fighting as your specialty.',
        category: 'Class Feature'
      });

      const paladinFightingStyles = ['Blessed Warrior', 'Defense', 'Dueling', 'Great Weapon Fighting', 'Protection'];
      paladinFightingStyles.forEach(style => {
        features.push({
          name: `${style} Fighting Style`,
          description: getPaladinFightingStyleDescription(style),
          category: 'Class Feature'
        });
      });
    }
  }

  return features;
}

function generateRangerFeatures(character: CharacterSheetData): SimpleFeature[] {
  const features: SimpleFeature[] = [];
  const level = character.level || 1;

  // Use stored class features from character data (from API/database with 2024 data)
  if (character.classFeatures && Array.isArray(character.classFeatures)) {
    character.classFeatures.forEach((feature: any) => {
      if (feature.level === 1 || !feature.level) {
        // Parse the feature description through the template parser
        const description = parseComplexDnDEntry(feature);
        features.push({
          name: feature.name,
          description: description,
          category: 'Class Feature'
        });
      }
    });
  }

  // Add Weapon Mastery with tracking if not already included
  const hasWeaponMastery = features.some(f => f.name === 'Weapon Mastery');
  if (!hasWeaponMastery && level >= 1) {
    const masteryCount = 2; // Rangers get 2 weapon masteries
    const activeMasteries = character.weaponMasteries?.active || [];

    let masteryDesc = `You can use the mastery properties of ${masteryCount} kinds of Simple or Martial weapons of your choice. You can change one of these choices when you finish a Long Rest.`;

    if (activeMasteries.length > 0) {
      masteryDesc += '\n\n**Active Masteries:**';
      activeMasteries.forEach(mastery => {
        const propertyDesc = WEAPON_MASTERY_PROPERTIES[mastery.property];
        masteryDesc += `\n\n**${mastery.weapon} (${mastery.property}):** ${propertyDesc}`;
      });
    } else {
      masteryDesc += '\n\n*No weapon masteries currently selected. Choose your mastery weapons!*';
    }

    features.push({
      name: 'Weapon Mastery',
      description: masteryDesc,
      category: 'Class Feature'
    });
  }

  // Rangers get Fighting Style at level 2, but let's show it anyway for level 1 characters
  if (level >= 1) {
    const fightingStyleChoice = detectFightingStyleChoice(character);

    if (fightingStyleChoice) {
      features.push({
        name: `Fighting Style - ${fightingStyleChoice}`,
        description: getRangerFightingStyleDescription(fightingStyleChoice),
        category: 'Class Feature'
      });
    } else {
      // Show available ranger fighting styles
      features.push({
        name: 'Fighting Style (Level 2)',
        description: 'At 2nd level, you adopt a particular style of fighting as your specialty.',
        category: 'Class Feature'
      });

      const rangerFightingStyles = ['Archery', 'Defense', 'Dueling', 'Two-Weapon Fighting'];
      rangerFightingStyles.forEach(style => {
        features.push({
          name: `${style} Fighting Style`,
          description: getRangerFightingStyleDescription(style),
          category: 'Class Feature'
        });
      });
    }
  }

  return features;
}

function generateSorcererFeatures(_character: CharacterSheetData): SimpleFeature[] {
  return [{
    name: 'Innate Sorcery',
    description: 'An event in your past left an indelible mark on you, infusing you with **sorcerous magic**. The source of your magic determines some of your spells.',
    category: 'Class Feature'
  }, {
    name: 'Spellcasting',
    description: 'You can cast **sorcerer spells**. **Charisma** is your spellcasting ability.',
    category: 'Class Feature'
  }];
}

function generateWarlockFeatures(_character: CharacterSheetData): SimpleFeature[] {
  return [{
    name: 'Otherworldly Patron',
    description: 'You have made a pact with an **otherworldly being**. Your patron gives you features at **1st, 6th, 10th, and 14th level**.',
    category: 'Class Feature'
  }, {
    name: 'Pact Magic',
    description: 'You can cast **warlock spells**. **Charisma** is your spellcasting ability.',
    category: 'Class Feature'
  }];
}

function generateWizardFeatures(_character: CharacterSheetData): SimpleFeature[] {
  return [{
    name: 'Spellcasting',
    description: 'You can cast **wizard spells**. **Intelligence** is your spellcasting ability.',
    category: 'Class Feature'
  }, {
    name: 'Ritual Casting',
    description: 'You can cast a wizard spell as a **ritual** if that spell has the ritual tag and you have the spell in your **spellbook**.',
    category: 'Class Feature'
  }];
}

/**
 * Generate background features
 */
function generateBackgroundFeatures(character: CharacterSheetData): SimpleFeature[] {
  const features: SimpleFeature[] = [];

  // Get background features from character data
  if (character.backgroundFeatures && character.backgroundFeatures.length > 0) {
    character.backgroundFeatures.forEach((bgFeature, index) => {
      // Handle different background feature formats
      let featureName = 'Background Feature';
      let featureDescription = 'A feature from your background.';

      if (typeof bgFeature === 'string') {
        featureDescription = bgFeature;
      } else if (bgFeature && typeof bgFeature === 'object') {
        featureName = bgFeature.name || bgFeature.title || `Background Feature ${index + 1}`;
        featureDescription = extractFeatureDescription(bgFeature);
      }

      features.push({
        name: featureName,
        description: featureDescription,
        category: 'Background Feature'
      });
    });
  }

  // Languages are now handled in the Proficiencies section, so we don't add them here

  return features;
}

/**
 * Helper function to extract description from complex background feature objects
 */
function extractFeatureDescription(bgFeature: any): string {
  // Handle various formats background features might come in
  if (typeof bgFeature === 'string') {
    return bgFeature;
  }

  if (bgFeature.description) {
    return Array.isArray(bgFeature.description)
      ? bgFeature.description.join(' ')
      : bgFeature.description;
  }

  if (bgFeature.entries && Array.isArray(bgFeature.entries)) {
    return bgFeature.entries.map((entry: any) =>
      typeof entry === 'string' ? entry : JSON.stringify(entry)
    ).join(' ');
  }

  if (bgFeature.text) {
    return bgFeature.text;
  }

  return 'A background feature.';
}

/**
 * Generate feat features - consolidated under one heading per feat
 */
function generateFeatFeatures(character: CharacterSheetData): SimpleFeature[] {
  const features: SimpleFeature[] = [];

  // Process origin feats and their features
  if (character.selectedOriginFeats && character.selectedOriginFeats.length > 0) {
    character.selectedOriginFeats.forEach((featName) => {
      const descriptionParts: string[] = [];

      // Get feat features from the stored data
      const featFeatures = character.featFeatures?.[featName];

      // Special handling for specific feats that primarily grant choices
      const choiceBasedFeats = ['Skilled', 'Linguist', 'Weapon Master'];
      if (choiceBasedFeats.includes(featName)) {
        const featChoices = character.featChoices?.[featName];
        if (featChoices && typeof featChoices === 'object') {
          Object.entries(featChoices).forEach(([_choiceType, choiceValue]) => {
            if (Array.isArray(choiceValue) && choiceValue.length > 0) {
              const prefix = featName === 'Skilled' ? 'You gain **proficiency** in' :
                            featName === 'Linguist' ? 'You learn' :
                            featName === 'Weapon Master' ? 'You gain **proficiency** with' :
                            'You gain';
              descriptionParts.push(`${prefix} **${choiceValue.join('**, **')}**.`);
            } else if (typeof choiceValue === 'string') {
              const prefix = featName === 'Skilled' ? 'You gain **proficiency** in' :
                            featName === 'Linguist' ? 'You learn' :
                            featName === 'Weapon Master' ? 'You gain **proficiency** with' :
                            'You gain';
              descriptionParts.push(`${prefix} **${choiceValue}**.`);
            }
          });
        }

        // For Linguist, might also want to add the cipher ability
        if (featName === 'Linguist' && featFeatures && featFeatures.length > 0) {
          const cipherFeature = featFeatures.find((f: any) => {
            const desc = typeof f === 'string' ? f : extractFeatFeatureDescription(f);
            return desc.toLowerCase().includes('cipher') || desc.toLowerCase().includes('code');
          });
          if (cipherFeature) {
            const desc = typeof cipherFeature === 'string' ? cipherFeature : extractFeatFeatureDescription(cipherFeature);
            descriptionParts.push(`**Ciphers:** ${desc}`);
          }
        }

        // Create single consolidated feature
        if (descriptionParts.length > 0) {
          features.push({
            name: featName,
            description: descriptionParts.join('\n\n'),
            category: 'Feat'
          });
        }

        return; // Skip the normal processing for these feats
      }

      // For other feats, filter out non-useful information and consolidate
      if (featFeatures && featFeatures.length > 0) {
        const filteredFeatures = featFeatures.filter((featFeature: any) => {
          // Skip generic/non-useful descriptions
          const desc = typeof featFeature === 'string'
            ? featFeature
            : (featFeature && typeof featFeature === 'object')
              ? extractFeatFeatureDescription(featFeature)
              : '';

          const lowerDesc = desc.toLowerCase();

          // Comprehensive list of non-useful text patterns to skip
          const skipPatterns = [
            'repeatable',
            'you gain proficiency in the following',
            'choose one of the following',
            'choose three of the following',
            'prerequisite:',
            'ability score increase',
            'increase one ability score',
            'you can take this feat multiple times',
            'general feat',
            'origin feat',
            '4th-level feat',
            '8th-level feat',
            '12th-level feat',
            '16th-level feat',
            '19th-level feat',
            'epic boon',
            'you gain the following',
            'tool proficiency:',
            'skill proficiency:',
            'weapon proficiency:',
            'armor proficiency:',
            'language proficiency:'
          ];

          // Check if description contains any skip patterns
          if (skipPatterns.some(pattern => lowerDesc.includes(pattern))) {
            return false;
          }

          // Also skip very short generic descriptions
          if (desc.length < 20 && lowerDesc.includes('feat')) {
            return false;
          }

          return true;
        });

        filteredFeatures.forEach((featFeature: any) => {
          let featureDescription = 'A feat feature.';

          if (typeof featFeature === 'string') {
            // Parse template tags in string features
            featureDescription = parseComplexDnDEntry(featFeature);
          } else if (featFeature && typeof featFeature === 'object') {
            const subName = featFeature.name || featFeature.title;
            featureDescription = extractFeatFeatureDescription(featFeature);
            // If there's a sub-feature name, format it as a heading
            if (subName && subName !== featName) {
              featureDescription = `**${subName}:** ${featureDescription}`;
            }
          }

          descriptionParts.push(featureDescription);
        });
      }

      // Add spell features from feats if any
      const featSpells = character.featSpells?.[featName];
      if (featSpells && featSpells.length > 0) {
        descriptionParts.push(`**Spells:** You know **${featSpells.join('**, **')}**.`);
      }

      // Add choice-based features if any (for feats other than Skilled)
      const featChoices = character.featChoices?.[featName];
      if (featChoices && typeof featChoices === 'object' && !choiceBasedFeats.includes(featName)) {
        Object.entries(featChoices).forEach(([choiceType, choiceValue]) => {
          if (Array.isArray(choiceValue) && choiceValue.length > 0) {
            descriptionParts.push(`**${choiceType}:** **${choiceValue.join('**, **')}**`);
          } else if (typeof choiceValue === 'string') {
            descriptionParts.push(`**${choiceType}:** **${choiceValue}**`);
          }
        });
      }

      // Create single consolidated feature for this feat
      if (descriptionParts.length > 0) {
        features.push({
          name: featName,
          description: descriptionParts.join('\n\n'),
          category: 'Feat'
        });
      } else {
        // If no useful features were added for this feat, add a minimal description
        features.push({
          name: featName,
          description: `You have the ${featName} feat.`,
          category: 'Feat'
        });
      }
    });
  }

  return features;
}

/**
 * Extract description from feat feature data
 */
function extractFeatFeatureDescription(featFeature: any): string {
  // Use the parseComplexDnDEntry function which handles nested structures and template tags
  return parseComplexDnDEntry(featFeature);
}

/**
 * Generate proficiencies feature (always displayed last)
 */
function generateProficienciesFeature(character: CharacterSheetData): SimpleFeature[] {
  const proficiencySections: string[] = [];

  // Weapons
  if (character.proficiencies?.weapons && character.proficiencies.weapons.length > 0) {
    proficiencySections.push(`**Weapons:** ${character.proficiencies.weapons.join(', ')}`);
  }

  // Armor
  if (character.proficiencies?.armor && character.proficiencies.armor.length > 0) {
    proficiencySections.push(`**Armor:** ${character.proficiencies.armor.join(', ')}`);
  }

  // Languages
  const allLanguages = [
    ...(character.selectedLanguages || []),
    // Add any other language sources here
  ];
  if (allLanguages.length > 0) {
    proficiencySections.push(`**Languages:** ${allLanguages.join(', ')}`);
  }

  // Tools
  if (character.proficiencies?.tools && character.proficiencies.tools.length > 0) {
    proficiencySections.push(`**Tools:** ${character.proficiencies.tools.join(', ')}`);
  }

  // Vehicles (if we add this later)
  // if (character.proficiencies?.vehicles && character.proficiencies.vehicles.length > 0) {
  //   proficiencySections.push(`**Vehicles:** ${character.proficiencies.vehicles.join(', ')}`);
  // }

  // Saving Throws
  if (character.proficiencies?.savingThrows && character.proficiencies.savingThrows.length > 0) {
    proficiencySections.push(`**Saving Throws:** ${character.proficiencies.savingThrows.join(', ')}`);
  }

  // Skills
  if (character.proficiencies?.skills && character.proficiencies.skills.length > 0) {
    proficiencySections.push(`**Skills:** ${character.proficiencies.skills.join(', ')}`);
  }

  // Musical Instruments (from feat choices or other sources)
  const instruments: string[] = [];
  if (character.featChoices) {
    Object.values(character.featChoices).forEach(choices => {
      if (choices && typeof choices === 'object' && choices.instruments && Array.isArray(choices.instruments)) {
        instruments.push(...choices.instruments);
      }
    });
  }
  if (instruments.length > 0) {
    proficiencySections.push(`**Instruments:** ${instruments.join(', ')}`);
  }

  // Only create the proficiencies feature if there are any proficiencies to show
  if (proficiencySections.length === 0) {
    return [];
  }

  return [{
    name: 'Proficiencies',
    description: proficiencySections.join('\n\n'),
    category: 'Proficiencies'
  }];
}

/**
 * Helper functions
 */
function getDragonData(ancestry: string) {
  const dragonMap: { [key: string]: any } = {
    'Black': { fullName: 'Black Dragon', damageType: 'acid', area: '15-foot line (5 feet wide)', saveType: 'Dexterity' },
    'Blue': { fullName: 'Blue Dragon', damageType: 'lightning', area: '15-foot line (5 feet wide)', saveType: 'Dexterity' },
    'Brass': { fullName: 'Brass Dragon', damageType: 'fire', area: '15-foot line (5 feet wide)', saveType: 'Dexterity' },
    'Bronze': { fullName: 'Bronze Dragon', damageType: 'lightning', area: '15-foot line (5 feet wide)', saveType: 'Dexterity' },
    'Copper': { fullName: 'Copper Dragon', damageType: 'acid', area: '15-foot line (5 feet wide)', saveType: 'Dexterity' },
    'Gold': { fullName: 'Gold Dragon', damageType: 'fire', area: '15-foot cone', saveType: 'Dexterity' },
    'Green': { fullName: 'Green Dragon', damageType: 'poison', area: '15-foot cone', saveType: 'Constitution' },
    'Red': { fullName: 'Red Dragon', damageType: 'fire', area: '15-foot cone', saveType: 'Dexterity' },
    'Silver': { fullName: 'Silver Dragon', damageType: 'cold', area: '15-foot cone', saveType: 'Constitution' },
    'White': { fullName: 'White Dragon', damageType: 'cold', area: '15-foot cone', saveType: 'Constitution' }
  };

  return dragonMap[ancestry] || dragonMap['Red']; // Default to Red
}

function getProficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

function getConstitutionModifier(character: CharacterSheetData): number {
  const constitution = character.abilityScores?.constitution || 10;
  return Math.floor((constitution - 10) / 2);
}

function getBreathWeaponDamage(level: number): string {
  if (level >= 17) return '4d6';
  if (level >= 11) return '3d6';
  if (level >= 5) return '2d6';
  return '1d6';
}