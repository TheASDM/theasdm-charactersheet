import { describe, expect, it } from 'vitest';
import { deriveGrantedSpells } from '../deriveGrantedSpells';
import type { PartialCharacter } from '@/types/api';

describe('deriveGrantedSpells', () => {
  it('collects spells from character data, features, and options', () => {
    const character = {
      characterData: {
        grantedSpells: ['character-spell-1', 42],
        spellbook: {
          grantedSpells: ['book-spell-1'],
        },
        classFeatures: [
          { name: 'Class Feature', grantedSpells: ['class-character-spell'] },
          { name: 'Ignored Feature' },
        ],
        subclassFeatures: {
          featureA: { grantedSpells: ['subclass-character-spell'] },
        },
        backgroundFeatures: [
          { grantedSpells: ['background-character-spell'] },
        ],
        featSpells: {
          featA: ['feat-character-spell'],
        },
        features: {
          classFeatures: [{ grantedSpells: ['structured-class-spell'] }],
          subclassFeatures: [{ grantedSpells: ['structured-subclass-spell'] }],
          backgroundFeatures: [{ grantedSpells: ['structured-background-spell'] }],
          speciesTraits: [{ grantedSpells: ['structured-species-spell'] }],
          feats: [{ grantedSpells: ['structured-feat-spell'] }],
        },
      },
    } as unknown as PartialCharacter;

    const result = deriveGrantedSpells(character, {
      species: {
        grantedSpells: ['species-spell'],
        innateSpells: ['species-innate-spell'] as unknown as Record<string, unknown>,
      },
      feats: [
        {
          grantedSpells: ['feat-option-spell'],
          additionalSpells: ['feat-additional-spell'] as unknown as Record<string, unknown>,
        },
      ],
      classFeatures: [
        {
          grantedSpells: ['class-option-spell'],
          mechanics: { grantedSpells: ['class-mechanic-spell'] } as any,
        },
      ],
      subclassFeatures: [
        {
          grantedSpells: ['subclass-option-spell'],
          mechanics: { grantedSpells: ['subclass-mechanic-spell'] } as any,
        },
      ],
      background: {
        grantedSpells: ['background-option-spell'],
        feature: { grantedSpells: ['background-feature-spell'] },
        spells: ['background-spells-entry'] as unknown as Record<string, unknown>,
      } as any,
      backgroundFeatures: [
        { grantedSpells: ['background-array-spell'] },
        ['background-array-nested-spell'] as unknown as Record<string, unknown>,
      ],
    });

    const sorted = [...result].sort();
    const expected = [
      '42',
      'background-array-nested-spell',
      'background-array-spell',
      'background-character-spell',
      'background-feature-spell',
      'background-option-spell',
      'background-spells-entry',
      'book-spell-1',
      'character-spell-1',
      'class-character-spell',
      'class-mechanic-spell',
      'class-option-spell',
      'feat-additional-spell',
      'feat-character-spell',
      'feat-option-spell',
      'species-innate-spell',
      'species-spell',
      'structured-background-spell',
      'structured-class-spell',
      'structured-feat-spell',
      'structured-species-spell',
      'structured-subclass-spell',
      'subclass-character-spell',
      'subclass-mechanic-spell',
      'subclass-option-spell',
    ];

    expect(sorted).toEqual(expected.sort());
  });

  it('deduplicates spell ids and ignores falsy or malformed entries', () => {
    const character = {
      characterData: {
        grantedSpells: [null, undefined, ''],
      },
    } as PartialCharacter;

    const result = deriveGrantedSpells(character, {
      backgroundFeatures: [
        { grantedSpells: ['duplicate-spell', 'duplicate-spell'] },
        { grantedSpells: ['  spaced-id  ', '', 'duplicate-spell'] },
      ],
    });

    expect(result).toEqual(['duplicate-spell', 'spaced-id']);
  });
});
