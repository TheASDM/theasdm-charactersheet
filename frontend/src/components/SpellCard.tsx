import React from 'react';
import styled from 'styled-components';
import { Spell } from '../types/api';

// Main card container with medieval styling
const CardContainer = styled.div<{ compact?: boolean; clickable?: boolean }>`
  background: linear-gradient(145deg, #f4e7d1, #e8d5b7);
  border: 3px solid #8b6914;
  border-radius: 15px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  font-family: 'Crimson Text', serif;
  cursor: ${(props) => (props.clickable ? 'pointer' : 'default')};
  overflow: hidden;
  position: relative;
  color: #2c1810;
  will-change: transform;
  contain: layout style paint;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
    border-color: #d4af37;
  }
`;

const SpellHeader = styled.div`
  background: linear-gradient(
    145deg,
    rgba(90, 58, 42, 0.9),
    rgba(74, 42, 26, 0.9)
  );
  color: #d4af37;
  padding: 20px 25px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 15px;
  border-bottom: 2px solid #8b6914;
  position: relative;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding: 15px 20px;
  }
`;

const SpellName = styled.h3<{ compact?: boolean }>`
  margin: 0;
  font-size: ${(props) => (props.compact ? '1.4rem' : '1.8rem')};
  font-weight: 700;
  color: #d4af37;
  font-family: 'Cinzel', serif;
  flex: 1;
  letter-spacing: 1px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  line-height: 1.2;
`;

const SpellLevel = styled.div`
  background: linear-gradient(145deg, #8b6914, #6d5411);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-family: 'Cinzel', serif;
  margin-left: 10px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
`;

const SpellContent = styled.div`
  padding: 25px;
  background: transparent;
  flex: 1;
`;

const SchoolBadge = styled.div<{ school: string }>`
  display: inline-block;
  padding: 10px 20px;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 20px;
  color: white;
  font-family: 'Cinzel', serif;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

  ${(props) => {
    const schoolColors: { [key: string]: string } = {
      Abjuration: 'linear-gradient(145deg, #3c6382, #2f4f4f)',
      Conjuration: 'linear-gradient(145deg, #8e44ad, #9b59b6)',
      Divination: 'linear-gradient(145deg, #f39c12, #e67e22)',
      Enchantment: 'linear-gradient(145deg, #e91e63, #ad1457)',
      Evocation: 'linear-gradient(145deg, #ff6b47, #e55039)',
      Illusion: 'linear-gradient(145deg, #9c88ff, #7b68ee)',
      Necromancy: 'linear-gradient(145deg, #2c2c54, #40407a)',
      Transmutation: 'linear-gradient(145deg, #27ae60, #229954)',
    };

    const bgColor =
      schoolColors[props.school] || 'linear-gradient(145deg, #8b7355, #6d5411)';
    return `background: ${bgColor};`;
  }}
`;

const SpellDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 20px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 10px;
  }
`;

const DetailItem = styled.div`
  background: rgba(139, 105, 20, 0.1);
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #8b6914;
  font-size: 0.95rem;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(139, 105, 20, 0.15);
    transform: translateX(2px);
  }

  strong {
    color: #8b6914;
    font-weight: 600;
    display: block;
    margin-bottom: 8px;
    text-transform: uppercase;
    font-size: 0.8rem;
    letter-spacing: 1px;
    font-family: 'Cinzel', serif;
  }

  span {
    color: #2c1810;
    font-weight: 500;
    line-height: 1.4;
    font-family: 'Crimson Text', serif;
    font-size: 1rem;
  }
`;

const CompactDetails = styled(DetailItem)`
  grid-column: 1 / -1;
  text-align: center;
  border-left: none;
  border: 2px solid rgba(139, 105, 20, 0.3);

  span {
    font-style: italic;
    color: #4a321a;
  }
`;

const SourceInfo = styled.div`
  margin-top: auto;
  padding: 15px 20px;
  font-size: 0.85rem;
  color: #6d5411;
  font-style: italic;
  text-align: center;
  background: linear-gradient(
    145deg,
    rgba(139, 105, 20, 0.1),
    rgba(139, 105, 20, 0.05)
  );
  border-top: 1px solid rgba(139, 105, 20, 0.3);
  font-family: 'Crimson Text', serif;
  border-radius: 0 0 12px 12px;

  strong {
    color: #8b6914;
    font-weight: 600;
    font-style: normal;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 0.8rem;
    font-family: 'Cinzel', serif;
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
