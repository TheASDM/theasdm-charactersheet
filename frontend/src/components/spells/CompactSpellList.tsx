import styled from 'styled-components';
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

const ListContainer = styled.div`
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

  @media (max-width: 768px) {
    grid-template-columns: 40px 1fr 80px;

    span:nth-child(3),
    span:nth-child(4) {
      display: none;
    }
  }
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

  &:last-child {
    border-bottom: none;
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

export const CompactSpellList: React.FC<CompactSpellListProps> = ({
  spells,
  selectedSpells,
  grantedSpells,
  maxSelections,
  onToggle,
  onViewDetails,
  normaliseId,
}) => {
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
      {spells.map((spell) => {
        const spellId = normaliseId(spell.id);
        const isSelected = selectedSpells.includes(spellId);
        const isGranted = grantedSpells.includes(spellId);
        const canSelect = isGranted || isSelected || selectedSpells.length < maxSelections;

        return (
          <SpellRow
            key={spell.id}
            $selected={isSelected}
            $disabled={!canSelect && !isGranted}
            onClick={() => !isGranted && canSelect && onToggle(spell)}
          >
            <Checkbox
              $checked={isSelected || isGranted}
              $disabled={!canSelect && !isGranted}
              onClick={(e) => {
                e.stopPropagation();
                if (!isGranted && canSelect) onToggle(spell);
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
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails(spell);
                }}
              >
                View
              </ActionButton>
            </div>
          </SpellRow>
        );
      })}
    </ListContainer>
  );
};
