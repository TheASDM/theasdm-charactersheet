import { memo, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { FixedSizeList as VirtualList, type ListChildComponentProps } from 'react-window';
import type { Spell } from '@/types/api';
import { formatLevel, getSchoolLabel } from '@/utils/spellUtils';

interface CompactSpellListProps {
  spells: Spell[];
  selectedSpells: string[];
  grantedSpells: string[];
  maxSelections: number;
  onToggle: (spell: Spell) => void;
  onViewDetails: (spell: Spell) => void;
  normaliseId: (id: string | number) => string;
}

const ROW_HEIGHT = 64;
const MAX_VISIBLE_ROWS = 8;

interface SpellListRowData {
  spells: Spell[];
  selectedSet: Set<string>;
  grantedSet: Set<string>;
  selectedCount: number;
  maxSelections: number;
  onToggle: (spell: Spell) => void;
  onViewDetails: (spell: Spell) => void;
  normaliseId: (id: string | number) => string;
}

const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(206, 144, 22, 0.3);
  border-radius: 8px;
  overflow: hidden;
  background: rgba(26, 26, 26, 0.6);
`;

const ListHeader = styled.div`
  display: grid;
  grid-template-columns: 40px 2fr 1fr 1fr 120px 100px;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(206, 144, 22, 0.15);
  border-bottom: 1px solid rgba(206, 144, 22, 0.3);
  font-weight: 600;
  font-size: 0.85rem;
  color: #ce9016;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex: none;

  @media (max-width: 768px) {
    grid-template-columns: 40px 1fr 80px;

    span:nth-child(3),
    span:nth-child(4) {
      display: none;
    }
  }
`;

const ListBody = styled.div`
  flex: 1;
`;

const SpellRow = styled.div<{ $selected?: boolean; $disabled?: boolean }>`
  display: grid;
  grid-template-columns: 40px 2fr 1fr 1fr 120px 100px;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(206, 144, 22, 0.15);
  transition: background 0.15s ease;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  background: ${({ $selected }) =>
    $selected ? 'rgba(206, 144, 22, 0.1)' : 'transparent'};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};

  &:hover {
    background: ${({ $disabled, $selected }) =>
      $disabled ? 'transparent' : $selected ? 'rgba(206, 144, 22, 0.15)' : 'rgba(206, 144, 22, 0.08)'};
  }

  @media (max-width: 768px) {
    grid-template-columns: 40px 1fr 80px;

    > div:nth-child(3),
    > div:nth-child(4) {
      display: none;
    }
  }
`;

const Checkbox = styled.div<{ $checked?: boolean; $disabled?: boolean }>`
  width: 20px;
  height: 20px;
  border: 2px solid ${({ $checked }) => ($checked ? '#ce9016' : 'rgba(206, 144, 22, 0.5)')};
  border-radius: 4px;
  background: ${({ $checked }) => ($checked ? '#ce9016' : 'transparent')};
  position: relative;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s ease;

  &::after {
    content: '✓';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #1a1a1a;
    font-weight: bold;
    font-size: 14px;
    opacity: ${({ $checked }) => ($checked ? 1 : 0)};
  }
`;

const SpellName = styled.div`
  color: #e0a523;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SpellInfo = styled.div`
  color: #c0aa70;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
`;

const Tag = styled.span<{ $kind?: 'granted' | 'ritual' | 'concentration' }>`
  display: inline-block;
  background: ${({ $kind }) => {
    if ($kind === 'granted') return 'rgba(106, 168, 79, 0.25)';
    if ($kind === 'ritual') return 'rgba(147, 112, 219, 0.25)';
    if ($kind === 'concentration') return 'rgba(255, 165, 0, 0.25)';
    return 'rgba(206, 144, 22, 0.2)';
  }};
  color: ${({ $kind }) => {
    if ($kind === 'granted') return '#a3e635';
    if ($kind === 'ritual') return '#c9a9ff';
    if ($kind === 'concentration') return '#ffa500';
    return '#ce9016';
  }};
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const ActionButton = styled.button`
  padding: 0.4rem 0.75rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;
  border: 1px solid rgba(206, 144, 22, 0.4);
  color: #ce9016;

  &:hover {
    background: rgba(206, 144, 22, 0.15);
    border-color: #ce9016;
  }
`;

const SpellRowRenderer = memo(
  ({ index, style, data }: ListChildComponentProps<SpellListRowData>) => {
    const spell = data.spells[index];
    if (!spell) {
      return null;
    }

    const spellId = data.normaliseId(spell.id);
    const isSelected = data.selectedSet.has(spellId);
    const isGranted = data.grantedSet.has(spellId);
    const canSelect = isGranted || isSelected || data.selectedCount < data.maxSelections;

    const handleToggle = () => {
      if (!isGranted && canSelect) {
        data.onToggle(spell);
      }
    };

    return (
      <SpellRow
        style={{ ...style, width: '100%' }}
        $selected={isSelected}
        $disabled={!canSelect && !isGranted}
        onClick={handleToggle}
      >
        <Checkbox
          $checked={isSelected || isGranted}
          $disabled={!canSelect && !isGranted}
          onClick={(event) => {
            event.stopPropagation();
            if (!isGranted && canSelect) {
              data.onToggle(spell);
            }
          }}
        />
        <SpellName>
          {spell.name}
        </SpellName>
        <SpellInfo>{formatLevel(spell.level)}</SpellInfo>
        <SpellInfo>{getSchoolLabel(spell.school)}</SpellInfo>
        <SpellInfo>
          {isGranted && <Tag $kind="granted">Granted</Tag>}
          {spell.isRitual && <Tag $kind="ritual">Ritual</Tag>}
          {spell.miscTags?.includes('Concentration') && <Tag $kind="concentration">Conc</Tag>}
        </SpellInfo>
        <div>
          <ActionButton
            onClick={(event) => {
              event.stopPropagation();
              data.onViewDetails(spell);
            }}
          >
            View
          </ActionButton>
        </div>
      </SpellRow>
    );
  }
);

SpellRowRenderer.displayName = 'SpellRowRenderer';

export const CompactSpellList: React.FC<CompactSpellListProps> = ({
  spells,
  selectedSpells,
  grantedSpells,
  maxSelections,
  onToggle,
  onViewDetails,
  normaliseId,
}) => {
  const selectedSet = useMemo(
    () => new Set(selectedSpells.map((id) => normaliseId(id))),
    [selectedSpells, normaliseId]
  );
  const grantedSet = useMemo(
    () => new Set(grantedSpells.map((id) => normaliseId(id))),
    [grantedSpells, normaliseId]
  );
  const rowData = useMemo<SpellListRowData>(
    () => ({
      spells,
      selectedSet,
      grantedSet,
      selectedCount: selectedSet.size,
      maxSelections,
      onToggle,
      onViewDetails,
      normaliseId,
    }),
    [spells, selectedSet, grantedSet, maxSelections, onToggle, onViewDetails, normaliseId]
  );
  const listHeight = useMemo(() => {
    if (spells.length === 0) return ROW_HEIGHT;
    const visibleRows = Math.min(spells.length, MAX_VISIBLE_ROWS);
    return visibleRows * ROW_HEIGHT;
  }, [spells.length]);
  const itemKey = useCallback(
    (index: number, data: SpellListRowData) => {
      const spell = data.spells[index];
      return spell ? spell.id : index;
    },
    []
  );

  return (
    <ListContainer>
      <ListHeader>
        <span></span>
        <span>Spell Name</span>
        <span>Level</span>
        <span>School</span>
        <span>Tags</span>
        <span>Details</span>
      </ListHeader>
      <ListBody>
        <VirtualList
          height={listHeight}
          itemCount={spells.length}
          itemSize={ROW_HEIGHT}
          width="100%"
          itemData={rowData}
          overscanCount={4}
          itemKey={itemKey}
        >
          {SpellRowRenderer}
        </VirtualList>
      </ListBody>
    </ListContainer>
  );
};
