import { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import type { CharacterSheetData, CharacterAction } from '../types/characterSheet';
import type { Spell } from '@/types/api';
import { getSpellById } from '@/services/spellService';
import { isError } from '@/types/api';
import { getCantripCount, getPreparedCount, usesSpellbook } from '@/helpers/spellRules';
import { CLASS_CONFIG, normalizeClassId } from '@/helpers/spellcastingConfig';
import { logger } from '@/utils/logger';
import {
  useSpellLibraryStore,
  selectClassSpells,
  selectClassStatus,
} from '@/store/spellLibraryStore';
import { calculateModifier } from '../types/characterSheet';
import WizardModal from './wizard/WizardModal';
import { SpellDetailModal } from './spells/SpellDetailModal';
import { buildSpellAction } from '@/utils/spellActionBuilder';

interface CharacterSpellsSectionProps {
  character: CharacterSheetData;
  onUpdateCharacter: (updates: Partial<CharacterSheetData>) => void;
  actions: {
    addAction: (action: CharacterAction) => void;
    removeActionByName: (name: string) => void;
    hasAction: (name: string) => boolean;
  };
}

interface PreparedSpellsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classLabel: string;
  limit: number | null;
  currentPrepared: string[];
  grantedPrepared: string[];
  availableSpells: Array<{ id: string; spell: Spell | null }>;
  spellLookup: Record<string, Spell | null>;
  isLoading: boolean;
  error?: string | undefined;
  onSave: (selectedIds: string[]) => void;
}

type SpellbookData = {
  known: string[];
  prepared?: string[];
  cantrips?: string[];
  wizardSpellbook?: string[];
};

const abilityKeyToScore: Record<string, keyof CharacterSheetData['abilityScores']> = {
  int: 'intelligence',
  wis: 'wisdom',
  cha: 'charisma',
};

const SPELL_ID_PATTERN = /^\d+$/;
const normaliseSpellId = (value: unknown): string | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return SPELL_ID_PATTERN.test(trimmed) ? trimmed : null;
  }
  return null;
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
    $variant === 'warning' ? 'rgba(244, 67, 54, 0.12)' : 'rgba(206, 144, 22, 0.12)'};
  border: 1px solid ${({ $variant }) =>
    $variant === 'warning' ? 'rgba(244, 67, 54, 0.35)' : 'rgba(206, 144, 22, 0.35)'};
  border-radius: 999px;
  padding: 0.5rem 1rem;
  color: ${({ $variant }) =>
    $variant === 'warning' ? '#f76b5c' : '#ce9016'};
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.3px;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
`;

const Section = styled.section`
  background: rgba(26, 26, 26, 0.65);
  border: 1px solid rgba(206, 144, 22, 0.25);
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;

  h3 {
    margin: 0;
    font-size: 1rem;
    color: #ce9016;
    font-family: 'Cinzel', serif;
    letter-spacing: 0.6px;
    text-transform: uppercase;
  }

  span {
    font-size: 0.8rem;
    color: rgba(206, 144, 22, 0.7);
  }
`;

const SectionHeaderText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const ManageButton = styled.button<{ disabled?: boolean }>`
  background: ${({ disabled }) =>
    disabled
      ? 'rgba(120, 120, 120, 0.4)'
      : 'linear-gradient(145deg, rgba(206, 144, 22, 0.32), rgba(206, 144, 22, 0.18))'};
  border: 1px solid ${({ disabled }) => (disabled ? 'rgba(120, 120, 120, 0.6)' : 'rgba(206, 144, 22, 0.5)')};
  color: ${({ disabled }) => (disabled ? '#bbb' : '#f3e7c8')};
  border-radius: 999px;
  padding: 0.4rem 0.95rem;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.4px;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s ease;

  &:hover {
    ${({ disabled }) =>
      !disabled &&
      `
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(206, 144, 22, 0.35);
      `}
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
      $granted ? 'rgba(108, 198, 255, 0.4)' : $prepared ? 'rgba(125, 225, 125, 0.45)' : 'rgba(206, 144, 22, 0.25)'};
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
    cursor: pointer;
    transition: color 0.2s ease;

    &:hover {
      color: #ce9016;
    }
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
      : '#ce9016'};
  border: 1px solid ${({ $tone }) =>
    $tone === 'prepared'
      ? 'rgba(125, 225, 125, 0.6)'
      : $tone === 'granted'
      ? 'rgba(108, 198, 255, 0.6)'
      : $tone === 'cantrip'
      ? 'rgba(244, 199, 106, 0.6)'
      : 'rgba(206, 144, 22, 0.5)'};
  background: ${({ $tone }) =>
    $tone === 'prepared'
      ? 'rgba(125, 225, 125, 0.12)'
      : $tone === 'granted'
      ? 'rgba(108, 198, 255, 0.12)'
      : $tone === 'cantrip'
      ? 'rgba(244, 199, 106, 0.12)'
      : 'rgba(206, 144, 22, 0.1)'};
`;

const SpellMetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  font-size: 0.78rem;
  color: rgba(228, 220, 200, 0.85);
`;

const CardActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.35rem;
`;

const CardButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  border-radius: 8px;
  border: 1px solid
    ${({ $variant }) =>
      $variant === 'danger'
        ? 'rgba(220, 53, 69, 0.55)'
        : $variant === 'secondary'
        ? 'rgba(206, 144, 22, 0.35)'
        : 'rgba(125, 225, 125, 0.45)'};
  padding: 0.35rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.35px;
  cursor: pointer;
  color: ${({ $variant }) =>
    $variant === 'danger'
      ? '#ff9c9c'
      : $variant === 'secondary'
      ? '#f8f4e1'
      : '#dfffd7'};
  background: ${({ $variant }) =>
    $variant === 'danger'
      ? 'rgba(220, 53, 69, 0.18)'
      : $variant === 'secondary'
      ? 'rgba(35, 35, 35, 0.68)'
      : 'rgba(125, 225, 125, 0.18)'};
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
  }
`;

const EmptyState = styled.div`
  padding: 1rem;
  text-align: center;
  font-size: 0.9rem;
  color: rgba(206, 144, 22, 0.8);
  border: 1px dashed rgba(206, 144, 22, 0.25);
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

const ModalColumns = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.25rem;
`;

const ModalSection = styled.div`
  background: rgba(18, 18, 18, 0.78);
  border: 1px solid rgba(206, 144, 22, 0.2);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 420px;
`;

const ModalSectionTitle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5rem;

  h4 {
    margin: 0;
    font-size: 0.95rem;
    font-family: 'Cinzel', serif;
    color: #ce9016;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }

  span {
    font-size: 0.75rem;
    color: rgba(206, 144, 22, 0.75);
  }
`;

const ModalList = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(206, 144, 22, 0.4);
    border-radius: 4px;
  }
`;

const ModalListItem = styled.button<{ $variant?: 'default' | 'danger' }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.65rem;
  border-radius: 8px;
  border: 1px solid
    ${({ $variant }) =>
      $variant === 'danger' ? 'rgba(244, 67, 54, 0.45)' : 'rgba(206, 144, 22, 0.35)'};
  background: ${({ $variant }) =>
    $variant === 'danger' ? 'rgba(244, 67, 54, 0.15)' : 'rgba(35, 35, 35, 0.75)'};
  color: #f0f0f0;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.35);
  }

  .spell-label {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.2rem;

    strong {
      font-size: 0.85rem;
      letter-spacing: 0.3px;
    }

    span {
      font-size: 0.7rem;
      color: rgba(206, 144, 22, 0.7);
    }
  }
`;

const GrantedInfo = styled.div`
  background: rgba(108, 198, 255, 0.12);
  border: 1px solid rgba(108, 198, 255, 0.4);
  border-radius: 10px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.78rem;
  color: #d0edff;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.45rem 0.65rem;
  border-radius: 8px;
  border: 1px solid rgba(206, 144, 22, 0.3);
  background: rgba(12, 12, 12, 0.75);
  color: #f3f3f3;
  font-size: 0.8rem;

  &:focus {
    outline: none;
    border-color: rgba(206, 144, 22, 0.6);
    box-shadow: 0 0 0 2px rgba(206, 144, 22, 0.15);
  }
`;

const ModalFooterActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
`;

const FooterButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  border-radius: 999px;
  padding: 0.5rem 1.35rem;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.4px;
  cursor: pointer;
  border: 1px solid
    ${({ $variant }) =>
      $variant === 'primary' ? 'rgba(206, 144, 22, 0.55)' : 'rgba(206, 144, 22, 0.35)'};
  background: ${({ $variant }) =>
    $variant === 'primary'
      ? 'linear-gradient(145deg, rgba(206, 144, 22, 0.42), rgba(206, 144, 22, 0.26))'
      : 'rgba(35, 35, 35, 0.72)'};
  color: ${({ $variant }) => ($variant === 'primary' ? '#f8f4e1' : '#f0e1b8')};
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.35);
  }
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

const getSchoolLabel = (schoolOrCode?: string | { code: string; name: string } | null) => {
  if (!schoolOrCode) return 'Unknown School';

  // Extract code from string or object
  let school: string;
  if (typeof schoolOrCode === 'string') {
    school = schoolOrCode;
  } else if (typeof schoolOrCode === 'object' && 'code' in schoolOrCode) {
    school = schoolOrCode.code;
  } else {
    return 'Unknown School';
  }

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

const PreparedSpellsModal = ({
  isOpen,
  onClose,
  classLabel,
  limit,
  currentPrepared,
  grantedPrepared,
  availableSpells,
  spellLookup,
  isLoading,
  error,
  onSave,
}: PreparedSpellsModalProps) => {
  const [selected, setSelected] = useState<string[]>(currentPrepared);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelected(currentPrepared);
      setSearchTerm('');
    }
  }, [isOpen, currentPrepared]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const grantedSet = useMemo(() => new Set(grantedPrepared), [grantedPrepared]);

  const limitReached = limit !== null && selected.length >= limit;

  const availableList = useMemo(() => {
    const items = availableSpells
      .filter(({ id }) => !selectedSet.has(id) && !grantedSet.has(id))
      .map(({ id, spell }) => ({
        id,
        spell,
        level: spell?.level ?? 0,
        name: spell?.name ?? `Spell #${id}`,
      }));

    const searchValue = searchTerm.trim().toLowerCase();
    const filtered = searchValue
      ? items.filter((entry) =>
          entry.name.toLowerCase().includes(searchValue) ||
          formatLevelLabel(entry.level).toLowerCase().includes(searchValue)
        )
      : items;

    return filtered.sort((a, b) => {
      const levelDiff = (a.level ?? 0) - (b.level ?? 0);
      if (levelDiff !== 0) {
        return levelDiff;
      }
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
  }, [availableSpells, selectedSet, grantedSet, searchTerm]);

  const selectedList = useMemo(() => {
    return selected
      .map((id) => {
        const spell = spellLookup[id];
        return {
          id,
          spell,
          level: spell?.level ?? 0,
          name: spell?.name ?? `Spell #${id}`,
        };
      })
      .sort((a, b) => {
        const levelDiff = (a.level ?? 0) - (b.level ?? 0);
        if (levelDiff !== 0) {
          return levelDiff;
        }
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      });
  }, [selected, spellLookup]);

  const grantedList = useMemo(() => {
    return grantedPrepared
      .map((id) => {
        const spell = spellLookup[id];
        return {
          id,
          spell,
          level: spell?.level ?? 0,
          name: spell?.name ?? `Spell #${id}`,
        };
      })
      .sort((a, b) => {
        const levelDiff = (a.level ?? 0) - (b.level ?? 0);
        if (levelDiff !== 0) {
          return levelDiff;
        }
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      });
  }, [grantedPrepared, spellLookup]);

  const handleAdd = (id: string) => {
    if (selectedSet.has(id)) return;
    if (limit !== null && selected.length >= limit) return;
    setSelected((prev) => [...prev, id]);
  };

  const handleRemove = (id: string) => {
    setSelected((prev) => prev.filter((spellId) => spellId !== id));
  };

  const handleSave = () => {
    onSave(selected);
    onClose();
  };

  const footer = (
    <ModalFooterActions>
      <FooterButton onClick={onClose}>Cancel</FooterButton>
      <FooterButton $variant="primary" onClick={handleSave}>
        Save Prepared Spells
      </FooterButton>
    </ModalFooterActions>
  );

  return (
    <WizardModal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Prepared Spells"
      subtitle={
        limit !== null
          ? `You can prepare up to ${limit} non-granted spells. Granted spells do not count against this limit.`
          : `Manage which spells you have prepared. Granted spells are always prepared.`
      }
      maxWidth="960px"
      footer={footer}
    >
      <ModalColumns>
        <ModalSection>
          <ModalSectionTitle>
            <h4>Prepared Spells</h4>
            <span>
              {selected.length}
              {limit !== null ? ` / ${limit}` : ''}
            </span>
          </ModalSectionTitle>
          <ModalList>
            {selectedList.length === 0 ? (
              <EmptyState>No prepared spells selected.</EmptyState>
            ) : (
              selectedList.map(({ id, name, level }) => (
                <ModalListItem
                  key={id}
                  $variant="danger"
                  onClick={() => handleRemove(id)}
                >
                  <div className="spell-label">
                    <strong>{name}</strong>
                    <span>{formatLevelLabel(level)}</span>
                  </div>
                  <span>Remove</span>
                </ModalListItem>
              ))
            )}
          </ModalList>

          {grantedList.length > 0 && (
            <GrantedInfo>
              <strong>Granted & Always Prepared</strong>
              {grantedList.map(({ id, name, level }) => (
                <div key={id}>
                  {name} — {formatLevelLabel(level)}
                </div>
              ))}
            </GrantedInfo>
          )}
        </ModalSection>

        <ModalSection>
          <ModalSectionTitle>
            <h4>
              {classLabel ? `${classLabel} Spell List` : 'Available Spells'}
            </h4>
            <span>Add spells to your prepared list</span>
          </ModalSectionTitle>
          <SearchInput
            type="search"
            value={searchTerm}
            placeholder="Search spells by name or level…"
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <ModalList>
            {isLoading ? (
              <LoadingMessage>Loading spells…</LoadingMessage>
            ) : error ? (
              <EmptyState>{error}</EmptyState>
            ) : availableList.length === 0 ? (
              <EmptyState>
                {limit !== null && limitReached
                  ? 'You have prepared the maximum number of spells.'
                  : 'No additional spells available.'}
              </EmptyState>
            ) : (
              availableList.map(({ id, name, level }) => (
                <ModalListItem
                  key={id}
                  onClick={() => handleAdd(id)}
                  disabled={limit !== null && limitReached}
                >
                  <div className="spell-label">
                    <strong>{name}</strong>
                    <span>{formatLevelLabel(level)}</span>
                  </div>
                  <span>{limit !== null && limitReached ? 'Limit Reached' : 'Add'}</span>
                </ModalListItem>
              ))
            )}
          </ModalList>
        </ModalSection>
      </ModalColumns>
    </WizardModal>
  );
};

export function CharacterSpellsSection({
  character,
  onUpdateCharacter,
  actions,
}: CharacterSpellsSectionProps) {
  const rawSpellbook = character.spellbook as SpellbookData | undefined;
  const spellbook: SpellbookData = rawSpellbook
    ? {
        known: rawSpellbook.known ?? [],
        prepared: rawSpellbook.prepared ?? [],
        cantrips: rawSpellbook.cantrips ?? [],
        wizardSpellbook: rawSpellbook.wizardSpellbook ?? [],
      }
    : { known: [], prepared: [], cantrips: [], wizardSpellbook: [] };

  const knownIds = useMemo(
    () => (spellbook.known ?? []).map((id) => String(id)),
    [spellbook.known]
  );
  const preparedIds = useMemo(
    () => (spellbook.prepared ?? []).map((id) => String(id)),
    [spellbook.prepared]
  );
  const cantripBaseIds = useMemo(
    () => (spellbook.cantrips ?? []).map((id) => String(id)),
    [spellbook.cantrips]
  );
  const wizardSpellbookIds = useMemo(
    () => (spellbook.wizardSpellbook ?? []).map((id) => String(id)),
    [spellbook.wizardSpellbook]
  );

  const speciesTraits = (character.features?.speciesTraits ?? character.speciesTraits ?? []) as unknown[];
  const featFeatureEntries = (character.features?.feats ?? []) as unknown[];

  const featSpellSources = useMemo(
    () =>
      Object.values(character.featSpells ?? {})
        .filter((spells) => Array.isArray(spells) && spells.length > 0)
        .map((spells) => ({ grantedSpells: spells })),
    [character.featSpells]
  );

  const speciesSource = useMemo(() => {
    const spellIds: string[] = [];

    // Extract spell IDs from species traits that have grantedSpells metadata
    for (const trait of speciesTraits) {
      if (trait && typeof trait === 'object' && 'grantedSpells' in trait) {
        const traitSpells = (trait as any).grantedSpells;
        if (Array.isArray(traitSpells)) {
          spellIds.push(...traitSpells.filter((id: any) => typeof id === 'string' || typeof id === 'number').map(String));
        }
      }
    }

    // Include direct species granted spells (Rock Gnome, Drow, etc.)
    if (character.speciesGrantedSpells && Array.isArray(character.speciesGrantedSpells)) {
      spellIds.push(...character.speciesGrantedSpells);
    }

    // Also check spellbook.grantedSpells for species-granted spells
    if (character.spellbook?.grantedSpells && Array.isArray(character.spellbook.grantedSpells)) {
      spellIds.push(...character.spellbook.grantedSpells);
    }

    // Return as simple array of spell IDs wrapped in grantedSpells object
    return spellIds.length > 0 ? ({ grantedSpells: spellIds } as unknown) : undefined;
  }, [speciesTraits, character.speciesGrantedSpells, character.spellbook?.grantedSpells]);

  const featSources = useMemo(() => {
    const combined = [...featSpellSources, ...featFeatureEntries];
    return combined.length > 0 ? (combined as unknown[]) : undefined;
  }, [featFeatureEntries, featSpellSources]);

  const grantedIds = useMemo(() => {
    const grantedSpellIds: string[] = [];

    // 1. Primary source: spellbook.grantedSpells (most reliable, set during character creation)
    if (character.spellbook?.grantedSpells && Array.isArray(character.spellbook.grantedSpells)) {
        character.spellbook.grantedSpells.forEach((id) => {
          const normalised = normaliseSpellId(id);
          if (normalised) {
            grantedSpellIds.push(normalised);
          }
        });
    }

    // 2. Direct species grants (Rock Gnome, Drow, etc.)
    if (character.speciesGrantedSpells && Array.isArray(character.speciesGrantedSpells)) {
      character.speciesGrantedSpells.forEach((id) => {
        const normalised = normaliseSpellId(id);
        if (normalised) {
          grantedSpellIds.push(normalised);
        }
      });
    }

    // 3. Extract from species traits with explicit grantedSpells metadata
    if (speciesSource && typeof speciesSource === 'object' && 'grantedSpells' in speciesSource) {
      const sourceSpells = (speciesSource as any).grantedSpells;
      if (Array.isArray(sourceSpells)) {
        sourceSpells.forEach((id: any) => {
          const normalised = normaliseSpellId(id);
          if (normalised) {
            grantedSpellIds.push(normalised);
          }
        });
      }
    }

    // 4. Extract from feat features with explicit grantedSpells metadata
    for (const feat of featSources || []) {
      if (feat && typeof feat === 'object' && 'grantedSpells' in feat) {
        const featSpells = (feat as any).grantedSpells;
        if (Array.isArray(featSpells)) {
          featSpells.forEach((id: any) => {
            const normalised = normaliseSpellId(id);
            if (normalised) {
              grantedSpellIds.push(normalised);
            }
          });
        }
      }
    }

    // Deduplicate and return
    return Array.from(new Set(grantedSpellIds)).filter((id) => SPELL_ID_PATTERN.test(id));
  }, [character.spellbook?.grantedSpells, character.speciesGrantedSpells, speciesSource, featSources]);

  const grantedSet = useMemo(() => new Set(grantedIds), [grantedIds]);
  const preparedSet = useMemo(() => new Set(preparedIds), [preparedIds]);
  const grantedPreparedIds = useMemo(
    () => grantedIds.filter((id) => preparedSet.has(id)),
    [grantedIds, preparedSet]
  );
  const preparedTrackedIds = useMemo(
    () => preparedIds.filter((id) => !grantedSet.has(id)),
    [preparedIds, grantedSet]
  );

  const normalizedClass = normalizeClassId(character.class ?? '');
  const classConfig = normalizedClass ? CLASS_CONFIG[normalizedClass] : undefined;
  const spellcastingAbilityKey = classConfig?.spellcastingAbility;
  const abilityScore = spellcastingAbilityKey
    ? character.abilityScores[abilityKeyToScore[spellcastingAbilityKey] ?? 'charisma']
    : undefined;
  const characterLevel = Math.max(1, character.level ?? 1);
  const abilityMod = typeof abilityScore === 'number' ? calculateModifier(abilityScore) : 0;

  const cantripMax = classConfig
    ? getCantripCount(normalizedClass, characterLevel)
    : null;
  const preparedLimit = classConfig && classConfig.casterType !== 'none'
    ? getPreparedCount(normalizedClass, characterLevel, abilityMod)
    : null;

  const [spellLookup, setSpellLookup] = useState<Record<string, Spell | null>>({});
  const [isLoadingSpellDetails, setIsLoadingSpellDetails] = useState(false);

  const baseUniqueSpellIds = useMemo(
    () =>
      Array.from(
        new Set([
          ...knownIds,
          ...preparedIds,
          ...grantedIds,
          ...cantripBaseIds,
          ...wizardSpellbookIds,
        ])
      ).filter(Boolean),
    [knownIds, preparedIds, grantedIds, cantripBaseIds, wizardSpellbookIds]
  );

  useEffect(() => {
    if (baseUniqueSpellIds.length === 0) {
      setSpellLookup({});
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const load = async () => {
      setIsLoadingSpellDetails(true);
      try {
        const entries = await Promise.all(
          baseUniqueSpellIds.map(async (spellId) => {
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
            let changed = false;
            entries.forEach(([id, spell]) => {
              if (!next[id]) {
                next[id] = spell;
                changed = true;
              }
            });
            return changed ? next : prev;
          });
          setIsLoadingSpellDetails(false);
        }
      } catch (error) {
        if (!cancelled) {
          logger.error('Unexpected error loading spell details', error);
          setIsLoadingSpellDetails(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [baseUniqueSpellIds]);

  const fetchClassSpells = useSpellLibraryStore((state) => state.fetchClassSpells);
  const classSpellsSelector = useMemo(() => selectClassSpells(normalizedClass), [normalizedClass]);
  const classStatusSelector = useMemo(() => selectClassStatus(normalizedClass), [normalizedClass]);
  const classSpells = useSpellLibraryStore(classSpellsSelector);
  const classSpellStatus = useSpellLibraryStore(classStatusSelector);

  useEffect(() => {
    if (!normalizedClass) return;
    void fetchClassSpells(normalizedClass);
  }, [normalizedClass, fetchClassSpells]);

  useEffect(() => {
    if (!classSpells || classSpells.length === 0) return;

    setSpellLookup((prev) => {
      const next = { ...prev };
      let changed = false;
      classSpells.forEach((spell) => {
        const id = String(spell.id);
        if (!next[id]) {
          next[id] = spell;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [classSpells]);

  const cantripDisplayIds = useMemo(() => {
    if (cantripBaseIds.length > 0) {
      return Array.from(new Set(cantripBaseIds));
    }
    return knownIds.filter((id) => {
      const spell = spellLookup[id];
      return spell?.level === 0;
    });
  }, [cantripBaseIds, knownIds, spellLookup]);

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

  const cantripOverflow = cantripMax !== null && cantripDisplayIds.length > cantripMax;
  const preparedOverflow = preparedLimit !== null && preparedTrackedIds.length > preparedLimit;

  const warnings = useMemo(() => {
    const list: string[] = [];
    if (cantripOverflow) {
      list.push('Cantrip count exceeds the current limit.');
    }
    if (preparedOverflow) {
      list.push('Prepared spells exceed the current limit.');
    }
    return list;
  }, [cantripOverflow, preparedOverflow]);

  const [isManagePreparedOpen, setIsManagePreparedOpen] = useState(false);
  const [selectedSpellForDetail, setSelectedSpellForDetail] = useState<Spell | null>(null);

  const availableSpellEntries = useMemo(() => {
    const entries = new Map<string, { id: string; spell: Spell | null }>();

    if (usesSpellbook(normalizedClass) && wizardSpellbookIds.length > 0) {
      wizardSpellbookIds.forEach((id: string) => {
        entries.set(id, { id, spell: spellLookup[id] ?? null });
      });
    }

    if (classSpells && classSpells.length > 0) {
      classSpells.forEach((spell) => {
        const id = String(spell.id);
        entries.set(id, { id, spell });
      });
    }

    preparedTrackedIds.forEach((id: string) => {
      if (!entries.has(id)) {
        entries.set(id, { id, spell: spellLookup[id] ?? null });
      }
    });

    return Array.from(entries.values());
  }, [classSpells, normalizedClass, wizardSpellbookIds, spellLookup, preparedTrackedIds]);

  const updatePreparedSpells = useCallback(
    (nextPrepared: string[]) => {
      const dedupSelected = Array.from(new Set(nextPrepared));
      const combinedPrepared = Array.from(
        new Set([...dedupSelected, ...grantedPreparedIds])
      );

      const cantrips = spellbook.cantrips ?? [];
      const wizardBook = spellbook.wizardSpellbook ?? [];
      const mergedKnown = Array.from(
        new Set([
          ...cantrips.map((id) => String(id)),
          ...wizardBook.map((id) => String(id)),
          ...combinedPrepared,
        ])
      );

      onUpdateCharacter({
        spellbook: {
          ...spellbook,
          prepared: combinedPrepared,
          known: mergedKnown,
        },
      });
    },
    [spellbook, grantedPreparedIds, onUpdateCharacter]
  );

  const handleUnprepare = useCallback(
    (spellId: string) => {
      const next = preparedTrackedIds.filter((id) => id !== spellId);
      updatePreparedSpells(next);
    },
    [preparedTrackedIds, updatePreparedSpells]
  );

  const handleToggleAction = useCallback(
    (spell: Spell) => {
      if (!spell?.name) return;

      const actionName = spell.name;
      const alreadyActive = actions.hasAction(actionName);

      if (alreadyActive) {
        actions.removeActionByName(actionName);
        return;
      }

      const builtAction = buildSpellAction(spell);
      actions.addAction(builtAction);
    },
    [actions]
  );

  const handleSpellClick = useCallback((spell: Spell | null) => {
    if (spell) {
      setSelectedSpellForDetail(spell);
    }
  }, []);

  const renderSpellCard = (
    spellId: string,
    options: {
      prepared?: boolean;
      granted?: boolean;
      allowUnprepare?: boolean;
      showActionButton?: boolean;
    } = {}
  ) => {
    const spell = spellLookup[spellId];
    const isPrepared = preparedSet.has(spellId) || Boolean(options.prepared);
    const isGranted = grantedSet.has(spellId) || Boolean(options.granted);
    const level = spell?.level;
    const label = spell?.name ?? `Spell #${spellId}`;
    const schoolLabel = getSchoolLabel(spell?.school);
    const isCantrip = level === 0;
    const actionActive = spell?.name ? actions.hasAction(spell.name) : false;

    return (
      <SpellCard key={spellId} $prepared={isPrepared && !isGranted} $granted={isGranted}>
        <SpellTitleRow>
          <h4 onClick={() => handleSpellClick(spell)}>{label}</h4>
          <Tag $tone={isCantrip ? 'cantrip' : 'default'}>{formatLevelLabel(level)}</Tag>
        </SpellTitleRow>
        <SpellMetaRow>
          <span>{schoolLabel}</span>
          {isPrepared && <Tag $tone="prepared">Prepared</Tag>}
          {isGranted && <Tag $tone="granted">Granted</Tag>}
        </SpellMetaRow>
        {options.showActionButton && spell?.name && (
          <CardActions>
            {options.allowUnprepare && !isGranted && (
              <CardButton $variant="secondary" onClick={() => handleUnprepare(spellId)}>
                Unprepare
              </CardButton>
            )}
            <CardButton
              $variant={actionActive ? 'danger' : 'primary'}
              onClick={() => handleToggleAction(spell)}
            >
              {actionActive ? 'Remove from Action Bar' : 'Add to Action Bar'}
            </CardButton>
          </CardActions>
        )}
      </SpellCard>
    );
  };

  const preparedHeaderDescription = usesSpellbook(normalizedClass)
    ? 'Choose spells from your spellbook to prepare for the day.'
    : 'Select the spells you have ready to cast. You can change your prepared list at any time.';

  const showPreparedSection =
    preparedTrackedIds.length > 0 ||
    grantedPreparedIds.length > 0 ||
    (preparedLimit !== null && preparedLimit > 0) ||
    (availableSpellEntries.length > 0 && classConfig && classConfig.casterType !== 'none');

  return (
    <Container>
      <SummaryRow>
        {(preparedLimit !== null || preparedTrackedIds.length > 0) && (
          <SummaryBadge $variant={preparedOverflow ? 'warning' : 'default'}>
            Prepared Spells: {preparedTrackedIds.length}
            {preparedLimit !== null ? ` / ${preparedLimit}` : ''}
          </SummaryBadge>
        )}
        {cantripMax !== null && (cantripMax > 0 || cantripDisplayIds.length > 0) && (
          <SummaryBadge $variant={cantripOverflow ? 'warning' : 'default'}>
            Cantrips: {cantripDisplayIds.length}
            {cantripMax !== null && ` / ${cantripMax}`}
          </SummaryBadge>
        )}
        {usesSpellbook(normalizedClass) && wizardSpellbookIds.length > 0 && (
          <SummaryBadge>
            Spellbook: {wizardSpellbookIds.length}
          </SummaryBadge>
        )}
        <SummaryBadge>
          Granted: {grantedIds.length}
        </SummaryBadge>
      </SummaryRow>

      {warnings.length > 0 && (
        <Section>
          <SectionHeader>
            <SectionHeaderText>
              <h3>Spell Limit Notices</h3>
            </SectionHeaderText>
          </SectionHeader>
          <WarningList>
            {warnings.map((warning) => (
              <div key={warning}>• {warning}</div>
            ))}
          </WarningList>
        </Section>
      )}

      {showPreparedSection && (
        <Section>
          <SectionHeader>
            <SectionHeaderText>
              <h3>Prepared Spells</h3>
              <span>{preparedHeaderDescription}</span>
            </SectionHeaderText>
            <ManageButton
              onClick={() => setIsManagePreparedOpen(true)}
              disabled={availableSpellEntries.length === 0 && preparedTrackedIds.length === 0}
            >
              Manage Prepared Spells
            </ManageButton>
          </SectionHeader>
          {preparedTrackedIds.length === 0 && grantedPreparedIds.length === 0 ? (
            <EmptyState>No prepared spells selected.</EmptyState>
          ) : (
            <SpellGrid>
              {sortIdsBySpell(preparedTrackedIds).map((id) =>
                renderSpellCard(id, {
                  prepared: true,
                  allowUnprepare: true,
                  showActionButton: true,
                })
              )}
              {sortIdsBySpell(grantedPreparedIds).map((id) =>
                renderSpellCard(id, {
                  prepared: true,
                  granted: true,
                  showActionButton: true,
                })
              )}
            </SpellGrid>
          )}
        </Section>
      )}

      <Section>
        <SectionHeader>
          <SectionHeaderText>
            <h3>Cantrips</h3>
            <span>At-will spells that do not require spell slots.</span>
          </SectionHeaderText>
        </SectionHeader>
        {cantripDisplayIds.length === 0 ? (
          <EmptyState>No cantrips added yet.</EmptyState>
        ) : (
          <SpellGrid>
            {sortIdsBySpell(cantripDisplayIds).map((id) =>
              renderSpellCard(id, { showActionButton: true })
            )}
          </SpellGrid>
        )}
      </Section>

      {usesSpellbook(normalizedClass) && wizardSpellbookIds.length > 0 && (
        <Section>
          <SectionHeader>
            <SectionHeaderText>
              <h3>Spellbook</h3>
              <span>All spells recorded in your spellbook.</span>
            </SectionHeaderText>
          </SectionHeader>
          <SpellGrid>
            {sortIdsBySpell(wizardSpellbookIds).map((id) =>
              renderSpellCard(id, {
                prepared: preparedSet.has(id),
              })
            )}
          </SpellGrid>
        </Section>
      )}

      <Section>
        <SectionHeader>
          <SectionHeaderText>
            <h3>Granted Spells</h3>
            <span>Automatically granted spells from features, species, or feats.</span>
          </SectionHeaderText>
        </SectionHeader>
        {grantedIds.length === 0 ? (
          <EmptyState>No granted spells detected.</EmptyState>
        ) : (
          <SpellGrid>
            {sortIdsBySpell(grantedIds).map((id) =>
              renderSpellCard(id, { granted: true, showActionButton: true })
            )}
          </SpellGrid>
        )}
      </Section>

      {(isLoadingSpellDetails || classSpellStatus.isLoading) && (
        <LoadingMessage>Fetching spell details…</LoadingMessage>
      )}

      <PreparedSpellsModal
        isOpen={isManagePreparedOpen}
        onClose={() => setIsManagePreparedOpen(false)}
        classLabel={character.class || ''}
        limit={preparedLimit}
        currentPrepared={preparedTrackedIds}
        grantedPrepared={grantedPreparedIds}
        availableSpells={availableSpellEntries}
        spellLookup={spellLookup}
        isLoading={classSpellStatus.isLoading}
        error={classSpellStatus.error}
        onSave={updatePreparedSpells}
      />

      <SpellDetailModal
        spell={selectedSpellForDetail}
        onClose={() => setSelectedSpellForDetail(null)}
      />
    </Container>
  );
}

export default CharacterSpellsSection;
