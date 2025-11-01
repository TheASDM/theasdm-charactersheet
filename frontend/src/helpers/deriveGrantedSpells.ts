import type { Background, Feat, Species, PartialCharacter } from '@/types/api';
import type { ClassFeature } from '@/types/classFeatures';

type MaybeGranted = {
  grantedSpells?: unknown;
};

const SPELL_ID_KEYS = ['id', 'spellId', 'slug', 'key', 'value'] as const;

const normaliseSpellId = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return null;
};

const ingestGranted = (source: unknown, bucket: Set<string>): void => {
  if (source === null || source === undefined) {
    return;
  }

  if (Array.isArray(source)) {
    source.forEach((entry) => ingestGranted(entry, bucket));
    return;
  }

  const directId = normaliseSpellId(source);
  if (directId) {
    bucket.add(directId);
    return;
  }

  if (typeof source !== 'object') {
    return;
  }

  const record = source as Record<string, unknown>;
  for (const key of SPELL_ID_KEYS) {
    if (key in record) {
      const id = normaliseSpellId(record[key]);
      if (id) {
        bucket.add(id);
      }
    }
  }

  if ('spell' in record) {
    ingestGranted(record.spell, bucket);
  }

  if ('grantedSpells' in record) {
    ingestGranted(record.grantedSpells, bucket);
  }

  if ('spells' in record) {
    ingestGranted(record.spells, bucket);
  }
};

const ingestFeatureLike = (value: unknown, bucket: Set<string>): void => {
  if (value === null || value === undefined) {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => ingestFeatureLike(entry, bucket));
    return;
  }

  if (typeof value === 'object') {
    ingestGranted(value, bucket);
    return;
  }

  const id = normaliseSpellId(value);
  if (id) {
    bucket.add(id);
  }
};

const ingestFeatureCollection = (collection: unknown, bucket: Set<string>): void => {
  if (!collection) {
    return;
  }

  if (Array.isArray(collection)) {
    collection.forEach((entry) => ingestFeatureLike(entry, bucket));
    return;
  }

  if (typeof collection === 'object') {
    Object.values(collection as Record<string, unknown>).forEach((entry) =>
      ingestFeatureLike(entry, bucket)
    );
  }
};

export function deriveGrantedSpells(
  character: PartialCharacter | null,
  opts: {
    species?: (Partial<Species> & MaybeGranted) | null;
    feats?: Array<Partial<Feat> & MaybeGranted>;
    classFeatures?: Array<Partial<ClassFeature> & MaybeGranted>;
    subclassFeatures?: Array<Partial<ClassFeature> & MaybeGranted>;
    background?: (Partial<Background> & MaybeGranted) | null;
    backgroundFeatures?: Array<MaybeGranted | Record<string, unknown>>;
  } = {}
): string[] {
  const granted = new Set<string>();

  const fromCharacter = character?.characterData as Record<string, unknown> | undefined;
  if (fromCharacter) {
    if ('grantedSpells' in fromCharacter) {
      ingestGranted(fromCharacter.grantedSpells, granted);
    }

    const spellbook = fromCharacter.spellbook as MaybeGranted | undefined;
    if (spellbook?.grantedSpells) {
      ingestGranted(spellbook.grantedSpells, granted);
    }
  }

  const { species, feats, classFeatures, subclassFeatures, background, backgroundFeatures } = opts;

  if (fromCharacter) {
    const reportedSpecies = fromCharacter.speciesTraits;
    if (reportedSpecies) {
      ingestFeatureCollection(reportedSpecies, granted);
    }

    const reportedFeatSpells = fromCharacter.featSpells;
    if (reportedFeatSpells) {
      ingestFeatureCollection(reportedFeatSpells, granted);
    }

    const reportedFeatFeatures = fromCharacter.featFeatures;
    if (reportedFeatFeatures) {
      ingestFeatureCollection(reportedFeatFeatures, granted);
    }

    const reportedClassFeatures = fromCharacter.classFeatures;
    if (reportedClassFeatures) {
      ingestFeatureCollection(reportedClassFeatures, granted);
    }

    const reportedSubclassFeatures = fromCharacter.subclassFeatures;
    if (reportedSubclassFeatures) {
      ingestFeatureCollection(reportedSubclassFeatures, granted);
    }

    const reportedBackgroundFeatures = fromCharacter.backgroundFeatures;
    if (reportedBackgroundFeatures) {
      ingestFeatureCollection(reportedBackgroundFeatures, granted);
    }

    const structuredFeatures = fromCharacter.features as Record<string, unknown> | undefined;
    if (structuredFeatures && typeof structuredFeatures === 'object') {
      ingestFeatureCollection(structuredFeatures.classFeatures, granted);
      ingestFeatureCollection(structuredFeatures.subclassFeatures, granted);
      ingestFeatureCollection(structuredFeatures.backgroundFeatures, granted);
      ingestFeatureCollection(structuredFeatures.speciesTraits, granted);
      ingestFeatureCollection(structuredFeatures.feats, granted);
    }
  }

  if (species) {
    ingestGranted((species as MaybeGranted).grantedSpells, granted);
    const innate = (species as Record<string, unknown>).innateSpells;
    if (innate) {
      ingestGranted(innate, granted);
    }
  }

  feats?.forEach((feat) => {
    ingestGranted((feat as MaybeGranted).grantedSpells, granted);
    const additional = (feat as Record<string, unknown>).additionalSpells;
    if (additional) {
      ingestGranted(additional, granted);
    }
  });

  classFeatures?.forEach((feature) => {
    ingestGranted((feature as MaybeGranted).grantedSpells, granted);
    const mechanics = (feature as Record<string, unknown>).mechanics;
    if (mechanics && typeof mechanics === 'object') {
      ingestGranted((mechanics as MaybeGranted).grantedSpells, granted);
    }
  });

  subclassFeatures?.forEach((feature) => {
    ingestGranted((feature as MaybeGranted).grantedSpells, granted);
    const mechanics = (feature as Record<string, unknown>).mechanics;
    if (mechanics && typeof mechanics === 'object') {
      ingestGranted((mechanics as MaybeGranted).grantedSpells, granted);
    }
  });

  if (background) {
    ingestGranted((background as MaybeGranted).grantedSpells, granted);
    const backgroundRecord = background as Record<string, unknown>;
    ingestFeatureCollection(backgroundRecord.feature, granted);
    ingestFeatureCollection(backgroundRecord.features, granted);
    ingestFeatureCollection(backgroundRecord.spells, granted);
  }

  backgroundFeatures?.forEach((feature) => {
    ingestFeatureLike(feature, granted);
  });

  const SPELL_ID_PATTERN = /^\d+$/;

  return Array.from(granted).filter((id) => SPELL_ID_PATTERN.test(id));
}

/**
 * D&D 2024: Returns spells that are always prepared for a given class/subclass/level.
 * These spells don't count against the prepared spell limit.
 *
 * At level 1, this returns [] (subclass integration is deferred to future sprints).
 * Future: Will return domain spells (Cleric), oath spells (Paladin), etc.
 *
 * @param classId - The class identifier (e.g., 'Cleric', 'Paladin')
 * @param level - Character level
 * @param subclassId - Optional subclass identifier (e.g., 'Life Domain', 'Oath of Devotion')
 * @returns Array of spell IDs that are always prepared
 */
export function deriveAlwaysPreparedSpells(
  _classId: string,
  _level: number,
  _subclassId?: string
): string[] {
  // Level 1: No subclass spells implemented yet
  // Future implementation:
  // import { SUBCLASS_CONFIG } from './spellcastingConfig';
  // if (!_subclassId) return [];
  // const config = SUBCLASS_CONFIG[_subclassId];
  // return config?.alwaysPrepared?.[_level] ?? [];

  return [];
}

/**
 * Helper to check if a spell is always prepared (doesn't count against limit).
 *
 * @param spellId - The spell identifier
 * @param classId - The class identifier
 * @param level - Character level
 * @param subclassId - Optional subclass identifier
 * @returns True if the spell is always prepared
 */
export function isAlwaysPrepared(
  spellId: string,
  classId: string,
  level: number,
  subclassId?: string
): boolean {
  const alwaysPrepared = deriveAlwaysPreparedSpells(classId, level, subclassId);
  return alwaysPrepared.includes(spellId);
}
