/**
 * Utility functions for generating and managing feature IDs
 */

import { SimpleFeature } from './simpleFeatureGenerator';

/**
 * Generate a unique ID for a feature based on its name and category
 * Format: {source}-{name-slug}
 *
 * Examples:
 * - "class-rage"
 * - "species-darkvision"
 * - "background-wanderer"
 * - "feat-alert"
 */
export const generateFeatureId = (feature: SimpleFeature): string => {
  // Normalize category to source prefix
  const categoryToSource: Record<string, string> = {
    'Species Trait': 'species',
    'Species Trait (Legacy)': 'species',
    'Class Feature': 'class',
    'Class Feature (Legacy)': 'class',
    'Subclass Feature': 'subclass',
    'Background Feature': 'background',
    'Feat': 'feat',
    'Feat (Legacy)': 'feat',
    'Magic Item': 'item',
    'Custom': 'custom',
  };

  const source = categoryToSource[feature.category] || 'feature';
  const nameSlug = feature.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

  return `${source}-${nameSlug}`;
};

/**
 * Add IDs to an array of features
 */
export const addFeatureIds = (features: SimpleFeature[]): Array<SimpleFeature & { id: string }> => {
  return features.map(feature => ({
    ...feature,
    id: generateFeatureId(feature),
  }));
};

/**
 * Check if a feature is hidden
 */
export const isFeatureHidden = (featureId: string, hiddenFeatures?: string[]): boolean => {
  return hiddenFeatures?.includes(featureId) || false;
};

/**
 * Toggle a feature's hidden state
 */
export const toggleFeatureVisibility = (
  featureId: string,
  currentHiddenFeatures?: string[]
): string[] => {
  const hiddenFeatures = currentHiddenFeatures || [];

  if (hiddenFeatures.includes(featureId)) {
    // Show the feature
    return hiddenFeatures.filter(id => id !== featureId);
  } else {
    // Hide the feature
    return [...hiddenFeatures, featureId];
  }
};

/**
 * Get all feature IDs for a specific category
 */
export const getFeatureIdsByCategory = (
  features: Array<SimpleFeature & { id: string }>,
  category: string
): string[] => {
  return features
    .filter(f => f.category === category)
    .map(f => f.id);
};

/**
 * Sort features based on custom order
 * Features not in the order array will be appended at the end in their original order
 */
export const sortFeaturesByOrder = <T extends { id: string }>(
  features: T[],
  featureOrder?: string[]
): T[] => {
  if (!featureOrder || featureOrder.length === 0) {
    return features;
  }

  // Create a map of feature IDs to their order index
  const orderMap = new Map<string, number>();
  featureOrder.forEach((id, index) => {
    orderMap.set(id, index);
  });

  // Sort features based on their position in the order array
  return [...features].sort((a, b) => {
    const orderA = orderMap.get(a.id) ?? Infinity;
    const orderB = orderMap.get(b.id) ?? Infinity;
    return orderA - orderB;
  });
};

/**
 * Reorder features array (for drag-and-drop)
 */
export const reorderFeatures = (
  featureIds: string[],
  fromIndex: number,
  toIndex: number
): string[] => {
  if (fromIndex === toIndex) return featureIds;

  const result = [...featureIds];
  const [movedId] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, movedId);

  return result;
};
