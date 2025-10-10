import React from 'react';
import styled from 'styled-components';
import { Spell } from '../types/api';

// Main card container with dark theme
const CardContainer = styled.div<{ compact?: boolean; clickable?: boolean }>`
  background: rgba(45, 45, 45, 0.6);
  border: 2px solid #444;
  border-radius: 8px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  cursor: ${(props) => (props.clickable ? 'pointer' : 'default')};
  overflow: hidden;
  color: #f0f0f0;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5);
    border-color: #ce9016;
  }
`;

const SpellHeader = styled.div`
  background: rgba(35, 35, 35, 0.9);
  color: #ce9016;
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  border-bottom: 1px solid #444;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 1rem;
  }
`;

const SpellName = styled.h3<{ compact?: boolean }>`
  margin: 0;
  font-size: ${(props) => (props.compact ? '1.1rem' : '1.2rem')};
  font-weight: 600;
  color: #ce9016;
  font-family: 'Cinzel', serif;
  flex: 1;
`;

const SpellLevel = styled.div`
  background: rgba(206, 144, 22, 0.2);
  color: #ce9016;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  border: 1px solid rgba(206, 144, 22, 0.3);
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SpellContent = styled.div`
  padding: 1.25rem;
  flex: 1;
`;

const SchoolBadge = styled.div<{ school: string }>`
  display: inline-block;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 1rem;
  color: #f0f0f0;

  ${(props) => {
    const schoolColors: { [key: string]: string } = {
      Abjuration: 'rgba(60, 99, 130, 0.3)',
      Conjuration: 'rgba(142, 68, 173, 0.3)',
      Divination: 'rgba(243, 156, 18, 0.3)',
      Enchantment: 'rgba(233, 30, 99, 0.3)',
      Evocation: 'rgba(255, 107, 71, 0.3)',
      Illusion: 'rgba(156, 136, 255, 0.3)',
      Necromancy: 'rgba(44, 44, 84, 0.3)',
      Transmutation: 'rgba(39, 174, 96, 0.3)',
    };

    const borderColors: { [key: string]: string } = {
      Abjuration: 'rgba(60, 99, 130, 0.6)',
      Conjuration: 'rgba(142, 68, 173, 0.6)',
      Divination: 'rgba(243, 156, 18, 0.6)',
      Enchantment: 'rgba(233, 30, 99, 0.6)',
      Evocation: 'rgba(255, 107, 71, 0.6)',
      Illusion: 'rgba(156, 136, 255, 0.6)',
      Necromancy: 'rgba(44, 44, 84, 0.6)',
      Transmutation: 'rgba(39, 174, 96, 0.6)',
    };

    const bgColor = schoolColors[props.school] || 'rgba(139, 115, 85, 0.3)';
    const borderColor = borderColors[props.school] || 'rgba(139, 115, 85, 0.6)';
    return `
      background: ${bgColor};
      border: 1px solid ${borderColor};
    `;
  }}
`;

const SpellDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.25rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`;

const DetailItem = styled.div`
  background: rgba(35, 35, 35, 0.5);
  padding: 0.75rem;
  border-radius: 6px;
  border-left: 3px solid #ce9016;
  font-size: 0.85rem;

  strong {
    color: #ce9016;
    font-weight: 600;
    display: block;
    margin-bottom: 0.25rem;
    text-transform: uppercase;
    font-size: 0.7rem;
    letter-spacing: 0.5px;
  }

  span {
    color: #f0f0f0;
    font-weight: 400;
    line-height: 1.4;
    font-size: 0.85rem;
  }
`;

const CompactDetails = styled(DetailItem)`
  grid-column: 1 / -1;
  text-align: center;
  border-left: none;
  border: 1px solid #555;

  span {
    font-style: italic;
    color: #ccc;
  }
`;

const SourceInfo = styled.div`
  margin-top: auto;
  padding: 0.75rem 1rem;
  font-size: 0.8rem;
  color: #888;
  font-style: italic;
  text-align: center;
  background: rgba(35, 35, 35, 0.5);
  border-top: 1px solid #444;
  border-radius: 0 0 8px 8px;

  strong {
    color: #ce9016;
    font-weight: 600;
    font-style: normal;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-size: 0.75rem;
  }
`;

interface SpellCardProps {
  spell: Spell;
  onClick?: (() => void) | undefined;
  compact?: boolean;
}

const SpellCard: React.FC<SpellCardProps> = ({
  spell,
  onClick,
  compact = false,
}) => {
  // Helper function to get school name from abbreviation
  const getSchoolName = (abbreviation: string | undefined): string => {
    const schoolMap: { [key: string]: string } = {
      A: 'Abjuration',
      C: 'Conjuration',
      D: 'Divination',
      E: 'Enchantment',
      V: 'Evocation',
      I: 'Illusion',
      N: 'Necromancy',
      T: 'Transmutation',
    };
    return abbreviation ? schoolMap[abbreviation] || abbreviation : 'Unknown';
  };

  // Helper function to format spell components
  const formatComponents = (components: any): string => {
    if (!components) return '';

    const parts: string[] = [];
    if (components.v) parts.push('V');
    if (components.s) parts.push('S');
    if (components.m)
      parts.push(
        typeof components.m === 'string' ? `M (${components.m})` : 'M'
      );

    return parts.join(', ');
  };

  // Helper function to format casting time
  const formatCastingTime = (time: any[]): string => {
    if (!Array.isArray(time) || time.length === 0) return 'Unknown';

    const firstTime = time[0];
    if (firstTime.number && firstTime.unit) {
      return `${firstTime.number} ${firstTime.unit}${
        firstTime.number > 1 ? 's' : ''
      }`;
    }
    return 'Unknown';
  };

  // Helper function to format range
  const formatRange = (range: any): string => {
    if (!range) return 'Unknown';

    if (range.type === 'point' && range.distance) {
      return `${range.distance.amount} ${range.distance.type}`;
    } else if (range.type === 'self') {
      return 'Self';
    }
    return range.type || 'Unknown';
  };

  // Helper function to format duration
  const formatDuration = (duration: any[]): string => {
    if (!Array.isArray(duration) || duration.length === 0) return 'Unknown';

    const firstDuration = duration[0];
    if (firstDuration.type === 'instant') {
      return 'Instantaneous';
    } else if (firstDuration.type === 'timed' && firstDuration.duration) {
      const dur = firstDuration.duration;
      const durationText = `${dur.amount} ${dur.type}${
        dur.amount > 1 ? 's' : ''
      }`;
      return firstDuration.concentration
        ? `Concentration, up to ${durationText}`
        : durationText;
    }
    return firstDuration.type || 'Unknown';
  };

  const handleClick = () => {
    if (onClick) onClick();
  };

  const schoolName = getSchoolName(spell.school);
  const levelText = spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`;

  return (
    <CardContainer
      compact={compact}
      clickable={!!onClick}
      onClick={handleClick}
    >
      <SpellHeader>
        <SpellName compact={compact}>{spell.name}</SpellName>
        <SpellLevel>{levelText}</SpellLevel>
      </SpellHeader>

      <SpellContent>
        <SchoolBadge school={schoolName}>{schoolName}</SchoolBadge>

        {/* Full Details */}
        {!compact && (
          <SpellDetails>
            <DetailItem>
              <strong>Casting Time:</strong>
              <span>{formatCastingTime(spell.time || [])}</span>
            </DetailItem>
            <DetailItem>
              <strong>Range:</strong>
              <span>{formatRange(spell.range)}</span>
            </DetailItem>
            <DetailItem>
              <strong>Components:</strong>
              <span>{formatComponents(spell.components)}</span>
            </DetailItem>
            <DetailItem>
              <strong>Duration:</strong>
              <span>{formatDuration(spell.duration || [])}</span>
            </DetailItem>
          </SpellDetails>
        )}

        {/* Compact Details */}
        {compact && (
          <SpellDetails>
            <CompactDetails>
              <span>
                {schoolName} • {formatCastingTime(spell.time || [])} •{' '}
                {formatRange(spell.range)}
              </span>
            </CompactDetails>
          </SpellDetails>
        )}

        {/* Source Information */}
        {spell.source && (
          <SourceInfo>
            <strong>Source:</strong> {spell.source}
            {spell.page ? `, p. ${spell.page}` : ''}
          </SourceInfo>
        )}
      </SpellContent>
    </CardContainer>
  );
};

export default SpellCard;
