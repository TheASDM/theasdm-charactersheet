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
      id: 'dragonborn-breath-weapon-universal',
      name: 'Breath Weapon (${draconicAncestry.damageType})',
      baseFeatureId: 'dragonborn-breath-weapon',
      source: 'species',
      sourceDetail: 'Dragonborn',
      type: 'active',
      prerequisites: ['species=Dragonborn'],
      variables: {
        damageType: '${draconicAncestry.damageType}',
        saveType: 'dexterity', // Will be resolved by template renderer
        saveDC: '8 + proficiencyBonus + constitutionModifier',
        areaType: '${draconicAncestry.areaType}',
        damageByLevel: {
          '1': '1d10',
          '5': '2d10',
          '11': '3d10',
          '17': '4d10'
        },
        uses: 'proficiency',
        recharge: 'long rest'
      },
      description: 'You exhale destructive energy in a ${areaType}. Each creature in that area must make a ${saveType} saving throw (DC ${saveDC}). On a failed save, a creature takes ${currentDamage} ${damageType} damage. On a successful save, it takes half as much damage. This damage increases as you gain levels: 2d10 at 5th level, 3d10 at 11th level, and 4d10 at 17th level. You can use this Breath Weapon a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.',
      shortDescription: 'Deal ${currentDamage} ${damageType} damage in a ${areaType}',
      action: {
        type: 'action',
        range: '${areaType}',
        duration: 'Instantaneous',
        savingThrow: {
          ability: 'dexterity' as any, // Will be resolved by template renderer
          dc: '8 + proficiencyBonus + constitutionModifier'
        },
        damage: {
          dice: '${currentDamage}',
          type: '${damageType}'
        }
      },
      resource: {
        type: 'per-long-rest',
        maxUses: 'proficiency'
      },
      category: 'Species Trait',
      tags: ['attack', '${damageType}', 'save']
    }
  ],

  'dragonborn-damage-resistance': [
    {
      id: 'dragonborn-damage-resistance-universal',
      name: 'Damage Resistance (${draconicAncestry.damageType})',
      baseFeatureId: 'dragonborn-damage-resistance',
      source: 'species',
      sourceDetail: 'Dragonborn',
      type: 'passive',
      prerequisites: ['species=Dragonborn'],
      variables: {
        damageType: '${draconicAncestry.damageType}'
      },
      description: 'You have Resistance to ${damageType} damage from your ${draconicAncestryName} draconic ancestry.',
      shortDescription: 'Resistance to ${damageType} damage',
      effects: [{
        type: 'resistance',
        target: '${damageType} damage'
      }],
      category: 'Species Trait',
      tags: ['resistance', '${damageType}']
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
    speciesChoices: characterData.speciesChoices,
    draconicAncestry: characterData.speciesChoices?.draconicAncestry
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
  if (character.species?.toLowerCase().includes('dragonborn')) {
    console.log('🔍 Inferring draconic ancestry for dragonborn character');

    // Look through existing features for clues about dragon type
    const allFeatures = [
      ...(character.features?.speciesTraits || []),
      ...(character.speciesTraits || []).map(trait => ({ description: trait }))
    ];

    console.log('🔍 All features to check:', allFeatures);

    for (const feature of allFeatures) {
      const description = (feature.description || '').toLowerCase();
      const name = ((feature as any).name || '').toLowerCase();

      console.log('🔍 Checking feature:', { name: (feature as any).name, description });

      // Check for dragon types mentioned in names or descriptions
      if (description.includes('black dragon') || description.includes('acid') ||
          name.includes('black') || name.includes('acid')) {
        choices.draconicAncestry = 'Black Dragon';
        console.log('✅ Found Black Dragon ancestry');
        break;
      } else if (description.includes('blue dragon') || description.includes('lightning') ||
                 name.includes('blue') || name.includes('lightning')) {
        choices.draconicAncestry = 'Blue Dragon';
        console.log('✅ Found Blue Dragon ancestry');
        break;
      } else if (description.includes('brass dragon') || name.includes('brass')) {
        choices.draconicAncestry = 'Brass Dragon';
        console.log('✅ Found Brass Dragon ancestry');
        break;
      } else if (description.includes('bronze dragon') || name.includes('bronze')) {
        choices.draconicAncestry = 'Bronze Dragon';
        console.log('✅ Found Bronze Dragon ancestry');
        break;
      } else if (description.includes('copper dragon') || name.includes('copper')) {
        choices.draconicAncestry = 'Copper Dragon';
        console.log('✅ Found Copper Dragon ancestry');
        break;
      } else if (description.includes('gold dragon') || name.includes('gold')) {
        choices.draconicAncestry = 'Gold Dragon';
        console.log('✅ Found Gold Dragon ancestry');
        break;
      } else if (description.includes('green dragon') || description.includes('poison') ||
                 name.includes('green') || name.includes('poison')) {
        choices.draconicAncestry = 'Green Dragon';
        console.log('✅ Found Green Dragon ancestry');
        break;
      } else if (description.includes('red dragon') || description.includes('fire') ||
                 name.includes('red') || name.includes('fire')) {
        choices.draconicAncestry = 'Red Dragon';
        console.log('✅ Found Red Dragon ancestry');
        break;
      } else if (description.includes('silver dragon') || name.includes('silver')) {
        choices.draconicAncestry = 'Silver Dragon';
        console.log('✅ Found Silver Dragon ancestry');
        break;
      } else if (description.includes('white dragon') || description.includes('cold') ||
                 name.includes('white') || name.includes('cold')) {
        choices.draconicAncestry = 'White Dragon';
        console.log('✅ Found White Dragon ancestry');
        break;
      }
    }

    // If no ancestry found yet, try some fallback logic based on character name or just default to Red Dragon
    if (!choices.draconicAncestry) {
      console.log('🔄 No ancestry found in features, defaulting to Red Dragon');
      choices.draconicAncestry = 'Red Dragon'; // Default fallback
    }
  }

  console.log('🔍 Final inferred choices:', choices);
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

  // Infer species choices and add them to the character data
  const inferredChoices = inferSpeciesChoicesFromCharacter(character);
  if (Object.keys(inferredChoices).length > 0) {
    console.log('🐉 Inferred species choices:', inferredChoices);
    updatedCharacter.speciesChoices = inferredChoices;
  }

  // Get appropriate feature variants
  const featureVariants = getFeatureVariantsForCharacter(updatedCharacter); // Use updated character with inferred choices

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

    // Now resolve the template features with the inferred character context
    if (updatedCharacter.speciesChoices?.draconicAncestry) {
      console.log('🐉 Resolving templates with draconic ancestry:', updatedCharacter.speciesChoices.draconicAncestry);
      // Import is handled at module level, we'll need to implement this differently
      console.log('🔧 Template resolution will happen at display time');
    }
  }

  return updatedCharacter;
}