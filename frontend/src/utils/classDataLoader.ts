import { logger } from './logger';
/**
 * Class Data Loader
 *
 * Loads class data from the API (follows same pattern as species/backgrounds/feats).
 */

import { ClassData, ClassFeature } from '../types/classFeatures';

// Cache loaded class data to avoid repeated fetches
const classDataCache: Map<string, ClassData> = new Map();

const buildFeatureKey = (feature: ClassFeature): string => {
  const level = feature.level ?? 1;
  return `${feature.name?.toLowerCase() || 'unknown'}|${level}`;
};

const mergeClassDataWithProcessed = (
  apiData: ClassData,
  processedData: ClassData
): ClassData => {
  if (!processedData || !Array.isArray(processedData.features)) {
    return apiData;
  }

  const processedFeatureMap = new Map<string, ClassFeature>();
  processedData.features.forEach((feature) => {
    const key = buildFeatureKey(feature);
    processedFeatureMap.set(key, feature);
  });

  const mergedFeatures: ClassFeature[] = [];

  apiData.features.forEach((feature) => {
    const key = buildFeatureKey(feature);
    const processedFeature = processedFeatureMap.get(key);

    if (processedFeature) {
      // Build merged feature by spreading and then overriding specific properties
      // Only set properties that have non-undefined values to satisfy exactOptionalPropertyTypes
      const merged: ClassFeature = {
        ...feature,
        ...processedFeature
      };

      // Override with explicit non-undefined values
      const entriesValue = feature.entries ?? processedFeature.entries;
      if (entriesValue !== undefined) {
        merged.entries = entriesValue;
      }

      const descriptionValue = processedFeature.description ?? feature.description;
      if (descriptionValue !== undefined) {
        merged.description = descriptionValue;
      }

      const mechanicsValue = processedFeature.mechanics ?? feature.mechanics;
      if (mechanicsValue !== undefined) {
        merged.mechanics = mechanicsValue;
      }

      const isChoiceValue = processedFeature.isChoice ?? feature.isChoice;
      if (isChoiceValue !== undefined) {
        merged.isChoice = isChoiceValue;
      }

      const requiresSelectionValue = processedFeature.requiresSelection ?? feature.requiresSelection;
      if (requiresSelectionValue !== undefined) {
        merged.requiresSelection = requiresSelectionValue;
      }

      const choiceGroupValue = processedFeature.choiceGroup ?? feature.choiceGroup;
      if (choiceGroupValue !== undefined) {
        merged.choiceGroup = choiceGroupValue;
      }

      const choiceTypeValue = processedFeature.choiceType ?? feature.choiceType;
      if (choiceTypeValue !== undefined) {
        merged.choiceType = choiceTypeValue;
      }

      const externalReferenceValue = processedFeature.externalReference ?? feature.externalReference;
      if (externalReferenceValue !== undefined) {
        merged.externalReference = externalReferenceValue;
      }

      const grantedOptionsValue = processedFeature.grantedOptions ?? feature.grantedOptions;
      if (grantedOptionsValue !== undefined) {
        merged.grantedOptions = grantedOptionsValue;
      }

      const scalingProgressionValue =
        processedFeature.scalingProgression && processedFeature.scalingProgression.length > 0
          ? processedFeature.scalingProgression
          : feature.scalingProgression;
      if (scalingProgressionValue !== undefined) {
        merged.scalingProgression = scalingProgressionValue;
      }

      mergedFeatures.push(merged);
      processedFeatureMap.delete(key);
    } else {
      mergedFeatures.push(feature);
    }
  });

  // Include any remaining processed features that weren't in the API data
  processedFeatureMap.forEach((feature) => {
    mergedFeatures.push(feature);
  });

  return {
    ...apiData,
    features: mergedFeatures
  };
};

/**
 * Load class data from the API
 *
 * @param className - Name of the class (e.g., "Cleric", "Rogue")
 * @returns Promise with class data
 */
export async function loadClassData(className: string): Promise<ClassData> {
  // Check cache first
  if (classDataCache.has(className)) {
    return classDataCache.get(className)!;
  }

  try {
    // Fetch class data from API (follows same pattern as species/backgrounds/feats)
    const response = await fetch(`/api/classes/${className}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiData = await response.json();

    // Transform API response to ClassData format expected by frontend
    // API returns features array with entries structure preserved
    let classData: ClassData = {
      className: apiData.className,
      slug: apiData.slug,
      source: apiData.source,
      hitDie: apiData.hitDie,
      primaryAbilities: apiData.primaryAbilities,
      savingThrows: apiData.savingThrows,
      proficiencies: apiData.proficiencies,
      spellcastingAbility: apiData.spellcastingAbility,
      subclassTitle: apiData.subclassTitle,
      // Features array from API has entries structure, not flattened description
      features: apiData.features || [],
      subclasses: apiData.mechanics?.subclass || [],
      mechanics: apiData.mechanics
    };

    // Attempt to load processed class data to enrich choice metadata
    try {
      const processedResponse = await fetch(
        `/processed-data/${encodeURIComponent(className)}.json`
      );

      if (processedResponse.ok) {
        const processedData = (await processedResponse.json()) as ClassData;
        classData = mergeClassDataWithProcessed(classData, processedData);
      }
    } catch (error) {
      logger.warn(`Failed to load processed class data for ${className}:`, error);
    }

    // Validate the loaded data
    if (!classData.className || !classData.features) {
      throw new Error(`Invalid class data structure for ${className}`);
    }

    // Cache it
    classDataCache.set(className, classData);

    return classData;
  } catch (error) {
    logger.error(`Failed to load class data for ${className}:`, error);
    throw new Error(`Could not load class data for ${className}`);
  }
}

/**
 * Preload class data for common classes
 * Call this on app initialization to speed up character creation
 */
export async function preloadCommonClasses(): Promise<void> {
  const commonClasses = [
    'Barbarian',
    'Bard',
    'Cleric',
    'Druid',
    'Fighter',
    'Monk',
    'Paladin',
    'Ranger',
    'Rogue',
    'Sorcerer',
    'Warlock',
    'Wizard'
  ];

  const loadPromises = commonClasses.map((className) =>
    loadClassData(className).catch((err) => {
      logger.warn(`Failed to preload ${className}:`, err);
    })
  );

  await Promise.all(loadPromises);
  logger.debug('Class data preloaded');
}

/**
 * Clear the class data cache
 * Useful for testing or when class data is updated
 */
export function clearClassDataCache(): void {
  classDataCache.clear();
}

/**
 * Check if a class has data available
 *
 * @param className - Name of the class
 * @returns True if class data exists in cache or can be loaded
 */
export function hasClassData(className: string): boolean {
  return classDataCache.has(className);
}
