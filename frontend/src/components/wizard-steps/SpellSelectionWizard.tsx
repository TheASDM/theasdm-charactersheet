import { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { StepContainer } from '../../styles/components/CharacterGeneratorWizard.styles';
import type { CharacterBuilderData } from '../CharacterGeneratorWizard';
import { useApiCall } from '@/hooks/useApiCall';
import { listSpells, getSpellById, SpellFilters } from '@/services/spellService';
import type { Spell } from '@/types/api';
import { isError } from '@/types/api';
import { showError } from '@/utils/errorDisplay';
import LoadingSpinner from '@/components/LoadingSpinner';
import { deriveGrantedSpells } from '@/helpers/deriveGrantedSpells';
import { computeManaPool } from '@/helpers/manaRules';
import type { getCasterProgressionMeta } from '@/helpers/spellRules';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';
import { characterService } from '@/services/characterService';

type FilterTriState = 'all' | 'yes' | 'no';

type SpellProgressionMeta = ReturnType<typeof getCasterProgressionMeta>;

interface SpellSelectionWizardProps {
  data: CharacterBuilderData;
  spellMeta: SpellProgressionMeta | null;
  onUpdate: (updates: Partial<CharacterBuilderData>) => void;
  onValidityChange: (isValid: boolean) => void;
}

const FiltersBar = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
  padding: 1rem;
  background: rgba(26, 26, 26, 0.75);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 12px;
`;

const FilterGroup = styled.label`
  display: flex;
  flex-direction: column;
  font-size: 0.85rem;
  color: #d4af37;

  span {
    margin-bottom: 0.35rem;
    font-weight: 600;
    letter-spacing: 0.4px;
  }

  input,
  select {
    background: rgba(16, 16, 16, 0.9);
    border: 1px solid rgba(212, 175, 55, 0.35);
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    color: #f8f4e1;
    font-size: 0.9rem;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &:focus {
      outline: none;
      border-color: #f1c661;
      box-shadow: 0 0 0 2px rgba(241, 198, 97, 0.15);
    }
  }
`;

const CounterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  margin: 0 0 1.5rem;
`;

const CounterPill = styled.div<{ $invalid?: boolean }>`
  background: ${({ $invalid }) =>
    $invalid ? 'rgba(182, 55, 55, 0.2)' : 'rgba(26, 26, 26, 0.75)'};
  border: 1px solid ${({ $invalid }) =>
    $invalid ? 'rgba(255, 92, 92, 0.6)' : 'rgba(212, 175, 55, 0.4)'};
  border-radius: 999px;
  padding: 0.5rem 1rem;
  color: ${({ $invalid }) => ($invalid ? '#ff8a8a' : '#d4af37')};
  font-weight: 600;
  font-size: 0.9rem;
  letter-spacing: 0.4px;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
`;

const SpellGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1rem;
`;

const SpellCard = styled.div<{ $selected?: boolean }>`
  background: rgba(20, 20, 20, 0.9);
  border: 1px solid ${({ $selected }) =>
    $selected ? 'rgba(241, 198, 97, 0.9)' : 'rgba(80, 80, 80, 0.6)'};
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: border-color 0.2s ease, transform 0.2s ease;
  cursor: pointer;

  &:hover {
    border-color: rgba(241, 198, 97, 0.6);
    transform: translateY(-1px);
  }

  h3 {
    margin: 0;
    font-size: 1.05rem;
    color: #f8f4e1;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.5rem;
  }
`;

const SpellMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  color: #b9b4a6;
  font-size: 0.8rem;
`;

const Tag = styled.span<{ $kind?: 'granted' | 'error' }>`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  font-size: 0.75rem;
  background: ${({ $kind }) => {
    if ($kind === 'granted') return 'rgba(54, 126, 89, 0.2)';
    if ($kind === 'error') return 'rgba(182, 55, 55, 0.2)';
    return 'rgba(60, 60, 60, 0.75)';
  }};
  color: ${({ $kind }) => {
    if ($kind === 'granted') return '#5ce0a3';
    if ($kind === 'error') return '#ff8a8a';
    return '#d4af37';
  }};
  border: 1px solid ${({ $kind }) => {
    if ($kind === 'granted') return 'rgba(92, 224, 163, 0.6)';
    if ($kind === 'error') return 'rgba(255, 138, 138, 0.6)';
    return 'rgba(212, 175, 55, 0.35)';
  }};
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  border: none;
  border-radius: 8px;
  padding: 0.45rem 0.75rem;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.3px;
  cursor: pointer;
  background: ${({ $variant }) => {
    switch ($variant) {
      case 'danger':
        return 'linear-gradient(135deg, #b23b3b, #922f2f)';
      case 'secondary':
        return 'linear-gradient(135deg, #444, #333)';
      default:
        return 'linear-gradient(135deg, #d4af37, #b8941f)';
    }
  }};
  color: ${({ $variant }) => ($variant === 'primary' ? '#1a1a1a' : '#f8f4e1')};
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
  }
`;

const GrantedSection = styled.div`
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(30, 30, 30, 0.8);
  border: 1px solid rgba(92, 224, 163, 0.4);
  border-radius: 12px;

  h2 {
    margin: 0 0 0.75rem;
    color: #5ce0a3;
    font-size: 1rem;
    letter-spacing: 0.4px;
    text-transform: uppercase;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  li {
    background: rgba(54, 126, 89, 0.2);
    border: 1px solid rgba(92, 224, 163, 0.4);
    border-radius: 999px;
    padding: 0.35rem 0.75rem;
    color: #d7fff0;
    font-size: 0.8rem;
  }
`;

const StatusBanner = styled.div<{ $tone: 'error' | 'info' }>`
  margin: 1rem 0;
  padding: 0.85rem 1.1rem;
  border-radius: 10px;
  border: 1px solid
    ${({ $tone }) => ($tone === 'error' ? 'rgba(255, 120, 120, 0.65)' : 'rgba(212, 175, 55, 0.45)')};
  background: ${({ $tone }) =>
    $tone === 'error' ? 'rgba(182, 55, 55, 0.2)' : 'rgba(40, 40, 40, 0.75)'};
  color: ${({ $tone }) => ($tone === 'error' ? '#ff9c9c' : '#d4af37')};
  font-size: 0.9rem;
`;

const ManaPanel = styled.div`
  margin: 1.5rem 0;
  padding: 1rem;
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid rgba(64, 164, 255, 0.45);
  border-radius: 12px;
  color: #cfe4ff;

  header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 0.95rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
  }

  .inputs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  label {
    display: flex;
    flex-direction: column;
    font-size: 0.8rem;

    input {
      margin-top: 0.35rem;
      background: rgba(12, 26, 46, 0.9);
      border: 1px solid rgba(64, 164, 255, 0.55);
      color: #e8f6ff;
      border-radius: 6px;
      padding: 0.45rem 0.65rem;
      width: 120px;
    }
  }
`;

const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1.5rem;
  z-index: 1000;
`;

const ModalCard = styled.div`
  background: rgba(20, 20, 20, 0.95);
  border: 1px solid rgba(212, 175, 55, 0.4);
  border-radius: 12px;
  max-width: 640px;
  width: 100%;
  max-height: 85vh;
  overflow: hidden auto;
  padding: 1.5rem;
  color: #f8f4e1;

  h2 {
    margin-top: 0;
    margin-bottom: 0.75rem;
  }

  p {
    line-height: 1.5;
    font-size: 0.95rem;
  }
`;

const ModalClose = styled.button`
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  border: none;
  background: transparent;
  color: #d4af37;
  font-size: 1.5rem;
  cursor: pointer;
`;

const SCHOOL_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'Any School', value: 'all' },
  { label: 'Abjuration', value: 'A' },
  { label: 'Conjuration', value: 'C' },
  { label: 'Divination', value: 'D' },
  { label: 'Enchantment', value: 'E' },
  { label: 'Evocation', value: 'V' },
  { label: 'Illusion', value: 'I' },
  { label: 'Necromancy', value: 'N' },
  { label: 'Transmutation', value: 'T' },
];

const levelOptions = ['All Levels', 'Cantrips', '1st', '2nd', '3rd', '4th', '5th'];

const env = import.meta.env as Record<string, string | undefined>;
const manaFeatureEnabled = env?.VITE_ENABLE_MANA === 'true';

const normaliseSpellId = (value: string | number): string => String(value);

const formatLevel = (level: number): string => {
  if (level === 0) {
    return 'Cantrip';
  }
  const suffix = level === 1 ? 'st' : level === 2 ? 'nd' : level === 3 ? 'rd' : 'th';
  return `${level}${suffix}-level`;
};

const getSchoolLabel = (code?: string) => {
  const match = SCHOOL_OPTIONS.find((option) => option.value === code);
  return match?.label ?? 'Unknown';
};

const mapLevelLabelToNumber = (label: string): number | null => {
  switch (label) {
    case 'Cantrips':
      return 0;
    case '1st':
      return 1;
    case '2nd':
      return 2;
    case '3rd':
      return 3;
    case '4th':
      return 4;
    case '5th':
      return 5;
    default:
      return null;
  }
};

export const SpellSelectionWizard: React.FC<SpellSelectionWizardProps> = ({
  data,
  spellMeta,
  onUpdate,
  onValidityChange,
}) => {
  const characterId = (data as unknown as { characterId?: number | string; id?: number | string }).characterId ??
    (data as unknown as { id?: number | string }).id ??
    null;

  const [filters, setFilters] = useState({
    search: '',
    level: 'All Levels',
    school: 'all',
    ritual: 'all' as FilterTriState,
    concentration: 'all' as FilterTriState,
  });

  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const knownIds = useMemo(() => (data.spellbook?.known ?? []).map((id) => normaliseSpellId(id)), [data.spellbook]);
  const preparedIds = useMemo(
    () => (data.spellbook?.prepared ?? []).map((id) => normaliseSpellId(id)),
    [data.spellbook]
  );

  const speciesSource = useMemo(() => {
    if (!data.speciesSpells) {
      return undefined;
    }
    const aggregated = Object.values(data.speciesSpells)
      .flat()
      .filter((spellId): spellId is string => !!spellId);
    return aggregated.length > 0 ? { grantedSpells: aggregated } : undefined;
  }, [data.speciesSpells]);

  const featSources = useMemo(() => {
    if (!data.featSpells) {
      return undefined;
    }
    const mapped = Object.values(data.featSpells)
      .map((spells) => ({ grantedSpells: spells }))
      .filter((entry) => Array.isArray(entry.grantedSpells) && entry.grantedSpells.length > 0);
    return mapped.length > 0 ? mapped : undefined;
  }, [data.featSpells]);

  const classFeatureSources = useMemo(() => {
    if (!Array.isArray(data.classFeatures)) {
      return undefined;
    }
    const mapped = data.classFeatures
      .filter((feature: unknown): feature is { grantedSpells?: string[] } =>
        Boolean(feature && typeof feature === 'object' && 'grantedSpells' in (feature as Record<string, unknown>))
      )
      .map((feature) => ({ grantedSpells: feature.grantedSpells }))
      .filter((entry) => Array.isArray(entry.grantedSpells) && entry.grantedSpells.length > 0);
    return mapped.length > 0 ? mapped : undefined;
  }, [data.classFeatures]);

  const grantedIds = useMemo(() => {
    const options: Parameters<typeof deriveGrantedSpells>[1] = {};
    if (speciesSource) {
      options.species = speciesSource;
    }
    if (featSources) {
      options.feats = featSources;
    }
    if (classFeatureSources) {
      options.classFeatures = classFeatureSources;
    }
    return deriveGrantedSpells(null, options).map((id) => normaliseSpellId(id));
  }, [speciesSource, featSources, classFeatureSources]);

  const grantedSet = useMemo(() => new Set(grantedIds), [grantedIds]);

  const knownSet = useMemo(() => new Set(knownIds), [knownIds]);
  const preparedSet = useMemo(() => new Set(preparedIds), [preparedIds]);

  const knownTrackedIds = useMemo(
    () => knownIds.filter((id) => !grantedSet.has(id)),
    [knownIds, grantedSet]
  );
  const preparedTrackedIds = useMemo(
    () => preparedIds.filter((id) => !grantedSet.has(id)),
    [preparedIds, grantedSet]
  );

  const normalizedFilters = useMemo<SpellFilters>(() => {
    const next: SpellFilters = {
      limit: 50,
      page: 1,
    };

    if (data.selectedClass) {
      next.classId = data.selectedClass;
    }

    const levelNumber = mapLevelLabelToNumber(filters.level);
    if (levelNumber !== null) {
      next.level = levelNumber;
    }

    if (filters.school !== 'all') {
      next.school = filters.school;
    }

    const trimmedSearch = filters.search.trim();
    if (trimmedSearch) {
      next.q = trimmedSearch;
    }

    if (filters.ritual !== 'all') {
      next.ritual = filters.ritual === 'yes';
    }

    if (filters.concentration !== 'all') {
      next.concentration = filters.concentration === 'yes';
    }

    return next;
  }, [data.selectedClass, filters]);

  const {
    data: spellResponse,
    execute: fetchSpells,
    isLoading: isLoadingSpells,
    error: spellError,
  } = useApiCall(listSpells, { showErrorToast: false });

  const debouncedFetch = useDebouncedCallback((params: SpellFilters) => {
    void fetchSpells(params);
  }, 250);

  useEffect(() => {
    debouncedFetch(normalizedFilters);
    return () => debouncedFetch.cancel();
  }, [normalizedFilters, debouncedFetch]);

  const [grantedSpellDetails, setGrantedSpellDetails] = useState<Record<string, Spell | null>>({});

  useEffect(() => {
    if (grantedIds.length === 0) {
      setGrantedSpellDetails({});
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const loadDetails = async () => {
      const entries: Array<[string, Spell | null]> = await Promise.all(
        grantedIds.map(async (spellId) => {
          const response = await getSpellById(spellId, controller.signal);
          if (isError(response) || !response.data) {
            return [spellId, null];
          }
          return [spellId, response.data];
        })
      );

      if (!cancelled) {
        setGrantedSpellDetails(Object.fromEntries(entries));
      }
    };

    void loadDetails();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [grantedIds]);

  const spells = spellResponse?.items ?? [];

  const knownMax = spellMeta?.knownMax ?? null;
  const preparedMax = spellMeta?.preparedMax ?? null;
  const knownOverflow = knownMax !== null && knownTrackedIds.length > knownMax;
  const preparedOverflow = preparedMax !== null && preparedTrackedIds.length > preparedMax;
  const validState = !(knownOverflow || preparedOverflow);

  useEffect(() => {
    onValidityChange(validState);
  }, [validState, onValidityChange]);

  const persistChanges = useCallback(
    async (
      nextKnown: string[],
      nextPrepared: string[],
      nextResources?: Partial<{ manaCurrent: number; manaMax: number }>
    ) => {
      if (!characterId) {
        return;
      }

      setIsSaving(true);
      setSaveError(null);
      const payload = {
        spellbook: {
          known: nextKnown,
          prepared: nextPrepared,
        },
        ...(nextResources ? { resources: nextResources } : {}),
      };

      const response = await characterService.update(characterId, payload);
      if (isError(response)) {
        const message = response.error ?? 'Failed to save spell selection';
        setSaveError(message);
        showError(message, response.statusCode, response.errorCode);
      }
      setIsSaving(false);
    },
    [characterId]
  );

  const applyKnownChange = useCallback(
    (spellId: string, willKnow: boolean) => {
      const nextKnownSet = new Set(knownSet);
      const nextPreparedSet = new Set(preparedSet);

      if (willKnow) {
        nextKnownSet.add(spellId);
      } else {
        nextKnownSet.delete(spellId);
        if (nextPreparedSet.has(spellId)) {
          nextPreparedSet.delete(spellId);
        }
      }

      const nextKnown = Array.from(nextKnownSet);
      const nextPrepared = Array.from(nextPreparedSet);
      onUpdate({ spellbook: { known: nextKnown, prepared: nextPrepared } });
      void persistChanges(nextKnown, nextPrepared);
    },
    [knownSet, preparedSet, onUpdate, persistChanges]
  );

  const applyPreparedChange = useCallback(
    (spellId: string, willPrepare: boolean) => {
      const nextPreparedSet = new Set(preparedSet);
      if (willPrepare) {
        nextPreparedSet.add(spellId);
      } else {
        nextPreparedSet.delete(spellId);
      }

      const nextPrepared = Array.from(nextPreparedSet);
      const nextKnown = Array.from(knownSet);
      onUpdate({ spellbook: { known: nextKnown, prepared: nextPrepared } });
      void persistChanges(nextKnown, nextPrepared);
    },
    [preparedSet, knownSet, onUpdate, persistChanges]
  );

  const handleManaInitialization = useCallback(() => {
    if (!manaFeatureEnabled) {
      return;
    }
    if (!data.selectedClass) {
      return;
    }
    if (data.resources?.manaMax !== undefined) {
      return;
    }

    const totalSlots = 0;
    const proficiencyBonus = 2;
    const computedMax = computeManaPool(
      [{ classId: data.selectedClass, level: 1 }],
      proficiencyBonus,
      totalSlots
    );
    const nextResources = {
      manaMax: computedMax,
      manaCurrent: computedMax,
    };
    onUpdate({ resources: nextResources });
    void persistChanges(Array.from(knownSet), Array.from(preparedSet), nextResources);
  }, [data.selectedClass, data.resources, onUpdate, persistChanges, knownSet, preparedSet]);

  useEffect(() => {
    handleManaInitialization();
  }, [handleManaInitialization]);

  const handleManaChange = useCallback(
    (field: 'manaCurrent' | 'manaMax', value: number) => {
      const clampedValue = Math.max(0, Math.floor(value));
      const nextResources = {
        manaCurrent: field === 'manaCurrent' ? clampedValue : data.resources?.manaCurrent ?? clampedValue,
        manaMax: field === 'manaMax' ? clampedValue : data.resources?.manaMax ?? clampedValue,
      };
      onUpdate({ resources: nextResources });
      void persistChanges(Array.from(knownSet), Array.from(preparedSet), nextResources);
    },
    [data.resources, onUpdate, persistChanges, knownSet, preparedSet]
  );

  const renderedSpellCards = spells.map((spell) => {
    const spellId = normaliseSpellId(spell.id);
    const isGranted = grantedSet.has(spellId);
    const isKnown = knownSet.has(spellId);
    const isPrepared = preparedSet.has(spellId);
    const miscTags = spell.miscTags ?? [];
    const isRitualSpell = (typeof spell.isRitual === 'boolean' ? spell.isRitual : undefined) ??
      miscTags.some((tag) => tag.toLowerCase() === 'ritual');
    const isConcentrationSpell = miscTags.some((tag) => tag.toLowerCase() === 'concentration');

    const knownAtCapacity = knownMax !== null && knownTrackedIds.length >= knownMax && !isKnown;
    const preparedAtCapacity = preparedMax !== null && preparedTrackedIds.length >= preparedMax && !isPrepared;

    const disableKnown = isGranted || knownMax === null || knownAtCapacity;
    const disablePrepared = isGranted || !spellMeta?.preparedCaster || preparedAtCapacity;

    const knownTooltip = (() => {
      if (isGranted) return 'Granted automatically';
      if (knownMax === null) return 'Prepared casters do not track known spells';
      if (knownAtCapacity) return 'No known spell slots remaining';
      return undefined;
    })();

    const preparedTooltip = (() => {
      if (isGranted) return 'Granted automatically';
      if (!spellMeta?.preparedCaster) return 'This class does not prepare spells';
      if (preparedAtCapacity) return 'No prepared spell slots remaining';
      return undefined;
    })();

    return (
      <SpellCard key={spellId} onClick={() => setSelectedSpell(spell)}>
        <h3>
          <span>{spell.name}</span>
          <Tag>{formatLevel(spell.level)}</Tag>
        </h3>
        <SpellMeta>
          <span>{getSchoolLabel(spell.school)}</span>
          {isRitualSpell && <Tag>Ritual</Tag>}
          {isConcentrationSpell && <Tag>Concentration</Tag>}
          {isGranted && <Tag $kind="granted">Granted</Tag>}
        </SpellMeta>
        <ActionRow onClick={(event) => event.stopPropagation()}>
          <ActionButton
            $variant={isKnown ? 'danger' : 'primary'}
            disabled={disableKnown}
            title={knownTooltip}
            onClick={() => applyKnownChange(spellId, !isKnown)}
          >
            {isKnown ? 'Remove Known' : 'Add Known'}
          </ActionButton>
          {spellMeta?.preparedCaster && (
            <ActionButton
              $variant={isPrepared ? 'danger' : 'secondary'}
              disabled={disablePrepared}
              title={preparedTooltip}
              onClick={() => applyPreparedChange(spellId, !isPrepared)}
            >
              {isPrepared ? 'Unprepare' : 'Prepare'}
            </ActionButton>
          )}
        </ActionRow>
      </SpellCard>
    );
  });

  return (
    <StepContainer>
      <div className="step-title">Spell Selection</div>
      <div className="step-description">
        Choose spells to learn and prepare. Granted spells are listed separately and never count against your limits.
      </div>

      <CounterBar>
        <CounterPill $invalid={knownOverflow}>
          Known Spells: {knownTrackedIds.length}
          {knownMax !== null && ` / ${knownMax}`}
        </CounterPill>
        {spellMeta?.preparedCaster && (
          <CounterPill $invalid={preparedOverflow}>
            Prepared Spells: {preparedTrackedIds.length}
            {preparedMax !== null && ` / ${preparedMax}`}
          </CounterPill>
        )}
        {isSaving && <CounterPill>Saving…</CounterPill>}
      </CounterBar>

      {saveError && (
        <StatusBanner role="alert" $tone="error">
          {saveError}
        </StatusBanner>
      )}

      {grantedIds.length > 0 && (
        <GrantedSection>
          <h2>Granted Spells</h2>
          <ul>
            {grantedIds.map((spellId) => {
              const detail = grantedSpellDetails[spellId];
              const label = detail?.name ?? `Spell #${spellId}`;
              return <li key={spellId}>{label}</li>;
            })}
          </ul>
        </GrantedSection>
      )}

      <FiltersBar>
        <FilterGroup>
          <span>Search</span>
          <input
            type="search"
            placeholder="Search by name or text…"
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
          />
        </FilterGroup>
        <FilterGroup>
          <span>Level</span>
          <select
            value={filters.level}
            onChange={(event) => setFilters((prev) => ({ ...prev, level: event.target.value }))}
          >
            {levelOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </FilterGroup>
        <FilterGroup>
          <span>School</span>
          <select
            value={filters.school}
            onChange={(event) => setFilters((prev) => ({ ...prev, school: event.target.value }))}
          >
            {SCHOOL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FilterGroup>
        <FilterGroup>
          <span>Ritual</span>
          <select
            value={filters.ritual}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, ritual: event.target.value as FilterTriState }))
            }
          >
            <option value="all">Any</option>
            <option value="yes">Ritual Only</option>
            <option value="no">Non-Ritual</option>
          </select>
        </FilterGroup>
        <FilterGroup>
          <span>Concentration</span>
          <select
            value={filters.concentration}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, concentration: event.target.value as FilterTriState }))
            }
          >
            <option value="all">Any</option>
            <option value="yes">Requires Concentration</option>
            <option value="no">No Concentration</option>
          </select>
        </FilterGroup>
      </FiltersBar>

      {manaFeatureEnabled && spellMeta?.casterType !== 'none' && data.selectedClass && (
        <ManaPanel>
          <header>
            <span>Mana Pool (experimental)</span>
            <small>Values persist with your spell choices.</small>
          </header>
          <div className="inputs">
            <label>
              Current Mana
              <input
                type="number"
                value={data.resources?.manaCurrent ?? 0}
                onChange={(event) => handleManaChange('manaCurrent', Number(event.target.value))}
              />
            </label>
            <label>
              Maximum Mana
              <input
                type="number"
                value={data.resources?.manaMax ?? 0}
                onChange={(event) => handleManaChange('manaMax', Number(event.target.value))}
              />
            </label>
          </div>
        </ManaPanel>
      )}

      {spellError && (
        <StatusBanner role="alert" $tone="error">
          Unable to load spells right now. Please adjust your filters or try again in a moment.
        </StatusBanner>
      )}

      {isLoadingSpells ? (
        <LoadingSpinner />
      ) : spells.length === 0 ? (
        <StatusBanner $tone="info">
          No spells found for your current filters.
        </StatusBanner>
      ) : (
        <SpellGrid>{renderedSpellCards}</SpellGrid>
      )}

      {selectedSpell && (
        <ModalBackdrop role="dialog" aria-modal="true">
          <ModalCard>
            <ModalClose aria-label="Close" onClick={() => setSelectedSpell(null)}>
              ×
            </ModalClose>
            <h2>{selectedSpell.name}</h2>
            <p>
              {formatLevel(selectedSpell.level)} &bull; {getSchoolLabel(selectedSpell.school)}
              {selectedSpell.isRitual ? ' • Ritual' : ''}
              {selectedSpell.miscTags?.includes('Concentration') ? ' • Concentration' : ''}
            </p>
            {Array.isArray(selectedSpell.entries) && selectedSpell.entries.length > 0 ? (
              selectedSpell.entries.map((entry, index) => (
                <p key={index}>{typeof entry === 'string' ? entry : JSON.stringify(entry)}</p>
              ))
            ) : (
              <p>No additional description available.</p>
            )}
          </ModalCard>
        </ModalBackdrop>
      )}
    </StepContainer>
  );
};
