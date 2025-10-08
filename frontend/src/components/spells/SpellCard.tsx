import styled from 'styled-components';
import type { Spell } from '@/types/api';
import { formatLevel, getSchoolLabel } from '@/utils/spellUtils';

interface SpellCardProps {
  spell: Spell;
  isSelected: boolean;
  isGranted: boolean;
  canSelect: boolean;
  onToggle: (spell: Spell) => void;
  onViewDetails: (spell: Spell) => void;
}

const Card = styled.div<{ $selected?: boolean }>`
  background: ${({ $selected }) =>
    $selected
      ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(184, 148, 31, 0.1))'
      : 'rgba(26, 26, 26, 0.6)'};
  border: 1px solid
    ${({ $selected }) => ($selected ? 'rgba(212, 175, 55, 0.6)' : 'rgba(212, 175, 55, 0.25)')};
  border-radius: 12px;
  padding: 1rem;
  transition: all 0.2s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;

  &:hover {
    border-color: #d4af37;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
  }
`;

const SpellName = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #f1c661;
  font-weight: 600;
  letter-spacing: 0.3px;
`;

const SpellMeta = styled.div`
  font-size: 0.85rem;
  color: #c0aa70;
  margin-bottom: 0.75rem;
  letter-spacing: 0.2px;
`;

const Tag = styled.span<{ $kind?: 'granted' | 'error' }>`
  display: inline-block;
  background: ${({ $kind }) => {
    if ($kind === 'granted') {
      return 'rgba(106, 168, 79, 0.25)';
    }
    if ($kind === 'error') {
      return 'rgba(182, 55, 55, 0.25)';
    }
    return 'rgba(212, 175, 55, 0.2)';
  }};
  color: ${({ $kind }) => {
    if ($kind === 'granted') {
      return '#a3e635';
    }
    if ($kind === 'error') {
      return '#ff8a8a';
    }
    return '#d4af37';
  }};
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-right: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  flex: 1;
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;

  ${({ $variant }) => {
    if ($variant === 'primary') {
      return `
        background: linear-gradient(135deg, #d4af37, #b8941f);
        color: #1a1a1a;
        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
        }
      `;
    }
    if ($variant === 'danger') {
      return `
        background: linear-gradient(135deg, #b63737, #8a2828);
        color: #fff;
        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(182, 55, 55, 0.3);
        }
      `;
    }
    return `
      background: rgba(60, 60, 60, 0.5);
      color: #d4af37;
      border-color: rgba(212, 175, 55, 0.3);
      &:hover {
        background: rgba(80, 80, 80, 0.6);
        border-color: #d4af37;
      }
    `;
  }}
`;

export const SpellCard: React.FC<SpellCardProps> = ({
  spell,
  isSelected,
  isGranted,
  canSelect,
  onToggle,
  onViewDetails,
}) => {
  const handleToggle = () => {
    if (canSelect || isSelected) {
      onToggle(spell);
    }
  };

  return (
    <Card $selected={isSelected}>
      <SpellName>{spell.name}</SpellName>
      <SpellMeta>
        {formatLevel(spell.level)} • {getSchoolLabel(spell.school)}
        {spell.isRitual && ' • Ritual'}
        {spell.miscTags?.includes('Concentration') && ' • Concentration'}
      </SpellMeta>
      {isGranted && <Tag $kind="granted">Granted</Tag>}
      {!canSelect && !isSelected && !isGranted && <Tag $kind="error">Cannot Select</Tag>}
      <ActionRow>
        <ActionButton $variant="secondary" onClick={() => onViewDetails(spell)}>
          View Details
        </ActionButton>
        {!isGranted && (
          <ActionButton
            $variant={isSelected ? 'danger' : 'primary'}
            onClick={handleToggle}
            disabled={!canSelect && !isSelected}
          >
            {isSelected ? 'Remove' : 'Select'}
          </ActionButton>
        )}
      </ActionRow>
    </Card>
  );
};
