import {
  TrackerConfig,
  classResources,
  subclassResources,
  speciesResources,
  featResources,
  coreTrackers,
} from '../config/trackableResources';
import { CharacterSheetData } from '../types/characterSheet';

export interface ResourceTracker extends TrackerConfig {
  current: number;
  max: number;
  id: string;
}

export function getCharacterResources(character: CharacterSheetData): ResourceTracker[] {
  const resources: ResourceTracker[] = [];
  const level = character.level || 1;

  // Calculate ability modifiers for resources that use them
  const charismaModifier = Math.floor((character.abilityScores.charisma - 10) / 2);
  const wisdomModifier = Math.floor((character.abilityScores.wisdom - 10) / 2);
  const intelligenceModifier = Math.floor((character.abilityScores.intelligence - 10) / 2);

  // Helper to get modifier based on class
  const getModifierForClass = (className: string): number => {
    const lowerClass = className.toLowerCase();
    if (lowerClass.includes('bard') || lowerClass.includes('sorcerer') ||
        lowerClass.includes('warlock') || lowerClass.includes('paladin')) {
      return charismaModifier;
    }
    if (lowerClass.includes('cleric') || lowerClass.includes('druid') ||
        lowerClass.includes('ranger') || lowerClass.includes('monk')) {
      return wisdomModifier;
    }
    if (lowerClass.includes('wizard')) {
      return intelligenceModifier;
    }
    return 0;
  };

  const modifier = getModifierForClass(character.class);

  // Add class resources
  const className = character.class.toLowerCase().replace(/\s+/g, '');
  if (classResources[className]) {
    classResources[className].forEach((resource) => {
      // Check if character meets level requirement
      if (!resource.showAt || level >= resource.showAt) {
        const maxUses = typeof resource.maxUses === 'function'
          ? resource.maxUses(level, modifier)
          : resource.maxUses || 0;

        // Show resources even if they have 0 max uses (for level progression display)
        const resourceId = `${className}-${resource.name.toLowerCase().replace(/\s+/g, '-')}`;
        resources.push({
          ...resource,
          current: character.resources[resourceId] || 0,
          max: maxUses,
          id: resourceId,
        });
      }
    });
  }

  // Add subclass resources
  if (character.subclass) {
    const subclassKey = `${className}-${character.subclass.toLowerCase().replace(/\s+/g, '')}`;
    if (subclassResources[subclassKey]) {
      subclassResources[subclassKey].forEach((resource) => {
        if (!resource.showAt || level >= resource.showAt) {
          const maxUses = typeof resource.maxUses === 'function'
            ? resource.maxUses(level, modifier)
            : resource.maxUses || 0;

          // Show resources even if they have 0 max uses (for level progression display)
          const resourceId = `${subclassKey}-${resource.name.toLowerCase().replace(/\s+/g, '-')}`;
          resources.push({
            ...resource,
            current: character.resources[resourceId] || 0,
            max: maxUses,
            id: resourceId,
          });
        }
      });
    }
  }

  // Add species resources
  const speciesName = character.species.toLowerCase().replace(/\s+/g, '');
  if (speciesResources[speciesName]) {
    speciesResources[speciesName].forEach((resource) => {
      if (!resource.showAt || level >= resource.showAt) {
        const maxUses = typeof resource.maxUses === 'function'
          ? resource.maxUses(level, modifier)
          : resource.maxUses || 0;

        // Show resources even if they have 0 max uses (for level progression display)
        const resourceId = `${speciesName}-${resource.name.toLowerCase().replace(/\s+/g, '-')}`;
        resources.push({
          ...resource,
          current: character.resources[resourceId] || 0,
          max: maxUses,
          id: resourceId,
        });
      }
    });
  }

  // Add feat resources
  if (character.feats && character.feats.length > 0) {
    character.feats.forEach((feat) => {
      const featName = feat.toLowerCase().replace(/\s+/g, '-');
      if (featResources[featName]) {
        featResources[featName].forEach((resource) => {
          if (!resource.showAt || level >= resource.showAt) {
            const maxUses = typeof resource.maxUses === 'function'
              ? resource.maxUses(level, modifier)
              : resource.maxUses || 0;

            // Show resources even if they have 0 max uses (for level progression display)
            const resourceId = `${featName}-${resource.name.toLowerCase().replace(/\s+/g, '-')}`;
            resources.push({
              ...resource,
              current: character.resources[resourceId] || 0,
              max: maxUses,
              id: resourceId,
            });
          }
        });
      }
    });
  }

  // Add core trackers (Wounds - always in the middle)
  const halfIndex = Math.floor(resources.length / 2);
  coreTrackers.forEach((tracker) => {
    const maxUses = typeof tracker.maxUses === 'function'
      ? tracker.maxUses(level, modifier)
      : tracker.maxUses || 0;

    resources.splice(halfIndex, 0, {
      ...tracker,
      current: character.wounds || 0,
      max: maxUses,
      id: `core-${tracker.name.toLowerCase().replace(/\s+/g, '-')}`,
    });
  });

  return resources;
}

export function updateResourceValue(
  resources: ResourceTracker[],
  resourceId: string,
  newValue: number
): ResourceTracker[] {
  return resources.map((resource) => {
    if (resource.id === resourceId) {
      return {
        ...resource,
        current: Math.max(0, Math.min(newValue, resource.max)),
      };
    }
    return resource;
  });
}