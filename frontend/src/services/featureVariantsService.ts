import { CharacterFeature, FeatureSource } from '../types/features';
import { CharacterBuilderData } from '../components/CharacterGeneratorWizard';
import { CharacterSheetData } from '../types/characterSheet';

/**
 * Service for managing feature variants based on character choices
 */

// Feature variants database - organized by source and base feature
export const FEATURE_VARIANTS: { [key: string]: CharacterFeature[] } = {
  // Dragonborn Species Features
  'dragonborn-draconic-ancestry': [
    {
      id: 'dragonborn-draconic-ancestry-black',
      name: 'Draconic Ancestry',
      variant: 'Black Dragon',
      baseFeatureId: 'dragonborn-draconic-ancestry',
      source: 'species',
      sourceDetail: 'Dragonborn',
      type: 'passive',
      prerequisites: ['species=Dragonborn', 'draconicAncestry=Black Dragon'],
      description: 'You have Black Dragon ancestry, which determines your breath weapon and damage resistance. Your draconic heritage grants you a connection to Black Dragons and their acidic powers.',
      shortDescription: 'Black Dragon ancestry grants acid-based abilities',
      category: 'Species Trait',
      tags: ['ancestry', 'dragon', 'acid']
    },
    {
      id: 'dragonborn-draconic-ancestry-blue',
      name: 'Draconic Ancestry',
      variant: 'Blue Dragon',
      baseFeatureId: 'dragonborn-draconic-ancestry',
      source: 'species',
      sourceDetail: 'Dragonborn',
      type: 'passive',
      prerequisites: ['species=Dragonborn', 'draconicAncestry=Blue Dragon'],
      description: 'You have Blue Dragon ancestry, which determines your breath weapon and damage resistance. Your draconic heritage grants you a connection to Blue Dragons and their lightning powers.',
      shortDescription: 'Blue Dragon ancestry grants lightning-based abilities',
      category: 'Species Trait',
      tags: ['ancestry', 'dragon', 'lightning']
    },
    {
      id: 'dragonborn-draconic-ancestry-brass',
      name: 'Draconic Ancestry',
      variant: 'Brass Dragon',
      baseFeatureId: 'dragonborn-draconic-ancestry',
      source: 'species',
      sourceDetail: 'Dragonborn',
      type: 'passive',
      prerequisites: ['species=Dragonborn', 'draconicAncestry=Brass Dragon'],
      description: 'You have Brass Dragon ancestry, which determines your breath weapon and damage resistance. Your draconic heritage grants you a connection to Brass Dragons and their fiery powers.',
      shortDescription: 'Brass Dragon ancestry grants fire-based abilities',
      category: 'Species Trait',
      tags: ['ancestry', 'dragon', 'fire']
    },
    {
      id: 'dragonborn-draconic-ancestry-bronze',
      name: 'Draconic Ancestry',
      variant: 'Bronze Dragon',
      baseFeatureId: 'dragonborn-draconic-ancestry',
      source: 'species',
      sourceDetail: 'Dragonborn',
      type: 'passive',
      prerequisites: ['species=Dragonborn', 'draconicAncestry=Bronze Dragon'],
      description: 'You have Bronze Dragon ancestry, which determines your breath weapon and damage resistance. Your draconic heritage grants you a connection to Bronze Dragons and their lightning powers.',
      shortDescription: 'Bronze Dragon ancestry grants lightning-based abilities',
      category: 'Species Trait',
      tags: ['ancestry', 'dragon', 'lightning']
    },
    {
      id: 'dragonborn-draconic-ancestry-copper',
      name: 'Draconic Ancestry',
      variant: 'Copper Dragon',
      baseFeatureId: 'dragonborn-draconic-ancestry',
      source: 'species',
      sourceDetail: 'Dragonborn',
      type: 'passive',
      prerequisites: ['species=Dragonborn', 'draconicAncestry=Copper Dragon'],
      description: 'You have Copper Dragon ancestry, which determines your breath weapon and damage resistance. Your draconic heritage grants you a connection to Copper Dragons and their acidic powers.',
      shortDescription: 'Copper Dragon ancestry grants acid-based abilities',
      category: 'Species Trait',
      tags: ['ancestry', 'dragon', 'acid']
    },
    {
      id: 'dragonborn-draconic-ancestry-gold',
      name: 'Draconic Ancestry',
      variant: 'Gold Dragon',
      baseFeatureId: 'dragonborn-draconic-ancestry',
      source: 'species',
      sourceDetail: 'Dragonborn',
      type: 'passive',
      prerequisites: ['species=Dragonborn', 'draconicAncestry=Gold Dragon'],
      description: 'You have Gold Dragon ancestry, which determines your breath weapon and damage resistance. Your draconic heritage grants you a connection to Gold Dragons and their fiery powers.',
      shortDescription: 'Gold Dragon ancestry grants fire-based abilities',
      category: 'Species Trait',
      tags: ['ancestry', 'dragon', 'fire']
    },
    {
      id: 'dragonborn-draconic-ancestry-green',
      name: 'Draconic Ancestry',
      variant: 'Green Dragon',
      baseFeatureId: 'dragonborn-draconic-ancestry',
      source: 'species',
      sourceDetail: 'Dragonborn',
      type: 'passive',
      prerequisites: ['species=Dragonborn', 'draconicAncestry=Green Dragon'],
      description: 'You have Green Dragon ancestry, which determines your breath weapon and damage resistance. Your draconic heritage grants you a connection to Green Dragons and their poisonous powers.',
      shortDescription: 'Green Dragon ancestry grants poison-based abilities',
      category: 'Species Trait',
      tags: ['ancestry', 'dragon', 'poison']
    },
    {
      id: 'dragonborn-draconic-ancestry-red',
      name: 'Draconic Ancestry',
      variant: 'Red Dragon',
      baseFeatureId: 'dragonborn-draconic-ancestry',
      source: 'species',
      sourceDetail: 'Dragonborn',
      type: 'passive',
      prerequisites: ['species=Dragonborn', 'draconicAncestry=Red Dragon'],
      description: 'You have Red Dragon ancestry, which determines your breath weapon and damage resistance. Your draconic heritage grants you a connection to Red Dragons and their fiery powers.',
      shortDescription: 'Red Dragon ancestry grants fire-based abilities',
      category: 'Species Trait',
      tags: ['ancestry', 'dragon', 'fire']
    },
    {
      id: 'dragonborn-draconic-ancestry-silver',
      name: 'Draconic Ancestry',
      variant: 'Silver Dragon',
      baseFeatureId: 'dragonborn-draconic-ancestry',
      source: 'species',
      sourceDetail: 'Dragonborn',
      type: 'passive',
      prerequisites: ['species=Dragonborn', 'draconicAncestry=Silver Dragon'],
      description: 'You have Silver Dragon ancestry, which determines your breath weapon and damage resistance. Your draconic heritage grants you a connection to Silver Dragons and their cold powers.',
      shortDescription: 'Silver Dragon ancestry grants cold-based abilities',
      category: 'Species Trait',
      tags: ['ancestry', 'dragon', 'cold']
    },
    {
      id: 'dragonborn-draconic-ancestry-white',
      name: 'Draconic Ancestry',
      variant: 'White Dragon',
      baseFeatureId: 'dragonborn-draconic-ancestry',
      source: 'species',
      sourceDetail: 'Dragonborn',
      type: 'passive',
      prerequisites: ['species=Dragonborn', 'draconicAncestry=White Dragon'],
      description: 'You have White Dragon ancestry, which determines your breath weapon and damage resistance. Your draconic heritage grants you a connection to White Dragons and their cold powers.',
      shortDescription: 'White Dragon ancestry grants cold-based abilities',
      category: 'Species Trait',
      tags: ['ancestry', 'dragon', 'cold']
    }
  ],

  'dragonborn-breath-weapon': [
    {
      id: 'dragonborn-breath-weapon-acid',
      name: 'Breath Weapon',
      variant: 'Acid',
      baseFeatureId: 'dragonborn-breath-weapon',
      source: 'species',
      sourceDetail: 'Dragonborn',
      type: 'active',
      prerequisites: ['species=Dragonborn', 'draconicAncestry=Black Dragon|Copper Dragon'],
      description: 'Make a Dexterity saving throw (DC 8 plus your Constitution modifier and Proficiency). On a failed save, a creature takes 1d10 Acid damage. This damage increases by 1d10 damage when you reach character levels 5 (2d10 damage), 11 (3d10 damage), and 17 (4d10 damage). You can use this Breath Weapon a number of times equal to your Proficiency, and you regain all expended uses when you finish a Long Rest.',
      shortDescription: 'Deal 1d10 acid damage in a 15-foot cone',
      action: {
        type: 'action',
        range: '15-foot cone',
        duration: 'Instantaneous',
        savingThrow: {
          ability: 'dexterity',
          dc: 'ability-based'
        },
        damage: {
          dice: '1d10',
          type: 'acid'
        }
      },
      resource: {
        type: 'per-long-rest',
        maxUses: 'proficiency'
      },
      category: 'Species Trait',
      tags: ['attack', 'acid', 'save']
    },
    {
      id: 'dragonborn-breath-weapon-lightning',
      name: 'Breath Weapon',
      variant: 'Lightning',
      baseFeatureId: 'dragonborn-breath-weapon',
      source: 'species',
      sourceDetail: 'Dragonborn',
      type: 'active',
      prerequisites: ['species=Dragonborn', 'draconicAncestry=Blue Dragon|Bronze Dragon'],
      description: 'Make a Dexterity saving throw (DC 8 plus your Constitution modifier and Proficiency). On a failed save, a creature takes 1d10 Lightning damage. This damage increases by 1d10 damage when you reach character levels 5 (2d10 damage), 11 (3d10 damage), and 17 (4d10 damage). You can use this Breath Weapon a number of times equal to your Proficiency, and you regain all expended uses when you finish a Long Rest.',
      shortDescription: 'Deal 1d10 lightning damage in a 15-foot cone',
      action: {
        type: 'action',
        range: '15-foot cone',
        duration: 'Instantaneous',
        savingThrow: {
          ability: 'dexterity',
          dc: 'ability-based'
        },
        damage: {
          dice: '1d10',
          type: 'lightning'
        }
      },
      resource: {
        type: 'per-long-rest',
        maxUses: 'proficiency'
      },
      category: 'Species Trait',
      tags: ['attack', 'lightning', 'save']
    },
    {
      id: 'dragonborn-breath-weapon-fire',
      name: 'Breath Weapon',
      variant: 'Fire',
      baseFeatureId: 'dragonborn-breath-weapon',
      source: 'species',
      sourceDetail: 'Dragonborn',
      type: 'active',
      prerequisites: ['species=Dragonborn', 'draconicAncestry=Brass Dragon|Gold Dragon|Red Dragon'],
      description: 'Make a Dexterity saving throw (DC 8 plus your Constitution modifier and Proficiency). On a failed save, a creature takes 1d10 Fire damage. This damage increases by 1d10 damage when you reach character levels 5 (2d10 damage), 11 (3d10 damage), and 17 (4d10 damage). You can use this Breath Weapon a number of times equal to your Proficiency, and you regain all expended uses when you finish a Long Rest.',
      shortDescription: 'Deal 1d10 fire damage in a 15-foot cone',
      action: {
        type: 'action',
        range: '15-foot cone',
        duration: 'Instantaneous',
        savingThrow: {
          ability: 'dexterity',
          dc: 'ability-based'
        },
        damage: {
          dice: '1d10',
          type: 'fire'
        }
      },
      resource: {
        type: 'per-long-rest',
        maxUses: 'proficiency'
      },
      category: 'Species Trait',
      tags: ['attack', 'fire', 'save']
    },
    {
      id: 'dragonborn-breath-weapon-poison',
      name: 'Breath Weapon',
      variant: 'Poison',
      baseFeatureId: 'dragonborn-breath-weapon',
      source: 'species',
      sourceDetail: 'Dragonborn',
      type: 'active',
      prerequisites: ['species=Dragonborn', 'draconicAncestry=Green Dragon'],
      description: 'Make a Constitution saving throw (DC 8 plus your Constitution modifier and Proficiency). On a failed save, a creature takes 1d10 Poison damage. This damage increases by 1d10 damage when you reach character levels 5 (2d10 damage), 11 (3d10 damage), and 17 (4d10 damage). You can use this Breath Weapon a number of times equal to your Proficiency, and you regain all expended uses when you finish a Long Rest.',
      shortDescription: 'Deal 1d10 poison damage in a 15-foot cone',
      action: {
        type: 'action',
        range: '15-foot cone',
        duration: 'Instantaneous',
        savingThrow: {
          ability: 'constitution',
          dc: 'ability-based'
        },
        damage: {
          dice: '1d10',
          type: 'poison'
        }
      },
      resource: {
        type: 'per-long-rest',
        maxUses: 'proficiency'
      },
      category: 'Species Trait',
      tags: ['attack', 'poison', 'save']
    },
    {
      id: 'dragonborn-breath-weapon-cold',
      name: 'Breath Weapon',
      variant: 'Cold',
      baseFeatureId: 'dragonborn-breath-weapon',
      source: 'species',
      sourceDetail: 'Dragonborn',
      type: 'active',
      prerequisites: ['species=Dragonborn', 'draconicAncestry=Silver Dragon|White Dragon'],
      description: 'Make a Constitution saving throw (DC 8 plus your Constitution modifier and Proficiency). On a failed save, a creature takes 1d10 Cold damage. This damage increases by 1d10 damage when you reach character levels 5 (2d10 damage), 11 (3d10 damage), and 17 (4d10 damage). You can use this Breath Weapon a number of times equal to your Proficiency, and you regain all expended uses when you finish a Long Rest.',
      shortDescription: 'Deal 1d10 cold damage in a 15-foot cone',
      action: {
        type: 'action',
        range: '15-foot cone',
        duration: 'Instantaneous',
        savingThrow: {
          ability: 'constitution',
          dc: 'ability-based'
        },
        damage: {
          dice: '1d10',
          type: 'cold'
        }
      },
      resource: {
        type: 'per-long-rest',
        maxUses: 'proficiency'
      },
      category: 'Species Trait',
      tags: ['attack', 'cold', 'save']
    }
  ],

  'dragonborn-damage-resistance': [
    {
      id: 'dragonborn-damage-resistance-acid',
      name: 'Damage Resistance',
      variant: 'Acid',
      baseFeatureId: 'dragonborn-damage-resistance',
      source: 'species',
      sourceDetail: 'Dragonborn',
      type: 'passive',
      prerequisites: ['species=Dragonborn', 'draconicAncestry=Black Dragon|Copper Dragon'],
      description: 'You have Resistance to Acid damage from your Black Dragon or Copper Dragon draconic ancestry.',
      shortDescription: 'Resistance to acid damage',
      effects: [{
        type: 'resistance',
        target: 'Acid damage'
      }],
      category: 'Species Trait',
      tags: ['resistance', 'acid']
    },
    {
      id: 'dragonborn-damage-resistance-lightning',
      name: 'Damage Resistance',
      variant: 'Lightning',
      baseFeatureId: 'dragonborn-damage-resistance',
      source: 'species',
      sourceDetail: 'Dragonborn',
      type: 'passive',
      prerequisites: ['species=Dragonborn', 'draconicAncestry=Blue Dragon|Bronze Dragon'],
      description: 'You have Resistance to Lightning damage from your Blue Dragon or Bronze Dragon draconic ancestry.',
      shortDescription: 'Resistance to lightning damage',
      effects: [{
        type: 'resistance',
        target: 'Lightning damage'
      }],
      category: 'Species Trait',
      tags: ['resistance', 'lightning']
    },
    {
      id: 'dragonborn-damage-resistance-fire',
      name: 'Damage Resistance',
      variant: 'Fire',
      baseFeatureId: 'dragonborn-damage-resistance',
      source: 'species',
      sourceDetail: 'Dragonborn',
      type: 'passive',
      prerequisites: ['species=Dragonborn', 'draconicAncestry=Brass Dragon|Gold Dragon|Red Dragon'],
      description: 'You have Resistance to Fire damage from your Brass Dragon, Gold Dragon, or Red Dragon draconic ancestry.',
      shortDescription: 'Resistance to fire damage',
      effects: [{
        type: 'resistance',
        target: 'Fire damage'
      }],
      category: 'Species Trait',
      tags: ['resistance', 'fire']
    },
    {
      id: 'dragonborn-damage-resistance-poison',
      name: 'Damage Resistance',
      variant: 'Poison',
      baseFeatureId: 'dragonborn-damage-resistance',
      source: 'species',
      sourceDetail: 'Dragonborn',
      type: 'passive',
      prerequisites: ['species=Dragonborn', 'draconicAncestry=Green Dragon'],
      description: 'You have Resistance to Poison damage from your Green Dragon draconic ancestry.',
      shortDescription: 'Resistance to poison damage',
      effects: [{
        type: 'resistance',
        target: 'Poison damage'
      }],
      category: 'Species Trait',
      tags: ['resistance', 'poison']
    },
    {
      id: 'dragonborn-damage-resistance-cold',
      name: 'Damage Resistance',
      variant: 'Cold',
      baseFeatureId: 'dragonborn-damage-resistance',
      source: 'species',
      sourceDetail: 'Dragonborn',
      type: 'passive',
      prerequisites: ['species=Dragonborn', 'draconicAncestry=Silver Dragon|White Dragon'],
      description: 'You have Resistance to Cold damage from your Silver Dragon or White Dragon draconic ancestry.',
      shortDescription: 'Resistance to cold damage',
      effects: [{
        type: 'resistance',
        target: 'Cold damage'
      }],
      category: 'Species Trait',
      tags: ['resistance', 'cold']
    }
  ]
};

/**
 * Checks if a character meets the prerequisites for a feature variant
 */
export function meetsPrerequisites(
  prerequisites: string[],
  characterData: CharacterBuilderData
): boolean {
  console.log('🔍 Character data:', {
    selectedSpecies: characterData.selectedSpecies,
    selectedClass: characterData.selectedClass,
    speciesChoices: characterData.speciesChoices
  });

  return prerequisites.every(prerequisite => {
    const [key, value] = prerequisite.split('=');

    let result = false;
    switch (key) {
      case 'species':
        result = characterData.selectedSpecies === value;
        break;
      case 'class':
        result = characterData.selectedClass === value;
        break;
      case 'draconicAncestry':
        const values = value.split('|'); // Support multiple values like "Black Dragon|Copper Dragon"
        const draconicChoice = characterData.speciesChoices?.draconicAncestry || '';
        result = values.includes(draconicChoice);
        break;
      case 'elfLineage':
        result = characterData.speciesChoices?.elfLineage === value;
        break;
      case 'gnomeLineage':
        result = characterData.speciesChoices?.gnomeLineage === value;
        break;
      case 'giantAncestry':
        result = characterData.speciesChoices?.giantAncestry === value;
        break;
      case 'fiendishLegacy':
        result = characterData.speciesChoices?.fiendishLegacy === value;
        break;
      case 'humanSkill':
        result = characterData.speciesChoices?.humanSkill === value;
        break;
      default:
        console.warn(`Unknown prerequisite key: ${key}`);
        result = false;
    }

    return result;
  });
}

/**
 * Selects the appropriate feature variants for a character
 */
export function selectFeatureVariants(
  baseFeatureId: string,
  characterData: CharacterBuilderData
): CharacterFeature[] {
  const variants = FEATURE_VARIANTS[baseFeatureId];
  if (!variants) {
    console.warn(`No variants found for feature: ${baseFeatureId}`);
    return [];
  }

  return variants.filter(variant =>
    meetsPrerequisites(variant.prerequisites || [], characterData)
  );
}

/**
 * Gets all feature variants that a character qualifies for
 */
export function getAllQualifiedFeatureVariants(
  characterData: CharacterBuilderData,
  source?: FeatureSource
): CharacterFeature[] {
  const qualifiedFeatures: CharacterFeature[] = [];

  Object.keys(FEATURE_VARIANTS).forEach(baseFeatureId => {
    const variants = selectFeatureVariants(baseFeatureId, characterData);
    qualifiedFeatures.push(...variants);
  });

  // Filter by source if specified
  if (source) {
    return qualifiedFeatures.filter(feature => feature.source === source);
  }

  return qualifiedFeatures;
}

/**
 * Gets a specific feature variant by ID
 */
export function getFeatureVariantById(id: string): CharacterFeature | undefined {
  for (const variants of Object.values(FEATURE_VARIANTS)) {
    const feature = variants.find(v => v.id === id);
    if (feature) return feature;
  }
  return undefined;
}

/**
 * Infers species choices from existing character sheet data
 * This is useful for existing characters that were created before the variants system
 */
export function inferSpeciesChoicesFromCharacter(character: CharacterSheetData): { [key: string]: string } {
  const choices: { [key: string]: string } = {};

  // For Dragonborn, try to infer draconic ancestry from existing features
  if (character.species?.toLowerCase() === 'dragonborn') {
    // Look through existing features for clues about dragon type
    const allFeatures = [
      ...(character.features?.speciesTraits || []),
      ...(character.speciesTraits || []).map(trait => ({ description: trait }))
    ];

    for (const feature of allFeatures) {
      const description = feature.description || '';

      // Check for dragon types mentioned in descriptions
      if (description.toLowerCase().includes('black dragon') || description.toLowerCase().includes('acid')) {
        choices.draconicAncestry = 'Black Dragon';
        break;
      } else if (description.toLowerCase().includes('blue dragon') ||
                 (description.toLowerCase().includes('lightning') && !description.toLowerCase().includes('bronze'))) {
        choices.draconicAncestry = 'Blue Dragon';
        break;
      } else if (description.toLowerCase().includes('brass dragon')) {
        choices.draconicAncestry = 'Brass Dragon';
        break;
      } else if (description.toLowerCase().includes('bronze dragon')) {
        choices.draconicAncestry = 'Bronze Dragon';
        break;
      } else if (description.toLowerCase().includes('copper dragon')) {
        choices.draconicAncestry = 'Copper Dragon';
        break;
      } else if (description.toLowerCase().includes('gold dragon')) {
        choices.draconicAncestry = 'Gold Dragon';
        break;
      } else if (description.toLowerCase().includes('green dragon') || description.toLowerCase().includes('poison')) {
        choices.draconicAncestry = 'Green Dragon';
        break;
      } else if (description.toLowerCase().includes('red dragon')) {
        choices.draconicAncestry = 'Red Dragon';
        break;
      } else if (description.toLowerCase().includes('silver dragon')) {
        choices.draconicAncestry = 'Silver Dragon';
        break;
      } else if (description.toLowerCase().includes('white dragon') ||
                 (description.toLowerCase().includes('cold') && !description.toLowerCase().includes('silver'))) {
        choices.draconicAncestry = 'White Dragon';
        break;
      }
    }
  }

  return choices;
}

/**
 * Gets feature variants for an existing character sheet
 */
export function getFeatureVariantsForCharacter(character: CharacterSheetData): CharacterFeature[] {
  // Convert character sheet data to builder-like format for compatibility
  const inferredChoices = inferSpeciesChoicesFromCharacter(character);

  const builderData: Partial<CharacterBuilderData> = {
    selectedSpecies: character.species,
    selectedClass: character.class,
    speciesChoices: inferredChoices
  };


  return getAllQualifiedFeatureVariants(builderData as CharacterBuilderData, 'species');
}

/**
 * Updates an existing character's features with appropriate variants
 */
export function updateCharacterWithFeatureVariants(character: CharacterSheetData): CharacterSheetData {
  const updatedCharacter = { ...character };

  // Get appropriate feature variants
  const featureVariants = getFeatureVariantsForCharacter(character);

  if (featureVariants.length > 0) {
    // Update the structured features
    if (!updatedCharacter.features) {
      updatedCharacter.features = {
        classFeatures: [],
        subclassFeatures: [],
        speciesTraits: [],
        backgroundFeatures: [],
        feats: [],
        magicItemFeatures: [],
        customFeatures: []
      };
    }

    // Replace species traits with variants
    updatedCharacter.features.speciesTraits = featureVariants;

  }

  return updatedCharacter;
}