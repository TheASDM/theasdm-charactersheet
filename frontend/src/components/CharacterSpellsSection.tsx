import { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import type { CharacterSheetData } from '../types/characterSheet';
import type { Spell } from '@/types/api';
import { getSpellById } from '@/services/spellService';
import { isError } from '@/types/api';
import { deriveGrantedSpells } from '@/helpers/deriveGrantedSpells';
import { getCasterProgressionMeta } from '@/helpers/spellRules';
import { SPELLCASTING_CONFIG, normalizeClassId } from '@/helpers/spellcastingConfig';
import { logger } from '@/utils/logger';

interface CharacterSpellsSectionProps {
  character: CharacterSheetData;
}

const abilityKeyToScore: Record<string, keyof CharacterSheetData['abilityScores']> = {
  int: 'intelligence',
  wis: 'wisdom',
  cha: 'charisma',
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  padding-bottom: 2rem;
`;

const SummaryRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const SummaryBadge = styled.div<{ $variant?: 'default' | 'warning' }>`
  background: ${({ $variant }) =>
    $variant === 'warning' ? 'rgba(244, 67, 54, 0.12)' : 'rgba(212, 175, 55, 0.12)'};
  border: 1px solid ${({ $variant }) =>
    $variant === 'warning' ? 'rgba(244, 67, 54, 0.35)' : 'rgba(212, 175, 55, 0.35)'};
  border-radius: 999px;
  padding: 0.5rem 1rem;
  color: ${({ $variant }) =>
    $variant === 'warning' ? '#f76b5c' : '#d4af37'};
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.3px;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
`;

const Section = styled.section`
  background: rgba(26, 26, 26, 0.65);
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;

  h3 {
    margin: 0;
    font-size: 1rem;
    color: #d4af37;
    font-family: 'Cinzel', serif;
    letter-spacing: 0.6px;
    text-transform: uppercase;
  }

  span {
    font-size: 0.8rem;
    color: rgba(212, 175, 55, 0.7);
  }
`;

const SpellGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 0.9rem;
`;

const SpellCard = styled.div<{ $prepared?: boolean; $granted?: boolean }>`
  background: rgba(16, 16, 16, 0.9);
  border: 1px solid
    ${({ $prepared, $granted }) =>
      $granted ? 'rgba(108, 198, 255, 0.4)' : $prepared ? 'rgba(125, 225, 125, 0.45)' : 'rgba(212, 175, 55, 0.25)'};
  border-radius: 12px;
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  transition: border-color 0.2s ease, transform 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: ${({ $prepared, $granted }) =>
      $granted ? 'rgba(108, 198, 255, 0.65)' : $prepared ? 'rgba(125, 225, 125, 0.7)' : 'rgba(241, 198, 97, 0.55)'};
  }
`;

const SpellTitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;

  h4 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #f8f4e1;
  }
`;

const Tag = styled.span<{ $tone?: 'default' | 'prepared' | 'granted' | 'cantrip' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  font-size: 0.7rem;
  letter-spacing: 0.3px;
  color: ${({ $tone }) =>
    $tone === 'prepared'
      ? '#8de58d'
      : $tone === 'granted'
      ? '#80cfff'
      : $tone === 'cantrip'
      ? '#f4c76a'
      : '#d4af37'};
  border: 1px solid ${({ $tone }) =>
    $tone === 'prepared'
      ? 'rgba(125, 225, 125, 0.6)'
      : $tone === 'granted'
      ? 'rgba(108, 198, 255, 0.6)'
      : $tone === 'cantrip'
      ? 'rgba(244, 199, 106, 0.6)'
      : 'rgba(212, 175, 55, 0.5)'};
  background: ${({ $tone }) =>
    $tone === 'prepared'
      ? 'rgba(125, 225, 125, 0.12)'
      : $tone === 'granted'
      ? 'rgba(108, 198, 255, 0.12)'
      : $tone === 'cantrip'
      ? 'rgba(244, 199, 106, 0.12)'
      : 'rgba(212, 175, 55, 0.1)'};
`;

const SpellMetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  font-size: 0.78rem;
  color: rgba(228, 220, 200, 0.85);
`;

const EmptyState = styled.div`
  padding: 1rem;
  text-align: center;
  font-size: 0.9rem;
  color: rgba(212, 175, 55, 0.8);
  border: 1px dashed rgba(212, 175, 55, 0.25);
  border-radius: 10px;
  background: rgba(26, 26, 26, 0.5);
`;

const WarningList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: #ffc067;
`;

const LoadingMessage = styled.div`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
`;

const formatLevelLabel = (level: number | undefined) => {
  if (level === undefined) {
    return 'Unknown Level';
  }
  if (level === 0) {
    return 'Cantrip';
  }
  const suffix = level === 1 ? 'st' : level === 2 ? 'nd' : level === 3 ? 'rd' : 'th';
  return `${level}${suffix}-level`;
};

const getSchoolLabel = (school?: string | null) => {
  if (!school) return 'Unknown School';
  const lookup: Record<string, string> = {
    A: 'Abjuration',
    C: 'Conjuration',
    D: 'Divination',
    E: 'Enchantment',
    V: 'Evocation',
    I: 'Illusion',
    N: 'Necromancy',
    T: 'Transmutation',
  };
  return lookup[school] ?? school;
};

export function CharacterSpellsSection({ character }: CharacterSpellsSectionProps) {
  const knownIds = useMemo(() => (character.spellbook?.known ?? []).map((id) => String(id)), [character.spellbook]);
  const preparedIds = useMemo(() => (character.spellbook?.prepared ?? []).map((id) => String(id)), [character.spellbook]);

  const speciesTraits = (character.features?.speciesTraits ?? character.speciesTraits ?? []) as unknown[];
  const featFeatureEntries = (character.features?.feats ?? []) as unknown[];
  const backgroundFeatureEntries = (character.features?.backgroundFeatures ?? character.backgroundFeatures ?? []) as unknown[];
  const classFeatureEntries = (character.features?.classFeatures ?? character.classFeatures ?? []) as unknown[];
  const subclassFeatureEntries = (character.features?.subclassFeatures ?? []) as unknown[];

  const featSpellSources = useMemo(
    () =>
      Object.values(character.featSpells ?? {})
        .filter((spells) => Array.isArray(spells) && spells.length > 0)
        .map((spells) => ({ grantedSpells: spells })),
    [character.featSpells]
  );

  const speciesSource = useMemo(() => {
    if (!speciesTraits.length) {
      return undefined;
    }
    return { grantedSpells: speciesTraits } as unknown;
  }, [speciesTraits]);

  const featSources = useMemo(() => {
    const combined = [...featSpellSources, ...featFeatureEntries];
    return combined.length > 0 ? (combined as unknown[]) : undefined;
  }, [featFeatureEntries, featSpellSources]);

  const grantedIds = useMemo(() => {
    const options: Parameters<typeof deriveGrantedSpells>[1] = {};
    if (speciesSource) {
      options.species = speciesSource as any;
    }
    if (featSources) {
      options.feats = featSources as any;
    }
    if (classFeatureEntries.length > 0) {
      options.classFeatures = classFeatureEntries as any;
    }
    if (subclassFeatureEntries.length > 0) {
      options.subclassFeatures = subclassFeatureEntries as any;
    }
    if (backgroundFeatureEntries.length > 0) {
      options.backgroundFeatures = backgroundFeatureEntries as any;
    }

    try {
      return deriveGrantedSpells(null, options).map((id) => String(id));
    } catch (error) {
      logger.warn('Failed to derive granted spells for character sheet', error);
      return [];
    }
  }, [speciesSource, featSources, classFeatureEntries, subclassFeatureEntries, backgroundFeatureEntries]);

  const grantedSet = useMemo(() => new Set(grantedIds), [grantedIds]);
  const preparedSet = useMemo(() => new Set(preparedIds), [preparedIds]);
  const knownTrackedIds = useMemo(
    () => knownIds.filter((id) => !grantedSet.has(id)),
    [knownIds, grantedSet]
  );
  const preparedTrackedIds = useMemo(
    () => preparedIds.filter((id) => !grantedSet.has(id)),
    [preparedIds, grantedSet]
  );

  const grantedPreparedIds = useMemo(
    () => grantedIds.filter((id) => preparedSet.has(id)),
    [grantedIds, preparedSet]
  );

  const normalizedClass = normalizeClassId(character.class || '');
  const spellcastingAbilityKey = SPELLCASTING_CONFIG[normalizedClass]?.spellcastingAbility;
  const abilityScore = spellcastingAbilityKey
    ? character.abilityScores[abilityKeyToScore[spellcastingAbilityKey] ?? 'charisma']
    : undefined;

  const casterMeta = useMemo(() => {
    const classId = character.class || 'none';
    const params: Parameters<typeof getCasterProgressionMeta>[0] = {
      classId: normalizeClassId(classId) || classId,
      level: character.level ?? 1,
    };
    if (typeof abilityScore === 'number') {
      params.spellcastingAbilityScore = abilityScore;
    }
    return getCasterProgressionMeta(params);
  }, [character.class, character.level, abilityScore]);

  const cantripMax = casterMeta.cantripMax ?? null;
  const leveledMax = casterMeta.knownMax ?? null;
  const preparedMax = casterMeta.preparedCaster ? casterMeta.preparedMax ?? null : null;

  const [spellLookup, setSpellLookup] = useState<Record<string, Spell | null>>({});
  const [isLoading, setIsLoading] = useState(false);

  const sortIdsBySpell = useCallback(
    (ids: string[]) =>
      [...ids].sort((a, b) => {
        const aSpell = spellLookup[a];
        const bSpell = spellLookup[b];
        const levelDiff = (aSpell?.level ?? 0) - (bSpell?.level ?? 0);
        if (levelDiff !== 0) {
          return levelDiff;
        }
        return (aSpell?.name ?? a).localeCompare(bSpell?.name ?? b, undefined, {
          sensitivity: 'base',
        });
      }),
    [spellLookup]
  );

  const uniqueSpellIds = useMemo(
    () => Array.from(new Set([...knownIds, ...preparedIds, ...grantedIds])).filter(Boolean),
    [knownIds, preparedIds, grantedIds]
  );

  useEffect(() => {
    if (uniqueSpellIds.length === 0) {
      setSpellLookup({});
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const load = async () => {
      setIsLoading(true);
      try {
        const entries = await Promise.all(
          uniqueSpellIds.map(async (spellId) => {
            const response = await getSpellById(spellId, controller.signal);
            if (isError(response) || !response.data) {
              if (isError(response)) {
                logger.warn('Failed to fetch spell details for character sheet', {
                  spellId,
                  error: response.error,
                });
              }
              return [spellId, null] as const;
            }
            return [spellId, response.data] as const;
          })
        );

        if (!cancelled) {
          setSpellLookup((prev) => {
            const next = { ...prev };
            entries.forEach(([id, spell]) => {
              next[id] = spell;
            });
            return next;
          });
          setIsLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          logger.error('Unexpected error loading spell details', error);
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [uniqueSpellIds]);

  const knownBreakdown = useMemo(() => {
    const cantrips: string[] = [];
    const leveled: string[] = [];

    knownTrackedIds.forEach((id) => {
      const spell = spellLookup[id];
      if (spell?.level === 0) {
        cantrips.push(id);
      } else if (spell && typeof spell.level === 'number') {
        leveled.push(id);
      } else {
        leveled.push(id);
      }
    });

    return { cantrips, leveled };
  }, [knownTrackedIds, spellLookup]);

  const cantripOverflow = cantripMax !== null && knownBreakdown.cantrips.length > cantripMax;
  const leveledOverflow = leveledMax !== null && knownBreakdown.leveled.length > leveledMax;
  const preparedOverflow = preparedMax !== null && preparedTrackedIds.length > preparedMax;

  const warnings = useMemo(() => {
    const list: string[] = [];
    if (cantripOverflow) {
      list.push('Cantrip count exceeds current limit.');
    }
    if (leveledOverflow) {
      list.push('Known leveled spells exceed the recommended limit.');
    }
    if (preparedOverflow) {
      list.push('Prepared spells exceed your available preparation slots.');
    }
    return list;
  }, [cantripOverflow, leveledOverflow, preparedOverflow]);

  const renderSpellCard = (spellId: string, extraTags: Array<'prepared' | 'granted'> = []) => {
    const spell = spellLookup[spellId];
    const isPrepared = preparedSet.has(spellId);
    const isGranted = grantedSet.has(spellId);
    const level = spell?.level;
    const label = spell?.name ?? `Spell #${spellId}`;
    const schoolLabel = getSchoolLabel(spell?.school);
    const isCantrip = level === 0;

    return (
      <SpellCard key={spellId} $prepared={isPrepared && !isGranted} $granted={isGranted}>
        <SpellTitleRow>
          <h4>{label}</h4>
          <Tag $tone={isCantrip ? 'cantrip' : 'default'}>{formatLevelLabel(level)}</Tag>
        </SpellTitleRow>
        <SpellMetaRow>
          <span>{schoolLabel}</span>
          {(isPrepared || extraTags.includes('prepared')) && <Tag $tone="prepared">Prepared</Tag>}
          {(isGranted || extraTags.includes('granted')) && <Tag $tone="granted">Granted</Tag>}
        </SpellMetaRow>
      </SpellCard>
    );
  };

  return (
    <Container>
      <SummaryRow>
        <SummaryBadge $variant={cantripOverflow ? 'warning' : 'default'}>
          Cantrips: {knownBreakdown.cantrips.length}
          {cantripMax !== null && ` / ${cantripMax}`}
        </SummaryBadge>
        <SummaryBadge $variant={leveledOverflow ? 'warning' : 'default'}>
          Known Spells: {knownBreakdown.leveled.length}
          {leveledMax !== null && ` / ${leveledMax}`}
        </SummaryBadge>
        {preparedMax !== null && (
          <SummaryBadge $variant={preparedOverflow ? 'warning' : 'default'}>
            Prepared Spells: {preparedTrackedIds.length}
            {preparedMax !== null && ` / ${preparedMax}`}
          </SummaryBadge>
        )}
        <SummaryBadge>
          Granted: {grantedIds.length}
        </SummaryBadge>
      </SummaryRow>

      {warnings.length > 0 && (
        <Section>
          <SectionHeader>
            <h3>Spell Limit Notices</h3>
          </SectionHeader>
          <WarningList>
            {warnings.map((warning) => (
              <div key={warning}>• {warning}</div>
            ))}
          </WarningList>
        </Section>
      )}

      {preparedMax !== null && (
        <Section>
          <SectionHeader>
            <h3>Prepared Spells</h3>
            <span>Spells you have ready to cast without ritual preparation.</span>
          </SectionHeader>
          {preparedTrackedIds.length === 0 && grantedPreparedIds.length === 0 ? (
            <EmptyState>No prepared spells selected.</EmptyState>
          ) : (
            <SpellGrid>
              {sortIdsBySpell(preparedTrackedIds).map((id) => renderSpellCard(id, ['prepared']))}
              {sortIdsBySpell(grantedPreparedIds).map((id) => renderSpellCard(id, ['prepared', 'granted']))}
            </SpellGrid>
          )}
        </Section>
      )}

      <Section>
        <SectionHeader>
          <h3>Known Cantrips</h3>
          <span>At-will spells that do not require spell slots.</span>
        </SectionHeader>
        {knownBreakdown.cantrips.length === 0 ? (
          <EmptyState>No cantrips added yet.</EmptyState>
        ) : (
          <SpellGrid>
            {sortIdsBySpell(knownBreakdown.cantrips).map((id) => renderSpellCard(id))}
          </SpellGrid>
        )}
      </Section>

      <Section>
        <SectionHeader>
          <h3>Known Spells</h3>
          <span>Spells recorded in your spell list or spellbook.</span>
        </SectionHeader>
        {knownBreakdown.leveled.length === 0 ? (
          <EmptyState>No leveled spells known.</EmptyState>
        ) : (
          <SpellGrid>
            {sortIdsBySpell(knownBreakdown.leveled).map((id) => renderSpellCard(id))}
          </SpellGrid>
        )}
      </Section>

      <Section>
        <SectionHeader>
          <h3>Granted Spells</h3>
          <span>Automatically granted spells from features, species, or feats.</span>
        </SectionHeader>
        {grantedIds.length === 0 ? (
          <EmptyState>No granted spells detected.</EmptyState>
        ) : (
          <SpellGrid>
            {sortIdsBySpell(grantedIds).map((id) => renderSpellCard(id, ['granted']))}
          </SpellGrid>
        )}
      </Section>

      {isLoading && (
        <LoadingMessage>Fetching spell details…</LoadingMessage>
      )}
    </Container>
  );
}

export default CharacterSpellsSection;
