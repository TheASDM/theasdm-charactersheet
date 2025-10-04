import type { Character, Feat, Species } from '@/types/api';
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

export function deriveGrantedSpells(
  character: Partial<Character> | null,
  opts: {
    species?: (Partial<Species> & MaybeGranted) | null;
    feats?: Array<Partial<Feat> & MaybeGranted>;
    classFeatures?: Array<Partial<ClassFeature> & MaybeGranted>;
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

  const { species, feats, classFeatures } = opts;

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

  return Array.from(granted);
}
