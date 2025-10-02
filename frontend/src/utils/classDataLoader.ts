/**
 * Class Data Loader
 *
 * Loads processed class data from JSON files in the processed-data directory.
 */

import { ClassData } from '../types/classFeatures';

// Cache loaded class data to avoid repeated fetches
const classDataCache: Map<string, ClassData> = new Map();

/**
 * Load class data from the processed-data directory
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
    // Fetch the JSON file from public directory
    // Vite serves files from /public at the root path
    const response = await fetch(`/processed-data/${className}.json`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const classData: ClassData = await response.json();

    // Validate the loaded data
    if (!classData.className || !classData.features) {
      throw new Error(`Invalid class data structure for ${className}`);
    }

    // Cache it
    classDataCache.set(className, classData);

    return classData;
  } catch (error) {
    console.error(`Failed to load class data for ${className}:`, error);
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
      console.warn(`Failed to preload ${className}:`, err);
    })
  );

  await Promise.all(loadPromises);
  console.log('Class data preloaded');
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
