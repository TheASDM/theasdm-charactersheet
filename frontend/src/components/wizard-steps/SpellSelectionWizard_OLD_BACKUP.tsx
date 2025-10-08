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
import { characterService } from '@/services/characterService';
import { parseComplexDnDEntry } from '@/utils/dndTemplateParser';

type LevelFilter = 'all' | 0 | 1 | 2 | 3 | 4 | 5;
type RitualFilter = 'any' | 'ritual' | 'non';
type ConcentrationFilter = 'any' | 'conc' | 'non';

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

const EmptyState = styled.div`
  margin: 1.5rem 0;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px dashed rgba(212, 175, 55, 0.4);
  background: rgba(26, 26, 26, 0.6);
  color: #d4af37;
  text-align: center;
  font-size: 0.9rem;
`;

const PreparedSection = styled.div`
  margin: 2rem 0;
  padding: 1.25rem;
  border-radius: 12px;
  border: 1px solid rgba(212, 175, 55, 0.35);
  background: rgba(26, 26, 26, 0.65);
`;

const PreparedHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 1rem;

  h2 {
    margin: 0;
    font-size: 1rem;
    color: #d4af37;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  span {
    font-size: 0.85rem;
    color: #c0aa70;
  }
`;

const PreparedRows = styled.div`
  display: grid;
  gap: 0.75rem;
`;

const PreparedRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  label {
    font-size: 0.8rem;
    color: #d4af37;
    letter-spacing: 0.4px;
  }
`;

const PreparedSelect = styled.select`
  background: rgba(16, 16, 16, 0.9);
  border: 1px solid rgba(212, 175, 55, 0.35);
  border-radius: 6px;
  padding: 0.55rem 0.75rem;
  color: #f8f4e1;
  font-size: 0.9rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: #f1c661;
    box-shadow: 0 0 0 2px rgba(241, 198, 97, 0.15);
  }
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
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1.5rem;
  z-index: 1000;
  overflow-y: auto;
`;

const ModalCard = styled.div`
  background: linear-gradient(135deg, #2a2520 0%, #1a1a1a 100%);
  border: 3px solid #d4af37;
  border-radius: 12px;
  max-width: 720px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
  padding: 2rem;
  color: #f4e7d1;
  position: relative;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
  margin: 2rem auto;

  h2 {
    margin-top: 0;
    margin-bottom: 0.75rem;
    color: #d4af37;
    font-family: 'Cinzel', serif;
    letter-spacing: 0.5px;
  }

  p {
    line-height: 1.6;
    font-size: 0.95rem;
    color: #c4b49d;
    font-family: 'Crimson Text', serif;
  }
`;

const ModalClose = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  border: none;
  background: transparent;
  color: #d4af37;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(212, 175, 55, 0.2);
    transform: scale(1.1);
  }
`;

const SpellSection = styled.section`
  margin: 1.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SectionHeading = styled.h2`
  margin: 0;
  font-size: 1rem;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #d4af37;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin: 1.5rem 0;
  padding: 1rem;
`;

const PaginationButton = styled.button<{ $disabled?: boolean }>`
  background: ${({ $disabled }) =>
    $disabled ? 'rgba(60, 60, 60, 0.5)' : 'linear-gradient(135deg, #d4af37, #b8941f)'};
  color: ${({ $disabled }) => ($disabled ? '#666' : '#1a1a1a')};
  border: 1px solid ${({ $disabled }) => ($disabled ? '#444' : '#d4af37')};
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
  }

  &:disabled {
    opacity: 0.5;
  }
`;

const PageInfo = styled.span`
  color: #d4af37;
  font-size: 0.9rem;
  font-weight: 600;
  min-width: 120px;
  text-align: center;
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

const LEVEL_OPTIONS: Array<{ label: string; value: LevelFilter }> = [
  { label: 'All Levels', value: 'all' },
  { label: 'Cantrips', value: 0 },
  { label: '1st Level', value: 1 },
  { label: '2nd Level', value: 2 },
  { label: '3rd Level', value: 3 },
  { label: '4th Level', value: 4 },
  { label: '5th Level', value: 5 },
];

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

const normalizeClassName = (name: string | undefined | null) =>
  (name ?? '').trim().toLowerCase();

const extractSpellClassNames = (spell: Record<string, unknown>): string[] => {
  const names: string[] = [];

  if (Array.isArray((spell as { classes?: string[] }).classes)) {
    names.push(
      ...((spell as { classes?: string[] }).classes ?? [])
        .filter(Boolean)
        .map((cls) => normalizeClassName(String(cls)))
    );
  }

  const classSpells = (spell as { classSpells?: Array<{ class?: { name?: string } }> }).classSpells;
  if (Array.isArray(classSpells)) {
    names.push(
      ...classSpells
        .map((entry) => normalizeClassName(entry?.class?.name))
        .filter((cls) => cls.length > 0)
    );
  }

  return Array.from(new Set(names));
};

type SpellFlowMode = 'known' | 'prepared' | 'scribe' | 'none';

const KNOWN_FLOW_CLASSES = new Set(['bard', 'paladin', 'sorcerer', 'warlock', 'ranger']);
const PREPARED_FLOW_CLASSES = new Set(['cleric', 'druid']);
const SCRIBE_FLOW_CLASSES = new Set(['wizard']);
const CANTRIP_ELIGIBLE_CLASSES = new Set(['bard', 'cleric', 'druid', 'sorcerer', 'warlock', 'wizard']);

export const SpellSelectionWizard: React.FC<SpellSelectionWizardProps> = ({
  data,
  spellMeta,
  onUpdate,
  onValidityChange,
}) => {
  const characterId = (data as unknown as { characterId?: number | string; id?: number | string }).characterId ??
    (data as unknown as { id?: number | string }).id ??
    null;

  const normalizedSelectedClass = useMemo(() => normalizeClassName(data.selectedClass), [data.selectedClass]);

  const [searchTerm, setSearchTerm] = useState('');
  const [level, setLevel] = useState<LevelFilter>(1);
  const [school, setSchool] = useState<string>('all');
  const [ritual, setRitual] = useState<RitualFilter>('any');
  const [concentration, setConcentration] = useState<ConcentrationFilter>('any');
  const [currentPage, setCurrentPage] = useState(1);
  const spellsPerPage = 20;

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

  const backgroundFeatureSources = useMemo(() => {
    if (!Array.isArray(data.backgroundFeatures)) {
      return undefined;
    }
    const objectsOnly = data.backgroundFeatures.filter((feature): feature is Record<string, unknown> =>
      Boolean(feature && typeof feature === 'object')
    );
    return objectsOnly.length > 0 ? objectsOnly : undefined;
  }, [data.backgroundFeatures]);

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
    if (backgroundFeatureSources) {
      options.backgroundFeatures = backgroundFeatureSources;
    }
    return deriveGrantedSpells(null, options).map((id) => normaliseSpellId(id));
  }, [speciesSource, featSources, classFeatureSources, backgroundFeatureSources]);

  const grantedSet = useMemo(() => new Set(grantedIds), [grantedIds]);

  const knownSet = useMemo(() => new Set(knownIds), [knownIds]);
  const preparedSet = useMemo(() => new Set(preparedIds), [preparedIds]);

  const grantedPreparedIds = useMemo(
    () => preparedIds.filter((id) => grantedSet.has(id)),
    [preparedIds, grantedSet]
  );

  const knownTrackedIds = useMemo(
    () => knownIds.filter((id) => !grantedSet.has(id)),
    [knownIds, grantedSet]
  );
  const preparedTrackedIds = useMemo(
    () => preparedIds.filter((id) => !grantedSet.has(id)),
    [preparedIds, grantedSet]
  );

  const editablePreparedIds = useMemo(
    () => preparedIds.filter((id) => !grantedSet.has(id)),
    [preparedIds, grantedSet]
  );

  const spellSupportsSelectedClass = useCallback(
    (spell: Spell) => {
      if (!normalizedSelectedClass) {
        return true;
      }
      const classNames = extractSpellClassNames(spell as unknown as Record<string, unknown>);
      if (classNames.length === 0) {
        return false;
      }
      return classNames.some((cls) => cls === normalizedSelectedClass);
    },
    [normalizedSelectedClass]
  );

  const buildSpellRequest = useCallback(
    (signal?: AbortSignal) => {
      const trimmedSearch = searchTerm.trim();
      const filters: SpellFilters = {
        page: 1,
        limit: 500,
      };

      if (trimmedSearch) {
        filters.q = trimmedSearch;
      }

      if (level !== 'all') {
        filters.level = level;
      }

      if (school !== 'all') {
        filters.school = school;
      }

      if (data.selectedClass) {
        filters.className = data.selectedClass;
      }

      const ritualFilter = ritual === 'any' ? undefined : ritual === 'ritual';
      if (ritualFilter !== undefined) {
        filters.ritual = ritualFilter;
      }

      const concentrationFilter =
        concentration === 'any' ? undefined : concentration === 'conc';
      if (concentrationFilter !== undefined) {
        filters.concentration = concentrationFilter;
      }

      return listSpells(filters, signal);
    },
    [searchTerm, level, school, ritual, concentration, data.selectedClass]
  );

  const {
    data: spellsResponse,
    isLoading: isLoadingSpells,
    error: spellError,
    execute: loadSpells,
  } = useApiCall(buildSpellRequest, { showErrorToast: false });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSpells();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [loadSpells, searchTerm, level, school, ritual, concentration, data.selectedClass]);

  const [spellDetails, setSpellDetails] = useState<Record<string, Spell | null>>({});

  const detailIds = useMemo(
    () => Array.from(new Set([...knownIds, ...preparedIds, ...grantedIds])),
    [knownIds, preparedIds, grantedIds]
  );

  useEffect(() => {
    const fetchableIds = detailIds.filter((id) => id);

    if (fetchableIds.length === 0) {
      setSpellDetails({});
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const loadDetails = async () => {
      const entries: Array<[string, Spell | null]> = await Promise.all(
        fetchableIds.map(async (spellId) => {
          const response = await getSpellById(spellId, controller.signal);
          if (isError(response) || !response.data) {
            return [spellId, null];
          }
          return [spellId, response.data];
        })
      );

      if (!cancelled) {
        setSpellDetails((prev) => ({
          ...prev,
          ...Object.fromEntries(entries),
        }));
      }
    };

    void loadDetails();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [detailIds]);

  const spells = useMemo(() => {
    if (!spellsResponse) {
      return [];
    }
    if (Array.isArray(spellsResponse.items) && spellsResponse.items.length > 0) {
      return spellsResponse.items;
    }
    if (Array.isArray(spellsResponse.spells)) {
      return spellsResponse.spells;
    }
    return [];
  }, [spellsResponse]);

  const eligibleSpells = useMemo(() => {
    const list = spells.filter((spell) => spellSupportsSelectedClass(spell));
    return [...list].sort((a, b) => {
      const levelDiff = a.level - b.level;
      if (levelDiff !== 0) {
        return levelDiff;
      }
      return a.name.localeCompare(b.name);
    });
  }, [spells, spellSupportsSelectedClass]);

  const sortedSpells = useMemo(() => {
    return [...spells].sort((a, b) => {
      const levelDiff = a.level - b.level;
      if (levelDiff !== 0) {
        return levelDiff;
      }
      return a.name.localeCompare(b.name);
    });
  }, [spells]);

  const eligibleSpellsByLevel = useMemo(() => {
    const bucket = new Map<number, Spell[]>();
    eligibleSpells.forEach((spell) => {
      const list = bucket.get(spell.level) ?? [];
      list.push(spell);
      bucket.set(spell.level, list);
    });
    return bucket;
  }, [eligibleSpells]);

  const normalizedClassId = normalizedSelectedClass;

  const flowMode: SpellFlowMode = useMemo(() => {
    if (!normalizedClassId) {
      return 'none';
    }
    if (SCRIBE_FLOW_CLASSES.has(normalizedClassId)) {
      return 'scribe';
    }
    if (PREPARED_FLOW_CLASSES.has(normalizedClassId)) {
      return 'prepared';
    }
    if (KNOWN_FLOW_CLASSES.has(normalizedClassId)) {
      return 'known';
    }
    return 'none';
  }, [normalizedClassId]);

  const cantripSelectionEnabled = normalizedClassId ? CANTRIP_ELIGIBLE_CLASSES.has(normalizedClassId) : false;
  const leveledSelectionEnabled = flowMode === 'known' || flowMode === 'scribe';
  const showPreparedSection = flowMode === 'prepared';
  const autoSyncPrepared = flowMode === 'known';

  const knownBreakdown = useMemo(() => {
    const cantrips: string[] = [];
    const leveled: string[] = [];
    knownTrackedIds.forEach((id) => {
      const detail = spellDetails[id];
      if (detail?.level === 0) {
        cantrips.push(id);
      } else if (detail?.level !== undefined) {
        leveled.push(id);
      } else {
        // Unknown level defaults to leveled for conservative caps
        leveled.push(id);
      }
    });
    return { cantrips, leveled };
  }, [knownTrackedIds, spellDetails]);

  const cantripKnownCount = knownBreakdown.cantrips.length;
  const leveledKnownCount = knownBreakdown.leveled.length;

  const emptyStateMessage = useMemo(() => {
    if (!data.selectedClass) {
      return 'Select a class to view its spell list.';
    }

    const activeFilters: string[] = [];
    const trimmedSearch = searchTerm.trim();
    if (trimmedSearch) {
      activeFilters.push(`matching "${trimmedSearch}"`);
    }
    if (level !== 'all') {
      activeFilters.push(level === 0 ? 'cantrips' : `${formatLevel(level)} spells`);
    }
    if (school !== 'all') {
      activeFilters.push(`${getSchoolLabel(school)} spells`);
    }
    if (ritual !== 'any') {
      activeFilters.push(ritual === 'ritual' ? 'ritual spells only' : 'non-ritual spells');
    }
    if (concentration !== 'any') {
      activeFilters.push(concentration === 'conc' ? 'spells requiring concentration' : 'spells without concentration');
    }

    if (activeFilters.length === 0) {
      return 'No spells match your current filters.';
    }
    const last = activeFilters[activeFilters.length - 1];
    const initial = activeFilters.slice(0, Math.max(activeFilters.length - 1, 0));
    const joined = initial.length ? `${initial.join(', ')} and ${last}` : last;
    return `No spells match ${joined}.`;
  }, [data.selectedClass, searchTerm, level, school, ritual, concentration]);

  const cantripMax = spellMeta?.cantripMax ?? null;
  const leveledMax = !spellMeta || flowMode === 'prepared' ? null : spellMeta.knownMax;
  const preparedMax = showPreparedSection ? spellMeta?.preparedMax ?? null : null;

  const cantripOverflow = cantripMax !== null && cantripKnownCount > cantripMax;
  const leveledOverflow = leveledMax !== null && leveledKnownCount > leveledMax;
  const preparedOverflow =
    showPreparedSection && preparedMax !== null && preparedTrackedIds.length > preparedMax;

  const preparedSlotCount = useMemo(() => {
    if (!showPreparedSection) {
      return 0;
    }
    const maxSlots = preparedMax ?? 0;
    return Math.max(maxSlots, editablePreparedIds.length, 1);
  }, [showPreparedSection, preparedMax, editablePreparedIds.length]);

  const [preparedSelections, setPreparedSelections] = useState<string[]>(() => []);

  useEffect(() => {
    if (!showPreparedSection) {
      setPreparedSelections([]);
      return;
    }

    setPreparedSelections((current) => {
      const next = [...editablePreparedIds];
      while (next.length < preparedSlotCount) {
        next.push(current[next.length] ?? '');
      }
      return next;
    });
  }, [editablePreparedIds, preparedSlotCount, showPreparedSection]);

  useEffect(() => {
    onValidityChange(true);
  }, [onValidityChange]);

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
          known: Array.from(new Set(nextKnown)),
          prepared: Array.from(new Set(nextPrepared)),
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
    (spell: Spell, willKnow: boolean) => {
      const spellId = normaliseSpellId(spell.id);
      const isCantrip = spell.level === 0;

      if (!isCantrip && flowMode === 'prepared' && willKnow) {
        return;
      }

      if (!cantripSelectionEnabled && isCantrip && willKnow) {
        return;
      }

      if (!leveledSelectionEnabled && !isCantrip && willKnow) {
        return;
      }

      const nextKnownSet = new Set(knownSet);
      const nextPreparedSet = new Set(preparedSet);

      if (willKnow) {
        nextKnownSet.add(spellId);
        if (autoSyncPrepared) {
          nextPreparedSet.add(spellId);
        }
      } else {
        nextKnownSet.delete(spellId);
        if (autoSyncPrepared) {
          nextPreparedSet.delete(spellId);
        }
      }

      const nextKnown = Array.from(nextKnownSet);
      const nextPrepared = autoSyncPrepared
        ? Array.from(nextPreparedSet)
        : Array.from(preparedSet);

      onUpdate({ spellbook: { known: nextKnown, prepared: nextPrepared } });
      void persistChanges(nextKnown, nextPrepared);
    },
    [
      knownSet,
      preparedSet,
      autoSyncPrepared,
      flowMode,
      cantripSelectionEnabled,
      leveledSelectionEnabled,
      onUpdate,
      persistChanges,
    ]
  );

  const applyPreparedChange = useCallback(
    (spellId: string, willPrepare: boolean) => {
      if (!showPreparedSection) {
        return;
      }

      const detail = spellDetails[spellId];
      if (detail && detail.level === 0) {
        return;
      }

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
    [preparedSet, knownSet, onUpdate, persistChanges, showPreparedSection, spellDetails]
  );

  const handlePreparedSlotChange = useCallback(
    (slotIndex: number, spellId: string) => {
      if (!showPreparedSection) {
        return;
      }

      const detail = spellDetails[spellId];
      if (detail && detail.level === 0) {
        return;
      }

      setPreparedSelections((current) => {
        const selected = spellId.trim();
        const nextSelections = [...current];
        nextSelections[slotIndex] = selected;

        const sanitized = nextSelections
          .map((value) => value?.trim() ?? '')
          .filter((value) => value.length > 0);

        const uniqueSelectable = Array.from(new Set(sanitized));
        const nextPrepared = [...grantedPreparedIds, ...uniqueSelectable];
        const nextKnown = Array.from(knownSet);

        onUpdate({ spellbook: { known: nextKnown, prepared: nextPrepared } });
        void persistChanges(nextKnown, nextPrepared);

        return nextSelections;
      });
    },
    [grantedPreparedIds, knownSet, onUpdate, persistChanges, showPreparedSection, spellDetails]
  );

  useEffect(() => {
    if (!autoSyncPrepared) {
      return;
    }

    const desiredPrepared = new Set([...grantedPreparedIds, ...knownIds]);
    const currentPrepared = new Set(preparedIds);

    let changed = desiredPrepared.size !== currentPrepared.size;
    if (!changed) {
      desiredPrepared.forEach((id) => {
        if (!currentPrepared.has(id)) {
          changed = true;
        }
      });
    }
    if (!changed) {
      currentPrepared.forEach((id) => {
        if (!desiredPrepared.has(id)) {
          changed = true;
        }
      });
    }

    if (!changed) {
      return;
    }

    const nextKnown = Array.from(new Set(knownIds));
    const nextPrepared = Array.from(desiredPrepared);
    onUpdate({ spellbook: { known: nextKnown, prepared: nextPrepared } });
    void persistChanges(nextKnown, nextPrepared);
  }, [
    autoSyncPrepared,
    grantedPreparedIds,
    knownIds,
    preparedIds,
    onUpdate,
    persistChanges,
  ]);

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

  const stepDescription = useMemo(() => {
    if (!data.selectedClass) {
      return 'Select a class to configure spells.';
    }
    const suffix = ' Granted spells are listed separately and never count against your limits.';
    switch (flowMode) {
      case 'scribe':
        return `Add spells to your spellbook. You will prepare spells later from this list.${suffix}`;
      case 'prepared':
        return `Choose your cantrips and set the spells you start the game prepared with.${suffix}`;
      case 'known':
        return `Choose spells to learn. Prepared spells stay in sync with this list.${suffix}`;
      default:
        return `Review spells granted by your other choices.${suffix}`;
    }
  }, [flowMode, data.selectedClass]);

  const renderSpellCard = (spell: Spell) => {
    const spellId = normaliseSpellId(spell.id);
    const isGranted = grantedSet.has(spellId);
    const isKnown = knownSet.has(spellId);
    const isPrepared = preparedSet.has(spellId);
    const miscTags = spell.miscTags ?? [];
    const isRitualSpell = (typeof spell.isRitual === 'boolean' ? spell.isRitual : undefined) ??
      miscTags.some((tag) => tag.toLowerCase() === 'ritual');
    const isConcentrationSpell = miscTags.some((tag) => tag.toLowerCase() === 'concentration');
    const isForClass = spellSupportsSelectedClass(spell);
    const isCantrip = spell.level === 0;

    const knownInteractionAllowed = isCantrip ? cantripSelectionEnabled : leveledSelectionEnabled;

    let showKnownButton = knownInteractionAllowed || isKnown;
    if (!isCantrip && flowMode === 'prepared' && !isKnown) {
      showKnownButton = false;
    }
    if (isCantrip && !cantripSelectionEnabled && !isKnown) {
      showKnownButton = false;
    }

    const cantripCapReached = cantripMax !== null && cantripKnownCount >= cantripMax && !isKnown;
    const leveledCapReached = leveledMax !== null && leveledKnownCount >= leveledMax && !isKnown;
    const knownAtCapacity = isCantrip ? cantripCapReached : leveledCapReached;

    const disableKnown =
      isGranted ||
      !isForClass ||
      (!isKnown && (!knownInteractionAllowed || knownAtCapacity));

    const knownTooltip = (() => {
      if (!showKnownButton) {
        return undefined;
      }
      if (isGranted) return 'Granted automatically';
      if (!isForClass) return 'Not available to your class';
      if (!knownInteractionAllowed && !isKnown) {
        if (isCantrip && !cantripSelectionEnabled) {
          return 'This class does not learn cantrips';
        }
        if (!isCantrip && flowMode === 'prepared') {
          return 'This class automatically knows leveled spells';
        }
      }
      if (knownAtCapacity) {
        if (isCantrip) {
          return 'No cantrip slots remaining';
        }
        return flowMode === 'scribe'
          ? 'No spellbook slots remaining'
          : 'No known spell slots remaining';
      }
      return undefined;
    })();

    const knownLabel = (() => {
      if (isCantrip) {
        return isKnown ? 'Remove Cantrip' : 'Add Cantrip';
      }
      if (flowMode === 'scribe') {
        return isKnown ? 'Remove from Spellbook' : 'Add to Spellbook';
      }
      return isKnown ? 'Remove Known' : 'Add Known';
    })();

    const showPreparedButton = showPreparedSection && spell.level > 0;
    const preparedAtCapacity =
      showPreparedButton && preparedMax !== null && preparedTrackedIds.length >= preparedMax && !isPrepared;

    const disablePrepared =
      !showPreparedButton ||
      isGranted ||
      !isForClass ||
      (preparedAtCapacity && !isPrepared);

    const preparedTooltip = (() => {
      if (!showPreparedButton) {
        return undefined;
      }
      if (isGranted) return 'Granted automatically';
      if (!isForClass) return 'Not available to your class';
      if (preparedAtCapacity && !isPrepared) return 'No prepared spell slots remaining';
      return undefined;
    })();

    const actions: JSX.Element[] = [];
    if (showKnownButton) {
      actions.push(
        <ActionButton
          key="known"
          $variant={isKnown ? 'danger' : 'primary'}
          disabled={disableKnown}
          title={knownTooltip}
          onClick={() => applyKnownChange(spell, !isKnown)}
        >
          {knownLabel}
        </ActionButton>
      );
    }
    if (showPreparedButton) {
      actions.push(
        <ActionButton
          key="prepared"
          $variant={isPrepared ? 'danger' : 'secondary'}
          disabled={disablePrepared}
          title={preparedTooltip}
          onClick={() => applyPreparedChange(spellId, !isPrepared)}
        >
          {isPrepared ? 'Unprepare' : 'Prepare'}
        </ActionButton>
      );
    }

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
          {!isForClass && <Tag $kind="error">Unavailable</Tag>}
        </SpellMeta>
        {actions.length > 0 && (
          <ActionRow onClick={(event) => event.stopPropagation()}>
            {actions}
          </ActionRow>
        )}
      </SpellCard>
    );
  };

  const cantripSpells = sortedSpells.filter((spell) => spell.level === 0);
  const leveledSpells = sortedSpells.filter((spell) => spell.level > 0);

  const totalPages = Math.max(1, Math.ceil(leveledSpells.length / spellsPerPage));
  const paginatedLeveledSpells = leveledSpells.slice(
    (currentPage - 1) * spellsPerPage,
    currentPage * spellsPerPage
  );

  const cantripCards = cantripSpells.map((spell) => renderSpellCard(spell));
  const leveledCards = paginatedLeveledSpells.map((spell) => renderSpellCard(spell));

  useEffect(() => {
    setCurrentPage(1);
  }, [level, school, ritual, concentration, searchTerm]);

  return (
    <StepContainer>
      <div className="step-title">Spell Selection</div>
      <div className="step-description">
        {stepDescription}
      </div>

      <CounterBar>
        {cantripSelectionEnabled && (
          <CounterPill $invalid={cantripOverflow}>
            Cantrips: {cantripKnownCount}
            {cantripMax !== null && ` / ${cantripMax}`}
          </CounterPill>
        )}
        {flowMode !== 'prepared' && flowMode !== 'none' && (
          <CounterPill $invalid={leveledOverflow}>
            {flowMode === 'scribe' ? 'Spellbook' : 'Known Spells'}: {leveledKnownCount}
            {leveledMax !== null && ` / ${leveledMax}`}
          </CounterPill>
        )}
        {showPreparedSection && (
          <CounterPill $invalid={preparedOverflow}>
            Prepared Spells: {preparedTrackedIds.length}
            {preparedMax !== null && ` / ${preparedMax}`}
          </CounterPill>
        )}
        {isSaving && <CounterPill>Saving…</CounterPill>}
      </CounterBar>

      {showPreparedSection && preparedSlotCount > 0 && (
        <PreparedSection>
          <PreparedHeader>
            <h2>Prepare Spells</h2>
            <span>
              Choose up to {preparedSlotCount} spell{preparedSlotCount === 1 ? '' : 's'} to have ready.
            </span>
          </PreparedHeader>
          {eligibleSpells.length === 0 ? (
            <EmptyState>
              Load class spells with the filters above, then assign prepared spells here.
            </EmptyState>
          ) : (
            <PreparedRows>
              {Array.from({ length: preparedSlotCount }).map((_, index) => {
                const selectedValue = preparedSelections[index] ?? '';
                const selectedElsewhere = new Set(
                  preparedSelections
                    .map((value, idx) => (idx === index ? '' : value?.trim() ?? ''))
                    .filter((value) => value.length > 0)
                );
                const levelEntries = Array.from(eligibleSpellsByLevel.entries())
                  .filter(([levelKey]) => levelKey > 0)
                  .sort(([levelA], [levelB]) => levelA - levelB);

                return (
                  <PreparedRow key={`prepared-slot-${index}`}>
                    <label>Prepared Spell {index + 1}</label>
                    <PreparedSelect
                      value={selectedValue}
                      onChange={(event) => handlePreparedSlotChange(index, event.target.value)}
                    >
                      <option value="">-- Select a spell --</option>
                      {levelEntries.map(([levelKey, spellsForLevel]) => (
                        <optgroup key={`group-${levelKey}`} label={`LEVEL ${levelKey}`}>
                          {spellsForLevel.map((spell) => {
                            const spellId = normaliseSpellId(spell.id);
                            const disabled = selectedElsewhere.has(spellId);
                            return (
                              <option key={spellId} value={spellId} disabled={disabled}>
                                {spell.name}
                              </option>
                            );
                          })}
                        </optgroup>
                      ))}
                    </PreparedSelect>
                  </PreparedRow>
                );
              })}
            </PreparedRows>
          )}
        </PreparedSection>
      )}

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
              const detail = spellDetails[spellId];
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
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </FilterGroup>
        <FilterGroup>
          <span>Level</span>
          <select
            value={String(level)}
            onChange={(event) => {
              const value = event.target.value;
              setLevel(value === 'all' ? 'all' : (Number(value) as LevelFilter));
            }}
          >
            {LEVEL_OPTIONS.map(({ label, value }) => (
              <option key={value} value={String(value)}>
                {label}
              </option>
            ))}
          </select>
        </FilterGroup>
        <FilterGroup>
          <span>School</span>
          <select
            value={school}
            onChange={(event) => setSchool(event.target.value)}
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
            value={ritual}
            onChange={(event) => setRitual(event.target.value as RitualFilter)}
          >
            <option value="any">Any</option>
            <option value="ritual">Ritual Only</option>
            <option value="non">Non-Ritual</option>
          </select>
        </FilterGroup>
        <FilterGroup>
          <span>Concentration</span>
          <select
            value={concentration}
            onChange={(event) => setConcentration(event.target.value as ConcentrationFilter)}
          >
            <option value="any">Any</option>
            <option value="conc">Requires Concentration</option>
            <option value="non">No Concentration</option>
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
          Error loading spells: {spellError}
        </StatusBanner>
      )}

      {isLoadingSpells ? (
        <LoadingSpinner message="Loading spells..." />
      ) : cantripCards.length === 0 && leveledCards.length === 0 ? (
        <EmptyState>{emptyStateMessage}</EmptyState>
      ) : (
        <>
          {cantripCards.length > 0 && (
            <SpellSection>
              <SectionHeading>Cantrips</SectionHeading>
              <SpellGrid>{cantripCards}</SpellGrid>
            </SpellSection>
          )}
          {leveledCards.length > 0 && (
            <SpellSection>
              <SectionHeading>
                Leveled Spells ({leveledSpells.length} total)
              </SectionHeading>
              <SpellGrid>{leveledCards}</SpellGrid>
              {totalPages > 1 && (
                <PaginationContainer>
                  <PaginationButton
                    $disabled={currentPage === 1}
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  >
                    ← Previous
                  </PaginationButton>
                  <PageInfo>
                    Page {currentPage} of {totalPages}
                  </PageInfo>
                  <PaginationButton
                    $disabled={currentPage === totalPages}
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  >
                    Next →
                  </PaginationButton>
                </PaginationContainer>
              )}
            </SpellSection>
          )}
        </>
      )}

      {selectedSpell && (
        <ModalBackdrop role="dialog" aria-modal="true" onClick={() => setSelectedSpell(null)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalClose aria-label="Close" onClick={() => setSelectedSpell(null)}>
              ×
            </ModalClose>
            <h2>{selectedSpell.name}</h2>
            <p style={{ color: '#c0aa70', marginBottom: '1rem' }}>
              {formatLevel(selectedSpell.level)} &bull; {getSchoolLabel(selectedSpell.school)}
              {selectedSpell.isRitual ? ' • Ritual' : ''}
              {selectedSpell.miscTags?.includes('Concentration') ? ' • Concentration' : ''}
            </p>
            {Array.isArray(selectedSpell.entries) && selectedSpell.entries.length > 0 ? (
              <div dangerouslySetInnerHTML={{ __html: parseComplexDnDEntry(selectedSpell.entries) }} />
            ) : (
              <p>No additional description available.</p>
            )}
          </ModalCard>
        </ModalBackdrop>
      )}
    </StepContainer>
  );
};
